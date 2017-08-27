import V from './validate';

describe('any', () => {
    describe('V.any()', () => {
        test('should return value', () => {
            // Shortcut
            expect(V.any().validate()).toBe(undefined);
            expect(V.any().validate(undefined)).toBe(undefined);
            expect(V.any().validate(500)).toBe(500);
            expect(V.any().validate(false)).toBe(false);
        });
    });

    describe('V.any().required()', () => {
        test('should throw error if undefined', () => {
            // Shortcut
            expect(() => V.required().validate())
                .toThrow('is required');

            expect(() => V.any().required().validate())
                .toThrow('is required');

            expect(() => V.any().required().validate(undefined))
                .toThrow('is required');

            expect(V.any().required().validate(false)).toBe(false);
            expect(V.any().required().validate(null)).toBe(null);
            expect(V.any().required().validate(0)).toBe(0);
            expect(V.any().required().validate(500)).toBe(500);
        });
    });

    describe('V.any().default()', () => {
        test('should default to specified value if validated value is undefined', () => {

            // Shortcut
            expect(V.default('foox').validate()).toBe('foox');
            const func = V.any().default('foo');
            expect(func.validate()).toBe('foo');
            expect(func.validate(void 0)).toBe('foo');
            expect(func.validate(0)).toBe(0);
            expect(func.validate(null)).toBe(null);
            expect(func.validate(false)).toBe(false);
        });

        test('should call default if is function', () => {
            const func = V.any().default(() => 'foo');
            expect(func.validate()).toBe('foo');
        });
    });

    describe('V.any().transform()', () => {
        test('should throw error if func is not a function', () => {
            expect(() => V.any().transform()).toThrow(/invalid argument/);
            expect(() => V.any().transform({})).toThrow(/invalid argument/);
            expect(() => V.any().transform([])).toThrow(/invalid argument/);
        });

        test('should pass value through specified func', () => {
            expect(V.any().transform((val) => `${val}-bar`).validate()).toBe(void 0);
            expect(V.any().transform((val) => `${val}-bar`).validate(void 0)).toBe(void 0);
            expect(V.any().transform((val) => `${val}-bar`).validate('foo')).toBe('foo-bar');
        });

        test('should allow transform of undefined if undef option set', () => {
            expect(V.any().transform((val) => `${val}-bar`, { undef: true }).validate()).toBe('undefined-bar');
            expect(V.any().transform((val) => `${val}-bar`, { undef: true }).validate(void 0)).toBe('undefined-bar');
        });
    });

    describe('V.any().allow()', () => {
        test('should throw error if values is not an array', () => {
            expect(() => V.any().allow()).toThrow(/invalid argument/);
            expect(() => V.any().allow({})).toThrow(/invalid argument/);
            expect(() => V.any().allow('foo')).toThrow(/invalid argument/);
        });

        test('should throw error if value is not in array', () => {
            expect(V.any().allow(['foo']).validate()).toBe(void 0);
            expect(V.any().allow(['foo']).validate(void 0)).toBe(void 0);
            expect(V.any().allow(['foo', 'bar']).validate('foo')).toBe('foo');
            expect(V.any().allow(['foo', 'bar']).validate('bar')).toBe('bar');
            expect(() => V.any().allow(['foo']).validate('bar')).toThrow('is not a valid value');
        });

        test('should check values by ===', () => {
            const obj = { 'foo': 1 };
            const arr = ['bar'];

            expect(V.any().allow([obj, arr]).validate(obj)).toBe(obj);
            expect(V.any().allow([obj, arr]).validate(arr)).toBe(arr);
            expect(() => V.any().allow([obj, arr]).validate(['bar'])).toThrow('is not a valid value');
            expect(() => V.any().allow([obj, arr]).validate({ 'foo': 1 })).toThrow('is not a valid value');
        });
    });

    describe('V.any().when()', () => {
        test('should throw error if neither then nor otherwise are validators', () => {
            expect(() => V.any().when('foo', { is: 500 }))
                .toThrow(/must have schema "then" and\/or "otherwise"/);

            expect(() => V.any().when('foo', { is: 500, then: () => {} }))
                .toThrow(/must have schema "then" and\/or "otherwise"/);

            expect(() => V.any().when('foo', { is: 500, otherwise: () => {} }))
                .toThrow(/must have schema "then" and\/or "otherwise"/);
        });

        test('should apply additional validation if "is" value matches', () => {
            const fnThen = jest.fn((v) => `${v}-then`);
            const fnOtherwise = jest.fn((v) => `${v}-other`);

            const schema = V.object().keys({
                foo: V.number(),
                bar: V.any().when('foo', {
                    is: 500,
                    then: V.transform(fnThen),
                    otherwise: V.transform(fnOtherwise),
                }),
            });

            expect(schema.validate({
                foo: 500,
                bar: 'BAR',
            })).toEqual({
                foo: 500,
                bar: 'BAR-then',
            });

            expect(fnThen.mock.calls.length).toBe(1);
            expect(fnOtherwise.mock.calls.length).toBe(0);

            fnThen.mockClear();
            fnOtherwise.mockClear();

            expect(schema.validate({
                foo: 100,
                bar: 'BAR',
            })).toEqual({
                foo: 100,
                bar: 'BAR-other',
            });

            expect(fnThen.mock.calls.length).toBe(0);
            expect(fnOtherwise.mock.calls.length).toBe(1);
        });

        test('should apply additional validation if "is" is schema and matches', () => {
            const schema = V.object().keys({
                foo: V.number(),
                bar: V.any().when('foo', {
                    // Transform to check that value is not modified by schema.
                    is: V.number().allow([500]).transform((v) => v + 10),
                    then: V.transform((v) => `${v}-then`),
                    otherwise: V.transform((v) => `${v}-other`),
                }),
            });

            expect(schema.validate({
                foo: 500,
                bar: 'BAR',
            })).toEqual({
                foo: 500,
                bar: 'BAR-then',
            });

            expect(schema.validate({
                foo: 400,
                bar: 'BAR',
            })).toEqual({
                foo: 400,
                bar: 'BAR-other',
            });
        });

        test('should allow only "then"', () => {
            const schema = V.object().keys({
                foo: V.number(),
                bar: V.any().when('foo', {
                    is: 500,
                    then: V.transform((v) => `${v}-then`),
                }),
            });

            expect(schema.validate({
                foo: 500,
                bar: 'BAR',
            })).toEqual({
                foo: 500,
                bar: 'BAR-then',
            });

            expect(schema.validate({
                foo: 100,
                bar: 'BAR',
            })).toEqual({
                foo: 100,
                bar: 'BAR',
            });
        });

        test('should allow only "otherwise"', () => {
            const schema = V.object().keys({
                foo: V.number(),
                bar: V.any().when('foo', {
                    is: 500,
                    otherwise: V.transform((v) => `${v}-other`),
                }),
            });

            expect(schema.validate({
                foo: 500,
                bar: 'BAR',
            })).toEqual({
                foo: 500,
                bar: 'BAR',
            });

            expect(schema.validate({
                foo: 100,
                bar: 'BAR',
            })).toEqual({
                foo: 100,
                bar: 'BAR-other',
            });
        });

        test('should get modified sibling value', () => {
            const schema = V.object().keys({
                foo: V.number().transform((v) => v + 10),
                bar: V.any().when('foo', {
                    is: 510,
                    then: V.transform((v) => `${v}-then`),
                }),
            });

            expect(schema.validate({
                foo: 500,
                bar: 'BAR',
            })).toEqual({
                foo: 510,
                bar: 'BAR-then',
            });
        });

        test('should get modified sibling value', () => {
            const schema = V.object().keys({
                foo: V.object().keys({
                    fooChild: V.number().transform((v) => v + 10),
                }),
                bar: V.any().when('foo.fooChild', {
                    is: 510,
                    then: V.transform((v) => `${v}-then`),
                    otherwise: V.transform((v) => `${v}-other`),
                }),
            });

            expect(schema.validate({
                foo: {
                    fooChild: 500,
                },
                bar: 'BAR',
            })).toEqual({
                foo: {
                    fooChild: 510,
                },
                bar: 'BAR-then',
            });

            expect(schema.validate({
                foo: {
                    fooChild: undefined,
                },
                bar: 'BAR',
            })).toEqual({
                foo: {
                    fooChild: undefined,
                },
                bar: 'BAR-other',
            });
        });

        test('should still validate if validated value and/or ref value are undefined', () => {
            const schema = V.object().keys({
                foo: V.object().keys({
                    fooChild: V.number(),
                }),
                bar: V.any().when('foo.fooChild', {
                    is: 500,
                    then: V.default('BAR').transform((v) => `${v}-then`),
                    otherwise: V.default('FOO').transform((v) => `${v}-other`),
                }),
            });

            expect(schema.validate({})).toEqual({
                bar: 'FOO-other',
            });

            expect(schema.validate({
                bar: 'foo',
            })).toEqual({
                bar: 'foo-other',
            });

            expect(schema.validate({
                foo: {},
            })).toEqual({
                foo: {},
                bar: 'FOO-other',
            });

            expect(schema.validate({
                foo: {
                    fooChild: undefined,
                },
            })).toEqual({
                foo: {
                    fooChild: undefined,
                },
                bar: 'FOO-other',
            });
        });

        test('should respect "is" schema matching undefined', () => {
            const schemaA = V.object().keys({
                foo: V.number(),
                bar: V.any().when('foo', {
                    is: V.allow([500]),
                    then: V.default('THEN'),
                    otherwise: V.default('OTHER'),
                }),
            });

            expect(schemaA.validate({})).toEqual({
                bar: 'THEN',
            });

            const schemaB = V.object().keys({
                foo: V.number(),
                bar: V.any().when('foo', {
                    is: V.allow([500]).required(),
                    then: V.default('THEN'),
                    otherwise: V.default('OTHER'),
                }),
            });

            expect(schemaB.validate({})).toEqual({
                bar: 'OTHER',
            });
        });
    });
});

