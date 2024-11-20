const s3Client = require('./s3Client');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../../../../src/logger');
// temporary use of memory-db until we add DynamoDB
const MemoryDB = require('../memory/memory-db');

// Create an in-memory database for metadata temporarily
const metadata = new MemoryDB();

// Writes a fragment's metadata to memory db (we'll keep this the same for now)
function writeFragment(fragment) {
  logger.info(`Writing fragment metadata for ownerId=${fragment.ownerId}, id=${fragment.id}`);
  return metadata.put(fragment.ownerId, fragment.id, fragment)
    .then(() => {
      logger.debug(`Fragment metadata written successfully for ownerId=${fragment.ownerId}, id=${fragment.id}`);
    })
    .catch((error) => {
      logger.error(`Error writing fragment metadata for ownerId=${fragment.ownerId}, id=${fragment.id}: ${error.message}`);
      throw error;
    });
}

// Read a fragment's metadata from memory db
async function readFragment(ownerId, id) {
  try {
    const fragment = await metadata.get(ownerId, id);

    if (!fragment) {
      logger.warn(`No fragment found for ownerId=${ownerId}, id=${id}`);
    }

    return fragment;
  } catch (err) {
    logger.warn({ err, ownerId, id }, 'Error reading fragment from memory DB');
    throw err;
  }
}



// Writes a fragment's data to an S3 Object in a Bucket
// https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#upload-an-existing-object-to-an-amazon-s3-bucket
async function writeFragmentData(ownerId, id, data) {
  // Create the PUT API s3Params from our details
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
    Body: data,
  };
  logger.info(`Writing fragment data for ownerId=${ownerId}, id=${id}`);
  logger.info(`params: ${JSON.stringify(s3Params)}`);

  // Create a PUT Object command to send to S3
  const command = new PutObjectCommand(s3Params);

  try {
    // Use our client to send the command
    await s3Client.send(command);
    logger.debug(`Fragment data written successfully for ownerId=${ownerId}, id=${id}`);
  } catch (err) {
    // If anything goes wrong, log enough info that we can debug
    const { Bucket, Key } = s3Params;
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3');
    throw new Error('unable to upload fragment data');
  }
}


// Convert a stream of data into a Buffer, by collecting
// chunks of data until finished, then assembling them together.
// We wrap the whole thing in a Promise so it's easier to consume.
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    // As the data streams in, we'll collect it into an array.
    const chunks = [];
    // Streams have events that we can listen for and run
    // code.  We need to know when new `data` is available,
    // if there's an `error`, and when we're at the `end`
    // of the stream.

    // When there's data, add the chunk to our chunks list
    stream.on('data', (chunk) => chunks.push(chunk));
    // When there's an error, reject the Promise
    stream.on('error', reject);
    // When the stream is done, resolve with a new Buffer of our chunks
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });


// Reads a fragment's data from S3 and returns (Promise<Buffer>)
// https://github.com/awsdocs/aws-sdk-for-javascript-v3/blob/main/doc_source/s3-example-creating-buckets.md#getting-a-file-from-an-amazon-s3-bucket
async function readFragmentData(ownerId, id) {
  // Create the PUT API s3Params from our details
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    // Our key will be a mix of the ownerID and fragment id, written as a path
    Key: `${ownerId}/${id}`,
  };

  // Create a GET Object command to send to S3
  const command = new GetObjectCommand(s3Params);

  try {
    // Get the object from the Amazon S3 bucket. It is returned as a ReadableStream.
    const data = await s3Client.send(command);
    // Convert the ReadableStream to a Buffer
    return streamToBuffer(data.Body);
  } catch (err) {
    const { Bucket, Key } = s3Params;
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3');
    throw new Error('unable to read fragment data');
  }
}

// List fragments for a given user
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

// Delete a fragment's metadata and data from S3
async function deleteFragment(ownerId, id) {
  logger.info(`Deleting fragment for ownerId=${ownerId}, id=${id}`);

  // S3 object deletion parameters
  const s3Params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  };

  try {
    // Delete S3 object
    const deleteCommand = new DeleteObjectCommand(s3Params);
    await s3Client.send(deleteCommand);
    logger.debug(`Fragment data deleted from S3 for ownerId=${ownerId}, id=${id}`);
    console.log('hey im hreeeeeeeeeeeeer!')
    // Delete metadata from memory db
    await metadata.del(ownerId, id);
    logger.debug(`Fragment metadata deleted for ownerId=${ownerId}, id=${id}`);

    logger.info(`Fragment successfully deleted for ownerId=${ownerId}, id=${id}`);
  } catch (error) {
    logger.error(`Error deleting fragment for ownerId=${ownerId}, id=${id}: ${error.message}`);
    throw new Error('unable to delete fragment data/metadata');
  }
}

module.exports.listFragments = listFragments;
module.exports.writeFragment = writeFragment;
module.exports.readFragment = readFragment;
module.exports.writeFragmentData = writeFragmentData;
module.exports.readFragmentData = readFragmentData;
module.exports.deleteFragment = deleteFragment;
