import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { selectedIdsSelector, validatedBlocksSelector } from '../state/selectors';
import * as Block from '../models/Block';
import IOBlockProperties from './properties/IOBlockProperties';

const BlockPropertiesFactory = connect((state, { blockId }) => ({
    blockType: validatedBlocksSelector(state)[blockId] && validatedBlocksSelector(state)[blockId].type,
}))(class extends Component {
    static displayName = 'BlockPropertiesFactory';

    static propTypes = {
        blockId: PropTypes.string.isRequired,
        blockType: PropTypes.string.isRequired,
    };

    render() {
        const { blockId, blockType } = this.props;

        if (!blockType) {
            return <div>Invalid blockId: {blockId}</div>;
        }
        else if (blockType === 'AssemblingMachineBlock'
            || blockType === 'FurnaceBlock'
            || blockType === 'MiningDrillBlock') {
            return <IOBlockProperties blockId={blockId}/>;
        }
        else if (blockType === 'BeaconBlock') {
            return <div>BEACON PROPS {blockId}</div>;
        }
        else {
            return <div>Unknown blockType: {blockType}</div>;
        }
    }
});

class PropertiesPanel extends Component {

    static propTypes = {
        selectedId: PropTypes.string,
    };

    static defaultProps = {
        selectedId: null,
    };

    render() {
        const { selectedId } = this.props;

        if (!selectedId) {
            return null;
        }

        let contentHTML;
        if (Block.isBlockId(selectedId)) {
            contentHTML = <BlockPropertiesFactory blockId={selectedId} />;
        }

        if (!contentHTML) {
            return null;
        }

        return (
            <div className="properties-panel">
                {contentHTML}
            </div>
        );
    }
}

const mapStateToProps = (state) => {
    const selectedIds = selectedIdsSelector(state);
    return {
        selectedId: selectedIds.length === 1 ? selectedIds[0] : null,
    };
};

const mapDispatchToProps = (dispatch) => ({

});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PropertiesPanel);
