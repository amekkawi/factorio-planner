import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { actions } from '../state/reducers';
import { determineWheelDelta, isMac } from '../util/platform';

export class Surface extends Component {

    static propTypes = {
        children: PropTypes.any.isRequired,

        zoom: PropTypes.number,
        offsetX: PropTypes.number,
        offsetY: PropTypes.number,
        isBoxSelecting: PropTypes.bool,
        isDragging: PropTypes.bool,

        onSelectAll: PropTypes.func.isRequired,
        onKeyEscape: PropTypes.func.isRequired,
        onPanSurface: PropTypes.func.isRequired,
        onZoomSurface: PropTypes.func.isRequired,
        onBoxSelectionStart: PropTypes.func.isRequired,
        onBoxSelectionMove: PropTypes.func.isRequired,
        onBoxSelectionEnd: PropTypes.func.isRequired,
        onDragSelectionInit: PropTypes.func.isRequired,
        onDragSelectionMove: PropTypes.func.isRequired,
        onDragSelectionEnd: PropTypes.func.isRequired,
    };

    static defaultProps = {
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        isBoxSelecting: false,
        isDragging: false,
    };

    handleWheel = (evt) => {
        const { onPanSurface, onZoomSurface, offsetX, offsetY, zoom } = this.props;

        if (evt.ctrlKey && onZoomSurface) {
            evt.preventDefault();
            const { top: surfaceTop, left: surfaceLeft } = evt.currentTarget.getBoundingClientRect();
            onZoomSurface(
                determineWheelDelta(evt.deltaY, evt.deltaMode),
                (evt.clientX - surfaceLeft - offsetX) / zoom,
                (evt.clientY - surfaceTop - offsetY) / zoom
            );
        }
        else if (onPanSurface) {
            evt.preventDefault();
            onPanSurface(
                determineWheelDelta(evt.deltaX, evt.deltaMode),
                determineWheelDelta(evt.deltaY, evt.deltaMode)
            );
        }
    };

    handleContextMenu = (evt) => {
        evt.preventDefault();
    };

    handleKeyDown = (evt) => {
        const { onKeyEscape, onSelectAll } = this.props;

        if (evt.keyCode === 27) {
            evt.preventDefault();
            onKeyEscape();
        }
        else if (evt.keyCode === 65 && (isMac && evt.metaKey || !isMac && evt.ctrlKey)) {
            evt.preventDefault();
            onSelectAll();
        }
    };

    handleMouseDown = (evt) => {
        evt.currentTarget.focus();

        const { onBoxSelectionStart, offsetX, offsetY, zoom, onDragSelectionInit } = this.props;
        evt.preventDefault();

        if (evt.target === evt.currentTarget) {
            const { top: surfaceTop, left: surfaceLeft } = evt.currentTarget.getBoundingClientRect();
            onBoxSelectionStart(
                (evt.clientX - surfaceLeft - offsetX) / zoom,
                (evt.clientY - surfaceTop - offsetY) / zoom,
                evt.shiftKey || evt.altKey || evt.metaKey
            );
        }
        else {
            const { top: surfaceTop, left: surfaceLeft } = evt.currentTarget.getBoundingClientRect();
            onDragSelectionInit(
                (evt.clientX - surfaceLeft - offsetX) / zoom,
                (evt.clientY - surfaceTop - offsetY) / zoom,
            );
        }
    };

    handleMouseMove = (evt) => {
        const { isBoxSelecting, onBoxSelectionMove, offsetX, offsetY, zoom, isDragging, onDragSelectionMove } = this.props;
        evt.preventDefault();

        if (isBoxSelecting) {
            const { top: surfaceTop, left: surfaceLeft } = evt.currentTarget.getBoundingClientRect();
            onBoxSelectionMove(
                (evt.clientX - surfaceLeft - offsetX) / zoom,
                (evt.clientY - surfaceTop - offsetY) / zoom
            );
        }
        else if (isDragging) {
            const { top: surfaceTop, left: surfaceLeft } = evt.currentTarget.getBoundingClientRect();
            onDragSelectionMove(
                (evt.clientX - surfaceLeft - offsetX) / zoom,
                (evt.clientY - surfaceTop - offsetY) / zoom
            );
        }
    };

    handleMouseUp = (evt) => {
        const { isBoxSelecting, onBoxSelectionEnd, offsetX, offsetY, zoom, isDragging, onDragSelectionEnd } = this.props;
        if (isBoxSelecting) {
            const { top: surfaceTop, left: surfaceLeft } = evt.currentTarget.getBoundingClientRect();
            onBoxSelectionEnd(
                (evt.clientX - surfaceLeft - offsetX) / zoom,
                (evt.clientY - surfaceTop - offsetY) / zoom
            );
        }
        else if (isDragging) {
            onDragSelectionEnd();
        }
    };

    render() {
        const {
            offsetX, offsetY, zoom,
            onPanSurface,
            onZoomSurface,
            isBoxSelecting,
            isDragging,
        } = this.props;

        return (
            <svg id="DefaultFocus" className="surface"
                tabIndex="0"
                onWheel={onZoomSurface || onPanSurface ? this.handleWheel : null}
                onContextMenu={this.handleContextMenu}
                onKeyDown={this.handleKeyDown}
                onMouseDown={this.handleMouseDown}
                onMouseUp={isBoxSelecting || isDragging ? this.handleMouseUp : null}
                onMouseMove={isBoxSelecting || isDragging ? this.handleMouseMove : null}
                ref={(elem) => { this.svgRef = elem; }}
            >
                <g transform={`translate(${offsetX}, ${offsetY}) scale(${zoom})`}>
                    {this.props.children}
                </g>
            </svg>
        );
    }
}

export default connect((state) => ({
    offsetX: state.surface.offsetX,
    offsetY: state.surface.offsetY,
    zoom: state.surface.zoom,
    isBoxSelecting: state.surface.isBoxSelecting,
    isDragging: state.surface.isDragging,
}), (dispatch) => ({
    onSelectAll: () => dispatch(actions.selectionAll()),
    onKeyEscape: () => dispatch(actions.keyEscape()),
    onPanSurface: (dx, dy) => dispatch(actions.panSurface(dx, dy)),
    onZoomSurface: (delta, x, y) => dispatch(actions.zoomSurface(delta, x, y)),
    onBoxSelectionStart: (x, y, isAdd) => dispatch(actions.boxSelectionStart(x, y, isAdd)),
    onBoxSelectionMove: (x, y) => dispatch(actions.boxSelectionMove(x, y)),
    onBoxSelectionEnd: () => dispatch(actions.boxSelectionEnd()),
    onDragSelectionInit: (x, y) => dispatch(actions.dragSelectionInit(x, y)),
    onDragSelectionMove: (x, y) => dispatch(actions.dragSelectionMove(x, y)),
    onDragSelectionEnd: () => dispatch(actions.dragSelectionEnd()),
}))(Surface);