describe('alternatives', () => {
    describe('V.alternatives()', () => {
        test('should return value', () => {
            expect(V.alternatives().validate(void 0)).toBe(void 0);
            expect(V.alternatives().validate('foo')).toBe('foo');
            expect(V.alternatives().validate('')).toBe('');
            expect(V.alternatives().validate(null)).toBe(null);
            expect(V.alternatives().validate(false)).toBe(false);
        });
    });

    describe('V.alternatives().try()', () => {
        test('should throw error if schemas is not a non-empty array', () => {
            expect(() => V.alternatives().try()).toThrow(/invalid argument/);
            expect(() => V.alternatives().try({})).toThrow(/invalid argument/);
            expect(() => V.alternatives().try([])).toThrow(/invalid argument/);
        });

        test('should validate value against each schema, and use the value from the successful one, or throw error if none matched', () => {
            const schemaAError = new Error('Only alpha');
            const schemaAFn = jest.fn((val) => {
                if (val === 'alpha') {
                    return 'foo';
                }
                else {
                    throw schemaAError;
                }
            });
            const schemaA = V.transform(schemaAFn);

            const schemaBError = new Error('Only beta');
            const schemaBFn = jest.fn((val) => {
                if (val === 'beta') {
                    return 'bar';
                }
                else {
                    throw schemaBError;
                }
            });
            const schemaB = V.transform(schemaBFn);

            const schema = V.alternatives().try([
                schemaA,
                schemaB,
            ]);

            expect(schema.validate(void 0)).toBe(void 0);

            expect(schema.validate('alpha')).toBe('foo');

            expect(schemaAFn.mock.calls).toEqual([['alpha']]);
            expect(schemaBFn.mock.calls.length).toBe(0);

            schemaAFn.mockClear();
            schemaBFn.mockClear();

            expect(schema.validate('beta')).toBe('bar');

            expect(schemaAFn.mock.calls).toEqual([['beta']]);
            expect(schemaBFn.mock.calls).toEqual([['beta']]);

            expect(() => schema.validate('gamma')).toThrow(/must be one of the valid types/);
        });
    });
});

