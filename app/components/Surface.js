import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { actions } from '../state/reducers';

export class Surface extends Component {

    static propTypes = {
        children: PropTypes.any.isRequired,

        offsetX: PropTypes.number,
        offsetY: PropTypes.number,
        isBoxSelecting: PropTypes.bool,

        onPanSurface: PropTypes.func.isRequired,
        onBoxSelectionStart: PropTypes.func.isRequired,
        onBoxSelectionMove: PropTypes.func.isRequired,
        onBoxSelectionEnd: PropTypes.func.isRequired,
    };

    static defaultProps = {
        offsetX: 0,
        offsetY: 0,
        isBoxSelecting: false,
    };

    handleWheel = (event) => {
        this.props.onPanSurface(-event.deltaX, -event.deltaY);
    };

    handleContextMenu = (evt) => {
        evt.preventDefault();
    };

    handleMouseDown = (evt) => {
        const { onBoxSelectionStart, offsetX, offsetY } = this.props;
        const { top: surfaceTop, left: surfaceLeft } = evt.currentTarget.getBoundingClientRect();
        evt.preventDefault();

        if (evt.target === evt.currentTarget) {
            onBoxSelectionStart(
                evt.clientX - surfaceLeft - offsetX,
                evt.clientY - surfaceTop - offsetY,
                evt.shiftKey || evt.altKey || evt.metaKey
            );
        }
    };

    handleMouseMove = (evt) => {
        const { isBoxSelecting, onBoxSelectionMove, offsetX, offsetY } = this.props;
        evt.preventDefault();

        if (isBoxSelecting) {
            const { top: surfaceTop, left: surfaceLeft } = evt.currentTarget.getBoundingClientRect();
            onBoxSelectionMove(
                evt.clientX - surfaceLeft - offsetX,
                evt.clientY - surfaceTop - offsetY
            );
        }
    };

    handleMouseUp = (evt) => {
        const { isBoxSelecting, onBoxSelectionEnd, offsetX, offsetY } = this.props;
        if (isBoxSelecting) {
            const { top: surfaceTop, left: surfaceLeft } = evt.currentTarget.getBoundingClientRect();
            onBoxSelectionEnd(
                evt.clientX - surfaceLeft - offsetX,
                evt.clientY - surfaceTop - offsetY
            );
        }
    };

    render() {
        const {
            offsetX, offsetY,
            onPanSurface,
            isBoxSelecting,
        } = this.props;

        return (
            <svg className="surface"
                onWheel={onPanSurface ? this.handleWheel : null}
                onContextMenu={this.handleContextMenu}
                onMouseDown={this.handleMouseDown}
                onMouseUp={isBoxSelecting ? this.handleMouseUp : null}
                onMouseMove={isBoxSelecting ? this.handleMouseMove : null}
            >
                <g transform={`translate(${offsetX}, ${offsetY})`}>
                    {this.props.children}
                </g>
            </svg>
        );
    }
}

export default connect((state) => ({
    offsetX: state.surface.offsetX,
    offsetY: state.surface.offsetY,
    isBoxSelecting: state.selection.isBoxSelecting,
}), (dispatch) => ({
    onPanSurface: (dx, dy) => dispatch(actions.panSurface(dx, dy)),
    onBoxSelectionStart: (x, y, isAdd) => dispatch(actions.boxSelectionStart(x, y, isAdd)),
    onBoxSelectionMove: (x, y) => dispatch(actions.boxSelectionMove(x, y)),
    onBoxSelectionEnd: () => dispatch(actions.boxSelectionEnd()),
}))(Surface);
