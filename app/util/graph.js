export function buildGraph(blocks, connections) {
    const nodes = {};

    for (const connectionId of Object.keys(connections)) {
        const connection = connections[connectionId];

        const srcNode = nodes[connection.srcBlockId] || (nodes[connection.srcBlockId] = {
            blockId: connection.srcBlockId,
            outbound: {},
            inbound: {},
        });

        const destNode = nodes[connection.destBlockId] || (nodes[connection.destBlockId] = {
            blockId: connection.destBlockId,
            outbound: {},
            inbound: {},
        });

        // Verify the connection is between two different blocks.
        if (connection.destBlockId === connection.srcBlockId) {
            throw new Error(`Connection has same source and destination: ${connectionId}`);
        }

        // Verify the two blocks do not already have a connection.
        if (srcNode.outbound[connection.destBlockId] || srcNode.inbound[connection.destBlockId]) {
            throw new Error(`Connection ${connectionId} duplicates ${srcNode.outbound[connection.destBlockId].connectionId} between block ${srcNode.blockId} and ${destNode.blockId}`);
        }

        srcNode.outbound[connection.destBlockId] = connectionId;
        destNode.inbound[connection.srcBlockId] = connectionId;
    }

    const rootNodes = new Set();

    // Go through the actual blocks and determine roots
    for (const blockId of Object.keys(blocks)) {

        // Create a node for blocks that aren't connected.
        const node = nodes[blockId] || (nodes[blockId] = {
            blockId: blockId,
            outbound: {},
            inbound: {},
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

    // Cyclic checking
    for (const rootNode of rootNodes) {
        const networkId = `n${nextNetworkId++}`;
        const network = networks[networkId] = {
            nodes: {},
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
            // This happens if a connection is cyclic.
            if (!isOutbound && network.nodes[node.blockId]) {
                continue;
            }

            node.networkId = networkId;
            nodeToNetwork[node.blockId] = networkId;
            network.nodes[node.blockId] = node;

            if (node.isRoot) {
                network.roots.push(node.blockId);

                // Remove nodes that are part of the same network,
                // as traversing them again would create duplicate networks.
                rootNodes.delete(node);
            }

            if (node.isLeaf) {
                network.leafs.push(node.blockId);
            }

            // Queue outbound connections for traversal.
            for (const blockId of Object.keys(node.outbound)) {
                const connectionId = node.outbound[blockId];
                connectionToNetwork[connectionId] = networkId;

                // Queue block if is unvisited.
                if (!network.nodes[blockId]) {
                    outboundQueue.push(nodes[blockId]);
                }

                // Mark connection as cyclic if
                else if (isOutbound) {
                    node.isCyclic = true;
                    network.isCyclic = true;
                    network.cyclicConnections[connectionId] = blockId;
                    //console.warn(`Cyclic connection ${connectionId} to ${blockId}`);
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

    return {
        networks,
        nodeToNetwork,
        connectionToNetwork,
    };
}
