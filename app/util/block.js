import { warn } from '../util';
import {
    getProto,
    getRecipeCycle,
    isValidModulesForProto,
    isValidModulesForRecipe,
    isValidRecipeForProto,
    recipeGetIngredients,
    recipeGetResults,
} from '../factorio';

import { isEffectReceiver, isEffectSender, isValidEffectDistribution } from './effect';

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
        const recipeProto = getBlockRecipeProto(block);
        const isValidRecipe = isValidRecipeForProto(blockProto, recipeProto);
        const isValidModules = !block.modules || isValidModulesForProto(blockProto, block.modules)
            && isValidModulesForRecipe(recipeProto, block.modules);

        return {
            isValid: isValidRecipe && isValidModules,
            isValidRecipe,
            isValidModules,
        };
    }
    else if (block.type === 'BeaconBlock') {
        const blockProto = getBlockProto(block);
        const isValidModules = !block.modules || isValidModulesForProto(blockProto, block.modules);

        return {
            isValid: isValidModules,
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
    }
}

export function isValidConnection(connection, srcBlock, destBlock) {
    if (connection.type === 'results') {
        if (!isIngredientSender(srcBlock.type) || isIngredientReceiver(destBlock.type)) {
            return false;
        }

        const srcResults = getIngredientSenderResults(srcBlock);
        const destIngredients = getIngredientReceiverIngredients(destBlock);
        if (!srcResults || !destIngredients) {
            return false;
        }

        for (const result of connection.meta.results) {
            const resultComparator = ingredientComparator.bind(null, result);

            // Make sure the src outputs the result and the dest needs it as an ingredient.
            if (!srcResults.some(resultComparator) || !destIngredients.some(resultComparator)) {
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

    return false;
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
