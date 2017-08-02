import React, { Component } from 'react';
import PropTypes from 'prop-types';
import BlockModule from './BlockModule';

class BlockModules extends Component {

    static propTypes = {
        cx: PropTypes.number,
        cy: PropTypes.number,
        moduleSlots: PropTypes.number,
        modules: PropTypes.arrayOf(PropTypes.string),
        isValid: PropTypes.bool,
    };

    static defaultProps = {
        cx: 0,
        cy: 0,
        moduleSlots: 0,
        modules: [],
        isValid: true,
    };

    render() {
        const { cx, cy, moduleSlots = 0, modules = [], isValid } = this.props;

        const modulesHtml = [];
        for (let i = 0; i < moduleSlots; i++) {
            modulesHtml.push(
                <BlockModule key={i} x={i * 24} moduleName={modules[i] || null} isValid={isValid}/>
            );
        }

        return (
            <g className="block__modules" transform={`translate(${cx - (moduleSlots - 1) * 12}, ${cy})`}>
                {modulesHtml}
            </g>
        );
    }
}

export default BlockModules;
