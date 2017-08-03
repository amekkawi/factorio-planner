import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
import * as factorio from '../factorio';
import { actions } from '../state/reducers';
import { dragDeltaSelector, validatedBlocksSelector } from '../state/selectors';
import * as platformUtil from '../util/platform';
import HoverContainer from './HoverContainer';
import IORing from './IORing';
import Icon from './Icon';
import BlockModules from './BlockModules';
import BlockConnector, { BlockConnector as BlockConnectorMini } from './BlockConnector';
import { getBlockRecipeProto, getIngredientReceiverIngredients, getIngredientSenderResults, getProtoNameForBlockType } from '../util/block';

class IOBlock extends Component {

    static propTypes = {
        blockId: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,

        x: PropTypes.number,
        y: PropTypes.number,
        quantity: PropTypes.number,
        recipeType: PropTypes.string,
        recipeName: PropTypes.string,
        modules: PropTypes.arrayOf(PropTypes.string),
        ringRotate: PropTypes.number,

        isSelected: PropTypes.bool,
        onSelectAdd: PropTypes.func,
        onSelectRemove: PropTypes.func,
        onSelectSet: PropTypes.func,

        dragDelta: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.bool,
        ]),
        onDragSelectionStart: PropTypes.func,

        isValid: PropTypes.bool,
        isValidRecipe: PropTypes.bool,
        isValidModules: PropTypes.bool,

        isHoverDisabled: PropTypes.bool,

        isHovered: PropTypes.bool,
        onHoverOver: PropTypes.func,
        onHoverOut: PropTypes.func,

        isRecipeHovered: PropTypes.bool,
        onHoverRecipeOver: PropTypes.func,
        onHoverRecipeOut: PropTypes.func,
    };

    static defaultProps = {
        x: 0,
        y: 0,
        quantity: 1,
        recipeType: 'recipe',
        recipeName: null,
        modules: [],
        ringRotate: 0,
        isSelected: false,
        onSelectAdd: null,
        onSelectRemove: null,
        onSelectSet: null,
        dragDelta: false,
        onDragSelectionStart: null,
        isValid: true,
        isValidRecipe: true,
        isValidModules: true,
        isHoverDisabled: false,
        isHovered: false,
        onHoverOver: null,
        onHoverOut: null,
        isRecipeHovered: false,
        onHoverRecipeOver: null,
        onHoverRecipeOut: null,
    };

    renderBlockIcon(blockProto, quantity) {
        const quantityOffset = quantity > 99 ? 8
            : quantity > 9 ? 4 : 0;

        return (
            <g className="block__protoicon">
                {!blockProto && <circle cx={-11 - quantityOffset} cy={-30} r={16} fill="red"/>}
                {blockProto && <Icon size={22} cx={-11 - quantityOffset} cy={-30} type={blockProto.type} name={blockProto.name}/>}
                <text className="block__multiplier" x={6 - quantityOffset} y={-23}>x{quantity}</text>
            </g>
        );
    }

    handleHoverRecipeOver = () => {
        this.props.onHoverRecipeOver();
    };

    handleHoverRecipeOut = () => {
        this.props.onHoverRecipeOut();
    };

    renderRecipeIcon() {
        const {
            isValidRecipe,
            isHoverDisabled,
            isHovered,
            isRecipeHovered,
            onHoverRecipeOver,
            onHoverRecipeOut,
        } = this.props;

        const recipeProto = getBlockRecipeProto(this.props);
        const hoverEnabled = !isHoverDisabled && isHovered && onHoverRecipeOver && onHoverRecipeOut;

        const Container = hoverEnabled ? HoverContainer : 'g';
        const containerProps = {
            className: 'block__recipe',
        };

        if (hoverEnabled) {
            Object.assign(containerProps, {
                hoverDelay: 75,
                isHovered: isRecipeHovered,
                onHoverOver: this.handleHoverRecipeOver,
                onHoverOut: this.handleHoverRecipeOut,
            });
        }

        return (
            <Container {...containerProps}>
                {!isValidRecipe && <circle cy={31} r={16} fill="red"/>}
                {recipeProto && <Icon size={32} cy={31} type={recipeProto.type} name={recipeProto.name}/>}
            </Container>
        );
    }

    renderConnectors(radius, width) {
        const { blockId, isHoverDisabled, isHovered, ringRotate } = this.props;
        const ingredients = getIngredientReceiverIngredients(this.props);
        const results = getIngredientSenderResults(this.props);
        const connectors = [];

        if (ingredients) {
            for (let i = 0; i < ingredients.length; i++) {
                connectors.push({
                    tooltip: {
                        sourceId: `${blockId}_ingredient_${i}`,
                        contentType: 'block-ingredient',
                        meta: {
                            blockId,
                            ingredientIndex: i,
                        },
                    },
                    direction: 'in',
                    deg: 270 - ((ingredients.length - 1) * 25 / 2) + i * 25 + ringRotate,
                    ...ingredients[i],
                });
            }
        }

        if (results) {
            for (let i = 0; i < results.length; i++) {
                connectors.push({
                    tooltip: {
                        sourceId: `${blockId}_result_${i}`,
                        contentType: 'block-result',
                        meta: {
                            blockId,
                            resultIndex: i,
                        },
                    },
                    direction: 'out',
                    deg: 90 - ((results.length - 1) * 25 / 2) + i * 25 + ringRotate,
                    ...results[i],
                });
            }
        }

        const BlockConnectorComponent = !isHoverDisabled && isHovered
            ? BlockConnector
            : BlockConnectorMini;

        return connectors.map((props, i) => (
            <BlockConnectorComponent key={i}
                radius={radius + width / 2}
                width={width}
                showIcon={!isHoverDisabled && isHovered}
                {...props}
            />
        ));
    }

    renderModules(blockProto) {
        const { modules, isValidModules } = this.props;
        if (!blockProto || !blockProto.module_specification || !blockProto.module_specification.module_slots) {
            return null;
        }

        return (
            <BlockModules
                moduleSlots={blockProto.module_specification.module_slots}
                modules={modules}
                isValid={isValidModules}
            />
        );
    }

    handleMouseDown = (evt) => {
        const { isSelected, onSelectAdd, onSelectRemove, onSelectSet, onDragSelectionStart } = this.props;
        if (isSelected) {
            if (onSelectRemove && platformUtil.isMouseEventMultiSelectionRemove(evt)) {
                onSelectRemove();
            }
            else {
                onDragSelectionStart && onDragSelectionStart();
            }
        }
        else if (onSelectAdd && platformUtil.isMouseEventMultiSelection(evt)) {
            onSelectAdd();
            onDragSelectionStart && onDragSelectionStart();
        }
        else if (onSelectSet) {
            onSelectSet();
            onDragSelectionStart && onDragSelectionStart();
        }
    };

    render() {
        const {
            blockId, type, name, x, y, dragDelta,
            quantity, ringRotate,
            isValid, isSelected,
            isHoverDisabled, isHovered, onHoverOver, onHoverOut,
        } = this.props;

        const blockProto = factorio.getProto(getProtoNameForBlockType(type), name);

        const baseRadius = 54;
        const width = 22;

        return (
            <HoverContainer className="block"
                data-block-id={blockId}
                transform={`translate(${x + (isSelected && dragDelta ? dragDelta.x : 0)}, ${y + (isSelected && dragDelta ? dragDelta.y : 0)})`}
                onMouseDown={this.handleMouseDown}
                isHovered={isHovered}
                onHoverOver={onHoverOver}
                onHoverOut={onHoverOut}
                hoverTimeout={200}>

                {isSelected && <circle
                    className="selected-box"
                    r={baseRadius + (!isHoverDisabled && isHovered ? width : 6) + 5}
                />}

                <circle
                    className="block__bg block__bg--ingredients"
                    r={baseRadius + (!isHoverDisabled && isHovered ? width : 6)}
                />

                <circle
                    className={ClassNames('block__bg block__bg--inner', { 'block__bg--invalid-data': !isValid })}
                    r={baseRadius}
                />

                <IORing className="block__bg block__bg--results"
                    radius={baseRadius}
                    width={!isHoverDisabled && isHovered ? width : 6}
                    rotate={ringRotate}
                    strokeWidth={2}
                    stroke="red"
                    fill="none"
                />

                {this.renderConnectors(baseRadius, !isHoverDisabled && isHovered ? width : 6)}
                {this.renderBlockIcon(blockProto, quantity)}
                {this.renderModules(blockProto)}
                {this.renderRecipeIcon()}
            </HoverContainer>
        );
    }
}

