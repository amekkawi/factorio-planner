import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
import * as factorio from '../factorio';
import { actions } from '../state/reducers';
import { calcRadian } from '../util/math';
import HoverContainer from './HoverContainer';
import Icon from './Icon';

export class BlockConnector extends Component {

    static propTypes = {
        radius: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        deg: PropTypes.number.isRequired,
        type: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        direction: PropTypes.string.isRequired,
        cx: PropTypes.number,
        cy: PropTypes.number,
        showIcon: PropTypes.bool,
        isHovered: PropTypes.bool,

        onHoverOver: PropTypes.func,
        onHoverOut: PropTypes.func,
    };

    static defaultProps = {
        cx: 0,
        cy: 0,
        showIcon: false,
        isHovered: false,
        onHoverOver: null,
        onHoverOut: null,
    };

    render() {
        const {
            cx, cy,
            radius, width, deg,
            type, name, direction,
            showIcon,
            isHovered, onHoverOver, onHoverOut,
        } = this.props;

        const isHoverable = onHoverOver && onHoverOut;
        const proto = factorio.getProto(type, name);
        const { x, y } = calcRadian(cx, cy, radius, deg);

        const circleClassName = ClassNames(
            `block-connector__bg block-connector__bg--${direction}`,
            { 'block-connector--missing-data': !proto }
        );

        const Container = isHoverable ? HoverContainer : 'g';
        const containerProps = {
            className: `block-connector block-connector--${direction}`,
            transform: `translate(${x},${y})`,
        };

        if (isHoverable) {
            Object.assign(containerProps, {
                isHovered,
                hoverDelay: 150,
                onHoverOver,
                onHoverOut,
            });
        }

        return (
            <Container {...containerProps}>
                <circle className={circleClassName} r={width / 2 + 2} />

                {proto && showIcon && <Icon
                    className={`block-connector__img block-connector__img--${direction}`}
                    type={proto.type} name={proto.name}
                    size={16}
                />}
            </Container>
        );
    }
}

export default connect((state, ownProps) => ({
    isHovered: !!ownProps.tooltip && !!state.tooltip && state.tooltip.sourceId === ownProps.tooltip.sourceId,
}), (dispatch, ownProps) => ({
    onHoverOver: () => dispatch(actions.showTooltip(ownProps.tooltip.sourceId, ownProps.tooltip.contentType, ownProps.tooltip.meta)),
    onHoverOut: () => dispatch(actions.hideTooltip(ownProps.tooltip.sourceId)),
}))(BlockConnector);
