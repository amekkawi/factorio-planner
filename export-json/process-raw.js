'use strict';

const path = require('path');
const fs = require('fs');
const filtering = require('./filtering');
const getSchemaForType = require('./schema');

const icons = new Set();
getRawFileNames()
    .then((fileNames) => fileNames.filter((fileName) => filtering.includeRaw.indexOf(fileName) >= 0))
    .then((fileNames) => {
        console.log('Saving data/index.json');
        return writeFile(
            path.join(__dirname, 'data', 'index.js'),
            `'use strict';\n\n${fileNames.map((fileName) => {
                return `exports[${JSON.stringify(fileName.replace(/\.json$/, ''))}] = require(${JSON.stringify(`./${fileName}`)});`;
            }).join('\n')}\n`
        )
            .then(() => fileNames)
            .catch((err) => {
                console.error(`Failed to save data index: ${err.message}`);
                throw err;
            });
    })
    .then((fileNames) => {
        return (function next() {
            const fileName = fileNames.shift();
            if (fileName) {
                console.log(`Processing "${fileName}"...`);
                return readJsonFile(path.join(__dirname, 'raw/proto', fileName))
                    .then((json) => {
                        return Promise.resolve(json)
                            .then(filterKeys)
                            .then((data) => {
                                for (const id of Object.keys(data)) {
                                    if (data[id].icon) {
                                        icons.add(data[id].icon);
                                    }

                                    if (data[id].icons) {
                                        for (const entry of data[id].icons) {
                                            icons.add(entry.icon);
                                        }
                                    }
                                }

                                return writeFile(
                                    path.join(__dirname, 'data', fileName),
                                    JSON.stringify(data, null, 2)
                                )
                                    .catch((err) => {
                                        console.error(`Failed to write output for "${fileName}": ${err.message}`);
                                        throw err;
                                    })
                            }, (err) => {
                                console.error(`Failed to filter keys for "${fileName}": ${err.message}`);
                                throw err;
                            })
                    }, (err) => {
                        console.error(`Failed to read "${fileName}": ${err.message}`);
                        throw err;
                    })
                    .then(next);
            }
            else {
                return Promise.resolve();
            }
        })();
    })
    .then(() => {
        const langNames = ['en'];
        console.log('Saving lang/index.js');
        return writeFile(
            path.join(__dirname, 'lang', 'index.js'),
            `'use strict';\n\n${langNames.map((langName) => {
                return `exports[${JSON.stringify(langName.replace(/\.json$/, ''))}] = require(${JSON.stringify(`./${langName}.json`)});`;
            }).join('\n')}\n`
        )
            .then(() => langNames)
            .catch((err) => {
                console.error(`Failed to save data index: ${err.message}`);
                throw err;
            });
    })
    .then((langNames) => {
        langNames = langNames.slice(0);
        return (function next() {
            const langName = langNames.shift();
            if (langName) {
                console.log(`Processing "${langName}"...`);
                return readIniFile(path.join(__dirname, 'raw/locale', langName, 'base.cfg'))
                    .then((json) => {
                        return Promise.resolve()
                            .then(() => {
                                // Filter the sections.
                                return Object.keys(json).reduce((ret, key) => {
                                    if (filtering.includeLang.indexOf(key) >= 0) {
                                        ret[key] = json[key];
                                    }
                                    return ret;
                                }, {});
                            })
                            .then((data) => {
                                return writeFile(
                                    path.join(__dirname, 'lang', 'en.json'),
                                    JSON.stringify(data, null, 2)
                                )
                                    .catch((err) => {
                                        console.error(`Failed to write output for "${langName}": ${err.message}`);
                                        throw err;
                                    })
                            }, (err) => {
                                console.error(`Failed to filter sections for "${langName}": ${err.message}`);
                                throw err;
                            })
                    }, (err) => {
                        console.error(`Failed to read "${langName}": ${err.message}`);
                        throw err;
                    })
                    .then(next);
            }
            else {
                return Promise.resolve();
            }
        })();
    })
    .then(() => {
        return PromiseMap(Array.from(icons).sort(), (icon) => {
            const iconPath = `../../icons/${icon.replace(/^__base__\//, '')}`;
            return statFile(path.join(__dirname, `data/${iconPath}`))
                .then((stat) => {
                    return `${stat === null ? '// ' : ''}exports[${JSON.stringify(icon)}] = require(${JSON.stringify(iconPath)});`;
                }, (err) => {
                    console.error(`Failed to stat "${iconPath}": ${err.message}`);
                    throw err;
                });
        })
            .then((lines) => {
                return writeFile(
                    path.join(__dirname, 'data', 'icons.js'),
                    `'use strict';\n\n${lines.join('\n')}\n`
                )
                    .catch((err) => {
                        console.error(`Failed to save icons: ${err.message}`);
                        throw err;
                    });
            });
    })
    .catch((err) => {
        console.error(err.stack);
        process.exit(1);
    });

function getRawFileNames() {
    return new Promise((resolve, reject) => {
        fs.readdir(path.join(__dirname, 'raw/proto'), (err, files) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(files);
            }
        })
    })
        .then((files) => files.filter(isRawFile).sort());
}

function isRawFile(filename) {
    return filename.match(/^.+\.json$/);
}

function readIniFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, { encoding: 'utf8' }, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    })
        .then((data) => {
            const ret = {};
            let section = null;
            for (const line of data.split(/\n/g)) {
                if (line.length) {
                    const match = line.match(/^(?:\[(.+)]|([A-Za-z0-9#_-]+)=(.*))$/);
                    if (match) {
                        if (match[1]) {
                            section = match[1];
                            ret[section] = {};
                        }
                        else if (match[2] && section != null) {
                            // TODO: Handle escaped characters (i.e. "\n")
                            ret[section][match[2]] = match[3];
                        }
                        else {
                            // eslint-disable-next-line no-console
                            console.log('orphan line', match);
                        }
                    }
                    else {
                        // eslint-disable-next-line no-console
                        console.log('not match', JSON.stringify(line));
                    }
                }
            }
            return ret;
        });
}

function readJsonFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, { encoding: 'utf8' }, (err, data) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(data);
            }
        });
    })
        .then((data) => JSON.parse(data));
}

function writeFile(path, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(path, data, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}

function filterKeys(json) {
    return Object.keys(json).reduce((ret, id) => {
        const result = getSchemaForType(json[id].type).validate(json[id]);
        if (result.error) {
            result.error.message = `[${json[id].type}.${id}] ${result.error.message}`;
            throw result.error;
        }
        else {
            ret[id] = result.value;
        }
        return ret;
    }, {});
}

function PromiseMap(values, mapFn) {
    if (!values.length) {
        return Promise.resolve([]);
    }

    values = values.slice(0);
    let nextIndex = 0;
    const ret = [];

    return next();

    function next() {
        if (nextIndex < values.length) {
            const index = nextIndex++;
            const item = values[index];

            return PromiseTry(() => {
                return mapFn(item, index, values);
            })
                .then((result) => {
                    ret[index] = result;
                    return next();
                });
        }
        else {
            return Promise.resolve(ret);
        }
    }
}

function PromiseTry(fn) {
    return new Promise((resolve) => {
        resolve(fn());
    });
}

function statFile(path) {
    return new Promise((resolve, reject) => {
        fs.stat(path, (err, stats) => {
            if (!err) {
                resolve(stats);
            }
            else if (err.code === 'ENOENT') {
                resolve(null);
            }
            else {
                resolve(stats);
            }
        })
    });
}
