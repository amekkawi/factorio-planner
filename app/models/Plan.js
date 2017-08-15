import V from '../util/validate';
import { createBlock } from './Block';
import { createConnection } from './Connection';

/**
 * @typedef {object} EffectDistribution
 * @property {number} effectPerBlock
 * @property {number} blocksAffected
 */

const schema = V.object().keys({
    ver: V.number().default(1),
    blocks: V.object().mapKeys(createBlock),
    connections: V.object().mapKeys(createConnection),
});

/**
 * @param {object} props
 * @returns {EffectDistribution}
 */
export function createPlan(props) {
    return schema.validate(props);
}
