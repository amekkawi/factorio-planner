import React, { Component } from 'react';
import { connect } from 'react-redux';
import ClassNames from 'classnames';
import PropTypes from 'prop-types';
import { actions } from '../../state/reducers';
import { getProtoNameForBlockType, getProtosForBlockType, validRecipesForBlock } from '../../util/block';
import { getLocalizedName, getProto, isValidRecipeForProto } from '../../factorio';
import { validatedBlocksSelector } from '../../state/selectors';
import { Icon } from '../Icon';
import { IconDefs } from '../IconDefs';
import HoverContainer from '../HoverContainer';

function quietJSONParse(str, failValue = null) {
    try {
        return JSON.parse(str);
    }
    catch (err) {
        return failValue;
    }
}

const IconBox = connect((state, { type, name }) => ({
    isHovered: !!state.tooltip && state.tooltip.sourceId === `props_${type}.${name}`,
    isValidProto: !!getProto(type, name),
}), (dispatch, { type, name }) => ({
    onHoverOver: () => dispatch(actions.showTooltip(`props_${type}.${name}`, 'proto-label', { type, name })),
    onHoverOut: () => dispatch(actions.hideTooltip(`props_${type}.${name}`)),
}))(class IconBox extends Component {

    static propTypes = {
        type: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        selected: PropTypes.bool,
        invalid: PropTypes.bool,
        enabled: PropTypes.bool,
        isValidProto: PropTypes.bool,
        isHovered: PropTypes.bool,
        onClick: PropTypes.func,
        onHoverOver: PropTypes.func,
        onHoverOut: PropTypes.func,
    };

    static defaultProps = {
        selected: false,
        invalid: false,
        enabled: true,
        isValidProto: true,
        isHovered: false,
        onClick: null,
        onHoverOver: null,
        onHoverOut: null,
    };

    handleClick = () => {
        const { name, onClick } = this.props;
        onClick(name);
    };

    handleHoverOver = () => {
        this.props.onHoverOver && this.props.onHoverOver();
    };

    handleHoverOut = () => {
        this.props.onHoverOut && this.props.onHoverOut();
    };

    render() {
        const { type, name, selected, invalid, enabled, isValidProto, isHovered, onClick } = this.props;
        const className = ClassNames('icon-box', {
            'icon-box--selected': selected,
            'icon-box--invalid': invalid,
            'icon-box--pointer': onClick,
            'icon-box--disabled': !enabled,
        });
        return (
            <svg className={className} width="40" height="40" onClick={onClick && this.handleClick}>
                <HoverContainer isHovered={isHovered} onHoverOver={this.handleHoverOver} onHoverOut={this.handleHoverOut} hoverDelay={100}>
                    {isValidProto && <IconDefs icons={{
                        [`${type}.${name}`]: { type, name },
                    }}/>}
                    <rect width="40" height="40"/>
                    {isValidProto && <Icon type={type} name={name} size={32} cx={20} cy={20}/>}
                    {!isValidProto && <text x={20} y={34} className="icon-box__text">⚠</text>}
                </HoverContainer>
            </svg>
        );
    }
});

class IOBlockProperties extends Component {

    static propTypes = {
        blockId: PropTypes.string.isRequired,
        block: PropTypes.object.isRequired,

        onChangeBlockProto: PropTypes.func.isRequired,
        onChangeBlockRecipe: PropTypes.func.isRequired,
    };

    static defaultProps = {
        recipeType: 'recipe',
    };

    handleSelectProto = (name) => {
        const { onChangeBlockProto } = this.props;
        onChangeBlockProto(name || null);
    };

    handleRecipeChange = (evt) => {
        const { onChangeBlockRecipe } = this.props;
        const selected = evt.target.value && quietJSONParse(evt.target.value) || null;
        onChangeBlockRecipe(selected && selected.type, selected && selected.name);
    };

    renderProtoIcons() {
        const { block: { type, name, recipeType, recipeName, isValidRecipe } } = this.props;

        const protoType = getProtoNameForBlockType(type);
        const blockProto = getProto(protoType, name);
        const protosForBlockType = getProtosForBlockType(type);
        const fastReplaceableGroup = blockProto && blockProto.fast_replaceable_group || null;

        const recipeProto = getProto(recipeType, recipeName);

        const iconBoxes = [];
        let missingProtoBox = true;

        if (protosForBlockType) {
            for (let i = 0; i < protosForBlockType.length; i++) {
                const proto = protosForBlockType[i];
                const enabled = !isValidRecipe || !recipeProto || isValidRecipeForProto(proto, recipeProto);

                if (proto === blockProto) {
                    missingProtoBox = false;
                }

                if (!blockProto
                    || fastReplaceableGroup && fastReplaceableGroup === proto.fast_replaceable_group
                    || !fastReplaceableGroup && blockProto === proto) {
                    iconBoxes.push(
                        <IconBox key={i}
                            type={proto.type}
                            name={proto.name}
                            selected={proto === blockProto}
                            enabled={enabled}
                            onClick={!enabled || proto === blockProto ? null : this.handleSelectProto}
                        />
                    );
                }
            }
        }

        if (missingProtoBox) {
            iconBoxes.unshift(
                <IconBox key="selected-missing"
                    type={protoType}
                    name={name}
                    selected={true}
                    invalid={true}
                />
            );
        }

        return (
            <div className="io-block-props__proto-icons">{iconBoxes}</div>
        );
    }

    renderRecipeIcon() {
        const { block } = this.props;
        const { recipeType, recipeName, isValidProto, isValidRecipe } = block;

        const validRecipes = isValidProto && validRecipesForBlock(block);
        const recipeProto = getProto(recipeType, recipeName);
        const recipeKey = recipeProto
            ? JSON.stringify({ type: recipeProto.type, name: recipeProto.name })
            : '';

        return (
            <div className="io-block-props__recipe-icon">
                <IconBox key="selected-missing"
                    type={recipeType}
                    name={recipeName}
                    selected={true}
                    invalid={!isValidRecipe}
                />

                <select className="io-block-props__recipe-select" value={isValidRecipe ? JSON.stringify({ type: recipeType, name: recipeName }) : recipeKey || ''} onChange={this.handleRecipeChange}>
                    {recipeKey && (!validRecipes || !isValidRecipe) && <option disabled key={recipeKey} value={recipeKey}>
                        {getLocalizedName(recipeProto)}
                    </option>}
                    {validRecipes && validRecipes.map((proto) => {
                        const key = JSON.stringify({ type: proto.type, name: proto.name });
                        return (
                            <option key={key} value={key}>
                                {getLocalizedName(proto)}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    }

    render() {
        const { blockId, block } = this.props;
        const { type, quantity } = block;

        return (
            <div className="io-block-props">
                <div>{type} x{quantity} [{blockId}]</div>
                <div>
                    {this.renderProtoIcons()}
                    {this.renderRecipeIcon()}
                </div>
            </div>
        );
    }
}

const mapStateToProps = (state, { blockId }) => ({
    block: validatedBlocksSelector(state)[blockId],
});

const mapDispatchToProps = (dispatch, { blockId }) => ({
    onChangeBlockProto: (name) => dispatch(actions.changeBlockProto(blockId, name)),
    onChangeBlockRecipe: (type, name) => dispatch(actions.changeBlockRecipe(blockId, type, name)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(IOBlockProperties);
