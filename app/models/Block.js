import V from '../util/validate';
import { warn } from '../util';
import {
    data,
    getProto,
    getRecipeCycle,
    isValidModulesForProto,
    isValidModulesForRecipe,
    isValidRecipeForProto,
    recipeGetIngredients,
    recipeGetResults,
    validRecipesForProto,
} from '../factorio';

/* =============================================
 *                   Schema
 * ============================================= */

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
 * @param {object} props
 * @param {string} blockId
 * @return {Block}
 */
export function createBlock(props, blockId) {
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

/* =============================================
 *                Getters/Helpers
 * ============================================= */

export function isBlockId(id) {
    return !!id && id[0] === 'b';
}

/**
 * Get the proto type for the block.
 *
 * @param {string} blockType
 * @returns {string|null}
 */
export function getProtoNameForBlockType(blockType) {
    // TODO: Should be getProtoTypeForBlockType
    if (blockType === 'AssemblingMachineBlock') {
        return 'assembling-machine';
    }
    else if (blockType === 'FurnaceBlock') {
        return 'furnace';
    }
    else if (blockType === 'MiningDrillBlock') {
        return 'mining-drill';
    }
    else if (blockType === 'BeaconBlock') {
        return 'beacon';
    }
    else {
        return null;
    }
}

export function getBlockProto(block) {
    const protoType = getProtoNameForBlockType(block.type);
    return protoType && getProto(protoType, block.name);
}

export function getBlockRecipeProto(block) {
    if (block.type === 'AssemblingMachineBlock' || block.type === 'FurnaceBlock' || block.type === 'MiningDrillBlock') {
        return getProto(block.recipeType || 'recipe', block.recipeName);
    }
    else {
        return null;
    }
}

export function getValidRecipes(block) {
    if (block.type === 'AssemblingMachineBlock' || block.type === 'FurnaceBlock' || block.type === 'MiningDrillBlock') {
        return validRecipesForProto(getBlockProto(block));
    }
    else {
        return [];
    }
}

export function getProtosForBlockType(blockType) {
    const protoType = getProtoNameForBlockType(blockType);
    if (!data[protoType]) {
        return null;
    }

    return Object.keys(data[protoType]).reduce((ret, key) => {
        ret.push(data[protoType][key]);
        return ret;
    }, []);
}

export function validateBlock(block) {
    if (block.type === 'AssemblingMachineBlock' || block.type === 'FurnaceBlock' || block.type === 'MiningDrillBlock') {
        const blockProto = getBlockProto(block);
        const isValidProto = !!blockProto;
        const recipeProto = getBlockRecipeProto(block);
        const isValidRecipe = isValidRecipeForProto(blockProto, recipeProto);
        const isValidModules = !block.modules || isValidModulesForProto(blockProto, block.modules)
            && isValidModulesForRecipe(recipeProto, block.modules);

        return {
            isValid: isValidProto && isValidRecipe && isValidModules,
            isValidProto,
            isValidRecipe,
            isValidModules,
        };
    }
    else if (block.type === 'BeaconBlock') {
        const blockProto = getBlockProto(block);
        const isValidProto = !!blockProto;
        const isValidModules = isValidProto && !block.modules || isValidModulesForProto(blockProto, block.modules);

        return {
            isValid: isValidModules,
            isValidProto,
            isValidModules,
        };
    }
    else if (block.type === 'SupplyBlock') {
        return {
            isValid: true,
        };
    }
    else {
        warn(`Unexpected block type for ${block.blockId}: ${block.type}`);
        return {
            isValid: false,
        };
    }
}

export function getBlockBaseCycle(block) {
    if (block.type === 'AssemblingMachineBlock' || block.type === 'FurnaceBlock' || block.type === 'MiningDrillBlock') {
        return getRecipeCycle(getBlockProto(block), getBlockRecipeProto(block));
    }
    else if (block.type === 'SupplyBlock') {
        return 1;
    }
    else {
        throw new Error(`Cycle base time for block ${block.type} not supported`);
    }
}

/**
 * Check if the block type supports receiving ingredients.
 *
 * @param {string} type
 * @return {boolean}
 */
export function isIngredientReceiver(type) {
    return type === 'AssemblingMachineBlock' || type === 'FurnaceBlock';
}

export function getIngredientReceiverIngredients(block) {
    const recipeProto = getBlockRecipeProto(block);
    return recipeProto && recipeGetIngredients(recipeProto);
}

/**
 * Check if the block type supports sending ingredients.
 *
 * @param {string} type
 * @return {boolean}
 */
export function isIngredientSender(type) {
    return type === 'AssemblingMachineBlock' || type === 'FurnaceBlock'
        || type === 'MiningDrillBlock' || type === 'SupplyBlock';
}

export function getIngredientSenderResults(block) {
    if (block.type === 'SupplyBlock') {
        return [block.result];
    }
    else {
        const recipeProto = getBlockRecipeProto(block);
        return recipeProto && recipeGetResults(recipeProto);
    }
}

/**
 * Check if the block type can receive effects.
 *
 * @param {string} type
 * @return {boolean}
 */
export function isEffectReceiver(type) {
    return type === 'AssemblingMachineBlock' || type === 'MiningDrillBlock' || type === 'FurnaceBlock';
}

/**
 * Check if the block type can send effects.
 *
 * @param {string} type
 * @return {boolean}
 */
export function isEffectSender(type) {
    return type === 'BeaconBlock';
}

/**
 * @typedef {object} InputOutputRate
 * @property {string} type
 * @property {string} type
 * @property {number} rate
 */

/**
 * @param {Block} block
 * @param {Effect} effect
 * @returns {InputOutputRate[]}
 */
export function calculateOutputRates(block, effect) {
    const cycle = getBlockBaseCycle(block) / (1 + (effect ? effect.speed : 0));
    return getIngredientSenderResults(block)
        .map(({ type, name, amount, probability = 1 }) => ({
            type,
            name,
            rate: amount / cycle * (1 + (effect ? effect.productivity : 0)) * block.quantity * probability,
        }));
}

/**
 * @param {Block} block
 * @param {Effect} effect
 * @returns {InputOutputRate[]}
 */
export function calculateInputRates(block, effect) {
    const cycle = getBlockBaseCycle(block) / (1 + (effect ? effect.speed : 0));
    return getIngredientReceiverIngredients(block)
        .map(({ type, name, amount }) => ({
            type,
            name,
            rate: amount / cycle * block.quantity,
        }));
}
