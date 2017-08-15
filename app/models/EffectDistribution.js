import V from '../util/validate';

/**
 * @typedef {object} EffectDistribution
 * @property {number} effectPerBlock
 * @property {number} blocksAffected
 */

const schema = V.object().keys({
    effectPerBlock: V.required().number().integer().min(1),
    blocksAffected: V.required().number().integer(),
});

/**
 * @param {object} props
 * @returns {EffectDistribution}
 */
export function createEffectDistribution(props) {
    return schema.validate(props);
}

export function defaultDistributions() {
    return [
        {
            effectPerBlock: 1,
            blocksAffected: 0,
        },
    ];
}

export function getEffectDistributionLabel(distribution) {
    return `${distribution.blocksAffected || '*'}×${distribution.effectPerBlock}`;
}

export function isValidEffectDistribution(distribution, destBlockQuantity, messages = null) {
    if (distribution.blocksAffected <= 0 && destBlockQuantity - distribution.blocksAffected < 1
        || distribution.blocksAffected > 0 && distribution.blocksAffected > destBlockQuantity) {

        if (!messages) {
            return false;
        }

        messages.push(
            `Distribution ${getEffectDistributionLabel(distribution)} is invalid as the destination block only has a quantity of ${destBlockQuantity}`,
        );
    }

    return true;
}
