'use strict';

const Joi = require('joi')
    .extend((joi) => {
        return {
            base: joi.object(),
            name: 'object',
            rules: [
                {
                    name: 'transform',
                    params: {
                        func: joi.func().required(),
                    },
                    validate(params, value, state, options) {
                        return params.func(value);
                    },
                },
            ],
        };
    });

const schemaByType = {};

const commonStrip = {
    open_sound: Joi.any().strip(),
    close_sound: Joi.any().strip(),
    vehicle_impact_sound: Joi.any().strip(),
    working_sound: Joi.any().strip(),
    idle_animation: Joi.any().strip(),
    always_draw_idle_animation: Joi.any().strip(),
    repair_sound: Joi.any().strip(),
    mined_sound: Joi.any().strip(),
    shadow_animations: Joi.any().strip(),
    base_picture: Joi.any().strip(),
    input_fluid_patch_sprites: Joi.any().strip(),
    input_fluid_patch_shadow_sprites: Joi.any().strip(),
    input_fluid_patch_shadow_animations: Joi.any().strip(),
    input_fluid_patch_window_sprites: Joi.any().strip(),
    input_fluid_patch_window_flow_sprites: Joi.any().strip(),
    input_fluid_patch_window_base_sprites: Joi.any().strip(),
    radius_visualisation_picture: Joi.any().strip(),
    monitor_visualization_tint: Joi.any().strip(),
    circuit_connector_sprites: Joi.any().strip(),
};

const icons = Joi.array().min(1)
    .items(Joi.object().keys({
        icon: Joi.string().min(1),
        tint: Joi.object().keys({
            r: Joi.number().min(0).max(1).required(),
            g: Joi.number().min(0).max(1).required(),
            b: Joi.number().min(0).max(1).required(),
            a: Joi.number().min(0).max(1).required(),
        }),
        scale: Joi.number().min(0).max(1),
        shift: Joi.array().length(2)
            .ordered(
                Joi.number().required().integer(),
                Joi.number().required().integer()
            ),
    }));

const ingredients = Joi.array()
    .min(1)
    .items([
        Joi.array()
            .length(2)
            .ordered(
                Joi.string().required().min(1),
                Joi.number().integer().required().min(1)
            ),
        Joi.object()
            .keys({
                type: Joi.string().valid('item', 'fluid').required(),
                name: Joi.string().required().min(1),
                amount: Joi.number().integer().required().min(1),
            }),
    ]);

const results = Joi.array()
    .items(
        Joi.object().keys({
            type: Joi.string().valid('item', 'fluid').default('item'),
            name: Joi.string().required().min(1),
            amount: Joi.number().integer().min(0),
            probability: Joi.number().greater(0),
        })
    )
    .min(1);

const crafting = Joi.object()
    .keys({
        enabled: Joi.boolean().strip(),
        ingredients: ingredients.required(),
        result: Joi.string().min(1),
        results,
        energy_required: Joi.number().greater(0),
        requester_paste_multiplier: Joi.number().strip(),
    });

const minable = Joi.object().keys({
    hardness: Joi.number().greater(0),
    mining_time: Joi.number().greater(0).required(),
    result: Joi.string().min(1).required(),
});

const allowed_effects = Joi.array()
    .items(Joi.string().allow([
        'consumption',
        'speed',
        'productivity',
        'pollution',
    ]));

const energy_source = Joi.object().keys({
    type: Joi.string().valid('electric', 'burner', 'nuclear').required(),

    usage_priority: Joi.string().strip()
        .when('type', { is: 'electric', then: Joi.required(), otherwise: Joi.disallow() }),
    emissions: Joi.number().greater(0).strip()
        .when('type', { is: 'electric', otherwise: Joi.disallow() }),

    fuel_category: Joi.string().disallow()
        .when('type', { is: 'burner', then: Joi.valid('chemical').required() })
        .when('type', { is: 'nuclear', then: Joi.valid('nuclear').required() }),
    fuel_inventory_size: Joi.number().min(1).integer().disallow()
        .when('type', { is: 'burner', then: Joi.required() })
        .when('type', { is: 'nuclear', then: Joi.required() }),
    effectivity: Joi.number().greater(0).disallow()
        .when('type', { is: 'burner', then: Joi.required() }),
    smoke: Joi.any().strip(),
});

const fluid_box = Joi.object().keys({
    production_type: Joi.string().required().valid([
        'input',
        'output',
        'input-output',
    ]),

    base_area: Joi.number().integer().strip(),
    height: Joi.number().integer().strip(),
    base_level: Joi.number().required().integer().strip(),
    pipe_covers: Joi.object().strip(),
    pipe_connections: Joi.array().strip(),
    pipe_picture: Joi.object().strip(),
    secondary_draw_orders: Joi.object().strip(),
});

