// eslint-disable
var version = process.version.match(/^v(\d+)\.(\d+)/);
var versionMajor = version && parseInt(version[1], 10);
var versionMinor = version && parseInt(version[2], 10);
if (!versionMajor || versionMajor < 6 || versionMajor === 6 && versionMinor < 11) {
    console.error('Required node version >=6.11 not satisfied with current version ' + process.version + '.');
    process.exit(1);
}
