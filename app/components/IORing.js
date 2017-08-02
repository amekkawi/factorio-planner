import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { calcRadian } from '../util/math';

class IORing extends Component {

    static propTypes = {
        radius: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        balance: PropTypes.number,
        rotate: PropTypes.number,
    };

    static defaultProps = {
        className: 'block-io-ring',
        balance: 0,
        rotate: 0,
    };

    render() {
        const { radius, width, balance, rotate, ...props } = this.props;

        const b1 = calcRadian(0, 0, radius + width / 2, 180 - (width * 2 / 5) + rotate + balance);
        const b2 = calcRadian(0, 0, radius + width, 180 + rotate + balance);
        const b3 = calcRadian(0, 0, radius + width, rotate - balance);
        const b4 = calcRadian(0, 0, radius + width / 2, (width * 2 / 5) + rotate - balance);
        const b5 = calcRadian(0, 0, radius, rotate - balance);
        const b6 = calcRadian(0, 0, radius, 180 + rotate + balance);

        return (
            <path
                d={`M ${b1.x} ${b1.y} L ${b2.x} ${b2.y} A ${radius + width} ${radius + width} ${rotate} ${balance > 0 ? 1 : 0} 0 ${b3.x} ${b3.y} L ${b4.x} ${b4.y} L ${b5.x} ${b5.y} A ${radius} ${radius} ${rotate} ${balance > 0 ? 1 : 0} 1 ${b6.x} ${b6.y} z`}
                {...props}
            />
        );
    }
}

export default IORing;