const input_fluid_box = fluid_box.keys({
    production_type: Joi.optional().default('input'),
});

const output_fluid_box = fluid_box.keys({
    production_type: Joi.optional().default('output'),
});

const fluid_boxes = Joi.alternatives().try(
    Joi.array().items(fluid_box),
    Joi.object()
        .keys({
            off_when_no_fluid_recipe: Joi.boolean(),
        })
        .pattern(/^\d+$/, fluid_box)
        .transform((value) => {
            return Object.keys(value).reduce((ret, key) => {
                if (key.match(/^\d+$/)) {
                    ret.push(value[key]);
                }
                return ret;
            }, []);
        })
);

const energy_usage = Joi.string().regex(/^\d+[mk]W$/);

const module_specification = Joi.object().keys({
    module_slots: Joi.number().integer().required().min(1),
    module_info_icon_shift: Joi.array().strip(),
    module_info_multi_row_initial_height_modifier: Joi.number().strip()
});

const localised_name = Joi.array().items(
    Joi.string().required(),
    Joi.array().items(Joi.string())
);

const baseSchema = Joi.object().keys({
    type: Joi.string().required().min(1),
    name: Joi.string().required().min(1),
});

function createSchemaForType(type) {
    if (type === 'recipe') {
        return baseSchema
            //.pattern(/_(tint)$/, Joi.any().strip())
            .keys({
                category: Joi.string().default('crafting'),
                icon: Joi.string().min(1),
                icons,
                subgroup: Joi.string().min(1),
                order: Joi.string().min(1),
                ingredients,
                energy_required: Joi.number().greater(0),
                result: Joi.string().min(1),
                result_count: Joi.number().integer().min(1),
                results,
                normal: crafting,
                expensive: crafting,
                enabled: Joi.boolean().default(true),
                localised_name,

                // Stripped
                hidden: Joi.boolean().strip(),
                requester_paste_multiplier: Joi.number().strip(),
                allow_decomposition: Joi.boolean().strip(),
                hide_from_stats: Joi.boolean().strip(),
                main_product: Joi.string().valid('').strip(),
                crafting_machine_tint: Joi.any().strip(),
            })
            .and('normal', 'expensive')
            .xor('result', 'results', 'normal')
            .nand('result_count', 'results')
            .nand('result_count', 'normal')
            .nand('energy_required', 'normal');
    }
    else if (type === 'assembling-machine' || type === 'furnace') {
        return baseSchema
            //.pattern(/_(animation|sound)$/, Joi.any().strip())
            .keys(commonStrip)
            .keys({
                icon: Joi.string().min(1),
                flags: Joi.array().items(Joi.string()),
                crafting_categories: Joi.array().required()
                    .items(Joi.string()),
                crafting_speed: Joi.number().greater(0).required(),
                energy_source: energy_source.required(),
                energy_usage: energy_usage.required(),
                ingredient_count: Joi.number().greater(0).integer().required()
                    .when('type', { is: 'furnace', then: Joi.optional().disallow() }),
                module_specification,
                allowed_effects,
                fluid_boxes,
                fast_replaceable_group: Joi.string(),

                result_inventory_size: Joi.number().greater(0).integer().disallow()
                    .when('type', { is: 'furnace', then: Joi.required() }),
                source_inventory_size: Joi.number().greater(0).integer().disallow()
                    .when('type', { is: 'furnace', then: Joi.required() }),

                // Stripped
                minable: minable.strip(),
                max_health: Joi.number().strip(),
                corpse: Joi.string().strip(),
                dying_explosion: Joi.string().strip(),
                resistances: Joi.any().strip(),
                collision_box: Joi.any().strip(),
                selection_box: Joi.any().strip(),
                animation: Joi.any().strip(),
                scale_entity_info_icon: Joi.boolean().strip(),
                has_backer_name: Joi.boolean().strip(),
                working_visualisations: Joi.array().strip(),
                working_visualisations_disabled: Joi.array().strip(),
                pipe_covers: Joi.object().strip(),
                drawing_box: Joi.array().strip(),
                light: Joi.object().strip(),
            })
            .and('module_specification', 'allowed_effects');
    }
    else if (type === 'mining-drill') {
        return baseSchema
            .keys(commonStrip)
            .keys({
                icon: Joi.string().min(1),
                flags: Joi.array().items(Joi.string()),
                resource_categories: Joi.array().required()
                    .items(Joi.string()),
                mining_speed: Joi.number().greater(0).required(),
                mining_power: Joi.number().greater(0).required(),
                energy_source: energy_source.required(),
                energy_usage: energy_usage.required(),
                module_specification,
                resource_searching_radius: Joi.number().greater(0).required(),
                input_fluid_box,
                output_fluid_box,
                fast_replaceable_group: Joi.string(),

                // Strip
                animations: Joi.any().strip(),
                corpse: Joi.string().strip(),
                minable: minable.strip(),
                max_health: Joi.number().strip(),
                resistances: Joi.any().strip(),
                collision_box: Joi.any().strip(),
                selection_box: Joi.any().strip(),
                animation: Joi.any().strip(),
                circuit_wire_connection_points: Joi.any().strip(),
                circuit_wire_max_distance: Joi.any().strip(),
                dying_explosion: Joi.string().strip(),
                vector_to_place_result: Joi.any().strip(),
                drawing_box: Joi.any().strip(),
            });
    }
    else if (type === 'beacon') {
        return baseSchema
            //.pattern(/_(animation|sound)$/, Joi.any().empty(Joi.any()))
            .keys(commonStrip)
            .keys({
                icon: Joi.string().min(1),
                flags: Joi.array().items(Joi.string()),
                allowed_effects,
                supply_area_distance: Joi.number().required().min(0).integer(),
                energy_source: energy_source.required(),
                energy_usage: energy_usage.required(),
                distribution_effectivity: Joi.number().required().greater(0),
                module_specification,

                // Stripped
                minable: minable.strip(),
                max_health: Joi.number().strip(),
                corpse: Joi.string().strip(),
                dying_explosion: Joi.string().strip(),
                collision_box: Joi.any().strip(),
                selection_box: Joi.any().strip(),
                base_picture: Joi.object().strip(),
                animation: Joi.object().strip(),
                animation_shadow: Joi.object().strip(),
                radius_visualisation_picture: Joi.object().strip(),
            })
            .and('module_specification', 'allowed_effects');
    }
    else if (type === 'fluid') {
        return baseSchema
            //.pattern(/_(color|temperature)$/, Joi.any().strip())
            .keys(commonStrip)
            .keys({
                icon: Joi.string().min(1),
                order: Joi.string().min(1),

                // Stripped
                heat_capacity: Joi.string().strip(),
                pressure_to_speed_ratio: Joi.number().strip(),
                flow_to_energy_ratio: Joi.number().strip(),
                auto_barrel: Joi.boolean().strip(),
                default_temperature: Joi.any().strip(),
                max_temperature: Joi.any().strip(),
                base_color: Joi.any().strip(),
                flow_color: Joi.any().strip(),
                gas_temperature: Joi.any().strip(),
            });
    }
    else if (type === 'item') {
        return baseSchema
            .keys({
                icon: Joi.string().min(1),
                icons,
                flags: Joi.array().items(Joi.string()),
                order: Joi.string().min(1),
                subgroup: Joi.string().min(1),
                fuel_value: Joi.string().regex(/^\d+[GM]J$/),
                fuel_category: Joi.string().valid('chemical', 'nuclear'),
                localised_name,
                place_result: Joi.string(),

                stack_size: Joi.number().integer().min(1).strip(),
                place_as_tile: Joi.object().strip(),
                dark_background_icon: Joi.any().strip(),
                placed_as_equipment_result: Joi.string().strip(),
                default_request_amount: Joi.number().strip(),
                damage_radius: Joi.number().strip(),
                trigger_radius: Joi.number().strip(),
                fuel_acceleration_multiplier: Joi.number().greater(0).strip(),
                fuel_top_speed_multiplier: Joi.number().greater(0).strip(),
                burnt_result: Joi.any().strip(),
            })
            .and('fuel_value', 'fuel_category');
    }
    else if (type === 'module') {
        return baseSchema
            .keys({
                icon: Joi.string().min(1).required(),
                flags: Joi.array().items(Joi.string()).required(),
                subgroup: Joi.string().min(1).required(),
                category: Joi.string().valid('speed', 'effectivity', 'productivity').required(),
                tier: Joi.number().integer().min(1).required(),
                order: Joi.string().min(1),
                effect: Joi.object().required()
                    .keys({
                        productivity: Joi.object().keys({
                            bonus: Joi.number().required(),
                        }),
                        consumption: Joi.object().keys({
                            bonus: Joi.number().required(),
                        }),
                        pollution: Joi.object().keys({
                            bonus: Joi.number().required(),
                        }),
                        speed: Joi.object().keys({
                            bonus: Joi.number().required(),
                        }),
                    }),
                limitation: Joi.array().items(Joi.string().min(1)),

                stack_size: Joi.number().strip(),
                default_request_amount: Joi.number().strip(),
                limitation_message_key: Joi.string().strip(),
                requester_paste_multiplier: Joi.number().strip(),
            });
    }
    else if (type === 'resource') {
        return baseSchema
            //.pattern(/^effect_|_(effect_alpha|color)$/, Joi.any().strip())
            .keys({
                icon: Joi.string().min(1),
                flags: Joi.array().items(Joi.string()),
                category: Joi.string().default('basic-solid'),
                infinite: Joi.boolean(),
                order: Joi.string().min(1),
                minable: Joi.object().required().keys({
                    hardness: Joi.number().required(),
                    mining_time: Joi.number().integer().min(1).required(),
                    result: Joi.string().min(1),
                    results: Joi.array()
                        .items(
                            Joi.object().keys({
                                type: Joi.string().valid('item', 'fluid').default('item'),
                                name: Joi.string().required().min(1),
                                amount: Joi.number().integer().min(0),
                                amount_min: Joi.number().integer().min(0),
                                amount_max: Joi.number().integer().min(Joi.ref('amount_min')),
                                probability: Joi.number().greater(0),
                            })
                                .xor('amount', 'amount_min')
                                .and('amount_min', 'amount_max')
                        )
                        .min(1),
                    required_fluid: Joi.string(),
                    fluid_amount: Joi.number().min(1).integer(),

                    mining_particle: Joi.string().strip(),
                })
                    .xor('result', 'results')
                    .and('required_fluid', 'fluid_amount'),

                collision_box: Joi.any().strip(),
                selection_box: Joi.any().strip(),
                autoplace: Joi.object().strip(),
                stages: Joi.object().strip(),
                stages_effect: Joi.object().strip(),
                stage_counts: Joi.array().strip(),
                highlight: Joi.any().strip(),
                minimum: Joi.any().strip(),
                normal: Joi.any().strip(),
                infinite_depletion_amount: Joi.any().strip(),
                resource_patch_search_radius: Joi.any().strip(),
                map_grid: Joi.boolean().strip(),
                map_color: Joi.any().strip(),
                effect_animation_period: Joi.any().strip(),
                effect_animation_period_deviation: Joi.any().strip(),
                effect_darkness_multiplier: Joi.any().strip(),
                min_effect_alpha: Joi.any().strip(),
                max_effect_alpha: Joi.any().strip(),
            });
    }
    else if (type === 'tool') {
        return baseSchema
            .keys({
                icon: Joi.string().min(1),
                flags: Joi.array().items(Joi.string()),
                subgroup: Joi.string().min(1),
                order: Joi.string().min(1),

                stack_size: Joi.number().integer().strip(),
                durability: Joi.number().integer().strip(),
                durability_description_key: Joi.string().strip(),
            });
    }
    else if (type === 'capsule') {
        return baseSchema
            .keys({
                icon: Joi.string().min(1),
                flags: Joi.array().items(Joi.string()),
                subgroup: Joi.string().min(1),
                order: Joi.string().min(1),

                capsule_action: Joi.any().strip(),
                stack_size: Joi.number().integer().strip(),
                durability: Joi.number().integer().strip(),
                durability_description_key: Joi.string().strip(),
            });
    }
    else if (type === 'ammo') {
        return baseSchema
            .keys({
                icon: Joi.string().min(1),
                flags: Joi.array().items(Joi.string()),
                subgroup: Joi.string().min(1),
                order: Joi.string().min(1),

                ammo_type: Joi.any().strip(),
                magazine_size: Joi.number().strip(),
                stack_size: Joi.number().integer().strip(),
                durability: Joi.number().integer().strip(),
                durability_description_key: Joi.string().strip(),
            });
    }
    else if (type === 'technology') {
        return baseSchema
            .keys({
                icon: Joi.string().min(1),
                effects: Joi.array().items(
                    Joi.object().keys({
                        type: Joi.string().valid('unlock-recipe'),
                        recipe: Joi.string().required(),
                    }),
                    Joi.object().keys({
                        type: Joi.string().valid([
                            'ammo-damage',
                            'train-braking-force-bonus',
                            'laboratory-speed',
                            'num-quick-bars',
                            'ghost-time-to-live',
                            'worker-robot-speed',
                            'worker-robot-storage',
                            'character-logistic-slots',
                            'character-logistic-trash-slots',
                            'auto-character-logistic-trash-slots',
                            'gun-speed',
                            'turret-attack',
                            'maximum-following-robots-count',
                            'mining-drill-productivity-bonus',
                            'stack-inserter-capacity-bonus',
                            'inserter-stack-size-bonus',
                        ]),
                    }).unknown(true)
                ),
                order: Joi.string().min(1),
                localised_name,

                level: Joi.number().strip(),
                upgrade: Joi.boolean().strip(),
                max_level: Joi.any().strip(),
                unit: Joi.object().required().strip(),
                prerequisites: Joi.array().strip(),
                localised_description: Joi.any().strip(),
            });
    }
    else {
        throw new Error(`Type "${type}" not supported`);
    }
}

module.exports = function(type) {
    return schemaByType[type]
        || (schemaByType[type] = createSchemaForType(type));
};
