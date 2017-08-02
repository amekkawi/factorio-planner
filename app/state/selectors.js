import { createSelector, createSelectorCreator, defaultMemoize } from 'reselect';
import { buildGraph } from '../util/graph';
import {
    calculateInputRates, calculateOutputRates,
    isIngredientReceiver, isIngredientSender,
    isValidConnection, validateBlock,
} from '../util/block';
import {
    calculateBeaconEffect, calculateModulesEffect,
    isEffectSender, mergeEffects, scaleEffect,
} from '../util/effect';
import { memoize, createKeyMemoizedSelector, arrayValuesEqualityCheck } from '../util/selector';
import { getProto } from '../factorio';

export const graphSelector = createSelectorCreator(memoize, { skipHead: 2 })(
    (state) => state.blocks,
    (state) => state.connections,
    (state) => state.blockIds,
    (state) => state.connectionIds,
    (blocks, connections) => buildGraph(blocks, connections)
);

export const validatedBlocksSelector = createSelector(
    (state) => state.blockIds,
    (state) => state.blocks,
    createKeyMemoizedSelector(
        (blockId) =>
            createSelector(
                (blocks) => blocks[blockId],
                (block) => ({
                    ...block,
                    ...validateBlock(block),
                })
            )
    )
);

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
                    return {
                        ...connection,
                        isValid: isValidConnection(connection, srcBlock, destBlock),
                        srcBlock,
                        destBlock,
                    };
                }
            )
    )
);

export const blockIOSelector = createSelector(
    (state) => state.blockIds,
    validatedBlocksSelector,
    validatedConnectionsSelector,
    graphSelector,
    createKeyMemoizedSelector(
        (blockId) =>
            createSelector(
                (blocks) => blocks[blockId],
                createSelectorCreator(defaultMemoize, arrayValuesEqualityCheck)(
                    (blocks, connections, graph) => {
                        const graphNode = graph.networks[graph.nodeToNetwork[blockId]].nodes[blockId];
                        return Object.keys(graphNode.inbound).sort()
                            .map((blockId) => connections[graphNode.inbound[blockId]])
                            .filter((connection) => connection.type === 'effect' && connection.isValid);
                    },
                    (v) => v
                ),
                (block, effectConnections) => {
                    const isSender = isIngredientSender(block.type);
                    const isReceiver = isIngredientReceiver(block.type);
                    if (!block.isValid || !isSender && !isReceiver) {
                        return false;
                    }

                    const effects = [
                        calculateModulesEffect(block.modules || []),
                    ];

                    // Add effects from inbound blocks
                    for (const effectConnection of effectConnections) {
                        for (const distribution of effectConnection.meta.distributions) {
                            if (isEffectSender(effectConnection.srcBlock.type)) {

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

                    const ret = {
                        effect: effects.length > 1
                            ? mergeEffects(...effects)
                            : effects[0],
                    };

                    if (isSender) {
                        ret.output = calculateOutputRates(
                            block,
                            ret.effect
                        );
                    }

                    if (isReceiver) {
                        ret.input = calculateInputRates(
                            block,
                            ret.effect
                        );
                    }

                    if (blockId === 'b1')
                        console.log('b1-calc-eff', blockId, { block, effectConnections, effects, ...ret });

                    return ret;
                }
            )
    )
);
