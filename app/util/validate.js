import * as validators from './validators';

const _proto = Symbol('_proto');
const _validators = Symbol('_validators');
const protos = {};
const rootProto = {};

protos.any = Object.assign(Object.create(rootProto), {
    required: wrap(validators.required),
    default: wrap(validators.defaultVal),
    allow: wrap(validators.allow),
    transform: wrap(validators.transform),
    validate(val) {
        const context = arguments[1] || {
            rootValue: val,
            isValidator,
        };

        for (const validator of this[_validators]) {
            val = validator.call(context, val);
        }

        return val;
    },
});

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
    mapKeys: wrap(validators.mapKeys),
    and: wrap(validators.andKeys),
    nand: wrap(validators.nandKeys),
    or: wrap(validators.orKeys),
    when: wrap(validators.keyWhen),
});

protos.array = Object.assign(Object.create(protos.any), {
    items: wrap(validators.arrayItems),
    map: wrap(validators.arrayMap),
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

export function isValidator(val) {
    return val && Object.prototype.isPrototypeOf.call(rootProto, val);
}

export default Object.create(protos.core);

const wrapContext = {
    isValidator,
};

function wrap(fn, protoName) {
    return function(...args) {
        const ret = Object.create(protos[this[_proto] || protoName || 'core']);

        if (this[_proto] || protoName) {
            ret[_proto] = this[_proto] || protoName;
        }

        ret[_validators] = [
            ...(this[_validators] || []),
            fn.apply(wrapContext, args),
        ];
        return ret;
    };
}
