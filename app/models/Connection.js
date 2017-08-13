import V from '../util/validate';

const baseKeys = {
    connectionId: V.required().string().regex(/^c\d+$/),
    type: V.allow([
        'result',
        'effect',
    ]),
    srcBlockId: V.required().string().regex(/^b\d+$/),
    destBlockId: V.required().string().regex(/^b\d+$/),
};

const baseSchema = V.object().keys(baseKeys);

const schemaByType = {};

/**
 * @typedef {object} Connection
 * @property {string} connectionId
 * @property {string} type
 * @property {string} srcBlockId
 * @property {string} destBlockId
 * @property {ConnectionMeta} meta
 */

/**
 * @typedef {object} ConnectionMeta
 * @property {ConnectionMetaResult[]} results
 * @property {ConnectionMetaDistribution[]} distributions
 */

/**
 * @typedef {object} ConnectionMetaResult
 * @property {string} type
 * @property {string} name
 * @property {number} inboundWeight
 * @property {number} inboundPriority
 * @property {number} outboundWeight
 * @property {number} outboundPriority
 */

/**
 * @typedef {object} ConnectionMetaDistribution
 * @property {number} effectPerBlock
 * @property {number} blocksAffected
 */

schemaByType.result = V.object()
    .keys({
        ...baseKeys,
        meta: V.required().object().keys({
            results: V.required().array().items([
                V.object().keys({
                    type: V.default('item').string().min(1),
                    name: V.required().string().min(1),
                    inboundWeight: V.default(1).number().greater(0),
                    inboundPriority: V.default(1).number().integer().min(1),
                    outboundWeight: V.default(1).number().greater(0),
                    outboundPriority: V.default(1).number().integer().min(1),
                }),
            ]),
        }),
    });

function defaultDistributions() {
    return [
        {
            effectPerBlock: 1,
            blocksAffected: 0,
        },
    ];
}

schemaByType.effect = V.object()
    .keys({
        ...baseKeys,
        meta: V.required().object().keys({
            distributions: V.default(defaultDistributions)
                .array().items([
                    V.object().keys({
                        effectPerBlock: V.required().number().integer().min(1),
                        blocksAffected: V.required().number().integer(),
                    }),
                ]),
        }),
    });

/**
 * @param {string} connectionId
 * @param {object} props
 * @return {ResultConnection|EffectConnection}
 */
export function createConnection(connectionId, props) {
    try {
        if (!props || !schemaByType[props.type]) {
            baseSchema.validate(props);
        }
        else {
            props = schemaByType[props.type].validate(props);
            props.connectionId = connectionId;
            return props;
        }
    }
    catch (err) {
        err.message = `[Connection ${connectionId}] ${err.message}`;
        throw err;
    }
}
