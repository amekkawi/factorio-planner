import * as stateUtil from './schema/util/state';
import * as errorUtil from './schema/util/error';

exports.alternatives = alternatives;
function alternatives() {
    return function(val) {
        return val;
    };
}

exports.alternativesTry = alternativesTry;
function alternativesTry(schemas, {
    message = 'must be one of the valid types',
} = {}) {
    if (!Array.isArray(schemas) || !schemas.length) {
        throw new Error('invalid argument for alternatives().try()');
    }

    return function(val) {
        if (val === undefined) {
            return val;
        }

        const errors = [];
        for (const schema of schemas) {
            try {
                return schema.validate(val, this);
            }
            catch (err) {
                errors.push(err);
            }
        }

        throw Object.assign(errorUtil.createError(message, this), {
            errors,
        });
    };
}

exports.any = any;
function any() {
    return function(val) {
        return val;
    };
}

exports.required = required;
function required({
    message = 'is required',
} = {}) {
    return function(val) {
        if (val === undefined) {
            throw errorUtil.createError(message, this);
        }
        return val;
    };
}

exports.defaultVal = defaultVal;
function defaultVal(defaultVal) {
    return function(val) {
        return val === undefined
            ? (typeof defaultVal === 'function' ? defaultVal() : defaultVal)
            : val;
    };
}

exports.transform = transform;
function transform(func, {
    undef = false,
} = {}) {
    if (typeof func !== 'function') {
        throw new Error('invalid argument for transform()');
    }

    return function(val) {
        return undef || val !== undefined ? func(val) : val;
    };
}

exports.allow = allow;
function allow(values, {
    message = 'is not a valid value',
} = {}) {
    if (!Array.isArray(values)) {
        throw new Error('invalid argument for allow()');
    }

    values = new Set(values);
    return function(val) {
        if (val !== undefined && !values.has(val)) {
            throw errorUtil.createError(message, this);
        }
        return val;
    };
}

exports.when = when;
function when(key, {
    is,
    then = null,
    otherwise = null,
}) {
    if (!this.isValidator(then) && !this.isValidator(otherwise)) {
        throw new Error('must have schema "then" and/or "otherwise" for object().when()');
    }

    const isIsValidator = this.isValidator(is);
    const pathGetter = buildPathGetter(key, '.');

    return function(val) {
        const refValue = pathGetter(this.parent);
        let matched;

        if (isIsValidator) {
            try {
                is.validate(refValue, this);
                matched = true;
            }
            catch (err) {
                matched = false;
            }
        }
        else {
            matched = refValue === is;
        }

        if (matched && then) {
            return then.validate(val, this);
        }
        else if (!matched && otherwise) {
            return otherwise.validate(val, this);
        }

        return val;
    };
}

exports.string = string;
function string() {
    return function(val) {
        if (val !== undefined) {
            if (typeof val !== 'string') {
                throw errorUtil.createError('must be a string', this);
            }
        }
        return val;
    };
}

exports.stringMin = stringMin;
function stringMin(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for string().min()');
    }

    return function(val) {
        if (val !== undefined) {
            if (val.length < num) {
                throw errorUtil.createError(`must not be less than ${num} characters`, this);
            }
        }
        return val;
    };
}

exports.stringMax = stringMax;
function stringMax(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for string().min()');
    }

    return function(val) {
        if (val !== undefined) {
            if (val.length > num) {
                throw errorUtil.createError(`must not be more than ${num} characters`, this);
            }
        }
        return val;
    };
}

exports.stringRegex = stringRegex;
function stringRegex(regex, {
    message = `must match pattern ${regex}`,
} = {}) {
    return function(val) {
        if (val !== undefined && !val.match(regex)) {
            throw errorUtil.createError(message, this);
        }
        return val;
    };
}

exports.number = number;
function number() {
    return function(val) {
        if (val !== undefined) {
            if (typeof val !== 'number' || !isFinite(val)) {
                throw errorUtil.createError('must be a finite number', this);
            }
        }
        return val;
    };
}

