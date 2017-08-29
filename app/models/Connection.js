import V from '../util/validate';
import { warn, isProtoEqual } from '../util';
import * as Block from '../models/Block';
import { findByProto, getProtoId } from '../util/index';
import { getLocalizedName } from '../factorio';
import {
    isValidEffectDistribution,
    defaultDistributions,
    createEffectDistribution,
} from './EffectDistribution';

/* =============================================
 *                   Schema
 * ============================================= */

const baseKeys = {
    connectionId: V.required().string().regex(/^c\d+$/),
    type: V.allow([
        'result',
        'effect',
    ]),
    srcBlockId: V.required().string().regex(/^b\d+$/),
    destBlockId: V.required().string().regex(/^b\d+$/),
};

const baseSchema = V.object().keys(baseKeys);

const schemaByType = {};

/**
 * @typedef {object} Connection
 * @property {string} connectionId
 * @property {string} type
 * @property {string} srcBlockId
 * @property {string} destBlockId
 * @property {ConnectionMeta} meta
 */

/**
 * @typedef {object} ConnectionMeta
 * @property {ConnectionMetaResult[]} results
 * @property {EffectDistribution[]} distributions
 */

/**
 * @typedef {object} ConnectionMetaResult
 * @property {string} type
 * @property {string} name
 */

schemaByType.result = V.object()
    .keys({
        ...baseKeys,
        meta: V.required().object().keys({
            results: V.required().array().items([
                V.object().keys({
                    type: V.default('item').string().min(1),
                    name: V.required().string().min(1),
                }),
            ]),
        }),
    });

schemaByType.effect = V.object()
    .keys({
        ...baseKeys,
        meta: V.required().object().keys({
            distributions: V.default(defaultDistributions)
                .array().items([
                    V.transform(createEffectDistribution),
                ]),
        }),
    });

/**
 * @param {object} props
 * @param {string} connectionId
 * @return {Connection}
 */
export function createConnection(props, connectionId) {
    try {
        if (!props || !schemaByType[props.type]) {
            baseSchema.validate(props);
        }
        else {
            props = schemaByType[props.type].validate(props);
            props.connectionId = connectionId;
            return props;
        }
    }
    catch (err) {
        err.message = `[Connection ${connectionId}] ${err.message}`;
        throw err;
    }
}

/* =============================================
 *                Getters/Helpers
 * ============================================= */

export function isConnectionId(id) {
    return !!id && id[0] === 'c';
}

export function isResultConnection(connection) {
    return connection && connection.type === 'result';
}

export function isEffectConnection(connection) {
    return connection && connection.type === 'effect';
}

export function isValidConnection(connection, srcBlock, destBlock, messages = null) {
    if (isResultConnection(connection)) {
        const isSender = Block.isIngredientSender(srcBlock.type);
        if (!isSender) {
            if (!messages) {
                return false;
            }

            messages.push('Source block does send results');
        }

        const isReceiver = Block.isIngredientReceiver(destBlock.type);
        if (!isReceiver) {
            if (!messages) {
                return false;
            }

            messages.push('Destination block does receive ingredients');
        }

        if (isSender && isReceiver) {
            const srcResults = Block.getIngredientSenderResults(srcBlock);
            if (!srcResults || !srcResults.list.length) {
                if (!messages) {
                    return false;
                }

                messages.push('Source block recipe does not output any results');
            }

            const destIngredients = Block.getIngredientReceiverIngredients(destBlock);
            if (!destIngredients || !destIngredients.list.length) {
                if (!messages) {
                    return false;
                }

                messages.push('Destination block recipe does have any ingredients');
            }

            if (srcResults && destIngredients) {
                // Make sure the src outputs the results and the dest needs the results as ingredients.
                for (const result of connection.meta.results) {
                    if (!isValidConnectionResult(srcResults, destIngredients, result, messages)) {
                        if (!messages) {
                            return false;
                        }
                    }
                }
            }
        }

        return !messages || messages.length === 0;
    }
    else if (isEffectConnection(connection)) {
        if (!Block.isEffectSender(srcBlock.type)) {
            if (!messages) {
                return false;
            }

            messages.push('Source block does not transmit effects (i.e. speed)');
        }

        if (!Block.isEffectReceiver(destBlock.type)) {
            if (!messages) {
                return false;
            }

            messages.push('Destination block does not receive effects (i.e. speed)');
        }

        for (const distribution of connection.meta.distributions) {
            if (!isValidEffectDistribution(distribution, destBlock.quantity, messages)) {
                if (!messages) {
                    return false;
                }
            }
        }

        // TODO: Check if effects are allowed to recipe? Might not be needed though since Beacons can't have production modules.

        return !messages || messages.length === 0;
    }
    else {
        warn(`Unexpected connection type: ${connection.type}`);
    }

    return {
        isValid: false,
        messages: [
            `Unknown connection type: ${connection.type}`,
        ],
    };
}

/**
 * Make sure the src outputs the result and the dest needs it as an ingredient.
 *
 * @param srcResults
 * @param destIngredients
 * @param result
 * @param {string[]} [messages]
 * @returns {boolean}
 */
export function isValidConnectionResult(srcResults, destIngredients, result, messages = null) {
    const resultId = getProtoId(result);

    if (!srcResults.byId[resultId]) {
        if (!messages) {
            return false;
        }

        messages.push(`Source block does not output result: ${getLocalizedName(getProto(result.type, result.name))}`);
    }

    if (!destIngredients.byId[resultId]) {
        if (!messages) {
            return false;
        }

        messages.push(`Destination block does not have ingredient: ${getLocalizedName(getProto(result.type, result.name))}`);
    }

    return !messages || messages.length === 0;
}
