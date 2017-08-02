import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
import * as factorio from '../factorio';
import Icon from './Icon';

class BlockModule extends Component {

    static propTypes = {
        x: PropTypes.number,
        y: PropTypes.number,
        moduleName: PropTypes.string,
        isValid: PropTypes.bool,
    };

    static defaultProps = {
        x: 0,
        y: 0,
        moduleName: null,
        isValid: true,
    };

    state = {
        hover: false,
    };

    onMouseOver = () => {
        this.setState({ hover: true });
    };

    onMouseOut = () => {
        this.setState({ hover: false });
    };

    render() {
        const { x = 0, y = 0, moduleName, isValid } = this.props;
        const { hover } = this.state;
        const module = moduleName && factorio.getProto('module', moduleName);

        return (
            <g className={ClassNames('module', { 'module--hover': hover, 'module--invalid': !isValid })} transform={`translate(${x}, ${y})`}>
                <g className="module__scale">
                    <circle className="module__bg" r={12} />

                    {module && <Icon
                        className="module__img"
                        type="module"
                        name={moduleName}
                        size={18}
                    />}

                </g>

                <circle
                    className="module__click"
                    onMouseOver={this.onMouseOver}
                    onMouseOut={this.onMouseOut}
                    r={12} />
            </g>
        );
    }
}

export default BlockModule;
