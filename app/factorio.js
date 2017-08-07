import { warn } from './util';
import * as exportData from '../export-json/data/index';
import * as exportIcons from '../export-json/data/icons';

export const data = exportData;
export const icons = exportIcons;

const unlockableRecipeSet = new Set();
for (const technologyKey of Object.keys(exportData.technology)) {
    const technologyProto = exportData.technology[technologyKey];
    if (technologyProto.effects) {
        for (const effect of technologyProto.effects) {
            if (effect.type === 'unlock-recipe') {
                unlockableRecipeSet.add(effect.recipe);
            }
        }
    }
}

const allowedRecipeSet = new Set();
for (const recipeKey of Object.keys(exportData.recipe)) {
    const recipeProto = exportData.recipe[recipeKey];
    if (recipeProto.enabled || unlockableRecipeSet.has(recipeProto.name)) {
        allowedRecipeSet.add(recipeProto);
    }
    else {
        // eslint-disable-next-line no-console
        console.log('Omitting recipe', recipeProto.name);
    }
}

export function getProto(type, name) {
    const proto = data[type] && data[type][name] || null;
    if (!proto) {
        warn(`No proto for ${type}.${name}`);
    }
    return proto;
}

export function getTypeForName(name) {
    for (const type of ['item', 'tool', 'module', 'capsule', 'ammo']) {
        if (exportData[type][name]) {
            return type;
        }
    }

    warn(`Could got guess type for ${name}`);
    return 'item';
}

const validRecipesForProto_cache = new Map();
export function validRecipesForProto(proto) {
    let ret = validRecipesForProto_cache.get(proto);
    if (ret) {
        return ret;
    }

    ret = [];

    if (proto.crafting_categories) {
        for (const recipeProto of allowedRecipeSet) {
            if (isValidRecipeForProto(proto, recipeProto)) {
                ret.push(recipeProto);
            }
        }
    }

    if (proto.resource_categories) {
        for (const resourceKey of Object.keys(exportData.resource)) {
            const resourceProto = exportData.resource[resourceKey];
            if (isValidRecipeForProto(proto, resourceProto)) {
                ret.push(resourceProto);
            }
        }
    }

    ret.sort(protoComparator);

    validRecipesForProto_cache.set(proto, ret);
    return ret;
}

const recipeGetIngredients_cache = new Map();
export function recipeGetIngredients(recipeProto) {
    let ret = recipeGetIngredients_cache.get(recipeProto);
    if (ret) {
        return ret;
    }

    if (recipeProto.type === 'recipe') {
        const ingredients = recipeProto.ingredients
            || recipeProto.normal && recipeProto.normal.ingredients;

        if (recipeProto.type !== 'recipe') {
            throw new Error(`Invalid type: ${recipeProto.type}.${recipeProto.name}`);
        }

        if (!ingredients) {
            throw new Error(`Missing ingredients for ${recipeProto.name}`);
        }

        ret = ingredients.map((ingredient) => {
            if (Array.isArray(ingredient)) {
                return {
                    type: getTypeForName(ingredient[0]),
                    name: ingredient[0],
                    amount: ingredient[1],
                };
            }
            else {
                return ingredient.type
                    ? ingredient
                    : {
                        type: getTypeForName(ingredient.name),
                        ...ingredient,
                    };
            }
        });

        recipeGetIngredients_cache.set(recipeProto, ret);
        return ret;
    }
    else if (recipeProto.type === 'resource') {
        if (recipeProto.minable && recipeProto.minable.required_fluid) {
            ret = [
                {
                    type: 'fluid',
                    name: recipeProto.minable.required_fluid,
                    amount: recipeProto.minable.fluid_amount,
                },
            ];
        }

        recipeGetIngredients_cache.set(recipeProto, ret);
        return ret;
    }
    else {
        throw new Error(`Invalid proto for recipeGetIngredients: ${recipeProto.type}.${recipeProto.name}`);
    }
}

const recipeGetResults_cache = new Map();
export function recipeGetResults(recipeProto) {
    let ret = recipeGetResults_cache.get(recipeProto);
    if (ret) {
        return ret;
    }

    if (recipeProto.type === 'recipe') {
        const result = recipeProto.result
            || recipeProto.normal && recipeProto.normal.result;

        if (result) {
            ret = [
                {
                    type: getTypeForName(result),
                    name: result,
                    amount: recipeProto.result_count || recipeProto.normal && recipeProto.normal.result_count || 1,
                },
            ];
        }
        else {
            ret = recipeProto.results
                || recipeProto.normal && recipeProto.normal.results;
        }

        if (!ret) {
            warn(`Recipe ${recipeProto.type}.${recipeProto.name} missing results`);
            ret = [];
        }

        recipeGetResults_cache.set(recipeProto, ret);
        return ret;
    }
    else if (recipeProto.type === 'resource') {
        const result = recipeProto.minable && recipeProto.minable.result;

        if (result) {
            ret = [
                {
                    type: getTypeForName(result),
                    name: result,
                    amount: 1,
                },
            ];
        }
        else {
            ret = recipeProto.minable && recipeProto.minable.results;
        }

        if (!ret) {
            throw new Error('Resource missing minable results');
        }

        recipeGetResults_cache.set(recipeProto, ret);
        return ret;
    }
    else {
        throw new Error(`Invalid proto for recipeGetIngredients: ${recipeProto.type}.${recipeProto.name}`);
    }
}

