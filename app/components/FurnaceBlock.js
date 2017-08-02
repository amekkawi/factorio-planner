import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
import * as factorio from '../factorio';
import { actions } from '../state/reducers';
import HoverContainer from './HoverContainer';
import IORing from './IORing';
import Icon from './Icon';
import BlockModules from './BlockModules';
import BlockConnector, { BlockConnector as BlockConnectorMini } from './BlockConnector';

class FurnaceBlock extends Component {

    static propTypes = {
        blockId: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,

        x: PropTypes.number,
        y: PropTypes.number,
        quantity: PropTypes.number,
        recipeName: PropTypes.string,
        modules: PropTypes.arrayOf(PropTypes.string),
        ringRotate: PropTypes.number,

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
        isHoverDisabled: false,
        isHovered: false,
        onHoverOver: null,
        onHoverOut: null,
    };

    renderFurnace(furnace, quantity) {
        const quantityOffset = quantity > 99 ? 8
            : quantity > 9 ? 4 : 0;

        return (
            <g className="block__furnace">
                {!furnace && <circle cx={-11 - quantityOffset} cy={-30} r={16} fill="red"/>}
                {furnace && <Icon size={22} cx={-11 - quantityOffset} cy={-30} type={furnace.type} name={furnace.name}/>}
                <text className="block__multiplier" x={6 - quantityOffset} y={-23}>x{quantity}</text>
            </g>
        );
    }

    renderRecipe(recipe) {
        return (
            <g className="block__recipe">
                {recipe && <Icon size={32} cx={0} cy={31} type={recipe.type} name={recipe.name}/>}
            </g>
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
                        meta: {},
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
                        meta: {},
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

    render() {
        const {
            blockId, name, x, y, quantity, recipeName, modules, ringRotate,
            isHoverDisabled, isHovered, onHoverOver, onHoverOut,
        } = this.props;

        const furnace = factorio.getProto('furnace', name);
        const recipe = factorio.getProto('recipe', recipeName);

        const isValid = factorio.isValidRecipeForProto(
            furnace,
            recipe
        );

        const baseRadius = 54;
        const width = 22;

        return (
            <HoverContainer className="block"
                data-block-id={blockId}
                transform={`translate(${x}, ${y})`}
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

                {this.renderConnectors(recipe, baseRadius, !isHoverDisabled && isHovered ? width : 6)}

                {this.renderFurnace(furnace, quantity)}

                {furnace && furnace.module_specification && <BlockModules
                    moduleSlots={furnace.module_specification.module_slots}
                    modules={modules}
                />}

                {this.renderRecipe(recipe)}
            </HoverContainer>
        );
    }
}

const mapStateToProps = (state, ownProps) => ({
    blockId: ownProps.blockId,
    isHoverDisabled: state.selection.isBoxSelecting,
    isHovered: state.focused === ownProps.blockId,
    ...(state.blocks[ownProps.blockId] || {}),
});

const mapDispatchToProps = (dispatch, ownProps) => ({
    onHoverOver: () => dispatch(actions.focus(ownProps.blockId)),
    onHoverOut: () => dispatch(actions.blur(ownProps.blockId)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
    (stateProps, dispatchProps) => Object.assign({}, stateProps, dispatchProps)
)(FurnaceBlock);
