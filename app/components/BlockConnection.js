import React, { Component } from 'react';
import { connect } from 'react-redux';
import ClassNames from 'classnames';
import PropTypes from 'prop-types';
import * as platformUtil from '../util/platform';
import { actions } from '../state/reducers';
import { dragDeltaSelector, graphSelector, validatedConnectionsSelector } from '../state/selectors';
import { getBlockTypeRadius } from '../util';
import { calcAngle, calcMidpoint, calcAngledDistance, calcRadian, calcDistance } from '../util/math';
import HoverContainer from './HoverContainer';
import Icon from './Icon';

export class BlockConnection extends Component {

    static propTypes = {
        connectionId: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,

        srcCX: PropTypes.number.isRequired,
        srcCY: PropTypes.number.isRequired,
        srcRadius: PropTypes.number.isRequired,

        destCX: PropTypes.number.isRequired,
        destCY: PropTypes.number.isRequired,
        destRadius: PropTypes.number.isRequired,

        isSrcDragging: PropTypes.bool,
        isDestDragging: PropTypes.bool,
        dragDelta: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.bool
        ]),

        meta: PropTypes.object.isRequired,

        isSelected: PropTypes.bool,
        onSelectAdd: PropTypes.func,
        onSelectRemove: PropTypes.func,
        onSelectSet: PropTypes.func,

        isValid: PropTypes.bool,
        isCyclic: PropTypes.bool,

        isRelatedHovered: PropTypes.bool,
        isHoverDisabled: PropTypes.bool,
        isHovered: PropTypes.bool,
        onHoverOver: PropTypes.func,
        onHoverOut: PropTypes.func,
    };

    static defaultProps = {
        isValid: true,
        isCyclic: false,
        isRelatedHovered: false,
        isSrcDragging: false,
        isDestDragging: false,
        dragDelta: false,
        isSelected: false,
        onSelectAdd: null,
        onSelectRemove: null,
        onSelectSet: null,
        isHoverDisabled: false,
        isHovered: false,
        onHoverOver: null,
        onHoverOut: null,
    };

    renderResults(x1, y1, x2, y2, deg) {
        const { meta, isHoverDisabled, isHovered, isRelatedHovered } = this.props;

        if (!meta || !Array.isArray(meta.results) || !meta.results.length) {
            return null;
        }

        const radius = !isHoverDisabled && (isHovered || isRelatedHovered) ? 13 : 5;
        const { x, y } = calcMidpoint(x1, y1, x2, y2);
        const maxDistance = calcDistance(x1, y1, x2, y2);
        const startDistance = (meta.results.length - 1) * (radius * 2 + 4) / 2;

        if (maxDistance < startDistance * 2 + radius * 2 + 10) {
            deg += 90;
        }

        return (
            <g>
                {!isHoverDisabled && isHovered && <rect
                    x={x - (radius + 2) * meta.results.length}
                    y={y - radius - 4}
                    width={(radius * 2 + 4) * meta.results.length}
                    height={(radius + 4) * 2}
                    transform={`rotate(${deg}, ${x}, ${y})`}
                    fill="transparent"
                />}
                {meta.results.map((result, i) => {
                    const distanceFromStart = startDistance - (i * (radius * 2 + 4));
                    const { x: ax, y: ay } = calcAngledDistance(x, y, deg, distanceFromStart);

                    return (
                        <g key={i} className="block-connector block-connector--out"
                            transform={`translate(${ax}, ${ay})`}>
                            <circle
                                className="block-connector__bg block-connector__bg--out"
                                r={radius}
                            />
                            {!isHoverDisabled && (isHovered || isRelatedHovered) && <Icon
                                className={`block-connector__img block-connector__img--out`}
                                type={result.type} name={result.name}
                                size={16}
                            />}
                        </g>
                    );
                })}
            </g>
        );
    }

    renderDistribution(x1, y1, x2, y2, deg) {
        const { meta, isHoverDisabled, isHovered, isRelatedHovered } = this.props;

        if (!meta || !Array.isArray(meta.distributions) || !meta.distributions.length) {
            return null;
        }

        const radius = !isHoverDisabled && (isHovered || isRelatedHovered) ? 13 : 5;
        const { x, y } = calcMidpoint(x1, y1, x2, y2);
        const maxDistance = calcDistance(x1, y1, x2, y2);
        const startDistance = (meta.distributions.length - 1) * (radius * 2 + 4) / 2;

        if (maxDistance < startDistance * 2 + radius * 2 + 10) {
            deg += 90;
        }

        return (
            <g>
                {!isHoverDisabled && isHovered && <rect
                    x={x - (radius + 2) * meta.distributions.length}
                    y={y - radius - 4}
                    width={(radius * 2 + 4) * meta.distributions.length}
                    height={(radius + 4) * 2}
                    transform={`rotate(${deg}, ${x}, ${y})`}
                    fill="transparent"
                />}
                {meta.distributions.map((distribution, i) => {
                    const distanceFromStart = startDistance - (i * (radius * 2 + 4));
                    const { x: ax, y: ay } = calcAngledDistance(x, y, deg, distanceFromStart);

                    return (
                        <g key={i} className="block-connector block-connector--effect"
                            transform={`translate(${ax}, ${ay})`}>
                            <circle
                                className="block-connector__bg block-connector__bg--effect"
                                r={radius}
                            />
                            {!isHoverDisabled && (isHovered || isRelatedHovered) && <text
                                textAnchor="middle"
                                y={4}
                                className="block-connector__text"
                            >{distribution.blocksAffected || '*'}×{distribution.effectPerBlock}</text>}
                        </g>
                    );
                })}
            </g>
        );
    }

    renderSelectionBox(x1, y1, x2, y2) {
        const {
            isSelected,
        } = this.props;

        if (!isSelected) {
            return null;
        }

        const { x: mx, y: my } = calcMidpoint(x1, y1, x2, y2);
        const distance = Math.max(5, calcDistance(x1, y1, x2, y2));
        const deg = calcAngle(x1, y1, x2, y2);

        return (
            <rect
                className="selected-box"
                x={mx - (distance / 2)}
                y={my - 5}
                width={distance}
                height={10}
                rx="10"
                ry="10"
                transform={`rotate(${deg} ${mx} ${my})`}
            />
        );
    }

    handleMouseDown = (evt) => {
        const { isSelected, onSelectAdd, onSelectRemove, onSelectSet } = this.props;
        if (isSelected) {
            if (onSelectRemove && platformUtil.isMouseEventMultiSelectionRemove(evt)) {
                onSelectRemove();
            }
        }
        else if (onSelectAdd && platformUtil.isMouseEventMultiSelection(evt)) {
            onSelectAdd();
        }
        else if (onSelectSet) {
            onSelectSet();
        }
    };

    render() {
        const {
            connectionId, type,
            srcCX, srcCY, srcRadius,
            destCX, destCY, destRadius,
            isValid,
            isSrcDragging, isDestDragging, dragDelta,
            isHovered, onHoverOver, onHoverOut,
        } = this.props;

        if (!connectionId || srcCX == null || destCX == null) {
            return null;
        }

        const srcCXAdjusted = srcCX + (isSrcDragging && dragDelta ? dragDelta.x : 0);
        const srcCYAdjusted = srcCY + (isSrcDragging && dragDelta ? dragDelta.y : 0);
        const destCXAdjusted = destCX + (isDestDragging && dragDelta ? dragDelta.x : 0);
        const destCYAdjusted = destCY + (isDestDragging && dragDelta ? dragDelta.y : 0);

        const deg = calcAngle(srcCXAdjusted, srcCYAdjusted, destCXAdjusted, destCYAdjusted);
        const { x: x1, y: y1 } = calcRadian(srcCXAdjusted, srcCYAdjusted, srcRadius, deg);
        const { x: x2, y: y2 } = calcRadian(destCXAdjusted, destCYAdjusted, destRadius + 10, 180 + deg);

        const className = ClassNames('block-connection', {
            'block-connection--invalid': !isValid,
        });

        return (
            <HoverContainer data-connection-id={connectionId}
                className={className}
                onMouseDown={this.handleMouseDown}
                isHovered={isHovered}
                onHoverOver={onHoverOver}
                onHoverOut={onHoverOut}
                hoverTimeout={200}
            >
                <line className="block-connection__line" x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={2}/>
                <line className="block-connection__hover" x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={16} stroke="transparent"/>
                <path className="block-connection__arrow" d="M0 -5 l 0 10 l 10 -5 l -10 -5" transform={`translate(${x2}, ${y2}) rotate(${deg})`}/>
                {this.renderSelectionBox(x1, y1, x2, y2)}

                {type === 'result' && this.renderResults(x1, y1, x2, y2, deg)}
                {type === 'effect' && this.renderDistribution(x1, y1, x2, y2, deg)}
            </HoverContainer>
        );
    }
}

