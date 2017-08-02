import { warn } from '../util';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import * as factorio from '../factorio';
import { getTintId, getIconId, getImageId, getTintMatrixValues } from '../util';

class ImageDef extends Component {

    static propTypes = {
        path: PropTypes.string.isRequired,
    };

    shouldComponentUpdate() {
        return false;
    }

    render() {
        const { path } = this.props;

        const imageData = factorio.icons[path];
        if (!imageData) {
            warn(`Missing image data for IconDef: ${path}`);
            return null;
        }

        return (
            <image id={getImageId(path)}
                href={imageData}
                width="32"
                height="32"
                imageRendering="optimizeSpeed"/>
        );
    }
}

class IconDef extends Component {

    static propTypes = {
        type: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
    };

    renderImage(image, props = {}) {
        const imageProps = {
            href: `#${getImageId(image.icon)}`,
            ...props,
        };

        let x = 0;
        let y = 0;

        if (image.tint) {
            const { r = 1, g = 1, b = 1, a = 1 } = image.tint;
            imageProps.filter = `url(#${getTintId(r, g, b, a)})`;
        }

        if (image.scale) {
            imageProps.transform = `${imageProps.transform || ''} scale(${image.scale})`;
            x += (32 - 32 * image.scale) / 2 * (1 / image.scale);
            y += (32 - 32 * image.scale) / 2 * (1 / image.scale);
        }

        if (image.shift) {
            x += image.shift[0] * (1 / (image.scale || 1));
            y += image.shift[1] * (1 / (image.scale || 1));
        }

        if (x || y) {
            imageProps.transform = `${imageProps.transform || ''} translate(${x}, ${y})`;
        }

        return <use {...imageProps} />;
    }

    render() {
        const { type, name } = this.props;
        const obj = factorio.getProto(type, name);

        if (!obj) {
            warn(`Missing data for IconDef: ${type} ${name}`);
            return null;
        }

        const iconImages = factorio.getIcon(obj);

        if (!iconImages || !iconImages.length) {
            warn(`Could not determine icon data for IconDef: ${type} ${name}`);
            return null;
        }

        else if (iconImages.length === 1) {
            return this.renderImage(
                iconImages[0],
                { id: getIconId(type, name) }
            );
        }

        else {
            return (
                <g id={getIconId(type, name)}>
                    {iconImages.map((image, i) => this.renderImage(
                        iconImages[i],
                        { key: i }
                    ))}
                </g>
            );
        }
    }
}

class TintDef extends Component {

    static propTypes = {
        r: PropTypes.number,
        g: PropTypes.number,
        b: PropTypes.number,
        a: PropTypes.number,
    };

    static defaultProps = {
        r: 1,
        g: 1,
        b: 1,
        a: 1,
    };

    shouldComponentUpdate() {
        return false;
    }

    render() {
        const { r, g, b, a } = this.props;

        return (
            <filter id={getTintId(r, g, b, a)}>
                <feColorMatrix in="SourceGraphic"
                    type="matrix"
                    values={getTintMatrixValues(r, g, b, a)}/>
            </filter>
        );
    }
}

export class IconDefs extends Component {

    static propTypes = {
        icons: PropTypes.object.isRequired,
    };

    renderImageDefs(icons) {
        const pathsSet = new Set();
        const tintMap = new Map();

        for (const iconKey of Object.keys(icons)) {
            const { type, name } = icons[iconKey];

            const obj = factorio.getProto(type, name);
            if (obj) {
                const iconImages = factorio.getIcon(obj);
                if (iconImages) {
                    for (const image of iconImages) {
                        if (image.icon) {
                            pathsSet.add(image.icon);
                        }

                        if (image.tint) {
                            const { r = 1, g = 1, b = 1, a = 1 } = image.tint;
                            tintMap.set(getTintId(r, g, b, a), image.tint);
                        }
                    }
                }
            }
        }

        const imageDefs = Array.from(pathsSet)
            .map((path) => <ImageDef key={path} path={path}/>);

        const tintDefs = Array.from(tintMap.keys())
            .map((tintKey) => <TintDef key={tintKey} {...tintMap.get(tintKey)} />);

        return imageDefs.concat(tintDefs);
    }

    render() {
        const { icons } = this.props;
        return (
            <defs>
                {Object.keys(icons).map((iconKey) => {
                    const { type, name } = icons[iconKey];
                    return (
                        <IconDef key={getIconId(type, name)} type={type} name={name}/>
                    );
                })}
                {this.renderImageDefs(icons)}
            </defs>
        );
    }
}

export default connect((state) => ({
    icons: state.icons,
}))(IconDefs);
