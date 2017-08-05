import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { actions } from '../state/reducers';
import { determineWheelDelta, isMac } from '../util/platform';

const directionalKeys = {
    87: { // w
        y: -1,
    },
    83: { // s
        y: 1,
    },
    65: { // a
        x: -1,
    },
    68: { // d
        x: 1,
    },
    38: { // ArrowUp
        y: -1,
    },
    40: { // ArrowDown
        y: 1,
    },
    37: { // ArrowLeft
        x: -1,
    },
    39: { // ArrowRight
        x: 1,
    },
};

const zoomKeys = {
    81: -1, // q
    69: 1, // e
    33: 1, // PageUp
    34: -1, // PageDown
};

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

    stopKeyPanning() {
        if (this._setIntervalKeyPan != null) {
            clearInterval(this._setIntervalKeyPan);
            delete this._setIntervalKeyPan;
            delete this._panX;
            delete this._panY;
        }
    }

    stopKeyZooming() {
        if (this._setIntervalKeyZoom != null) {
            clearInterval(this._setIntervalKeyZoom);
            delete this._setIntervalKeyZoom;
            delete this._panZ;
        }
    }

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
        const { onKeyEscape, onSelectAll, onPanSurface, onZoomSurface } = this.props;

        if (evt.keyCode === 27) {
            evt.preventDefault();
            this.stopKeyPanning();
            this.stopKeyZooming();
            onKeyEscape();
        }

        else if (evt.keyCode === 65 && (isMac && evt.metaKey || !isMac && evt.ctrlKey)) {
            evt.preventDefault();
            onSelectAll();
        }

        else if (directionalKeys[evt.keyCode]) {
            evt.preventDefault();
            const { x, y } = directionalKeys[evt.keyCode];

            this.stopKeyZooming();
            this._panX = x || this._panX || 0;
            this._panY = y || this._panY || 0;

            if (this._setIntervalKeyPan == null) {
                this._setIntervalKeyPan = setInterval(() => {
                    onPanSurface(
                        -this._panX * 15,
                        -this._panY * 15,
                    );
                }, 16);
            }
        }

        else if (zoomKeys[evt.keyCode]) {
            evt.preventDefault();
            const z = zoomKeys[evt.keyCode];

            this.stopKeyPanning();
            this._panZ = z || this._panZ || 0;

            if (this._setIntervalKeyZoom == null) {
                this._setIntervalKeyZoom = setInterval(() => {
                    onZoomSurface(
                        this._panZ * 15,
                    );
                }, 16);
            }
        }

        else {
            this.stopKeyPanning();
            this.stopKeyZooming();
        }
    };

    handleKeyUp = (evt) => {
        if (directionalKeys[evt.keyCode]) {
            evt.preventDefault();

            if (this._setIntervalKeyPan != null) {
                const { x, y } = directionalKeys[evt.keyCode];
                this._panX = x === this._panX ? 0 : this._panX;
                this._panY = y === this._panY ? 0 : this._panY;

                if (this._panX === 0 && this._panY === 0) {
                    this.stopKeyPanning();
                }
            }
        }

        else if (zoomKeys[evt.keyCode]) {
            evt.preventDefault();

            if (this._setIntervalKeyZoom != null) {
                const z = zoomKeys[evt.keyCode];
                if (this._panZ === z) {
                    this.stopKeyZooming();
                }
            }
        }
    };

    handleBlur = () => {
        this.stopKeyPanning();
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
                onKeyUp={this.handleKeyUp}
                onMouseDown={this.handleMouseDown}
                onMouseUp={isBoxSelecting || isDragging ? this.handleMouseUp : null}
                onMouseMove={isBoxSelecting || isDragging ? this.handleMouseMove : null}
                onBlur={this.handleBlur}
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
