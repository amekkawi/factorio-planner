import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { actions } from '../state/reducers';
import * as platformUtil from '../util/platform';
import HoverContainer from './HoverContainer';
import Icon from './Icon';
import { dragDeltaSelector } from '../state/selectors';

class SupplyBlock extends Component {

    static propTypes = {
        blockId: PropTypes.string.isRequired,
        result: PropTypes.object.isRequired,

        x: PropTypes.number,
        y: PropTypes.number,

        isSelected: PropTypes.bool,
        onSelectAdd: PropTypes.func,
        onSelectRemove: PropTypes.func,
        onSelectSet: PropTypes.func,

        dragDelta: PropTypes.oneOfType([
            PropTypes.object,
            PropTypes.bool,
        ]),
        onDragSelectionStart: PropTypes.func,

        isHovered: PropTypes.bool,
        onHoverOver: PropTypes.func,
        onHoverOut: PropTypes.func,
    };

    static defaultProps = {
        x: 0,
        y: 0,
        isSelected: false,
        onSelectAdd: null,
        onSelectRemove: null,
        onSelectSet: null,
        dragDelta: false,
        onDragSelectionStart: null,
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
            blockId, x, y, result: { type, name },
            isSelected, dragDelta,
            isHovered, onHoverOver, onHoverOut,
        } = this.props;

        const baseRadius = 18;

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

                <circle
                    className="block__bg block__bg--supply"
                    r={baseRadius}
                />

                <Icon size={22} type={type} name={name}/>
            </HoverContainer>
        );
    }
}

const mapStateToProps = (state, { blockId }) => ({
    blockId: blockId,
    isSelected: !!state.selection.byId[blockId],
    dragDelta: dragDeltaSelector(state),
    isHovered: state.focused === blockId,
    ...(state.blocks[blockId] || {}),
});

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
)(SupplyBlock);