describe('string', () => {
    describe('V.string()', () => {
        test('should throw error if value is not a string', () => {
            expect(V.string().validate(void 0)).toBe(void 0);
            expect(V.string().validate('foo')).toBe('foo');
            expect(V.string().validate('')).toBe('');
            expect(() => V.string().validate(null)).toThrow('must be a string');
            expect(() => V.string().validate(false)).toThrow('must be a string');
        });
    });

    describe('V.string().min()', () => {
        test('should throw error if num argument is not a finite number', () => {
            expect(() => V.string().min()).toThrow(/invalid argument/);
            expect(() => V.string().min({})).toThrow(/invalid argument/);
            expect(() => V.string().min('foo')).toThrow(/invalid argument/);
            expect(() => V.string().min(Infinity)).toThrow(/invalid argument/);
            expect(() => V.string().min(NaN)).toThrow(/invalid argument/);
        });

        test('should throw error if value is less than specified length', () => {
            expect(V.string().min(5).validate(undefined)).toBe(undefined);
            expect(V.string().min(5).validate('12345')).toBe('12345');
            expect(V.string().min(5).validate('12345678')).toBe('12345678');
            expect(() => V.string().min(10).validate('123')).toThrow('must not be less than 10 characters');
            expect(() => V.string().min(5).validate('')).toThrow('must not be less than 5 characters');
        });
    });

    describe('V.string().max()', () => {
        test('should throw error if num argument is not a finite number', () => {
            expect(() => V.string().max()).toThrow(/invalid argument/);
            expect(() => V.string().max({})).toThrow(/invalid argument/);
            expect(() => V.string().max('foo')).toThrow(/invalid argument/);
            expect(() => V.string().max(Infinity)).toThrow(/invalid argument/);
            expect(() => V.string().max(NaN)).toThrow(/invalid argument/);
        });

        test('should throw error if value is less than specified length', () => {
            expect(V.string().max(5).validate(undefined)).toBe(undefined);
            expect(V.string().max(5).validate('123')).toBe('123');
            expect(V.string().max(5).validate('12345')).toBe('12345');
            expect(() => V.string().max(2).validate('123')).toThrow('must not be more than 2 characters');
            expect(() => V.string().max(1).validate('12')).toThrow('must not be more than 1 characters');
        });
    });

    describe('V.string().regex()', () => {
        test('should throw error if value does not match regex', () => {
            expect(V.string().regex(/^\d{3}$/).validate('123')).toBe('123');
            expect(() => V.string().regex(/^\d{3}$/).validate('1234')).toThrow(/^must match pattern/);
        });
    });
});

