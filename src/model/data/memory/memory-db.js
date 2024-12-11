const logger = require('../../../../src/logger');
const validateKey = (key) => typeof key === 'string';

class MemoryDB {
  constructor() {
    /** @type {Record<string, any>} */
    this.db = {};
    logger.info('MemoryDB initialized');
  }

  /**
   * Gets a value for the given primaryKey and secondaryKey
   * @param {string} primaryKey
   * @param {string} secondaryKey
   * @returns {Promise<any>}
   */
  get(primaryKey, secondaryKey) {
    logger.debug(`Fetching value for primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`);
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      logger.error(`Invalid keys: primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`);
      throw new Error(
        `primaryKey and secondaryKey strings are required, got primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`
      );
    }

    const db = this.db;
    //logger.debug(`THIS IS DB---------------------, ${JSON.stringify(db)}`)
    const value = db[primaryKey] && db[primaryKey][secondaryKey];
    if (value) {
      logger.info(`Value found for primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`);
    } else {
      logger.warn(`No value found for primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`);
    }
    return Promise.resolve(value);
  }

  /**
   * Puts a value into the given primaryKey and secondaryKey
   * @param {string} primaryKey
   * @param {string} secondaryKey
   * @returns {Promise<void>}
   */
  put(primaryKey, secondaryKey, value) {
    logger.debug(`Putting value for primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`);
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      logger.error(`Invalid keys: primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`);
      throw new Error(
        `primaryKey and secondaryKey strings are required, got primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`
      );
    }

    const db = this.db;
    // Make sure the `primaryKey` exists, or create
    db[primaryKey] = db[primaryKey] || {};
    // Add the `value` to the `secondaryKey`
    db[primaryKey][secondaryKey] = value;
    logger.info(`Value stored for primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`);
    return Promise.resolve();
  }

  /**
   * Queries the list of values (i.e., secondaryKeys) for the given primaryKey.
   * Always returns an Array, even if no items are found.
   * @param {string} primaryKey
   * @returns {Promise<any[]>}
   */
  query(primaryKey) {
    logger.debug(`Querying values for primaryKey=${primaryKey}`);
    if (!validateKey(primaryKey)) {
      logger.error(`Invalid primaryKey: primaryKey=${primaryKey}`);
      throw new Error(`primaryKey string is required, got primaryKey=${primaryKey}`);
    }
    const db = this.db;
    const values = db[primaryKey] ? Object.values(db[primaryKey]) : [];
    logger.info(`Query for primaryKey=${primaryKey} returned ${values.length} values`);
    return Promise.resolve(values);
  }

  /**
   * Deletes the value with the given primaryKey and secondaryKey
   * @param {string} primaryKey
   * @param {string} secondaryKey
   * @returns {Promise<void>}
   */
  async del(primaryKey, secondaryKey) {
    logger.debug(`Deleting value for primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`);
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      logger.error(`Invalid keys: primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`);
      throw new Error(
        `primaryKey and secondaryKey strings are required, got primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`
      );
    }

    // Throw if trying to delete a key that doesn't exist
    const value = await this.get(primaryKey, secondaryKey);
    if (!value) {
      logger.warn(`No value to delete for primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`);
      throw new Error(
        `missing entry for primaryKey=${primaryKey} and secondaryKey=${secondaryKey}`
      );
    }

    const db = this.db;
    delete db[primaryKey][secondaryKey];
    logger.info(`Deleted value for primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`);
    return Promise.resolve();
  }
}

module.exports = MemoryDB;
