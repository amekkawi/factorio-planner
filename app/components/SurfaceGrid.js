import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

const SurfaceGridPattern  = connect()(class extends Component {
    static displayName = 'SurfaceGridPattern';

    render() {
        const { zoom } = this.props;
        const strong = [];
        const light = [];

        for (let i = 0, l = 100; i <= l; i++) {
            (i % 10 === 0 ? strong : light).push(
                <line key={`r${i}`}
                    x1={0}
                    y1={10 * i}
                    x2={100}
                    y2={10 * i}
                    strokeWidth={1}
                    stroke={i % 10 === 0 ? '#CCC' : '#EEE'}
                />
            );

            (i % 10 === 0 ? strong : light).push(
                <line key={`c${i}`}
                    x1={10 * i}
                    y1={0}
                    x2={10 * i}
                    y2={100}
                    strokeWidth={1}
                    stroke={i % 10 === 0 ? '#CCC' : '#EEE'}
                />
            );
        }

        return (
            <defs>
                <pattern id="surfaceGridPattern" patternUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" viewBox="0 0 100 100" >
                    <rect width="100" height="100" fill="#FFF" />
                    {light}
                    {strong}
                </pattern>
            </defs>
        );
    }
});

class SurfaceGrid extends Component {

    static propTypes = {
        domainWidth: PropTypes.number.isRequired,
        domainHeight: PropTypes.number.isRequired,
        //zoom: PropTypes.number.isRequired,
        // offsetX: PropTypes.number.isRequired,
        // offsetY: PropTypes.number.isRequired,
    };

    render() {
        const { offsetX, offsetY, domainWidth, domainHeight } = this.props;

        const strong = [];
        const light = [];

        for (let i = 0, l = 100; i <= l; i++) {
            (i % 10 === 0 ? strong : light).push(
                <line key={`r${i}`}
                    x1={0}
                    y1={10 * i}
                    x2={100}
                    y2={10 * i}
                    strokeWidth={1}
                    stroke={i % 10 === 0 ? '#CCC' : '#EEE'}
                />
            );

            (i % 10 === 0 ? strong : light).push(
                <line key={`c${i}`}
                    x1={10 * i}
                    y1={0}
                    x2={10 * i}
                    y2={100}
                    strokeWidth={1}
                    stroke={i % 10 === 0 ? '#CCC' : '#EEE'}
                />
            );
        }

        return (
            <g className="surface-grid">
                <defs>
                    <pattern id="surfaceGridPattern" patternUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" viewBox="0 0 100 100" >
                        <rect width="100" height="100" fill="#FFF" />
                        {light}
                        {strong}
                    </pattern>
                </defs>
                <rect x={-1} y={-1} width={domainWidth + 2} height={domainHeight + 2} fill="#999"/>
                <rect width={domainWidth} height={domainHeight} fill="url(#surfaceGridPattern)"/>
            </g>
        );
    }
}

export default connect((state) => ({
    //offsetX: state.surface.offsetX,
    //offsetY: state.surface.offsetY,
    //zoom: state.surface.zoom,
    domainWidth: state.surface.domainWidth,
    domainHeight: state.surface.domainHeight,
}))(SurfaceGrid);