describe('number', () => {
    describe('V.number()', () => {
        test('should throw error if value is not a finite number', () => {
            expect(V.number().validate(void 0)).toBe(void 0);
            expect(V.number().validate(5)).toBe(5);
            expect(V.number().validate(0)).toBe(0);
            expect(V.number().validate(-5)).toBe(-5);
            expect(() => V.number().validate(null)).toThrow('must be a finite number');
            expect(() => V.number().validate(false)).toThrow('must be a finite number');
            expect(() => V.number().validate('5')).toThrow('must be a finite number');
            expect(() => V.number().validate(NaN)).toThrow('must be a finite number');
            expect(() => V.number().validate(Infinity)).toThrow('must be a finite number');
        });
    });

    describe('V.number().integer()', () => {
        test('should throw error if value is not an integer', () => {
            expect(V.number().integer().validate(void 0)).toBe(void 0);
            expect(V.number().integer().validate(5)).toBe(5);
            expect(V.number().integer().validate(0)).toBe(0);
            expect(V.number().integer().validate(-5)).toBe(-5);
            expect(() => V.number().integer().validate(0.5)).toThrow('must be an integer');
            expect(() => V.number().integer().validate(1.5)).toThrow('must be an integer');
        });
    });

    describe('V.number().min()', () => {
        test('should throw error if num argument is not a finite number', () => {
            expect(() => V.number().min()).toThrow(/invalid argument/);
            expect(() => V.number().min({})).toThrow(/invalid argument/);
            expect(() => V.number().min('foo')).toThrow(/invalid argument/);
            expect(() => V.number().min(Infinity)).toThrow(/invalid argument/);
            expect(() => V.number().min(NaN)).toThrow(/invalid argument/);
        });

        test('should throw error if value less than the specified value', () => {
            expect(V.number().min(-100).validate(void 0)).toBe(void 0);
            expect(V.number().min(-100).validate(-10)).toBe(-10);
            expect(V.number().min(-100).validate(-100)).toBe(-100);
            expect(V.number().min(0).validate(0)).toBe(0);
            expect(V.number().min(5).validate(5)).toBe(5);
            expect(V.number().min(5).validate(6)).toBe(6);
            expect(() => V.number().min(10).validate(9)).toThrow('must not be less than 10');
            expect(() => V.number().min(5).validate(0)).toThrow('must not be less than 5');
            expect(() => V.number().min(0).validate(-100)).toThrow('must not be less than 0');
        });
    });

    describe('V.number().max()', () => {
        test('should throw error if num argument is not a finite number', () => {
            expect(() => V.number().max()).toThrow(/invalid argument/);
            expect(() => V.number().max({})).toThrow(/invalid argument/);
            expect(() => V.number().max('foo')).toThrow(/invalid argument/);
            expect(() => V.number().max(Infinity)).toThrow(/invalid argument/);
            expect(() => V.number().max(NaN)).toThrow(/invalid argument/);
        });

        test('should throw error if value more than the specified value', () => {
            expect(V.number().max(-10).validate(void 0)).toBe(void 0);
            expect(V.number().max(-10).validate(-100)).toBe(-100);
            expect(V.number().max(-100).validate(-100)).toBe(-100);
            expect(V.number().max(0).validate(0)).toBe(0);
            expect(V.number().max(5).validate(4)).toBe(4);
            expect(V.number().max(5).validate(5)).toBe(5);
            expect(() => V.number().max(10).validate(11)).toThrow('must not be more than 10');
            expect(() => V.number().max(0).validate(10)).toThrow('must not be more than 0');
            expect(() => V.number().max(-100).validate(0)).toThrow('must not be more than -100');
        });
    });

    describe('V.number().less()', () => {
        test('should throw error if num argument is not a finite number', () => {
            expect(() => V.number().less()).toThrow(/invalid argument/);
            expect(() => V.number().less({})).toThrow(/invalid argument/);
            expect(() => V.number().less('foo')).toThrow(/invalid argument/);
            expect(() => V.number().less(Infinity)).toThrow(/invalid argument/);
            expect(() => V.number().less(NaN)).toThrow(/invalid argument/);
        });

        test('should throw error if value less than the specified value', () => {
            expect(V.number().less(-100).validate(void 0)).toBe(void 0);
            expect(V.number().less(-10).validate(-100)).toBe(-100);
            expect(V.number().less(-100).validate(-100.5)).toBe(-100.5);
            expect(V.number().less(0).validate(-10)).toBe(-10);
            expect(V.number().less(5).validate(4)).toBe(4);
            expect(() => V.number().less(10).validate(11)).toThrow('must be less than 10');
            expect(() => V.number().less(0).validate(10)).toThrow('must be less than 0');
            expect(() => V.number().less(-100).validate(0)).toThrow('must be less than -100');
        });
    });

    describe('V.number().greater()', () => {
        test('should throw error if num argument is not a finite number', () => {
            expect(() => V.number().greater()).toThrow(/invalid argument/);
            expect(() => V.number().greater({})).toThrow(/invalid argument/);
            expect(() => V.number().greater('foo')).toThrow(/invalid argument/);
            expect(() => V.number().greater(Infinity)).toThrow(/invalid argument/);
            expect(() => V.number().greater(NaN)).toThrow(/invalid argument/);
        });

        test('should throw error if value less than the specified value', () => {
            expect(V.number().greater(-100).validate(void 0)).toBe(void 0);
            expect(V.number().greater(-100).validate(-10)).toBe(-10);
            expect(V.number().greater(-100).validate(-99.5)).toBe(-99.5);
            expect(V.number().greater(0).validate(1)).toBe(1);
            expect(V.number().greater(5).validate(5.5)).toBe(5.5);
            expect(V.number().greater(5).validate(6)).toBe(6);
            expect(() => V.number().greater(10).validate(9)).toThrow('must be greater than 10');
            expect(() => V.number().greater(5).validate(0)).toThrow('must be greater than 5');
            expect(() => V.number().greater(0).validate(-100)).toThrow('must be greater than 0');
        });
    });
});