const mapStateToProps = (state, { connectionId }) => {
    const graph = graphSelector(state);
    const networkId = graph.connectionToNetwork[connectionId];
    const isCyclic = !!networkId && !!graph.networks[networkId].cyclicConnections[connectionId];

    const connection = validatedConnectionsSelector(state)[connectionId];
    const srcBlock = connection && state.blocks[connection.srcBlockId];
    const destBlock = connection && state.blocks[connection.destBlockId];

    const isHoverDisabled = state.surface.isBoxSelecting || state.surface.isDragging;
    const isSrcDragging = srcBlock && state.surface.isDragging && state.surface.selectedById[connection.srcBlockId];
    const isDestDragging = destBlock && state.surface.isDragging && state.surface.selectedById[connection.destBlockId];

    return {
        ...connection,
        isValid: connection.isValid && !isCyclic,
        isCyclic,
        isSelected: !!state.surface.selectedById[connectionId],
        isHoverDisabled,
        isHovered: state.detailExpanded === connectionId,
        isRelatedHovered: state.detailExpanded === connection.srcBlockId || state.detailExpanded === connection.destBlockId,

        isSrcDragging,
        isDestDragging,
        dragDelta: isSrcDragging || isDestDragging ? dragDeltaSelector(state) : false,

        srcCX: srcBlock && srcBlock.x,
        srcCY: srcBlock && srcBlock.y,
        srcRadius: getBlockTypeRadius(srcBlock && srcBlock.type, !isHoverDisabled && state.detailExpanded === connection.srcBlockId),

        destCX: destBlock && destBlock.x,
        destCY: destBlock && destBlock.y,
        destRadius: getBlockTypeRadius(destBlock && destBlock.type, !isHoverDisabled && state.detailExpanded === connection.destBlockId),
    };
};

const mapDispatchToProps = (dispatch, { connectionId }) => ({
    onSelectAdd: () => dispatch(actions.selectionAdd(connectionId)),
    onSelectRemove: () => dispatch(actions.selectionRemove(connectionId)),
    onSelectSet: () => dispatch(actions.selectionSet([connectionId])),
    onHoverOver: () => dispatch(actions.detailExpand(connectionId)),
    onHoverOut: () => dispatch(actions.detailCollapse(connectionId)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
    (stateProps, dispatchProps) => Object.assign({}, stateProps, dispatchProps)
)(BlockConnection);
