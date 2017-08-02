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

class MiningDrillBlock extends Component {

    static propTypes = {
        blockId: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,

        x: PropTypes.number,
        y: PropTypes.number,
        quantity: PropTypes.number,
        resourceName: PropTypes.string,
        modules: PropTypes.arrayOf(PropTypes.string),
        ringRotate: PropTypes.number,

        isValid: PropTypes.bool,
        isValidResource: PropTypes.bool,
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
        resourceName: null,
        modules: [],
        ringRotate: 0,
        isValid: true,
        isValidResource: true,
        isValidModules: true,
        isHoverDisabled: false,
        isHovered: false,
        onHoverOver: null,
        onHoverOut: null,
    };

    renderMiningDrill(miningDrill, quantity) {
        const quantityOffset = quantity > 99 ? 8
            : quantity > 9 ? 4 : 0;

        return (
            <g className="block__mining-drill">
                {!miningDrill && <circle cx={-11 - quantityOffset} cy={-30} r={16} fill="red"/>}
                {miningDrill && <Icon size={22} cx={-11 - quantityOffset} cy={-30} type={miningDrill.type} name={miningDrill.name}/>}
                <text className="block__multiplier" x={6 - quantityOffset} y={-23}>x{quantity}</text>
            </g>
        );
    }

    renderResource(resource) {
        const { isValidResource } = this.props;
        return (
            <g className="block__recipe">
                {!isValidResource && <circle cy={31} r={16} fill="red"/>}
                {resource && <Icon size={32} cx={0} cy={31} type={resource.type} name={resource.name}/>}
            </g>
        );
    }

    renderConnectors(resource, radius, width) {
        const { blockId, isHoverDisabled, isHovered, ringRotate } = this.props;

        const ingredients = resource && factorio.resourceGetIngredients(resource);
        const results = resource && factorio.resourceGetResults(resource);
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
            blockId, name, x, y, quantity, resourceName, modules, ringRotate,
            isValid, isValidModules,
            isHoverDisabled, isHovered, onHoverOver, onHoverOut,
        } = this.props;

        const miningDrill = factorio.getProto('mining-drill', name);
        const resource = factorio.getProto('resource', resourceName);

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
                    strokeWidth={2}
                    rotate={ringRotate}
                    stroke="red"
                    fill="none"
                />

                {this.renderConnectors(resource, baseRadius, !isHoverDisabled && isHovered ? width : 6)}

                {miningDrill && this.renderMiningDrill(miningDrill, quantity)}

                {miningDrill && miningDrill.module_specification && <BlockModules
                    moduleSlots={miningDrill.module_specification.module_slots}
                    modules={modules}
                    isValid={isValidModules}
                />}

                {this.renderResource(resource)}
            </HoverContainer>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const block = validatedBlocksSelector(state)[ownProps.blockId];

    return {
        blockId: ownProps.blockId,
        isHoverDisabled: state.selection.isBoxSelecting,
        isHovered: state.focused === ownProps.blockId,
        ...block,
    };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
    onHoverOver: () => dispatch(actions.focus(ownProps.blockId)),
    onHoverOut: () => dispatch(actions.blur(ownProps.blockId)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
    (stateProps, dispatchProps) => Object.assign({}, stateProps, dispatchProps)
)(MiningDrillBlock);
