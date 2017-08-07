export function alternatives() {
    return function(val) {
        return val;
    };
}

export function alternativesTry(schemas, {
    message = 'must be one of the valid types',
} = {}) {
    if (!Array.isArray(schemas) || !schemas.length) {
        throw new Error('invalid argument for alternatives().try()');
    }

    return function(val) {
        const errors = [];
        for (const schema of schemas) {
            try {
                return schema.validate(val, this);
            }
            catch (err) {
                errors.push(err);
            }
        }

        throw Object.assign(new Error(message), {
            errors,
        });
    };
}

export function required({
    message = 'is required',
} = {}) {
    return function(val) {
        if (val === void 0) {
            throw new Error(message);
        }
        return val;
    };
}

export function defaultVal(defaultVal) {
    return function(val) {
        return val === void 0
            ? (typeof defaultVal === 'function' ? defaultVal() : defaultVal)
            : val;
    };
}

export function allow(values, {
    message = 'is not a valid value',
} = {}) {
    if (!values || !Array.isArray(values)) {
        throw new Error('invalid argument for allow()');
    }

    values = new Set(values);
    return function(val) {
        if (!values.has(val)) {
            throw new Error(message);
        }
        return val;
    };
}

export function string() {
    return function(val) {
        if (val !== void 0) {
            if (typeof val !== 'string') {
                throw new Error('must be a string');
            }
        }
        return val;
    };
}

export function stringMin(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for string().min()');
    }

    return function(val) {
        if (val !== void 0) {
            if (val.length < num) {
                throw new Error(`must not be less than ${num} characters`);
            }
        }
        return val;
    };
}

export function stringMax(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for string().min()');
    }

    return function(val) {
        if (val !== void 0) {
            if (val.length > num) {
                throw new Error(`must not be more than ${num} characters`);
            }
        }
        return val;
    };
}

export function stringRegex(regex, {
    message = `must match pattern ${regex}`,
} = {}) {
    return function(val) {
        if (val !== void 0 && !val.match(regex)) {
            throw new Error(message);
        }
        return val;
    };
}

export function number() {
    return function(val) {
        if (val !== void 0) {
            if (typeof val !== 'number' || !isFinite(val)) {
                throw new Error('must be a finite number');
            }
        }
        return val;
    };
}

export function numberInteger() {
    return function(val) {
        if (val !== void 0) {
            if (val % 1 !== 0) {
                throw new Error('must be an integer');
            }
        }
        return val;
    };
}

export function numberMin(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for number().min()');
    }

    return function(val) {
        if (val !== void 0) {
            if (val < num) {
                throw new Error(`must not be less than ${num}`);
            }
        }
        return val;
    };
}

export function numberMax(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for number().max()');
    }

    return function(val) {
        if (val !== void 0) {
            if (val > num) {
                throw new Error(`must not be more than ${num}`);
            }
        }
        return val;
    };
}

export function numberGreater(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for number().greater()');
    }

    return function(val) {
        if (val !== void 0) {
            if (val <= num) {
                throw new Error(`must be greater than ${num}`);
            }
        }
        return val;
    };
}

export function numberLess(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for number().less()');
    }

    return function(val) {
        if (val !== void 0) {
            if (val <= num) {
                throw new Error(`must be less than ${num}`);
            }
        }
        return val;
    };
}

export function object() {
    return function(val) {
        if (val !== void 0) {
            if (!val || typeof val !== 'object' || Array.isArray(val)) {
                throw new Error('must be an object');
            }
        }
        return val;
    };
}

export function keys(keys, {
    unknown = false,
} = {}) {
    return function(val) {
        if (val !== void 0) {
            const unknownKeys = !unknown && new Set(Object.keys(val));
            let mutated = false;

            for (const key of Object.keys(keys)) {
                unknownKeys && unknownKeys.delete(key);
                let keyVal;

                try {
                    keyVal = keys[key].validate(val[key], this);
                }
                catch (err) {
                    if (!err.path) {
                        err.path = [];
                        err.message = ` ${err.message}`;
                    }

                    err.path.unshift(key);
                    err.message = `${key}${err.path.length === 1 ? '' : '.'}${err.message}`;
                    throw err;
                }

                if (keyVal !== void 0) {
                    if (mutated) {
                        val[key] = keyVal;
                    }
                    else if (val[key] !== keyVal) {
                        mutated = true;
                        val = { ...val };
                        val[key] = keyVal;
                    }
                }
            }

            if (unknownKeys && unknownKeys.size) {
                throw new Error(`cannot include keys: ${Array.from(unknownKeys).join(',')}`);
            }
        }
        return val;
    };
}

export function andKeys(peers, {
    message = `must have all keys if at least one is present: ${peers.join(',')}`,
} = {}) {
    return function(val) {
        if (val !== void 0) {
            let found = 0;
            let missing = 0;
            for (const key of peers) {
                if (val[key] === void 0) {
                    missing++;
                    if (found) {
                        throw new Error(message);
                    }
                }
                else {
                    found++;
                    if (missing) {
                        throw new Error(message);
                    }
                }
            }
        }
        return val;
    };
}

export function nandKeys(peers, {
    message = `must not have more than one keys of: ${peers.join(',')}`,
} = {}) {
    return function(val) {
        if (val !== void 0) {
            let found = false;
            for (const key of peers) {
                if (val[key] !== void 0) {
                    if (found) {
                        throw new Error(message);
                    }
                    found = true;
                }
            }
        }
        return val;
    };
}

export function orKeys(peers, {
    message = `must have at least one of the following keys: ${peers.join(',')}`,
} = {}) {
    return function(val) {
        if (val !== void 0) {
            let found = false;
            for (const key of peers) {
                if (val[key] !== void 0) {
                    found = true;
                }
            }

            if (!found) {
                throw new Error(message);
            }
        }
        return val;
    };
}

export function array() {
    return function(val) {
        if (val !== void 0) {
            if (!val || !Array.isArray(val)) {
                throw new Error('must be an array');
            }
        }
        return val;
    };
}

export function arrayItems(types) {
    if (!Array.isArray(types) || !types.length) {
        throw new Error('invalid argument for array().items()');
    }

    const alts = alternativesTry(types);

    return function(val) {
        if (val !== void 0) {
            let mutated = false;

            for (let i = 0, l = val.length; i < l; i++) {
                const itemVal = alts.call(this, val[i]);
                if (itemVal !== void 0) {
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

export function arrayMin(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for array().min()');
    }

    return function(val) {
        if (val !== void 0) {
            if (val.length < num) {
                throw new Error(`must have less than ${num} items`);
            }
        }
        return val;
    };
}

export function arrayMax(num) {
    if (typeof num !== 'number' || !isFinite(num)) {
        throw new Error('invalid argument for array().max()');
    }

    return function(val) {
        if (val !== void 0) {
            if (val.length > num) {
                throw new Error(`must not have more than ${num} items`);
            }
        }
        return val;
    };
}