describe('object', () => {
    describe('V.object()', () => {
        test('should throw error if value is not an object', () => {
            const obj = {};
            expect(V.object().validate()).toBe(void 0);
            expect(V.object().validate(void 0)).toBe(void 0);
            expect(V.object().validate(obj)).toBe(obj);
            expect(() => V.object().validate(null)).toThrow('must be an object');
            expect(() => V.object().validate([])).toThrow('must be an object');
        });
    });

    describe('V.object().keys()', () => {
        test('should validate using keyed schemas', () => {
            expect(V.object().keys({}).validate(void 0)).toBe(void 0);

            const emptyObj = {};
            expect(V.object().keys({}).validate(emptyObj)).toBe(emptyObj);

            const obj = {
                foo: 'bar',
                num: 500,
                woah: void 0,
            };

            const keys = {
                foo: {
                    validate: jest.fn((val, state) => {
                        expect(state.parent).toEqual({
                            foo: 'bar',
                            num: 500,
                            woah: void 0,
                        });
                        return `${val}-bar`;
                    }),
                },
                num: {
                    validate: jest.fn((val, state) => {
                        expect(state.parent).toEqual({
                            foo: 'bar-bar',
                            num: 500,
                            woah: void 0,
                        });

                        return val + 10;
                    }),
                },
                woah: {
                    validate: jest.fn((v, state) => {
                        expect(state).toEqual({
                            key: 'woah',
                            path: ['woah'],
                            parent: {
                                foo: 'bar-bar',
                                num: 510,
                                woah: void 0,
                            },
                        });
                        return v;
                    }),
                },
            };

            expect(V.object().keys(keys).validate(obj)).toEqual({
                foo: 'bar-bar',
                num: 510,
                woah: void 0,
            });

            expect(keys.foo.validate.mock.calls.length).toBe(1);
            expect(keys.num.validate.mock.calls.length).toBe(1);
            expect(keys.woah.validate.mock.calls.length).toBe(1);

            expect(obj).toEqual({
                foo: 'bar',
                num: 500,
                woah: void 0,
            });

            const passThroughObj = { foo: 'bar' };
            expect(V.object().keys({ foo: { validate: (v) => v } }).validate(passThroughObj)).toBe(passThroughObj);

            expect(() => V.object().keys({ foo: { validate: (v) => v } }).validate({ foo: 1, bar: 2, FOO: 3 }))
                .toThrow('cannot include keys: bar,FOO');

            expect(() => V.object().keys({ foo: { validate: () => { throw new Error('cannot be value'); } } }).validate({ foo: 1 }))
                .toThrow('cannot be value');
        });

        test('should throw error for unknown keys', () => {
            const schema = V.object().keys({
                foo: V.any(),
            });

            expect(() => schema.validate({
                foo: 500,
                bar: 600,
                foobar: 700,
            })).toThrow('cannot include keys: bar,foobar');
        });

        test('should not throw error for unknown keys if "unknown" option is true', () => {
            const schema = V.object().keys({
                foo: V.transform((v) => v + 10),
            }, { unknown: true });

            expect(schema.validate({
                foo: 500,
                bar: 600,
                foobar: 700,
            })).toEqual({
                foo: 510,
                bar: 600,
                foobar: 700,
            });
        });
    });

    describe('V.object().pattern()', () => {
        test('should throw error if pattern is not valid', () => {
            expect(() => V.object().pattern())
                .toThrow(/invalid pattern argument/);

            expect(() => V.object().pattern(null))
                .toThrow(/invalid pattern argument/);

            expect(() => V.object().pattern('foo'))
                .toThrow(/invalid pattern argument/);
        });

        test('should throw error if schema is not a validator', () => {
            expect(() => V.object().pattern(/^(foo|bar)$/))
                .toThrow(/invalid schema argument/);

            expect(() => V.object().pattern(/^(foo|bar)$/, {}))
                .toThrow(/invalid schema argument/);
        });

        test('should apply schema to keys that match pattern (regex)', () => {
            const schema = V.object()
                .pattern(
                    /^(foo|bar)$/,
                    V.transform((v) => v + 10)
                );

            expect(schema.validate(Object.freeze({
                foo: 500,
                bar: 400,
                other: 300,
            }))).toEqual({
                foo: 510,
                bar: 410,
                other: 300,
            });
        });

        test('should apply schema to keys that match pattern (function)', () => {
            const schema = V.object()
                .pattern(
                    (key) => key.match(/^(foo|bar)$/),
                    V.transform((v) => v + 10)
                );

            expect(schema.validate(Object.freeze({
                foo: 500,
                bar: 400,
                other: 300,
            }))).toEqual({
                foo: 510,
                bar: 410,
                other: 300,
            });
        });

        test('should apply schema to keys that match pattern (schema)', () => {
            const schema = V.object()
                .pattern(
                    V.string().allow(['foo', 'bar']),
                    V.transform((v) => v + 10)
                );

            expect(schema.validate(Object.freeze({
                foo: 500,
                bar: 400,
                other: 300,
            }))).toEqual({
                foo: 510,
                bar: 410,
                other: 300,
            });
        });

        test('should skip undefined values', () => {
            const fn = jest.fn(() => true);
            expect(V.object().pattern(fn, V.any()).validate()).toBe(undefined);
            expect(fn.mock.calls.length).toBe(0);
        });

        test('should return same value if no values changed', () => {
            const fn = jest.fn(() => true);
            const expectedObj = Object.freeze({
                foo: 500,
                bar: 600,
            });
            expect(V.object().pattern(fn, V.any()).validate(expectedObj)).toBe(expectedObj);
            expect(fn.mock.calls.length).toBe(2);
        });

        test('should not throw error for unmatched keys', () => {
            const schema = V.object()
                .pattern(/^foo/, V.transform((v) => v + 10));

            expect(schema.validate({
                first: 400,
                foo: 500,
                foobar: 600,
                bar: 700,
            })).toEqual({
                first: 400,
                foo: 510,
                foobar: 610,
                bar: 700,
            });
        });

        test('should prevent further V.object().keys() assertions from thinking matched keys are unknown', () => {
            const schema = V.object()
                .pattern(/^foo/, V.any())
                .keys({
                    first: V.any(),
                });

            expect(() => schema.validate({
                first: 400,
                foo: 500,
                foobar: 600,
                bar: 700,
            })).toThrow('cannot include keys: bar');
        });
    });

    describe('V.object().map()', () => {
        test('should throw error if func is not a function', () => {
            expect(() => V.object().map()).toThrow(/invalid argument/);
            expect(() => V.object().map({})).toThrow(/invalid argument/);
            expect(() => V.object().map([])).toThrow(/invalid argument/);
        });

        test('should return function that maps each key using the provided function', () => {
            const obj = {
                first: 'alpha',
                second: 'beta',
            };

            const func = jest.fn((v, key, obj) => {
                if (key === 'first') {
                    expect(obj).toEqual({
                        first: 'alpha',
                        second: 'beta',
                    });
                }
                else if (key === 'second') {
                    expect(obj).toEqual({
                        first: 'alpha-foo',
                        second: 'beta',
                    });
                }

                return `${v}-foo`;
            });

            expect(V.object().map(func).validate(obj)).toEqual({
                first: 'alpha-foo',
                second: 'beta-foo',
            });

            expect(obj).toEqual({
                first: 'alpha',
                second: 'beta',
            });
        });

        test('should return original value if key values are identical', () => {
            const obj = {
                first: 'foo',
                second: 'bar',
            };
            expect(V.object().map((v) => v).validate(obj)).toBe(obj);
            expect(obj).toEqual({
                first: 'foo',
                second: 'bar',
            });
        });

        test('should return original value if undefined or empty object', () => {
            const func = jest.fn();

            expect(V.object().map(func).validate(undefined)).toBe(undefined);

            const emptyObj = {};
            expect(V.object().map(func).validate(emptyObj)).toBe(emptyObj);
            expect(emptyObj).toEqual({});

            expect(func.mock.calls.length).toBe(0);
        });
    });
});

