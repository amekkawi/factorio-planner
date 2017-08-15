/**
 * @param {object.<string,ValidatedBlock>} blocks
 * @param {object.<string,ValidatedConnection>} connections
 * @returns {Graph}
 */
export function buildGraph(blocks, connections) {
    const nodes = {};

    // Go through all connections and associate them with the blocks.
    for (const connectionId of Object.keys(connections)) {
        const connection = connections[connectionId];

        const srcNode = nodes[connection.srcBlockId] || (nodes[connection.srcBlockId] = {
            blockId: connection.srcBlockId,
            outbound: {},
            inbound: {},
            downstream: {},
            upstream: {},
        });

        const destNode = nodes[connection.destBlockId] || (nodes[connection.destBlockId] = {
            blockId: connection.destBlockId,
            outbound: {},
            inbound: {},
            downstream: {},
            upstream: {},
        });

        // Verify the connection is between two different blocks.
        if (connection.destBlockId === connection.srcBlockId) {
            throw new Error(`Connection has same source and destination: ${connectionId}`);
        }

        // Verify the two blocks do not already have a connection.
        if (srcNode.outbound[connection.destBlockId] || srcNode.inbound[connection.destBlockId]) {
            throw new Error(`Connection ${connectionId} duplicates ${srcNode.outbound[connection.destBlockId].connectionId} between block ${srcNode.blockId} and ${destNode.blockId}`);
        }

        // Add the connection to src/dest nodes.
        srcNode.outbound[connection.destBlockId] = connectionId;
        destNode.inbound[connection.srcBlockId] = connectionId;
    }

    const rootNodes = new Set();

    // Go through the actual blocks and determine roots.
    for (const blockId of Object.keys(blocks)) {

        /**
         * @typedef {object} GraphNode
         * @property {string} blockId
         * @property {object.<string,string>} outbound
         * @property {object.<string,string>} inbound
         * @property {object.<string,boolean>} downstream
         * @property {object.<string,boolean>} upstream
         */

        // Create node if it doesn't exist (which means the block has no connections).
        const node = nodes[blockId] || (nodes[blockId] = {
            blockId: blockId,
            outbound: {},
            inbound: {},
            downstream: {},
            upstream: {},
        });

        // Roots have no inbound connections.
        if (!Object.keys(node.inbound).length) {
            node.isRoot = true;
            rootNodes.add(node);
        }

        // Leafs have no outbound connections.
        if (!Object.keys(node.outbound).length) {
            node.isLeaf = true;
        }
    }

    const networks = {};
    const nodeToNetwork = {};
    const connectionToNetwork = {};
    let nextNetworkId = 1;

    for (const rootNode of rootNodes) {
        const networkId = `n${nextNetworkId++}`;

        /**
         * @typedef {object} GraphNetwork
         * @property {string} networkId
         * @property {object.<string,GraphNode>} nodes
         * @property {string[]} roots
         * @property {string[]} leafs
         * @property {boolean} isCyclic
         * @property {object.<string,string>} cyclicConnections
         */
        const network = networks[networkId] = {
            networkId,
            nodes: {},
            connections: [],
            roots: [],
            leafs: [],
            isCyclic: false,
            cyclicConnections: {},
        };

        const outboundQueue = [rootNode];
        const inboundQueue = [];

        let node = null;
        let isOutbound = true;

        const next = () => {
            if (outboundQueue.length) {
                isOutbound = true;
                node = outboundQueue.shift();
                return true;
            }
            else if (inboundQueue.length) {
                isOutbound = false;
                node = inboundQueue.shift();
                return true;
            }

            return false;
        };

        while (next()) {
            // Skip blocks in the inbound queue if already visited.
            // This can happen if a connection is cyclic.
            if (!isOutbound && network.nodes[node.blockId]) {
                continue;
            }

            node.networkId = networkId;
            nodeToNetwork[node.blockId] = networkId;
            network.nodes[node.blockId] = node;

            if (node.isRoot) {
                network.roots.push(node.blockId);
                rootNodes.delete(node);
            }

            if (node.isLeaf) {
                network.leafs.push(node.blockId);
            }

            // Process outbound connections.
            for (const blockId of Object.keys(node.outbound)) {
                const connectionId = node.outbound[blockId];
                const connection = connections[connectionId];

                network.connections.push(connectionId);
                connectionToNetwork[connectionId] = networkId;

                const destNode = nodes[connection.destBlockId];

                // Connection is cyclic if destination node is upstream of source node.
                if (node.upstream[connection.destBlockId]) {
                    node.isCyclic = true;
                    network.isCyclic = true;
                    network.cyclicConnections[connectionId] = blockId;
                }
                else if (!network.nodes[blockId]) {
                    propagateDownstream(nodes, node, destNode);
                    outboundQueue.push(nodes[blockId]);
                }
            }

            // Queue unvisited inbound blocks for traversal.
            for (const blockId of Object.keys(node.inbound)) {
                if (!network.nodes[blockId]) {
                    inboundQueue.push(nodes[blockId]);
                }
            }
        }
    }

    console.log('--graph--', {
        networks,
        nodeToNetwork,
        connectionToNetwork,
    });

    /**
     * @typedef {object} Graph
     * @property {object.<string,GraphNetwork>} networks
     * @property {object.<string,string>} nodeToNetwork
     * @property {object.<string,string>} connectionToNetwork
     */
    return {
        networks,
        nodeToNetwork,
        connectionToNetwork,
    };
}

function propagateDownstream(nodes, srcNode, destNode) {
    // Include dest and dest's downstream into src's downstream.
    srcNode.downstream[destNode.blockId] = true;
    Object.assign(srcNode.downstream, destNode.downstream);

    // Propogate new src's downstream to nodes upstream of src.
    for (const blockId of Object.keys(srcNode.upstream)) {
        Object.assign(nodes[blockId].downstream, srcNode.downstream);
    }

    // Include src and src's upstream into dest's upstream.
    destNode.upstream[srcNode.blockId] = true;
    Object.assign(destNode.upstream, srcNode.upstream);

    // Propogate new dest's upstream to nodes downstream of dest.
    for (const blockId of Object.keys(destNode.downstream)) {
        Object.assign(nodes[blockId].upstream, destNode.upstream);
    }
}
