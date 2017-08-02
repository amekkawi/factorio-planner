import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { actions } from '../state/reducers';
import HoverContainer from './HoverContainer';
import Icon from './Icon';

class SupplyBlock extends Component {

    static propTypes = {
        blockId: PropTypes.string.isRequired,
        result: PropTypes.object.isRequired,

        x: PropTypes.number,
        y: PropTypes.number,

        isHovered: PropTypes.bool,
        onHoverOver: PropTypes.func,
        onHoverOut: PropTypes.func,
    };

    static defaultProps = {
        x: 0,
        y: 0,
        isHovered: false,
        onHoverOver: null,
        onHoverOut: null,
    };

    render() {
        const {
            blockId, x, y, result: { type, name },
            isHovered, onHoverOver, onHoverOut,
        } = this.props;

        const baseRadius = 18;

        return (
            <HoverContainer className="block"
                data-block-id={blockId}
                transform={`translate(${x}, ${y})`}
                isHovered={isHovered}
                onHoverOver={onHoverOver}
                onHoverOut={onHoverOut}
                hoverTimeout={200}>

                <circle
                    className="block__bg block__bg--supply"
                    r={baseRadius}
                />

                <Icon size={22} type={type} name={name}/>
            </HoverContainer>
        );
    }
}

const mapStateToProps = (state, ownProps) => ({
    blockId: ownProps.blockId,
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
)(SupplyBlock);
