const logger = require('../../../../src/logger');
const MemoryDB = require('./memory-db');

// Create two in-memory databases: one for fragment metadata and the other for raw data
const data = new MemoryDB();
const metadata = new MemoryDB();

// Write a fragment's metadata to memory db. Returns a Promise
function writeFragment(fragment) {
  logger.info(`Writing fragment metadata for ownerId=${fragment.ownerId}, id=${fragment.id}`);
  return metadata.put(fragment.ownerId, fragment.id, fragment)
    .then(() => {
      logger.debug(`Fragment metadata written successfully for ownerId=${fragment.ownerId}, id=${fragment.id}`);
    })
    .catch((error) => {
      logger.error(`Error writing fragment metadata for ownerId=${fragment.ownerId}, id=${fragment.id}: ${error.message}`);
      throw error;  // Re-throw to propagate the error
    });
}

// Read a fragment's metadata from memory db. Returns a Promise
function readFragment(ownerId, id) {
  logger.info(`Reading fragment metadata for ownerId=${ownerId}, id=${id}`);
  return metadata.get(ownerId, id)
    .then((fragment) => {
      if (!fragment) {
        logger.warn(`Fragment metadata not found for ownerId=${ownerId}, id=${id}`);
      } else {
        logger.debug(`Fragment metadata found for ownerId=${ownerId}, id=${id}`);
      }
      return fragment;
    })
    .catch((error) => {
      logger.error(`Error reading fragment metadata for ownerId=${ownerId}, id=${id}: ${error.message}`);
      throw error;
    });
}

// Write a fragment's data buffer to memory db. Returns a Promise
function writeFragmentData(ownerId, id, buffer) {
  logger.info(`Writing fragment data for ownerId=${ownerId}, id=${id}`);
  return data.put(ownerId, id, buffer)
    .then(() => {
      logger.debug(`Fragment data written successfully for ownerId=${ownerId}, id=${id}`);
    })
    .catch((error) => {
      logger.error(`Error writing fragment data for ownerId=${ownerId}, id=${id}: ${error.message}`);
      throw error;
    });
}

// Read a fragment's data from memory db. Returns a Promise
function readFragmentData(ownerId, id) {
  logger.info(`Reading fragment data for ownerId=${ownerId}, id=${id}`);
  return data.get(ownerId, id)
    .then((buffer) => {
      if (!buffer) {
        logger.warn(`Fragment data not found for ownerId=${ownerId}, id=${id}`);
      } else {
        logger.debug(`Fragment data found for ownerId=${ownerId}, id=${id}`);
      }
      return buffer;
    })
    .catch((error) => {
      logger.error(`Error reading fragment data for ownerId=${ownerId}, id=${id}: ${error.message}`);
      throw error;
    });
}

// Get a list of fragment ids/objects for the given user from memory db. Returns a Promise
async function listFragments(ownerId, expand = false) {
  logger.info(`Listing fragments for ownerId=${ownerId}, expand=${expand}`);
  try {
    const fragments = await metadata.query(ownerId);
    if (!fragments || fragments.length === 0) {
      logger.warn(`No fragments found for ownerId=${ownerId}`);
      return [];
    }

    if (expand) {
      logger.debug(`Returning expanded fragment objects for ownerId=${ownerId}`);
      return fragments;
    }

    logger.debug(`Returning fragment ids for ownerId=${ownerId}`);
    return fragments.map((fragment) => fragment.id);
  } catch (error) {
    logger.error(`Error listing fragments for ownerId=${ownerId}: ${error.message}`);
    throw error;
  }
}

// Delete a fragment's metadata and data from memory db. Returns a Promise
function deleteFragment(ownerId, id) {
  logger.info(`Deleting fragment for ownerId=${ownerId}, id=${id}`);
  return Promise.all([
    // Delete metadata
    metadata.del(ownerId, id)
      .then(() => {
        logger.debug(`Fragment metadata deleted for ownerId=${ownerId}, id=${id}`);
      })
      .catch((error) => {
        logger.error(`Error deleting fragment metadata for ownerId=${ownerId}, id=${id}: ${error.message}`);
        throw error;
      }),

    // Delete data
    data.del(ownerId, id)
      .then(() => {
        logger.debug(`Fragment data deleted for ownerId=${ownerId}, id=${id}`);
      })
      .catch((error) => {
        logger.error(`Error deleting fragment data for ownerId=${ownerId}, id=${id}: ${error.message}`);
        throw error;
      }),
  ])
    .then(() => {
      logger.info(`Fragment successfully deleted for ownerId=${ownerId}, id=${id}`);
    })
    .catch((error) => {
      logger.error(`Error deleting fragment for ownerId=${ownerId}, id=${id}: ${error.message}`);
      throw error;
    });
}

module.exports.listFragments = listFragments;
module.exports.writeFragment = writeFragment;
module.exports.readFragment = readFragment;
module.exports.writeFragmentData = writeFragmentData;
module.exports.readFragmentData = readFragmentData;
module.exports.deleteFragment = deleteFragment;
