import { warn } from '../util';
import {
    getProto,
    getRecipeCycle,
    getResourceCycle,
    isValidModulesForProto,
    isValidModulesForRecipe,
    isValidRecipeForProto,
    isValidResourceForProto,
    recipeGetIngredients,
    recipeGetResults,
    resourceGetIngredients,
    resourceGetResults,
} from '../factorio';

import { isEffectReceiver, isEffectSender, isValidEffectDistribution } from './effect';

export function getBlockBaseCycle(block) {
    if (block.type === 'AssemblingMachineBlock' || block.type === 'FurnaceBlock') {
        return getRecipeCycle(getBlockProto(block), getProto('recipe', block.recipeName));
    }
    else if (block.type === 'MiningDrillBlock') {
        return getResourceCycle(getBlockProto(block), getProto('resource', block.resourceName));
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
    return type === 'AssemblingMachineBlock';
}

export function getIngredientReceiverIngredients(block) {
    if (block.type === 'AssemblingMachineBlock' || block.type === 'FurnaceBlock') {
        const recipeProto = getProto('recipe', block.recipeName);
        return recipeProto && recipeGetIngredients(recipeProto);
    }
    else if (block.type === 'MiningDrillBlock') {
        const resourceProto = getProto('resource', block.resourceName);
        return resourceProto && resourceGetIngredients(resourceProto);
    }
    else {
        return null;
    }
}

/**
 * Check if the block type supports sending ingredients.
 *
 * @param {string} type
 * @return {boolean}
 */
export function isIngredientSender(type) {
    return type === 'AssemblingMachineBlock' || type === 'SupplyBlock';
}

export function getIngredientSenderResults(block) {
    if (block.type === 'AssemblingMachineBlock' || block.type === 'FurnaceBlock') {
        const recipeProto = getProto('recipe', block.recipeName);
        return recipeProto && recipeGetResults(recipeProto);
    }
    else if (block.type === 'MiningDrillBlock') {
        const resourceProto = getProto('resource', block.resourceName);
        return resourceProto && resourceGetResults(resourceProto);
    }
    else if (block.type === 'SupplyBlock') {
        return [block.result];
    }
    else {
        throw new Error(`getIngredientSenderResults not supported for ${block.type}`);
    }
}

export function getBlockProto(block) {
    if (block.type === 'AssemblingMachineBlock') {
        return getProto('assembling-machine', block.name);
    }
    else if (block.type === 'FurnaceBlock') {
        return getProto('furnace', block.name);
    }
    else if (block.type === 'MiningDrillBlock') {
        return getProto('mining-drill', block.name);
    }
    else if (block.type === 'BeaconBlock') {
        return getProto('beacon', block.name);
    }
    else {
        return null;
        //throw new Error(`getBlockProto not supported for ${block.type}`);
    }
}

export function validateBlock(block) {
    if (block.type === 'AssemblingMachineBlock' || block.type === 'FurnaceBlock') {
        const blockProto = getBlockProto(block);
        const recipeProto = getProto('recipe', block.recipeName);
        const isValidRecipe = isValidRecipeForProto(blockProto, recipeProto);
        const isValidModules = !block.modules || isValidModulesForProto(blockProto, block.modules)
            && isValidModulesForRecipe(recipeProto, block.modules);

        return {
            isValid: isValidRecipe && isValidModules,
            isValidRecipe,
            isValidModules,
        };
    }
    else if (block.type === 'MiningDrillBlock') {
        const blockProto = getBlockProto(block);
        const resourceProto = getProto('resource', block.resourceName);
        const isValidResource = isValidResourceForProto(blockProto, resourceProto);
        const isValidModules = !block.modules || isValidModulesForProto(blockProto, block.modules);

        return {
            isValid: isValidResource && isValidModules,
            isValidResource,
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
            rate: amount / cycle * (1 + (effect ? effect.productivity : 0)) * block.quantity,
        }));
}

function ingredientComparator(a, b) {
    return a.type === b.type && a.name === b.name;
}
