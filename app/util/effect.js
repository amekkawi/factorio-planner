import { data as factorioData } from '../factorio';

export function isValidEffectDistribution(distribution, destBlockQuantity) {
    return distribution.blocksAffected <= 0 && destBlockQuantity - distribution.blocksAffected >= 1
        || distribution.blocksAffected > 0 && distribution.blocksAffected <= destBlockQuantity;
}

export function calculateModulesEffect(moduleIds) {
    const effect = defaultEffect();
    for (const moduleId of moduleIds) {
        const moduleProto = moduleId && factorioData.module[moduleId];
        if (moduleProto && moduleProto.effect) {
            addModuleEffectBonuses(moduleProto.effect, effect);
        }
    }
    return effect;
}

export function calculateBeaconEffect(beaconProto, moduleIds) {
    const effect = defaultEffect();
    const distributionEffectivity = beaconProto.distribution_effectivity || 1;
    for (const moduleId of moduleIds) {
        const moduleProto = moduleId && factorioData.module[moduleId];
        if (moduleProto && moduleProto.effect) {
            addModuleEffectBonuses(moduleProto.effect, effect, distributionEffectivity);
        }
    }
    return effect;
}

export function scaleEffect(effect, scale) {
    return {
        productivity: effect.productivity * scale,
        consumption: effect.consumption * scale,
        pollution: effect.pollution * scale,
        speed: effect.speed * scale,
    };
}

export function mergeEffects(...effects) {
    const ret = defaultEffect();
    for (const { productivity, consumption, pollution, speed } of effects) {
        ret.productivity += productivity;
        ret.consumption += consumption;
        ret.pollution += pollution;
        ret.speed += speed;
    }
    return ret;
}

function addModuleEffectBonuses(moduleEffect, effect, effectivity = 1) {
    const { productivity, consumption, pollution, speed } = moduleEffect;
    if (productivity && productivity.bonus) {
        effect.productivity += productivity.bonus * effectivity;
    }
    if (consumption && consumption.bonus) {
        effect.consumption += consumption.bonus * effectivity;
    }
    if (pollution && pollution.bonus) {
        effect.pollution += pollution.bonus * effectivity;
    }
    if (speed && speed.bonus) {
        effect.speed += speed.bonus * effectivity;
    }
    return effect;
}

function defaultEffect() {
    /**
     * @typedef {object} Effect
     * @property {number} productivity
     * @property {number} consumption
     * @property {number} pollution
     * @property {number} speed
     */
    return {
        productivity: 0,
        consumption: 0,
        pollution: 0,
        speed: 0,
    };
}
