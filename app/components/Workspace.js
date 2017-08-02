import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Surface from './Surface';
import Tooltip from './Tooltip';
import IconDefs from './IconDefs';
import SurfaceGrid from './SurfaceGrid';
import SelectionBox from './SelectionBox';
import BlockConnection from './BlockConnection';
import AssemblingMachineBlock from './AssemblingMachineBlock';
import FurnaceBlock from './FurnaceBlock';
import MiningDrillBlock from './MiningDrillBlock';
import BeaconBlock from './BeaconBlock';
import SupplyBlock from './SupplyBlock';

function SurfaceBlockFactory(props) {
    const type = props.block && props.block.type || null;

    switch (type) {
        case 'AssemblingMachineBlock':
            return (
                <AssemblingMachineBlock blockId={props.blockId}/>
            );
        case 'FurnaceBlock':
            return (
                <FurnaceBlock blockId={props.blockId}/>
            );
        case 'MiningDrillBlock':
            return (
                <MiningDrillBlock blockId={props.blockId}/>
            );
        case 'BeaconBlock':
            return (
                <BeaconBlock {...(props.block || {})} blockId={props.blockId}/>
            );
        case 'SupplyBlock':
            return (
                <SupplyBlock {...(props.block || {})} blockId={props.blockId}/>
            );
        default:
            return <text y={300}>UNKNOWN: [{props.blockId}] {type}</text>;
    }
}

SurfaceBlockFactory.propTypes = {
    block: PropTypes.object.isRequired,
    blockId: PropTypes.string.isRequired,
};

const SurfaceBlock = connect((state, ownProps) => {
    return {
        blockId: ownProps.blockId,
        block: state.blocks[ownProps.blockId],
    };
})(SurfaceBlockFactory);

class Workspace extends Component {

    static propTypes = {
        blockIds: PropTypes.arrayOf(PropTypes.string).isRequired,
        connectionIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    };

    renderBlocks() {
        const { blockIds } = this.props;
        const blocksHtml = [];

        for (const blockId of blockIds) {
            blocksHtml.push(
                <SurfaceBlock
                    key={blockId}
                    blockId={blockId}
                />
            );
        }

        return (
            <g className="surface__blocks">
                {blocksHtml}
            </g>
        );
    }

    renderConnections() {
        const { connectionIds } = this.props;
        const connectionsHtml = [];

        for (const connectionId of connectionIds) {
            connectionsHtml.push(
                <BlockConnection
                    key={connectionId}
                    connectionId={connectionId}
                />
            );
        }

        return (
            <g className="surface__connections">
                {connectionsHtml}
            </g>
        );
    }

    render() {
        return (
            <div className="workspace">
                <Surface>
                    <IconDefs/>
                    <SurfaceGrid/>
                    {this.renderBlocks()}
                    {this.renderConnections()}
                    <SelectionBox/>
                </Surface>
                <Tooltip/>
            </div>
        );
    }
}

export default connect((state) => ({
    blockIds: state.blockIds,
    connectionIds: state.connectionIds,
}))(Workspace);
