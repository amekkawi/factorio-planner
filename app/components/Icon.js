import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getIconId } from '../util';
import { actions } from '../state/reducers';

export class Icon extends Component {

    static propTypes = {
        type: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        size: PropTypes.number.isRequired,

        className: PropTypes.string,
        cx: PropTypes.number,
        cy: PropTypes.number,
        loadIcon: PropTypes.func,
    };

    static defaultProps = {
        className: 'icon',
        cx: 0,
        cy: 0,
        loadIcon: null,
    };

    componentDidMount() {
        const { type, name, loadIcon } = this.props;
        if (type && name && loadIcon) {
            loadIcon(type, name);
        }
    }

    render() {
        const {
            type, name, className,
            cx, cy, size, loadIcon,
            ...props
        } = this.props;

        return (
            <g {...props}
                className={className}
                transform={`translate(${cx}, ${cy})`}>

                <use
                    href={`#${getIconId(type, name)}`}
                    transform={`scale(${size / 32}) translate(-16, -16)`}
                />
            </g>
        );
    }
}

export default connect(null, (dispatch) => ({
    loadIcon: (type, name) => dispatch(actions.loadIcon(type, name)),
}))(Icon);
