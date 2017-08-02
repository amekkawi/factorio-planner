const warnings = new Set();
export function warn(message) {
    if (!warnings.has(message)) {
        warnings.add(message);
        console.warn(message);
    }
}

export function lang(name) {
    return name;
}

export function getTintMatrixValues(r, g, b, a) {
    return `${r} 0 0 0 0 0 ${g} 0 0 0 0 0 ${b} 0 0 0 0 0 ${a} 0`;
}

export function getTintId(r, g, b, a) {
    return `fd-icon--${r}-${g}-${b}-${a}`.replace(/\./g, 'd');
}

export function getImageId(path) {
    return `img--${path.replace(/^__base__\/graphics\/icons\//, '').replace(/[/.]/g, '_')}`;
}

export function getIconId(type, name) {
    return `icon--${type}_${name}`;
}

export function getBlockTypeRadius(blockType, isFocused = false) {
    if (blockType === 'AssemblingMachineBlock' || blockType === 'FurnaceBlock' || blockType === 'MiningDrillBlock') {
        return isFocused ? 80 : 65;
    }
    else if (blockType === 'SupplyBlock') {
        return 22;
    }
    else if (blockType === 'BeaconBlock') {
        return 44;
    }
    else {
        return 10;
    }
}
