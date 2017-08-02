import React, { Component } from 'react';
import PropTypes from 'prop-types';

export class HoverContainer extends Component {

    static propTypes = {
        children: PropTypes.any.isRequired,
        isHovered: PropTypes.bool.isRequired,
        onHoverOver: PropTypes.func.isRequired,
        onHoverOut: PropTypes.func.isRequired,

        hoverDelay: PropTypes.number,
        hoverTimeout: PropTypes.number,
    };

    static defaultProps = {
        hoverDelay: 0,
        hoverTimeout: 10,
    };

    componentWillUnmount() {
        clearTimeout(this._hoverOverTimeout);
        clearTimeout(this._hoverOutTimeout);

        // Make sure we hover out if the component is being unmounted.
        const { isHovered, onHoverOut } = this.props;
        if (isHovered && onHoverOut) {
            onHoverOut();
        }
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.isHovered && !nextProps.isHovered) {
            clearTimeout(this._hoverOverTimeout);
            clearTimeout(this._hoverOutTimeout);
        }
    }

    handleMouseOver = () => {
        const { isHovered, onHoverOver, hoverDelay } = this.props;
        if (isHovered) {
            clearTimeout(this._hoverOverTimeout);
            clearTimeout(this._hoverOutTimeout);
        }
        else if (onHoverOver) {
            if (hoverDelay) {
                this._hoverOverTimeout = setTimeout(() => {
                    onHoverOver();
                }, hoverDelay);
            }
            else {
                onHoverOver();
            }
        }
    };

    handleMouseOut = () => {
        const { isHovered, hoverTimeout } = this.props;
        if (isHovered) {
            this._hoverOutTimeout = setTimeout(() => {
                const { isHovered, onHoverOut } = this.props;
                if (isHovered && onHoverOut) {
                    onHoverOut();
                }
            }, hoverTimeout);
        }
        else {
            clearTimeout(this._hoverOverTimeout);
        }
    };

    render() {
        const {
            isHovered, hoverTimeout, hoverDelay,
            onHoverOver, onHoverOut,
            children,
            ...props
        } = this.props;

        return (
            <g
                {...props}
                onMouseOver={onHoverOver && this.handleMouseOver}
                onMouseOut={onHoverOut && this.handleMouseOut}
            >
                {children}
            </g>
        );
    }
}

export default HoverContainer;