exports.numberInteger = numberInteger;
function numberInteger() {
    return function(val) {
        if (val !== undefined) {
            if (val % 1 !== 0) {
                throw errorUtil.createError('must be an integer', this);
            }
        }
        return val;
    };
}

exports.numberMin = numberMin;
function numberMin(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for number().min()');
    }

    return function(val) {
        if (val !== undefined) {
            if (val < num) {
                throw errorUtil.createError(`must not be less than ${num}`, this);
            }
        }
        return val;
    };
}

exports.numberMax = numberMax;
function numberMax(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for number().max()');
    }

    return function(val) {
        if (val !== undefined) {
            if (val > num) {
                throw errorUtil.createError(`must not be more than ${num}`, this);
            }
        }
        return val;
    };
}

exports.numberGreater = numberGreater;
function numberGreater(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for number().greater()');
    }

    return function(val) {
        if (val !== undefined) {
            if (val <= num) {
                throw errorUtil.createError(`must be greater than ${num}`, this);
            }
        }
        return val;
    };
}

exports.numberLess = numberLess;
function numberLess(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for number().less()');
    }

    return function(val) {
        if (val !== undefined) {
            if (val >= num) {
                throw errorUtil.createError(`must be less than ${num}`, this);
            }
        }
        return val;
    };
}

exports.object = object;
function object() {
    return function(val) {
        this._knownKeySet = new Set();
        if (val !== undefined) {
            if (!val || typeof val !== 'object' || Array.isArray(val)) {
                throw errorUtil.createError('must be an object', this);
            }
        }
        return val;
    };
}

exports.objectKeys = objectKeys;
function objectKeys(keys, {
    unknown = false,
} = {}) {
    return function(val) {
        if (val !== undefined) {
            const unknownKeys = unknown
                ? null
                : new Set(getUnknownKeys(Object.keys(val), this._knownKeySet));

            let mutated = false;

            for (const key of Object.keys(keys)) {
                this._knownKeySet.add(key);

                if (unknownKeys) {
                    unknownKeys.delete(key);
                }

                const keyVal = keys[key].validate(
                    val[key],
                    stateUtil.createChildState(this, val, key)
                );

                if (mutated) {
                    val[key] = keyVal;
                }
                else if (val[key] !== keyVal) {
                    mutated = true;
                    val = Object.assign({}, val);
                    val[key] = keyVal;
                }
            }

            if (unknownKeys && unknownKeys.size) {
                throw errorUtil.createError(`cannot include keys: ${Array.from(unknownKeys).join(',')}`, this);
            }
        }
        return val;
    };
}

exports.objectPattern = objectPattern;
function objectPattern(pattern, schema, {
    mutate = false,
} = {}) {
    let keyCheck;

    if (this.isValidator(pattern)) {
        keyCheck = (key, state) => {
            try {
                pattern.validate(
                    key,
                    stateUtil.createState(state),
                );
                return true;
            }
            catch (err) {
                return false;
            }
        };
    }
    else if (pattern instanceof RegExp) {
        keyCheck = (key) => key.match(pattern);
    }
    else if (typeof pattern === 'function') {
        keyCheck = (key) => pattern(key);
    }
    else {
        throw new Error('invalid pattern argument for object().pattern()');
    }

    if (!this.isValidator(schema)) {
        throw new Error('invalid schema argument for object().pattern()');
    }

    return function(val) {
        if (val !== undefined) {
            let mutated = false;

            for (const key of Object.keys(val)) {
                if (keyCheck(key, this)) {
                    this._knownKeySet.add(key);

                    const keyVal = schema.validate(
                        val[key],
                        stateUtil.createChildState(this, val, key)
                    );

                    if (keyVal !== val[key]) {
                        if (!mutate && !mutated) {
                            val = Object.assign({}, val);
                            mutated = true;
                        }

                        val[key] = keyVal;
                    }
                }
            }
        }
        return val;
    };
}

