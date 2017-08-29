import V from '../util/schema/validate';
import { createBlock } from './Block';
import { createConnection } from './Connection';

/**
 * @typedef {object} EffectDistribution
 * @property {number} effectPerBlock
 * @property {number} blocksAffected
 */

const schema = V.object().keys({
    ver: V.number().default(1),
    blocks: V.object().map(createBlock),
    connections: V.object().map(createConnection),
});

/**
 * @param {object} props
 * @returns {EffectDistribution}
 */
export function createPlan(props) {
    return schema.validate(props);
}
