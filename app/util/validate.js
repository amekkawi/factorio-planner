import * as validators from './validators';

const _proto = Symbol('_proto');
const _validators = Symbol('_validators');
const protos = {};

protos.any = {
    required: wrap(validators.required),
    default: wrap(validators.defaultVal),
    allow: wrap(validators.allow),
    validate(val) {
        const context = arguments[1] || {
            rootValue: val,
        };

        for (const validator of this[_validators]) {
            val = validator.call(context, val);
        }

        return val;
    },
};

protos.alternatives = Object.assign(Object.create(protos.any), {
    try: wrap(validators.alternativesTry),
});

protos.number = Object.assign(Object.create(protos.any), {
    integer: wrap(validators.numberInteger),
    min: wrap(validators.numberMin),
    max: wrap(validators.numberMax),
    greater: wrap(validators.numberGreater),
    less: wrap(validators.numberLess),
});

protos.string = Object.assign(Object.create(protos.any), {
    regex: wrap(validators.stringRegex),
    min: wrap(validators.stringMin),
    max: wrap(validators.stringMax),
});

protos.object = Object.assign(Object.create(protos.any), {
    keys: wrap(validators.keys),
    and: wrap(validators.andKeys),
    nand: wrap(validators.nandKeys),
    or: wrap(validators.orKeys),
});

protos.array = Object.assign(Object.create(protos.any), {
    items: wrap(validators.arrayItems),
    min: wrap(validators.arrayMin),
    max: wrap(validators.arrayMax),
});

protos.core = Object.assign(Object.create(protos.any), {
    alternatives: wrap(validators.alternatives, 'alternatives'),
    string: wrap(validators.string, 'string'),
    object: wrap(validators.object, 'object'),
    number: wrap(validators.number, 'number'),
    array: wrap(validators.array, 'array'),
});

export default Object.create(protos.core);

function wrap(fn, protoName) {
    return function(...args) {
        const ret = Object.create(protos[this[_proto] || protoName || 'core']);

        if (this[_proto] || protoName) {
            ret[_proto] = this[_proto] || protoName;
        }

        ret[_validators] = [
            ...(this[_validators] || []),
            fn(...args),
        ];
        return ret;
    };
}
