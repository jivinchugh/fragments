const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.info(`Received POST request from user ${req.user}`);
  const { user: ownerId } = req;
  const contentType = req.get('Content-Type');

  // Check if the Content-Type is supported
  if (!Fragment.isSupportedType(contentType)) {
    logger.warn(`Unsupported media type: ${contentType}`);
    return res.status(415).json(createErrorResponse(415, 'The content format for fragment (supplied by client) is not supported!!'));
  }

  try {
    // Handle different content types
    let fragData;
    if (contentType.startsWith('image/')) {
      fragData = Buffer.from(req.body);
    } else {
      // For text-based content types
      fragData = contentType === 'text/plain' ||
        contentType === 'text/plain; charset=utf-8' ||
        contentType === 'text/markdown' ||
        contentType === 'text/markdown; charset=utf-8' ||
        contentType === 'text/html' ||
        contentType === 'text/csv'
        ? req.body
        : JSON.stringify(req.body);
    }

    logger.debug('Attempting to create a new fragment');
    const fragment = new Fragment({ ownerId, type: contentType });
    await fragment.save();

    // Ensure fragData is a Buffer for all content types
    const dataBuffer = Buffer.isBuffer(fragData)
      ? fragData
      : Buffer.from(fragData);
    await fragment.setData(dataBuffer);

    logger.info(`Fragment metadata and data saved. Owner: ${ownerId}, ID: ${fragment.id}, Size: ${fragment.size} bytes`);

    const locationURL = `${req.protocol}://${req.headers.host}/v1/fragments/${fragment.id}`;
    res.set('Location', locationURL);

    res.status(201).location(locationURL).json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
        },
      })
    );
    logger.info(`Fragment created successfully for user ${ownerId}, ID: ${fragment.id}`);
  } catch (error) {
    logger.error(`Error occurred while creating fragment for user ${ownerId}: ${error.message}`);
    res.status(500).json(createErrorResponse(500, error.message));
  }
};
