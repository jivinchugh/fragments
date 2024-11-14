const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const { user: ownerId } = req;
  const { id } = req.params;

  try {
    logger.info(`Fetching fragment by ID: ${id}`);

    const fragment = await Fragment.byId(ownerId, id);

    if (!fragment) {
      logger.warn(`Fragment not found for ID: ${id}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Get the actual fragment data instead of metadata
    const data = await fragment.getData();

    // Set the proper Content-Type header based on the fragment's type
    res.setHeader('Content-Type', fragment.type);
    // Set the Content-Length header
    res.setHeader('Content-Length', fragment.size);

    // Send the actual fragment data
    res.status(200).send(data);

    logger.info(`Successfully sent fragment data for ID: ${id}`);
  } catch (error) {
    logger.error(`Error fetching fragment with ID ${id}: ${error.message}`, { error });
    res.status(500).json(createErrorResponse(500, 'An error occurred while fetching the fragment'));
  }
};
