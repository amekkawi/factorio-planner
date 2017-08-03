import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
import * as platformUtil from '../util/platform';
import * as factorio from '../factorio';
import { actions } from '../state/reducers';
import { dragDeltaSelector, validatedBlocksSelector } from '../state/selectors';
import HoverContainer from './HoverContainer';
import BlockModules from './BlockModules';
import Icon from './Icon';

class BeaconBlock extends Component {

    static propTypes = {
        blockId: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        modules: PropTypes.arrayOf(PropTypes.string).isRequired,

        x: PropTypes.number,
        y: PropTypes.number,
        quantity: PropTypes.number,

        isSelected: PropTypes.bool,
        onSelectAdd: PropTypes.func,
        onSelectRemove: PropTypes.func,
        onSelectSet: PropTypes.func,

        dragDelta: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.bool,
        ]),
        onDragSelectionStart: PropTypes.func,

        isValid: PropTypes.bool,
        isValidModules: PropTypes.bool,
        isHovered: PropTypes.bool,
        onHoverOver: PropTypes.func,
        onHoverOut: PropTypes.func,
    };

    static defaultProps = {
        x: 0,
        y: 0,
        quantity: 1,
        isSelected: false,
        onSelectAdd: null,
        onSelectRemove: null,
        onSelectSet: null,
        dragDelta: null,
        onDragSelectionStart: null,
        isValid: true,
        isValidModules: true,
        isHovered: false,
        onHoverOver: null,
        onHoverOut: null,
    };

    handleMouseDown = (evt) => {
        const { isSelected, onSelectAdd, onSelectRemove, onSelectSet, onDragSelectionStart } = this.props;
        if (isSelected) {
            if (onSelectRemove && platformUtil.isMouseEventMultiSelectionRemove(evt)) {
                onSelectRemove();
            }
            else {
                onDragSelectionStart && onDragSelectionStart();
            }
        }
        else if (onSelectAdd && platformUtil.isMouseEventMultiSelection(evt)) {
            onSelectAdd();
            onDragSelectionStart && onDragSelectionStart();
        }
        else if (onSelectSet) {
            onSelectSet();
            onDragSelectionStart && onDragSelectionStart();
        }
    };

    render() {
        const {
            x = 0, y = 0,
            blockId, name, modules = [], quantity = 1,
            isValid, isValidModules, isSelected, dragDelta,
            isHovered, onHoverOver, onHoverOut,
        } = this.props;
        const obj = factorio.getProto('beacon', name);

        if (!obj) {
            return (
                <g className="block" transform={`translate(${x + (isSelected && dragDelta ? dragDelta.x : 0)}, ${y + (isSelected && dragDelta ? dragDelta.y : 0)})`}>
                    <circle className="block__bg block__bg--effect block__bg--missing-data" cx={50} cy={40} r={40}/>
                </g>
            );
        }

        const quantityOffset = quantity > 99 ? 8
            : quantity > 9 ? 4 : 0;

        const baseRadius = 40;

        return (
            <HoverContainer className="block"
                data-block-id={blockId}
                transform={`translate(${x + (isSelected && dragDelta ? dragDelta.x : 0)}, ${y + (isSelected && dragDelta ? dragDelta.y : 0)})`}
                onMouseDown={this.handleMouseDown}
                isHovered={isHovered}
                onHoverOver={onHoverOver}
                onHoverOut={onHoverOut}
                hoverTimeout={200}>

                {isSelected && <circle
                    className="selected-box"
                    r={baseRadius + 5}
                />}

                <circle className={ClassNames('block__bg block__bg--effect', { 'block__bg--invalid-data': !isValid })}
                    r={baseRadius}
                />

                <Icon size={22}
                    cx={-10 - quantityOffset}
                    cy={-14}
                    type={obj.type}
                    name={obj.name}
                />

                <text className="block__multiplier"
                    x={6 - quantityOffset}
                    y={-6}
                >x{quantity}</text>

                {obj.module_specification && <BlockModules
                    cy={14}
                    moduleSlots={obj.module_specification.module_slots}
                    modules={modules}
                    isValid={isValidModules}
                />}
            </HoverContainer>
        );
    }
}

const mapStateToProps = (state, { blockId }) => {
    const block = validatedBlocksSelector(state)[blockId];

    return {
        blockId: blockId,
        dragDelta: dragDeltaSelector(state),
        isSelected: !!state.surface.selectedById[blockId],
        isHovered: state.focused === blockId,
        ...block,
    };
};

const mapDispatchToProps = (dispatch, { blockId }) => ({
    onSelectAdd: () => dispatch(actions.selectionAdd(blockId)),
    onSelectRemove: () => dispatch(actions.selectionRemove(blockId)),
    onSelectSet: () => dispatch(actions.selectionSet([blockId])),
    onDragSelectionStart: () => dispatch(actions.dragSelectionStart()),
    onHoverOver: () => dispatch(actions.focus(blockId)),
    onHoverOut: () => dispatch(actions.blur(blockId)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
    (stateProps, dispatchProps) => Object.assign({}, stateProps, dispatchProps)
)(BeaconBlock);
