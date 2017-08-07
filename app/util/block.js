import { warn } from '../util';
import {
    getProto,
    getRecipeCycle,
    isValidModulesForProto,
    isValidModulesForRecipe,
    isValidRecipeForProto,
    recipeGetIngredients,
    recipeGetResults,
    validRecipesForProto,
} from '../factorio';

import { isEffectReceiver, isEffectSender, isValidEffectDistribution } from './effect';

export function isBlockId(id) {
    return !!id && id[0] === 'b';
}

export function isConnectorId(id) {
    return !!id && id[0] === 'c';
}

export function validRecipesForBlock(block) {
    if (block.type === 'AssemblingMachineBlock' || block.type === 'FurnaceBlock' || block.type === 'MiningDrillBlock') {
        return validRecipesForProto(getBlockProto(block));
    }
    else {
        return [];
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

export function getBlockRecipeProto(block) {
    if (block.type === 'AssemblingMachineBlock' || block.type === 'FurnaceBlock' || block.type === 'MiningDrillBlock') {
        return getProto(block.recipeType || 'recipe', block.recipeName);
    }
    else {
        return null;
    }
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
 * Get the proto type for the block.
 *
 * @param {string} blockType
 * @returns {string|null}
 */
export function getProtoNameForBlockType(blockType) {
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

export function validateBlock(block) {
    if (block.type === 'AssemblingMachineBlock' || block.type === 'FurnaceBlock' || block.type === 'MiningDrillBlock') {
        const blockProto = getBlockProto(block);
        const isValidProto = !!blockProto;
        const recipeProto = getBlockRecipeProto(block);
        const isValidRecipe = isValidProto && isValidRecipeForProto(blockProto, recipeProto);
        const isValidModules = isValidProto && !block.modules || isValidModulesForProto(blockProto, block.modules)
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

export function isValidConnection(connection, srcBlock, destBlock) {
    if (connection.type === 'result') {
        if (!isIngredientSender(srcBlock.type) || !isIngredientReceiver(destBlock.type)) {
            return false;
        }

        const srcResults = getIngredientSenderResults(srcBlock);
        const destIngredients = getIngredientReceiverIngredients(destBlock);
        if (!srcResults || !destIngredients) {
            return false;
        }

        // Make sure the src outputs the results and the dest needs the results as ingredients.
        for (const result of connection.meta.results) {
            if (!isValidConnectionResult(srcResults, destIngredients, result)) {
                return false;
            }
        }

        return true;
    }
    else if (connection.type === 'effect') {
        if (!isEffectSender(srcBlock.type) || !isEffectReceiver(destBlock.type)) {
            return false;
        }

        for (const distribution of connection.meta.distributions) {
            if (!isValidEffectDistribution(distribution, destBlock.quantity)) {
                return false;
            }
        }

        // TODO: Check if effects are allowed to recipe? Maybe not since Beacons can't have production?

        return true;
    }
    else {
        warn(`Unexpected connection type: ${connection.type}`);
    }

    return false;
}

/**
 * Make sure the src outputs the result and the dest needs it as an ingredient.
 *
 * @param srcResults
 * @param destIngredients
 * @param result
 * @returns {boolean}
 */
export function isValidConnectionResult(srcResults, destIngredients, result) {
    const resultComparator = ingredientComparator.bind(null, result);
    return srcResults.some(resultComparator) && destIngredients.some(resultComparator);
}

export function calculateOutputRates(block, effect) {
    const cycle = getBlockBaseCycle(block) / (1 + (effect ? effect.speed : 0));
    return getIngredientSenderResults(block)
        .map(({ type, name, amount, probability = 1 }) => ({
            type,
            name,
            rate: amount / cycle * (1 + (effect ? effect.productivity : 0)) * block.quantity * probability,
        }));
}

export function calculateInputRates(block, effect) {
    const cycle = getBlockBaseCycle(block) / (1 + (effect ? effect.speed : 0));
    return getIngredientReceiverIngredients(block)
        .map(({ type, name, amount }) => ({
            type,
            name,
            rate: amount / cycle * block.quantity,
        }));
}

function ingredientComparator(a, b) {
    return a.type === b.type && a.name === b.name;
}
