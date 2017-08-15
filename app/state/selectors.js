import { createSelector, createSelectorCreator, defaultMemoize } from 'reselect';
import { buildGraph } from '../util/graph';
import * as Block from '../models/Block';
import * as Connection from '../models/Connection';
import {
    calculateBeaconEffect, calculateModulesEffect,
    mergeEffects, scaleEffect,
} from '../util/effect';
import { memoize, createKeyMemoizedSelector, arrayValuesEqualityCheck } from '../util/selector';
import { getProto } from '../factorio';
import { calcDistance } from '../util/math';

export const dragDeltaSelector = createSelector(
    (state) => state.surface.dragStartX,
    (state) => state.surface.dragStartY,
    (state) => state.surface.dragEndX,
    (state) => state.surface.dragEndY,
    (x1, y1, x2, y2) =>
        calcDistance(x1, y1, x2, y2) > 2 ? {
            x: x2 - x1,
            y: y2 - y1,
        } : false,
);

export const selectedIdsSelector = createSelector(
    (state) => state.surface.selectedById,
    Object.keys
);

export const networkIdsSelector = createSelector(
    (state) => graphSelector(state).networks,
    (networks) => Object.keys(networks),
);

export const graphSelector = createSelectorCreator(memoize, { skipHead: 2 })(
    (state) => state.blocks,
    (state) => state.connections,
    (state) => state.blockIds,
    (state) => state.connectionIds,
    (blocks, connections) => buildGraph(blocks, connections)
);

/**
 * @function
 * @params {object} state
 * @returns {object.<string,ValidatedBlock>}
 */
export const validatedBlocksSelector = createSelector(
    (state) => state.blockIds,
    (state) => state.blocks,
    createKeyMemoizedSelector(
        (blockId) =>
            createSelector(
                (blocks) => blocks[blockId],
                (block) => {
                    /**
                     * @typedef {Block} ValidatedBlock
                     * @property {boolean} isValid
                     * @property {boolean} isValidProto
                     * @property {boolean} isValidRecipe
                     * @property {boolean} isValidModules
                     */
                    return {
                        ...block,
                        ...Block.validateBlock(block),
                    };
                }
            )
    )
);

/**
 * @function
 * @params {object} state
 * @returns {object.<string,ValidatedConnection>}
 */
export const validatedConnectionsSelector = createSelector(
    (state) => state.connectionIds,
    (state) => state.connections,
    (state) => state.blocks,
    createKeyMemoizedSelector(
        (connectionId) =>
            createSelector(
                (connections) => connections[connectionId],
                (connections, blocks) => blocks[connections[connectionId].srcBlockId],
                (connections, blocks) => blocks[connections[connectionId].destBlockId],
                (connection, srcBlock, destBlock) => {
                    let validationMessages = [];

                    /**
                     * @typedef {Connection} ValidatedConnection
                     * @property {boolean} isValid
                     * @property {string[]} validationMessages
                     * @property {Block} srcBlock
                     * @property {Block} destBlock
                     */
                    return {
                        ...connection,
                        isValid: Connection.isValidConnection(connection, srcBlock, destBlock, validationMessages),
                        validationMessages,
                        srcBlock,
                        destBlock,
                    };
                }
            )
    )
);

/**
 * @function
 * @params {object} state
 * @returns {object.<string,BlockIO>}
 */
export const blockIOSelector = createSelector(
    (state) => state.blockIds,
    validatedBlocksSelector,
    validatedConnectionsSelector,
    graphSelector,
    createKeyMemoizedSelector(
        (blockId) =>
            createSelector(
                // Select block.
                (blocks) => blocks[blockId],

                // Select (memozied) effect connections for the block.
                createSelectorCreator(defaultMemoize, arrayValuesEqualityCheck)(
                    (blocks, connections, graph) => {
                        const graphNode = graph.networks[graph.nodeToNetwork[blockId]].nodes[blockId];
                        return Object.keys(graphNode.inbound).sort()
                            .map((blockId) => connections[graphNode.inbound[blockId]])
                            .filter((connection) => connection.type === 'effect' && connection.isValid);
                    },
                    (v) => v
                ),

                /**
                 * @param {ValidatedBlock} block
                 * @param {ValidatedConnection[]} effectConnections
                 * @return {*}
                 */
                (block, effectConnections) => {
                    const isSender = Block.isIngredientSender(block.type);
                    const isReceiver = Block.isIngredientReceiver(block.type);
                    if (!block.isValid || !isSender && !isReceiver) {
                        return false;
                    }

                    const effects = [
                        calculateModulesEffect(block.modules || []),
                    ];

                    // Add effects from inbound blocks
                    for (const effectConnection of effectConnections) {
                        for (const distribution of effectConnection.meta.distributions) {
                            if (Block.isEffectSender(effectConnection.srcBlock.type)) {

                                const beaconEffect = calculateBeaconEffect(
                                    getProto('beacon', effectConnection.srcBlock.name),
                                    effectConnection.srcBlock.modules
                                );

                                const quantityAffected = distribution.blocksAffected <= 0
                                    ? block.quantity + distribution.blocksAffected
                                    : distribution.blocksAffected;

                                effects.push(
                                    scaleEffect(
                                        beaconEffect,
                                        distribution.effectPerBlock / block.quantity * quantityAffected
                                    )
                                );
                            }
                        }
                    }

                    /**
                     * @typedef {object} BlockIO
                     * @property {Effect} effect
                     * @property {InputOutputRate[]} output
                     * @property {InputOutputRate[]} input
                     */

                    const ret = {
                        effect: effects.length > 1
                            ? mergeEffects(...effects)
                            : effects[0],
                    };

                    if (isSender) {
                        ret.output = Block.calculateOutputRates(
                            block,
                            ret.effect
                        );
                    }

                    if (isReceiver) {
                        ret.input = Block.calculateInputRates(
                            block,
                            ret.effect
                        );
                    }

                    return ret;
                }
            )
    )
);
