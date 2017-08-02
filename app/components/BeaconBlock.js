import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
import * as factorio from '../factorio';
import { actions } from '../state/reducers';
import { validatedBlocksSelector } from '../state/selectors';
import HoverContainer from './HoverContainer';
import BlockModules from './BlockModules';
import Icon from './Icon';

class BeaconBlock extends Component {

    static propTypes = {
        blockId: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        modules: PropTypes.arrayOf(PropTypes.string).isRequired,

        x: PropTypes.number,
        y: PropTypes.number,
        quantity: PropTypes.number,

        isValid: PropTypes.bool,
        isValidModules: PropTypes.bool,
        isHovered: PropTypes.bool,
        onHoverOver: PropTypes.func,
        onHoverOut: PropTypes.func,
    };

    static defaultProps = {
        x: 0,
        y: 0,
        quantity: 1,
        isValid: true,
        isValidModules: true,
        isHovered: false,
        onHoverOver: null,
        onHoverOut: null,
    };

    render() {
        const {
            x = 0, y = 0,
            blockId, name, modules = [], quantity = 1,
            isValid, isValidModules,
            isHovered, onHoverOver, onHoverOut,
        } = this.props;
        const obj = factorio.getProto('beacon', name);

        if (!obj) {
            return (
                <g className="block" transform={`translate(${x}, ${y})`}>
                    <circle className="block__bg block__bg--effect block__bg--missing-data" cx={50} cy={40} r={40}/>
                </g>
            );
        }

        const quantityOffset = quantity > 99 ? 8
            : quantity > 9 ? 4 : 0;

        return (
            <HoverContainer className="block"
                data-block-id={blockId}
                transform={`translate(${x}, ${y})`}
                isHovered={isHovered}
                onHoverOver={onHoverOver}
                onHoverOut={onHoverOut}
                hoverTimeout={200}>

                <circle className={ClassNames('block__bg block__bg--effect', { 'block__bg--invalid-data': !isValid })}
                    r={40}
                />

                <Icon size={22}
                    cx={-10 - quantityOffset}
                    cy={-14}
                    type={obj.type}
                    name={obj.name}
                />

                <text className="block__multiplier"
                    x={6 - quantityOffset}
                    y={-6}
                >x{quantity}</text>

                {obj.module_specification && <BlockModules
                    cy={14}
                    moduleSlots={obj.module_specification.module_slots}
                    modules={modules}
                    isValid={isValidModules}
                />}
            </HoverContainer>
        );
    }
}

const mapStateToProps = (state, ownProps) => {
    const block = validatedBlocksSelector(state)[ownProps.blockId];

    return {
        blockId: ownProps.blockId,
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
)(BeaconBlock);
