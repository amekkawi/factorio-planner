import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
import * as factorio from '../factorio';
import { actions } from '../state/reducers';
import { validatedBlocksSelector } from '../state/selectors';
import HoverContainer from './HoverContainer';
import IORing from './IORing';
import Icon from './Icon';
import BlockModules from './BlockModules';
import BlockConnector, { BlockConnector as BlockConnectorMini } from './BlockConnector';

class AssemblingMachineBlock extends Component {

    static propTypes = {
        blockId: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,

        x: PropTypes.number,
        y: PropTypes.number,
        quantity: PropTypes.number,
        recipeName: PropTypes.string,
        modules: PropTypes.arrayOf(PropTypes.string),
        ringRotate: PropTypes.number,

        isSelected: PropTypes.bool,
        onSelectAdd: PropTypes.func,
        onSelectRemove: PropTypes.func,
        onSelectSet: PropTypes.func,

        isValid: PropTypes.bool,
        isValidRecipe: PropTypes.bool,
        isValidModules: PropTypes.bool,

        isHoverDisabled: PropTypes.bool,
        isHovered: PropTypes.bool,
        onHoverOver: PropTypes.func,
        onHoverOut: PropTypes.func,
    };

    static defaultProps = {
        x: 0,
        y: 0,
        quantity: 1,
        recipeName: null,
        modules: [],
        ringRotate: 0,
        isSelected: false,
        onSelectAdd: null,
        onSelectRemove: null,
        onSelectSet: null,
        isValid: true,
        isValidRecipe: true,
        isValidModules: true,
        isHoverDisabled: false,
        isHovered: false,
        onHoverOver: null,
        onHoverOut: null,
    };

    renderAssemblingMachine(assemblingMachine, quantity) {
        const quantityOffset = quantity > 99 ? 8
            : quantity > 9 ? 4 : 0;

        return (
            <g className="block__assembler">
                {!assemblingMachine && <circle cx={-11 - quantityOffset} cy={-30} r={16} fill="red"/>}
                {assemblingMachine && <Icon size={22} cx={-11 - quantityOffset} cy={-30} type={assemblingMachine.type} name={assemblingMachine.name}/>}
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

    renderRecipe(recipe) {
        const { isValidRecipe, isHoverDisabled, isHovered, isRecipeHovered } = this.props;

        const Container = !isHoverDisabled && isHovered ? HoverContainer : 'g';
        const containerProps = {
            className: 'block__recipe',
        };

        if (!isHoverDisabled && isHovered) {
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
                {recipe && <Icon size={32} cy={31} type={recipe.type} name={recipe.name}/>}
            </Container>
        );
    }

    renderConnectors(recipe, radius, width) {
        const {
            blockId, isHoverDisabled, isHovered, ringRotate,
        } = this.props;

        const ingredients = recipe && factorio.recipeGetIngredients(recipe);
        const results = recipe && factorio.recipeGetResults(recipe);
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

    handleMouseDown = (evt) => {
        const { isSelected, onSelectAdd, onSelectRemove, onSelectSet } = this.props;
        if (isSelected) {
            if (onSelectRemove && evt.metaKey) { // TODO: Different key for non-Mac?
                onSelectRemove();
            }
        }
        else if (onSelectAdd && (evt.shiftKey || evt.metaKey || evt.altKey || evt.ctrlKey)) {
            onSelectAdd();
        }
        else if (onSelectSet) {
            onSelectSet();
        }
    };

    render() {
        const {
            blockId, name, x, y, quantity, recipeName, modules, ringRotate,
            isValid, isValidModules, isSelected,
            isHoverDisabled, isHovered, onHoverOver, onHoverOut,
        } = this.props;

        const assemblingMachine = factorio.getProto('assembling-machine', name);
        const recipe = factorio.getProto('recipe', recipeName);

        const baseRadius = 54;
        const width = 22;

        return (
            <HoverContainer className="block"
                data-block-id={blockId}
                transform={`translate(${x}, ${y})`}
                onMouseDown={this.handleMouseDown}
                isHovered={isHovered}
                onHoverOver={onHoverOver}
                onHoverOut={onHoverOut}
                hoverTimeout={200}>

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

                {isSelected && <rect
                    x={-baseRadius}
                    y={-baseRadius}
                    width={baseRadius * 2}
                    height={baseRadius * 2}
                    style={{ pointerEvents: 'none' }}
                    stroke="#000"
                    strokeWidth="2"
                    fill="none"
                />}

                {this.renderConnectors(recipe, baseRadius, !isHoverDisabled && isHovered ? width : 6)}

                {this.renderAssemblingMachine(assemblingMachine, quantity)}

                {assemblingMachine && assemblingMachine.module_specification && <BlockModules
                    moduleSlots={assemblingMachine.module_specification.module_slots}
                    modules={modules}
                    isValid={isValidModules}
                />}

                {this.renderRecipe(recipe)}
            </HoverContainer>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const block = validatedBlocksSelector(state)[ownProps.blockId];

    return {
        ...block,
        blockId: ownProps.blockId,
        isSelected: !!state.selection.byId[ownProps.blockId],
        isHoverDisabled: state.selection.isBoxSelecting,
        isHovered: state.focused === ownProps.blockId,
        isRecipeHovered: !!state.tooltip && state.tooltip.sourceId === `${ownProps.blockId}_io`,
    };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
    onSelectAdd: () => dispatch(actions.selectionAdd(ownProps.blockId)),
    onSelectRemove: () => dispatch(actions.selectionRemove(ownProps.blockId)),
    onSelectSet: () => dispatch(actions.selectionSet([ownProps.blockId])),
    onHoverOver: () => dispatch(actions.focus(ownProps.blockId)),
    onHoverOut: () => dispatch(actions.blur(ownProps.blockId)),
    onHoverRecipeOver: () => dispatch(actions.showTooltip(`${ownProps.blockId}_io`, 'block-io', { blockId: ownProps.blockId })),
    onHoverRecipeOut: () => dispatch(actions.hideTooltip(`${ownProps.blockId}_io`)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
    (stateProps, dispatchProps) => Object.assign({}, stateProps, dispatchProps)
)(AssemblingMachineBlock);