const mapStateToProps = (state, { blockId }) => {
    const block = validatedBlocksSelector(state)[blockId];

    return {
        ...block,
        blockId: blockId,
        dragDelta: dragDeltaSelector(state),
        isSelected: !!state.surface.selectedById[blockId],
        isHoverDisabled: state.surface.isBoxSelecting || state.surface.isDragging,
        isHovered: state.focused === blockId,
        isRecipeHovered: !!state.tooltip && state.tooltip.sourceId === `${blockId}_io`,
    };
};

const mapDispatchToProps = (dispatch, { blockId }) => ({
    onSelectAdd: () => dispatch(actions.selectionAdd(blockId)),
    onSelectRemove: () => dispatch(actions.selectionRemove(blockId)),
    onSelectSet: () => dispatch(actions.selectionSet([blockId])),
    onDragSelectionStart: () => dispatch(actions.dragSelectionStart()),
    onHoverOver: () => dispatch(actions.focus(blockId)),
    onHoverOut: () => dispatch(actions.blur(blockId)),
    onHoverRecipeOver: () => dispatch(actions.showTooltip(`${blockId}_io`, 'block-io', { blockId: blockId })),
    onHoverRecipeOut: () => dispatch(actions.hideTooltip(`${blockId}_io`)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
    (stateProps, dispatchProps) => Object.assign({}, stateProps, dispatchProps)
)(IOBlock);
