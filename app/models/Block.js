import V from '../util/validate';

const baseKeys = {
    blockId: V.required().string().regex(/^b\d+$/),
    type: V.allow([
        'AssemblingMachineBlock',
        'FurnaceBlock',
        'MiningDrillBlock',
        'BeaconBlock',
        'SupplyBlock',
    ]),
    x: V.required().number().min(1).integer(),
    y: V.required().number().integer().min(0),
};

const baseSchema = V.object().keys(baseKeys);

const schemaByType = {};

/**
 * @typedef {object} Block
 * @property {string} blockId
 * @property {string} type
 * @property {number} x
 * @property {number} y
 * @property {number} quantity
 * @property {string} name
 * @property {string} recipeType
 * @property {string} recipeName
 * @property {string[]} modules
 * @property {number} ringRotate
 * @property {{ type: string, name: string, rate: string|number }} result
 */

schemaByType.AssemblingMachineBlock = V.object()
    .keys({
        ...baseKeys,
        quantity: V.default(1).number().integer().min(1),
        name: V.string().min(1),
        recipeType: V.default('recipe').string().min(1),
        recipeName: V.string().min(1),
        modules: V.array()
            .default(Array)
            .items([
                V.string().min(1),
            ])
            .min(0),
        ringRotate: V.default(0).number(),
    });
schemaByType.FurnaceBlock = schemaByType.AssemblingMachineBlock;
schemaByType.MiningDrillBlock = schemaByType.AssemblingMachineBlock;

schemaByType.BeaconBlock = V.object()
    .keys({
        ...baseKeys,
        quantity: V.default(1).number().integer().min(1),
        name: V.string().min(1),
        modules: V.array()
            .default(Array)
            .items([
                V.string().min(1),
            ])
            .min(0),
    });

schemaByType.SupplyBlock = V.object()
    .keys({
        ...baseKeys,
        name: V.string().min(1),
        result: V.object().required().keys({
            type: V.default('item').string().min(1),
            name: V.string().min(1),
            rate: V.alternatives().try([
                V.allow(['infinite']),
                V.number().greater(0),
            ]).default('infinite'),
        }),
    });

/**
 * @param {string} blockId
 * @param {object} props
 * @return {Block}
 */
export function createBlock(blockId, props) {
    try {
        if (!props || !schemaByType[props.type]) {
            baseSchema.validate(props);
        }
        else {
            props = schemaByType[props.type].validate(props);
            props.blockId = blockId;
            return props;
        }
    }
    catch (err) {
        err.message = `[Block ${blockId}] ${err.message}`;
        throw err;
    }
}
