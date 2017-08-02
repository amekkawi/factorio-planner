import React, { Component } from 'react';

class SurfaceGrid extends Component {
    render() {
        const viewBounds = { x1: 0, y1: 0, x2: 2000, y2: 1000 };
        const gridBounds = {
            x1: Math.floor(viewBounds.x1 / 10) * 10,
            y1: Math.floor(viewBounds.y1 / 10) * 10,
            x2: Math.ceil(viewBounds.x2 / 10) * 10,
            y2: Math.ceil(viewBounds.y2 / 10) * 10,
        };

        const cols = (gridBounds.x2 - gridBounds.x1) / 10;
        const rows = (gridBounds.y2 - gridBounds.y1) / 10;

        const strong = [];
        const light = [];

        /*for (let i = 0, l = Math.max(cols, rows); i <= l; i++) {
            if (i <= rows) {
                (i % 10 === 0 ? strong : light).push(
                    <line key={`r${i}`}
                        x1={gridBounds.x1}
                        y1={gridBounds.y1 + 10 * i}
                        x2={gridBounds.x2}
                        y2={gridBounds.y1 + 10 * i}
                        strokeWidth={1}
                        stroke={i % 10 === 0 ? '#CCC' : '#EEE'}
                    />
                );
            }

            if (i <= cols) {
                (i % 10 === 0 ? strong : light).push(
                    <line key={`c${i}`}
                        x1={gridBounds.x1 + 10 * i}
                        y1={gridBounds.y1}
                        x2={gridBounds.x1 + 10 * i}
                        y2={gridBounds.y2}
                        strokeWidth={1}
                        stroke={i % 10 === 0 ? '#CCC' : '#EEE'}
                    />
                );
            }
        }*/

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
                        {light}
                        {strong}
                    </pattern>
                </defs>
                <rect width={2000} height={1000} fill="url(#surfaceGridPattern)"/>
            </g>
        );
    }
}

export default SurfaceGrid;
