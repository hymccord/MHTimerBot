// Access local URIs, like files.
const fs = require('fs');
// Convert callbacks to 'Promise' versions
const util = require('util');
const fs_readFile = util.promisify(fs.readFile);
const fs_writeFile = util.promisify(fs.writeFile);

const Logger = require('./logger');

const file_encoding = 'utf8';

/**
 * Generic Promise-based file read.
 * Returns the data as an object, or the error that occurred when reading and parsing the file.
 * A common error code will be 'ENOENT' (the file did not exist).
 *
 * @param {string} filename the name of a file in the current working directory (or a path and the name)
 *                          from which raw data will be read, and then parsed as JSON.
 * @returns {Promise <any>}  Data from the given file, as an object to be consumed by the caller.
 */
function loadDataFromJSON(filename) {
    return fs_readFile(filename, { encoding: file_encoding })
        .then(data => {
            Logger.log(`I/O: data read from '${filename}'.`);
            return data;
        }).then(rawData => JSON.parse(rawData));
}

/**
 * Generic Promise-based file write.
 * Returns true if the file was written without error.
 * Returns false if an error occurred. Depending on the error, the data may have been written anyway.
 *
 * @param {string} filename the name of a file in the current working directory (or a path and the name)
 *                          to which data will be serialized as JSON.
 * @param {any} rawData raw object data which can be serialized as JSON, via JSON.stringify()
 * @returns {Promise <boolean>} The result of the save request (false negatives possible).
 */
function saveDataAsJSON(filename, rawData) {
    return fs_writeFile(filename, JSON.stringify(rawData, null, 1), { encoding: file_encoding })
        .then(() => {
            Logger.log(`I/O: data written to '${filename}'.`);
            return true;
        }).catch(err => {
            Logger.error(`I/O: error writing to '${filename}':\n`, err);
            return false;
        });
}

exports.loadDataFromJSON = loadDataFromJSON;
exports.saveDataAsJSON = saveDataAsJSON;
