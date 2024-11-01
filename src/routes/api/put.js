// src/routes/api/put.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const { user: ownerId } = req;
  const { id, ext } = req.params;

  try {
    logger.info(`Attempting to update fragment ${id} to extension: ${ext}`);

    // Check if the fragment exists
    const fragment = await Fragment.byId(ownerId, id);
    if (!fragment) {
      logger.warn(`Fragment not found for ID: ${id}`);
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Get the current fragment data
    const currentData = await fragment.getData();

    // Convert the data to the new extension
    const { convertedData, convertedType } = await fragment.convertType(currentData, ext);
    if (!convertedData) {
      logger.warn(`Invalid conversion attempted for fragment ${id} to extension ${ext}`);
      return res.status(415).json(
        createErrorResponse(415, 'Fragment cannot be converted to this type or extension is invalid')
      );
    }

    // Update fragment data, type, and extension
    fragment.setData(convertedData);
    fragment.type = convertedType;
    fragment.extension = ext;

    await fragment.save();

    logger.info(`Successfully updated fragment ${id} to extension ${ext}`);

    // Create a response object with only the necessary properties
    const responseFragment = {
      id: fragment.id,
      ownerId: fragment.ownerId,
      created: fragment.created,
      updated: fragment.updated,
      size: fragment.size,
      type: convertedType,
      extension: ext
    };

    return res.status(200).json(createSuccessResponse({ fragment: responseFragment }));

  } catch (error) {
    logger.error(`Error updating fragment ${id} extension: ${error.message}`, { error });
    return res.status(500).json(
      createErrorResponse(500, 'An error occurred while updating the fragment extension')
    );
  }
};