export function getRecipeCycle(blockProto, recipeProto) {
    if (recipeProto.type === 'recipe') {
        const energy_required = recipeProto.energy_required || recipeProto.normal && recipeProto.normal.energy_required || 0.5;
        return energy_required / blockProto.crafting_speed;
    }
    else if (recipeProto.type === 'resource') {
        const { mining_power, mining_speed } = blockProto;
        const { mining_time, hardness } = recipeProto.minable;
        return mining_time / ((mining_power - hardness) * mining_speed);
    }
    else {
        throw new Error(`Invalid proto for getRecipeCycle: ${recipeProto.type}.${recipeProto.name}`);
    }
}

const getIcon_cache = new Map();
export function getIcon(proto) {
    if (proto) {
        let ret = getIcon_cache.get(proto);
        if (ret) {
            return ret;
        }

        if (proto.icon) {
            ret = [
                {
                    icon: proto.icon,
                },
            ];
        }
        else if (proto.icons) {
            ret = proto.icons;
        }
        else if (proto.type === 'recipe') {
            const results = recipeGetResults(proto);
            const resultIcon = results.length === 1 && getIcon(exportData[results[0].type] && exportData[results[0].type][results[0].name]);
            if (resultIcon) {
                ret = resultIcon;
            }
            else {
                const itemIcon = getIcon(exportData.item[proto.name]);
                if (itemIcon) {
                    ret = itemIcon;
                }
                else {

                    const fluidIcon = getIcon(exportData.fluid[proto.name]);
                    if (fluidIcon) {
                        ret = fluidIcon;
                    }
                }
            }
        }

        if (ret) {
            getIcon_cache.set(proto, ret);
            return ret;
        }
    }

    return null;
}

export function isValidRecipeForProto(proto, recipeProto) {
    if (!proto || !recipeProto) {
        return false;
    }

    if (recipeProto.type === 'recipe') {
        if (!proto.crafting_categories || proto.crafting_categories.indexOf(recipeProto.category) < 0) {
            return false;
        }

        const ingredients = recipeGetIngredients(recipeProto);
        if (ingredients && ingredients.length > proto.ingredient_count) {
            return false;
        }
    }
    else if (recipeProto.type === 'resource') {
        if (!proto.resource_categories || proto.resource_categories.indexOf(recipeProto.category) < 0) {
            return false;
        }
    }
    else {
        return false;
    }

    return true;
}

export function isValidModulesForProto(blockProto, modules) {
    if (!modules.length) {
        return true;
    }

    if (blockProto.allowed_effects && !blockProto.allowed_effects.length || !blockProto.module_specification
        || blockProto.module_specification.module_slots < modules.length) {
        return false;
    }

    if (blockProto.allowed_effects) {
        for (const module of modules) {
            if (!isValidModuleForProto(blockProto.allowed_effects, module)) {
                return false;
            }
        }
    }

    return true;
}

export function isValidModuleForProto(allowedEffects, module) {
    if (!allowedEffects || !allowedEffects.length) {
        return false;
    }

    if (typeof module === 'string') {
        module = getProto('module', module);
    }

    for (const effect of Object.keys(module.effect)) {
        if (!allowedEffects.includes(effect)) {
            return false;
        }
    }

    return true;
}

export function isValidModuleForRecipe(recipeProto, module) {
    if (recipeProto.type === 'recipe') {
        if (typeof module === 'string') {
            module = getProto('module', module);
        }

        return !module.limitation || module.limitation.includes(recipeProto.name);
    }
    else {
        return recipeProto.type === 'resource';
    }
}

export function isValidModulesForRecipe(recipeProto, modules) {
    if (modules.length) {
        for (const module of modules) {
            if (!isValidModuleForRecipe(recipeProto, module)) {
                return false;
            }
        }
    }
    return true;
}

export function protoComparator(a, b) {
    return a.name < b.name ? -1 : a.name > b.name ? 1 : a.type < b.type ? -1 : a.type > b.type ? 1 : 0;
}
