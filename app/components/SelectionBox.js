import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

export class SelectionBox extends Component {

    static propTypes = {
        isBoxSelecting: PropTypes.bool,
        boxSelectionStartX: PropTypes.number,
        boxSelectionStartY: PropTypes.number,
        boxSelectionEndX: PropTypes.number,
        boxSelectionEndY: PropTypes.number,
    };

    static defaultProps = {
        isBoxSelecting: false,
        boxSelectionStartX: 0,
        boxSelectionStartY: 0,
        boxSelectionEndX: 0,
        boxSelectionEndY: 0,
    };

    render() {
        const {
            isBoxSelecting,
            boxSelectionStartX, boxSelectionStartY,
            boxSelectionEndX, boxSelectionEndY,
        } = this.props;

        if (!isBoxSelecting) {
            return null;
        }

        return (
            <rect
                className="selection-box"
                x={Math.min(boxSelectionStartX, boxSelectionEndX)}
                y={Math.min(boxSelectionStartY, boxSelectionEndY)}
                width={Math.max(boxSelectionStartX, boxSelectionEndX) - Math.min(boxSelectionStartX, boxSelectionEndX)}
                height={Math.max(boxSelectionStartY, boxSelectionEndY) - Math.min(boxSelectionStartY, boxSelectionEndY)}
            />
        );
    }
}

export default connect((state) => ({
    isBoxSelecting: state.surface.isBoxSelecting,
    boxSelectionStartX: state.surface.boxSelectionStartX || 0,
    boxSelectionStartY: state.surface.boxSelectionStartY || 0,
    boxSelectionEndX: state.surface.boxSelectionEndX || 0,
    boxSelectionEndY: state.surface.boxSelectionEndY || 0,
}))(SelectionBox);
