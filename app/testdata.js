export default {
    ver: 1,
    blocks: {
        b1: {
            blockId: 'b1',
            type: 'AssemblingMachineBlock',
            x: 500,
            y: 300,
            quantity: 12,
            name: 'assembling-machine-3',
            recipeName: 'advanced-circuit',
            modules: [
                'productivity-module-3',
                'productivity-module-3',
                'productivity-module-3',
                'productivity-module-3',
            ],
        },
        b2: {
            blockId: 'b2',
            type: 'AssemblingMachineBlock',
            x: 300,
            y: 250,
            quantity: 2,
            name: 'chemical-plant',
            recipeName: 'plastic-bar',
            modules: [
                'productivity-module-3',
                'productivity-module-3',
                'productivity-module-3',
            ],
            ringRotate: -45,
        },
        b3: {
            blockId: 'b3',
            type: 'AssemblingMachineBlock',
            x: 450,
            y: 100,
            quantity: 2,
            name: 'assembling-machine-3',
            recipeName: 'copper-cable',
            modules: [
                'productivity-module-3',
                'productivity-module-3',
                'productivity-module-3',
                'productivity-module-3',
            ],
        },
        b4: {
            blockId: 'b4',
            type: 'AssemblingMachineBlock',
            x: 100,
            y: 150,
            quantity: 1,
            name: 'assembling-machine-3',
            recipeName: 'empty-petroleum-gas-barrel',
            modules: [
                'speed-module-3',
                'speed-module-3',
                'speed-module-3',
                'speed-module-3',
            ],
        },
        b5: {
            blockId: 'b5',
            type: 'BeaconBlock',
            x: 700,
            y: 300,
            quantity: 12,
            name: 'beacon',
            modules: [
                'speed-module-3',
                'speed-module-3',
            ],
        },
        b6: {
            blockId: 'b6',
            type: 'AssemblingMachineBlock',
            x: 600,
            y: 100,
            quantity: 69,
            name: 'assembling-machine-3',
            recipeName: 'electronic-circuit',
            modules: [
                'productivity-module-3',
                'productivity-module-3',
                'productivity-module-3',
                'productivity-module-3',
            ],
            ringRotate: 30,
        },
        b7: {
            blockId: 'b7',
            type: 'SupplyBlock',
            x: 750,
            y: 60,
            result: {
                type: 'item',
                name: 'copper-cable',
                rate: 100,
            },
        },
        b8: {
            blockId: 'b8',
            // type: 'SupplyBlock',
            // x: 750,
            // y: 120,
            // result: {
            //     type: 'item',
            //     name: 'iron-plate'
            // }
            type: 'FurnaceBlock',
            name: 'electric-furnace',
            x: 850,
            y: 100,
            quantity: 1,
            recipeName: 'iron-plate',
            modules: [
                'productivity-module-3',
                'productivity-module-3',
            ],
            ringRotate: 90,
        },
        b9: {
            blockId: 'b9',
            type: 'SupplyBlock',
            x: 250,
            y: 100,
            result: {
                type: 'item',
                name: 'coal',
                rate: 'infinite',
            },
        },
        b10: {
            blockId: 'b10',
            type: 'SupplyBlock',
            x: 225,
            y: 40,
            result: {
                type: 'item',
                name: 'petroleum-gas-barrel',
                rate: 'infinite',
            },
        },
        b11: {
            blockId: 'b11',
            type: 'SupplyBlock',
            x: 300,
            y: 50,
            result: {
                type: 'item',
                name: 'copper-plate',
                rate: 'infinite',
            },
        },
        b12: {
            blockId: 'b12',
            type: 'MiningDrillBlock',
            name: 'electric-mining-drill',
            x: 850,
            y: 300,
            quantity: 1,
            recipeType: 'resource',
            recipeName: 'iron-ore',
            modules: [
                'productivity-module-3',
            ],
            ringRotate: 180,
        },
        b13: {
            blockId: 'b13',
            type: 'MiningDrillBlock',
            name: 'electric-mining-drill',
            x: 1000,
            y: 300,
            quantity: 1,
            recipeType: 'resource',
            recipeName: 'uranium-ore',
            modules: [
                'productivity-module-3',
            ],
        },
        b14: {
            blockId: 'b14',
            type: 'AssemblingMachineBlock',
            name: 'centrifuge',
            quantity: 1,
            x: 1000,
            y: 100,
            recipeName: 'uranium-processing',
            modules: [
                'productivity-module-3',
                'speed-module-3',
            ],
        },
        b15: {
            blockId: 'b15',
            type: 'AssemblingMachineBlock',
            x: 400,
            y: 400,
            quantity: 1,
            name: 'assembling-machine-3',
            recipeName: 'fill-petroleum-gas-barrel',
            modules: [
                'speed-module-3',
                'speed-module-3',
                'speed-module-3',
                'speed-module-3',
            ],
        },
        b16: {
            blockId: 'b16',
            type: 'AssemblingMachineBlock',
            x: 250,
            y: 400,
            quantity: 1,
            name: 'assembling-machine-3',
            recipeName: 'empty-petroleum-gas-barrel',
            modules: [
                'speed-module-3',
                'speed-module-3',
                'speed-module-3',
                'speed-module-3',
            ],
        },
        b17: {
            blockId: 'b17',
            type: 'AssemblingMachineBlock',
            x: 100,
            y: 400,
            quantity: 1,
            name: 'assembling-machine-3',
            recipeName: 'fill-petroleum-gas-barrel',
            modules: [
                'speed-module-3',
                'speed-module-3',
                'speed-module-3',
                'speed-module-3',
            ],
        },
        b18: {
            blockId: 'b18',
            type: 'BeaconBlock',
            x: 700,
            y: 400,
            quantity: 12,
            name: 'beacon',
            modules: [
                'speed-module-3',
                'productivity-module-3',
            ],
        },
        b19: {
            blockId: 'b19',
            type: 'MiningDrillBlock',
            name: 'electric-mining-drill',
            x: 1000,
            y: 450,
            quantity: 1,
            recipeType: 'resource',
            recipeName: 'crude-oil',
            modules: [
                'productivity-module-3',
            ],
        },
        b20: {
            blockId: 'b20',
            type: 'AssemblingMachineBlock',
            x: 850,
            y: 450,
            quantity: 1,
            name: 'assembling-machine-3',
            recipeName: 'fill-petroleum-gas-barrel',
            modules: [
                'productivity-module-3',
                'speed-module-3',
                'speed-module-3',
                'speed-module-3',
            ],
        },
        b21: {
            blockId: 'b21',
            type: 'AssemblingMachineBlock',
            x: 600,
            y: 450,
            quantity: 1,
            name: 'assembling-machineX',
            recipeName: 'fill-petroleum-gas-barrel',
            modules: [],
        },
        b99: {
            blockId: 'b99',
            type: 'DistributionBlock',
            x: 50 + 170 * 4,
            y: 50,
        },
    },
    connections: {
        c1: {
            connectionId: 'c1',
            type: 'result',
            srcBlockId: 'b2',
            destBlockId: 'b1',
            meta: {
                results: [
                    {
                        type: 'item',
                        name: 'plastic-bar',
                        percentage: 1,
                    },
                ],
            },
        },
        c2: {
            connectionId: 'c2',
            type: 'result',
            srcBlockId: 'b3',
            destBlockId: 'b1',
            meta: {
                results: [
                    {
                        type: 'item',
                        name: 'copper-cable',
                        percentage: 1,
                    },
                ],
            },
        },
        c3: {
            connectionId: 'c3',
            type: 'result',
            srcBlockId: 'b4',
            destBlockId: 'b2',
            meta: {
                results: [
                    {
                        type: 'fluid',
                        name: 'petroleum-gas',
                        percentage: 1,
                    },
                ],
            },
        },
        c4: {
            connectionId: 'c4',
            type: 'result',
            srcBlockId: 'b6',
            destBlockId: 'b1',
            meta: {
                results: [
                    {
                        type: 'item',
                        name: 'electronic-circuit',
                        percentage: 1,
                    },
                ],
            },
        },
        c5: {
            connectionId: 'c5',
            type: 'result',
            srcBlockId: 'b7',
            destBlockId: 'b6',
            meta: {
                results: [
                    {
                        type: 'item',
                        name: 'copper-cable',
                        percentage: 1,
                    },
                ],
            },
        },
        c6: {
            connectionId: 'c6',
            type: 'result',
            srcBlockId: 'b8',
            destBlockId: 'b6',
            meta: {
                results: [
                    {
                        type: 'item',
                        name: 'iron-plate',
                        percentage: 1,
                    },
                ],
            },
        },
        c7: {
            connectionId: 'c7',
            type: 'result',
            srcBlockId: 'b10',
            destBlockId: 'b4',
            meta: {
                results: [
                    {
                        type: 'item',
                        name: 'petroleum-gas-barrel',
                        percentage: 1,
                    },
                ],
            },
        },
        c8: {
            connectionId: 'c8',
            type: 'result',
            srcBlockId: 'b9',
            destBlockId: 'b2',
            meta: {
                results: [
                    {
                        type: 'item',
                        name: 'coal',
                        percentage: 1,
                    },
                ],
            },
        },
        c9: {
            connectionId: 'c9',
            type: 'result',
            srcBlockId: 'b11',
            destBlockId: 'b3',
            meta: {
                results: [
                    {
                        type: 'item',
                        name: 'copper-plate',
                        percentage: 1,
                    },
                ],
            },
        },
        c10: {
            connectionId: 'c10',
            type: 'effect',
            srcBlockId: 'b5',
            destBlockId: 'b1',
            meta: {
                distributions: [
                    {
                        effectPerBlock: 3,
                        blocksAffected: -2,
                    },
                    {
                        effectPerBlock: 2,
                        blocksAffected: 2,
                    },
                ],
            },
        },
        c11: {
            connectionId: 'c11',
            type: 'result',
            srcBlockId: 'b12',
            destBlockId: 'b8',
            meta: {
                results: [
                    {
                        type: 'item',
                        name: 'iron-ore',
                    },
                ],
            },
        },
        c12: {
            connectionId: 'c12',
            type: 'result',
            srcBlockId: 'b4',
            destBlockId: 'b15',
            meta: {
                results: [
                    {
                        type: 'fluid',
                        name: 'petroleum-gas',
                    },
                    {
                        type: 'item',
                        name: 'empty-barrel',
                    },
                ],
            },
        },
        c13: {
            connectionId: 'c13',
            type: 'result',
            srcBlockId: 'b15',
            destBlockId: 'b16',
            meta: {
                results: [
                    {
                        type: 'item',
                        name: 'petroleum-gas-barrel',
                    },
                ],
            },
        },
        c14: {
            connectionId: 'c14',
            type: 'result',
            srcBlockId: 'b16',
            destBlockId: 'b17',
            meta: {
                results: [
                    {
                        type: 'fluid',
                        name: 'petroleum-gas',
                    },
                    {
                        type: 'item',
                        name: 'empty-barrel',
                    },
                ],
            },
        },
        c15: {
            connectionId: 'c15',
            type: 'result',
            srcBlockId: 'b17',
            destBlockId: 'b4',
            meta: {
                results: [
                    {
                        type: 'item',
                        name: 'petroleum-gas-barrel',
                    },
                ],
            },
        },
    },
};
