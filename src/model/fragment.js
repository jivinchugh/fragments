// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');
const logger = require('../logger');
const md = require('markdown-it')();
var mime = require('mime-types');
// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

/**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
class Fragment {
  // Constructor for Fragment objects
  constructor({ id = randomUUID(), ownerId, created, updated, type = '', size = 0, }) {
    if (ownerId == null || type == null) {
      logger.error('ownerId and type are required');
      throw new Error('ownerId and type are required');
    }

    if (Fragment.isSupportedType(type)) {
      this.type = type;
    }
    else {
      logger.error(`Unsupported type: ${type}`);
      throw new Error('Unsupported type');
    }

    this.id = id;
    this.ownerId = ownerId;
    this.created = created || new Date().toString();
    this.updated = updated || new Date().toString();
    this.size = size;

    if (typeof this.size !== 'number' || this.size < 0) {
      logger.error('size must be a non-negative number');
      throw new Error('size must be a non-negative number');
    }
    logger.debug(`Fragment created with id=${this.id}, ownerId=${this.ownerId}, type=${this.type}, size=${this.size}`);
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
    logger.info(`Fetching fragments for ownerId=${ownerId}, expand=${expand}`);
    try {
      const fragments = await listFragments(ownerId, expand);
      return fragments;
    } catch (err) {
      logger.error('Error retrieving fragments by user:', err);
      return [];
    }
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    logger.info(`Fetching fragment by id=${id} for ownerId=${ownerId}`);
    try {
      const fragment = await readFragment(ownerId, id);
      logger.debug(`Fragment found with id=${id} for ownerId=${ownerId}`);
      return new Fragment(fragment);
    } catch (error) {
      logger.error('unable to find fragment by that id', error);
      throw new Error('unable to find fragment by that id');
    }
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static delete(ownerId, id) {
    logger.info(`Deleting fragment with id=${id} for ownerId=${ownerId}`);
    deleteFragment(ownerId, id)
      .then(() => {
        logger.debug(`Fragment deleted with id=${id} for ownerId=${ownerId}`);
      })
      .catch((error) => {
        logger.error(`Error deleting fragment with id=${id} for ownerId=${ownerId}: ${error.message}`);
        throw error;
      });
  }

  /**
   * Saves the current fragment to the database
   * @returns Promise<void>
   */
  save() {
    logger.info(`Saving fragment with id=${this.id} for ownerId=${this.ownerId}`);
    this.updated = new Date().toISOString();
    return writeFragment(this)
      .then(() => {
        logger.debug(`Fragment saved successfully with id=${this.id} for ownerId=${this.ownerId}`);
      })
      .catch((error) => {
        logger.error(`Error saving fragment with id=${this.id} for ownerId=${this.ownerId}: ${error.message}`);
        throw error;
      });
  }


  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
    logger.info(`Fetching data for fragment with id=${this.id} for ownerId=${this.ownerId}`);
    return readFragmentData(this.ownerId, this.id)
      .then((data) => {
        logger.debug(`Data retrieved for fragment with id=${this.id} for ownerId=${this.ownerId}`);
        return Buffer.from(data);
      })
      .catch((error) => {
        logger.error(`Error retrieving data for fragment with id=${this.id} for ownerId=${this.ownerId}: ${error.message}`);
        throw new Error('unable to get data');
      });
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {
    if (!data) {
      logger.error('Data cannot be null or undefined');
      throw new Error('Data cannot be null or undefined');
    }

    logger.info(`Setting data for fragment with id=${this.id} for ownerId=${this.ownerId}`);
    this.updated = new Date().toISOString();
    this.size = Buffer.byteLength(data);

    try {
      await writeFragment(this);
      await writeFragmentData(this.ownerId, this.id, data);
      logger.debug(`Data set successfully for fragment with id=${this.id} for ownerId=${this.ownerId}`);
    } catch (error) {
      logger.error(`Error setting data for fragment with id=${this.id} for ownerId=${this.ownerId}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    logger.debug(`Mime type for fragment with id=${this.id}: ${type}`);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    const { type } = contentType.parse(this.type);
    logger.debug(`Fragment with id=${this.id} isText check: ${type.startsWith('text/')}`);
    return type.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    // Retrieves formats for the fragment
    if (this.mimeType === 'text/plain') {
      return ['text/plain'];
    } else if (this.mimeType === 'text/markdown') {
      return ['text/plain', 'text/markdown', 'text/html'];
    } else if (this.mimeType === 'text/html') {
      return ['text/plain', 'text/html'];
    } else if (this.mimeType === 'application/json') {
      return ['text/plain', 'application/json'];
    } else if (this.mimeType === 'text/csv') {
      return ['text/plain', 'text/csv', 'application/json'];
    } else {
      return [];
    }
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    const { type } = contentType.parse(value);
    const SupportedType = ['text/plain',
      'text/plain; charset=utf-8',
      'text/markdown',
      'text/html',
      'text/csv',
      'application/json'];
    const isSupported = SupportedType.includes(type);
    logger.debug(`Content type ${type} is supported: ${isSupported}`);
    return isSupported;
  }

  async convertType(data, ext) {
    let desiredType = mime.lookup(ext) || ext;;
    const availableFormats = this.formats;
    if (!availableFormats.includes(desiredType)) {
      logger.warn('This type can not be converted');
      return { convertedData: null, convertedType: null };
    }
    let convertedData = data;
    if (this.mimeType !== desiredType) {
      if (this.mimeType === 'text/markdown' && desiredType === 'text/html') {
        convertedData = md.render(data.toString());
        convertedData = Buffer.from(convertedData);
      }
    }
    return { convertedData, convertedType: desiredType };
  }
}

module.exports.Fragment = Fragment;