exports.objectMap = objectMap;
function objectMap(func, {
    mutate = false,
} = {}) {
    if (typeof func !== 'function') {
        throw new Error('invalid argument for object().map()');
    }

    return function(val) {
        if (val !== undefined) {
            let mutated = false;

            for (const key of Object.keys(val)) {
                this._knownKeySet.add(key);

                const keyVal = func(val[key], key, val);

                if (keyVal !== val[key]) {
                    if (!mutate && !mutated) {
                        val = Object.assign({}, val);
                        mutated = true;
                    }

                    val[key] = keyVal;
                }
            }
        }
        return val;
    };
}

/*exports.andKeys = andKeys;
function andKeys(peers, {
    message = `must have all keys if at least one is present: ${peers.join(',')}`,
} = {}) {
    return function(val) {
        if (val !== undefined) {
            let found = 0;
            let missing = 0;
            for (const key of peers) {
                if (val[key] === undefined) {
                    missing++;
                    if (found) {
                        throw errorUtil.createError(message, this);
                    }
                }
                else {
                    found++;
                    if (missing) {
                        throw errorUtil.createError(message, this);
                    }
                }
            }
        }
        return val;
    };
}

exports.nandKeys = nandKeys;
function nandKeys(peers, {
    message = `must not have more than one keys of: ${peers.join(',')}`,
} = {}) {
    return function(val) {
        if (val !== undefined) {
            let found = false;
            for (const key of peers) {
                if (val[key] !== undefined) {
                    if (found) {
                        throw errorUtil.createError(message, this);
                    }
                    found = true;
                }
            }
        }
        return val;
    };
}

exports.orKeys = orKeys;
function orKeys(peers, {
    message = `must have at least one of the following keys: ${peers.join(',')}`,
} = {}) {
    return function(val) {
        if (val !== undefined) {
            let found = false;
            for (const key of peers) {
                if (val[key] !== undefined) {
                    found = true;
                }
            }

            if (!found) {
                throw errorUtil.createError(message, this);
            }
        }
        return val;
    };
}*/

exports.array = array;
function array() {
    return function(val) {
        if (val !== undefined) {
            if (!val || !Array.isArray(val)) {
                throw errorUtil.createError('must be an array', this);
            }
        }
        return val;
    };
}

exports.arrayMap = arrayMap;
function arrayMap(func) {
    if (typeof func !== 'function') {
        throw new Error('invalid argument for array().map()');
    }

    return function(val) {
        return val === undefined ? val : val.map(func);
    };
}

exports.arrayItems = arrayItems;
function arrayItems(types) {
    if (!Array.isArray(types) || !types.length) {
        throw new Error('invalid argument for array().items()');
    }

    const alts = alternativesTry.call(this, types);

    return function(val) {
        if (val !== undefined) {
            let mutated = false;

            for (let i = 0, l = val.length; i < l; i++) {
                const itemVal = alts.call(stateUtil.createChildState(this, val, i), val[i]);
                if (itemVal !== undefined) {
                    if (mutated) {
                        val[i] = itemVal;
                    }
                    else if (val[i] !== itemVal) {
                        mutated = true;
                        val = [...val];
                        val[i] = itemVal;
                    }
                }
            }
        }

        return val;
    };
}

exports.arrayMin = arrayMin;
function arrayMin(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for array().min()');
    }

    return function(val) {
        if (val !== undefined) {
            if (val.length < num) {
                throw errorUtil.createError(`must not have less than ${num} items`, this);
            }
        }
        return val;
    };
}

exports.arrayMax = arrayMax;
function arrayMax(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for array().max()');
    }

    return function(val) {
        if (val !== undefined) {
            if (val.length > num) {
                throw errorUtil.createError(`must not have more than ${num} items`, this);
            }
        }
        return val;
    };
}

function getUnknownKeys(keys, knownKeySet) {
    return keys.filter((key) => !knownKeySet.has(key));
}

function buildPathGetter(path, sep) {
    const split = path.split(sep);
    if (split.length === 1) {
        return propGetter.bind(null, split[0]);
    }
    else {
        return pathGetter.bind(null, split);
    }
}

function propGetter(key, value) {
    return value && value[key];
}

function pathGetter(keys, value) {
    for (let i = 0, l = keys.length; i < l && value; i++) {
        value = value[keys[i]];
    }
    return value;
}
