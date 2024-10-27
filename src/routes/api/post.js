const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.info(`Received POST request from user ${req.user}`);

  // Ensure req.body is a Buffer
  const fragData = req.body;
  if (!Buffer.isBuffer(fragData)) {
    logger.warn('Unsupported content format. Expected Buffer.');
    return res.status(415).json(createErrorResponse(415, 'The content format for fragment (supplied by client) is not supported!!'));
  }

  const { user: ownerId } = req;
  const contentType = req.get('Content-Type');

  // Validate the Content-Type for text/* or application/json
  if (!contentType.startsWith('text/') && contentType !== 'application/json') {
    logger.warn(`Unsupported content-type: ${contentType}`);
    return res.status(415).json(createErrorResponse(415, 'Unsupported content-type. Allowed: text/*, application/json'));
  }

  try {
    logger.debug('Attempting to create a new fragment');
    const fragment = new Fragment({ ownerId, type: contentType });
    await fragment.save();
    await fragment.setData(fragData);
    logger.info(`Fragment metadata and data saved. Owner: ${ownerId}, ID: ${fragment.id}, Size: ${fragment.size} bytes`);
    res.set('Content-Type', fragment.type);
    // Construct the Location URL using req.protocol and req.headers.host
    //const APIURL = process.env.API_URL;
    //const locationURL = `${APIURL}/v1/fragments/${fragment.id}`;
    // here the logic ${APIURL} is same as ${req.protocol}://${req.headers.host}
    const locationURL = `${req.protocol}://${req.headers.host}/v1/fragments/${fragment.id}`;
    res.set('Location', locationURL);
    logger.debug(`Location header set: ${locationURL}`);
    res.status(201).location(locationURL).json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          created: fragment.created,
          updated: fragment.updated,
          type: fragment.type,
          size: fragment.size,
        }
      })
    );
    logger.info(`Fragment created successfully for user ${ownerId}, ID: ${fragment.id}`);
  } catch (error) {
    logger.error(`Error occurred while creating fragment for user ${ownerId}: ${error.message}`);
    res.status(500).json(createErrorResponse(500, error.message));
  }
};
