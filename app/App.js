import React, { Component } from 'react';
import '../styles/app.scss';

import Workspace from './components/Workspace';

/*class EffectBlock extends Component {
    render() {
        const { x = 0, y = 0, blockId, modules, quantity = 1 } = this.props;
        const effectBlock = factorio.effectBlocks[blockId];
        const blockItem = factorio.items[effectBlock.item];

        const quantityOffset = quantity > 99 ? 8
            : quantity > 9 ? 4 : 0;

        return (
            <g className="block" transform={`translate(${x}, ${y})`}>
                <circle className="block__bg block__bg--effect" cx={50} cy={40} r={40}/>

                <Icon size={22} cx={40 - quantityOffset} cy={24} icon={blockItem.icon} tooltip={blockItem.label}/>
                <text className="block__multiplier" x={50 + 6 - quantityOffset} y={32}>x{quantity}</text>

                <BlockModules cx={50} cy={52} modules={modules} />
            </g>
        );
    }
}*/

export default class App extends Component {
    render() {
        return (
            <div className="app">
                <div className="toolbar">TOOLBAR</div>
                <Workspace/>
            </div>
        );
    }
}
