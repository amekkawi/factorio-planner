import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Icon } from './Icon';
import { IconDefs } from './IconDefs';
import { blockIOSelector } from '../state/selectors';

let pageX = 0;
let pageY = 0;
const handlers = new Set();
window.addEventListener('mousemove', (event) => {
    pageX = event.pageX;
    pageY = event.pageY;
    for (const handler of handlers) {
        if (handlers.has(handler)) {
            handler(event.pageX, event.pageY);
        }
    }
});

function percentText(value) {
    return `${value > 0 ? '+' : ''}${parseFloat((value * 100).toFixed(3))}%`;
}

class TooltipIcon extends Component {

    static propTypes = {
        type: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    };

    render() {
        const { type, name } = this.props;
        return (
            <svg className="inline-icon" width="16" height="16">
                <IconDefs icons={{
                    [`${type}.${name}`]: { type, name },
                }}/>
                <Icon type={type} name={name} size={16} cx={8} cy={8}/>
            </svg>
        );
    }
}

const TooltipIOContent = connect((state) => {
    const { blockId } = state.tooltip.meta;
    const blockIO = blockIOSelector(state)[blockId];
    return {
        ...blockIO,
        blockId,
        block: state.blocks[blockId],
    };
})(class TooltipIOContent extends Component {

    static propTypes = {
        blockId: PropTypes.string.isRequired,
        input: PropTypes.array,
        output: PropTypes.array,
        effect: PropTypes.object,
    };

    static defaultProps = {
        input: null,
        output: null,
        effect: null,
    };

    render() {
        const { blockId, input, output, effect } = this.props;

        const effectsHTML = [];

        if (effect) {
            if (effect.productivity) {
                effectsHTML.push(
                    <div key="productivity">
                        <TooltipIcon type="module" name="productivity-module-3"/> {percentText(effect.productivity)}
                    </div>
                );
            }
            if (effect.speed) {
                effectsHTML.push(
                    <div key="speed">
                        <TooltipIcon type="module" name="speed-module-3"/> {percentText(effect.speed)}
                    </div>
                );
            }
        }

        return (
            <div className="tooltip__content tooltip__content--io">
                {effectsHTML.length > 0 && <div className="tooltip__items-box tooltip__items-box--modules">{effectsHTML}</div>}
                <div className="tooltip__items-box-container">
                    {input && <div className="tooltip__items-box tooltip__items-box--ingredients">
                        {input.map((ingredient, i) => <div key={i}><TooltipIcon type={ingredient.type} name={ingredient.name}/> {parseFloat(ingredient.rate.toFixed(3))}<span style={{ opacity: 0.5 }}>/sec</span></div>)}
                    </div>}
                    <div className="tooltip__items-box-arrow">►</div>
                    {output && <div className="tooltip__items-box tooltip__items-box--results">
                        {output.map((result, i) => <div key={i}><TooltipIcon type={result.type} name={result.name}/> {parseFloat(result.rate.toFixed(3))}<span style={{ opacity: 0.5 }}>/sec</span></div>)}
                    </div>}
                </div>
            </div>
        );
    }
});

class TooltipBox extends Component {

    static propTypes = {
        children: PropTypes.any.isRequired,
    };

    state = {
        mouseX: pageX,
        mouseY: pageY,
    };

    componentDidMount() {
        handlers.add(this.handleMouseMove);
    }

    componentWillUnmount() {
        handlers.delete(this.handleMouseMove);
    }

    handleMouseMove = (pageX, pageY) => {
        this.setState({
            mouseX: pageX,
            mouseY: pageY,
        });
    };

    render() {
        const { mouseX, mouseY } = this.state;
        return (
            <div className="tooltip" style={{
                top: mouseY,
                left: mouseX,
            }}>
                <div>
                    {this.props.children}
                </div>
            </div>
        );
    }
}

class Tooltip extends Component {

    static propTypes = {
        sourceId: PropTypes.string,
        contentType: PropTypes.string,
    };

    static defaultProps = {
        sourceId: null,
        contentType: null,
    };

    render() {
        const { contentType } = this.props;
        if (!contentType) {
            return null;
        }

        let contentHTML = null;

        if (contentType === 'block-io') {
            contentHTML = <TooltipIOContent/>;
        }
        else {
            contentHTML = <div>Unknown contentType: {contentType}</div>;
        }

        if (!contentHTML) {
            return null;
        }

        return (
            <TooltipBox>
                {contentHTML}
            </TooltipBox>
        );
    }
}

export default connect((state) => ({
    sourceId: state.tooltip && state.tooltip.sourceId || null,
    contentType: state.tooltip && state.tooltip.contentType || null,
}))(Tooltip);