describe('array', () => {
    describe('V.array()', () => {
        test('should throw an error if the value is not an array', () => {
            const expectedArr = [];
            expect(V.array().validate(void 0)).toBe(void 0);
            expect(V.array().validate(expectedArr)).toBe(expectedArr);
            expect(V.array().validate(['alpha'])).toEqual(['alpha']);
            expect(() => V.array().validate(null)).toThrow('must be an array');
            expect(() => V.array().validate(false)).toThrow('must be an array');
            expect(() => V.array().validate({})).toThrow('must be an array');
            expect(() => V.array().validate('5')).toThrow('must be an array');
            expect(() => V.array().validate(NaN)).toThrow('must be an array');
            expect(() => V.array().validate(Infinity)).toThrow('must be an array');
        });
    });

    describe('V.array().map()', () => {
        test('should throw error if types argument is not a function', () => {
            expect(() => V.array().map()).toThrow(/invalid argument/);
            expect(() => V.array().map({})).toThrow(/invalid argument/);
            expect(() => V.array().map([])).toThrow(/invalid argument/);
        });

        test('should map each item in the array', () => {
            expect(V.array().map(() => 'foo').validate()).toBe(undefined);
            expect(V.array().map(() => 'foo').validate(undefined)).toBe(undefined);
            expect(V.array().map(() => 'foo').validate([])).toEqual([]);

            const expectedObj = { expected: 'obj' };
            const expectedArr = [
                'alpha',
                'beta',
                expectedObj,
            ];

            const func = jest.fn((v) => {
                if (v === 'alpha') {
                    return 'foo';
                }
                else if (v === 'beta') {
                    return 'bar';
                }
                else {
                    return v;
                }
            });

            const ret = V.array().map(func).validate(expectedArr);

            expect(ret).toEqual([
                'foo',
                'bar',
                expectedObj,
            ]);

            expect(func.mock.calls).toEqual([
                ['alpha', 0, expectedArr],
                ['beta', 1, expectedArr],
                [{ expected: 'obj' }, 2, expectedArr],
            ]);

            expect(ret[2]).toBe(expectedObj);
        });
    });

    describe('V.array().items()', () => {
        test('should throw error if types argument is not a non-empty array', () => {
            expect(() => V.array().items()).toThrow(/invalid argument/);
            expect(() => V.array().items({})).toThrow(/invalid argument/);
            expect(() => V.array().items([])).toThrow(/invalid argument/);
        });

        test('should throw error if array has values that do not match types', () => {
            const schemaAError = new Error('Only alpha');
            const schemaA = {
                validate: jest.fn((val) => {
                    if (val === 'alpha') {
                        return 'foo';
                    }
                    else {
                        throw schemaAError;
                    }
                }),
            };

            const schemaBError = new Error('Only beta');
            const schemaB = {
                validate: jest.fn((val) => {
                    if (val === 'beta') {
                        return 'bar';
                    }
                    else {
                        throw schemaBError;
                    }
                }),
            };

            const types = [
                schemaA,
                schemaB,
            ];

            expect(V.array().items(types).validate(undefined)).toEqual(undefined);
            expect(V.array().items(types).validate([])).toEqual([]);

            expect(V.array().items(types).validate([
                void 0,
                'alpha',
                'beta',
            ])).toEqual([
                void 0,
                'foo',
                'bar',
            ]);

            expect(() => V.array().items(types).validate(['foobar']))
                .toThrow('must be one of the valid types');

            const expectedArr = ['a', 'b'];
            const ret = V.array().items([{ validate: (v) => v }]).validate(expectedArr);
            expect(ret).toBe(expectedArr);
            expect(ret).toEqual(['a', 'b']);
        });
    });

    describe('V.array().min()', () => {
        test('should throw error if num argument is not a finite number', () => {
            expect(() => V.array().min()).toThrow(/invalid argument/);
            expect(() => V.array().min({})).toThrow(/invalid argument/);
            expect(() => V.array().min('foo')).toThrow(/invalid argument/);
            expect(() => V.array().min(Infinity)).toThrow(/invalid argument/);
            expect(() => V.array().min(NaN)).toThrow(/invalid argument/);
        });

        test('should throw error if array is more than specified length', () => {
            expect(V.array().min(5).validate(void 0)).toBe(void 0);

            const arr3 = [1, 2, 3];
            expect(V.array().min(1).validate(arr3)).toBe(arr3);

            const arr5 = [1, 2, 3, 4, 5];
            expect(V.array().min(5).validate(arr5)).toBe(arr5);

            expect(() => V.array().min(2).validate([1])).toThrow('must not have less than 2 items');
        });
    });


    describe('V.array().max()', () => {
        test('should throw error if num argument is not a finite number', () => {
            expect(() => V.array().max()).toThrow(/invalid argument/);
            expect(() => V.array().max({})).toThrow(/invalid argument/);
            expect(() => V.array().max('foo')).toThrow(/invalid argument/);
            expect(() => V.array().max(Infinity)).toThrow(/invalid argument/);
            expect(() => V.array().max(NaN)).toThrow(/invalid argument/);
        });

        test('should throw error if array is less than specified length', () => {
            expect(V.array().max(5).validate(void 0)).toBe(void 0);

            const arr3 = [1, 2, 3];
            expect(V.array().max(5).validate(arr3)).toBe(arr3);

            const arr5 = [1, 2, 3, 4, 5];
            expect(V.array().max(5).validate(arr5)).toBe(arr5);

            expect(() => V.array().max(2).validate([1, 2, 3])).toThrow('must not have more than 2 items');
            expect(() => V.array().max(1).validate([1, 2])).toThrow('must not have more than 1 items');
        });
    });
});

//validators\.(\w+)(\(.*?\))(\(.*?\))
//V.string()\.$1$2\.validate$3
