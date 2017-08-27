import * as validators from './validators';
import * as stateUtil from './schema/util/state';

const _proto = /*Symbol*/('_proto');
const _validators = /*Symbol*/('_validators');
const protos = {};
const rootProto = {};

const util = {
    isValidator,
};

function wrapValidator(fn, protoName) {
    /* istanbul ignore next */
    if (typeof fn !== 'function') {
        throw new Error('fn must be a function');
    }

    return function(...args) {
        const proto = this[_proto] || protoName;

        // Create the schema, defaulting the proto to 'any'
        // if we have yet to switch to a specific proto (e.g. 'string').
        const ret = Object.create(protos[proto || 'any']);

        // Maintain the proto if not 'any'
        if (proto) {
            ret[_proto] = proto;
        }

        ret[_validators] = [
            ...(this[_validators] || []),
            fn.apply(util, args),
        ];
        return ret;
    };
}

function wrapValidators(obj) {
    return Object.keys(obj).reduce((ret, key) => {
        ret[key] = wrapValidator(obj[key]);
        return ret;
    }, {});
}

export function isValidator(val) {
    return val && Object.prototype.isPrototypeOf.call(rootProto, val);
}

const anyValidators = {
    required: validators.required,
    default: validators.defaultVal,
    allow: validators.allow,
    transform: validators.transform,
    when: validators.when,
};

protos.any = Object.assign(
    Object.create(rootProto),
    wrapValidators(anyValidators),
    {
        validate(val, _state) {
            const state = stateUtil.createState(_state);

            for (const validator of this[_validators]) {
                val = validator.call(state, val);
            }

            return val;
        },
    }
);

protos.alternatives = Object.assign(
    Object.create(protos.any),
    wrapValidators({
        try: validators.alternativesTry,
    })
);

protos.number = Object.assign(
    Object.create(protos.any),
    wrapValidators({
        integer: validators.numberInteger,
        min: validators.numberMin,
        max: validators.numberMax,
        greater: validators.numberGreater,
        less: validators.numberLess,
    }),
);

protos.string = Object.assign(
    Object.create(protos.any),
    wrapValidators({
        regex: validators.stringRegex,
        min: validators.stringMin,
        max: validators.stringMax,
    }),
);

protos.object = Object.assign(
    Object.create(protos.any),
    wrapValidators({
        keys: validators.objectKeys,
        pattern: validators.objectPattern,
        map: validators.objectMap,
        // and: validators.andKeys,
        // nand: validators.nandKeys,
        // or: validators.orKeys,
    }),
);

protos.array = Object.assign(
    Object.create(protos.any),
    wrapValidators({
        items: validators.arrayItems,
        map: validators.arrayMap,
        min: validators.arrayMin,
        max: validators.arrayMax,
    }),
);

protos.core = Object.keys(anyValidators).reduce((ret, key) => {
    ret[key] = (...args) => {
        const chain = ret.any();
        return chain[key].apply(chain, args);
    };
    return ret;
}, {
    any: wrapValidator(validators.any),
    alternatives: wrapValidator(validators.alternatives, 'alternatives'),
    string: wrapValidator(validators.string, 'string'),
    object: wrapValidator(validators.object, 'object'),
    number: wrapValidator(validators.number, 'number'),
    array: wrapValidator(validators.array, 'array'),
});

export default Object.create(protos.core);
