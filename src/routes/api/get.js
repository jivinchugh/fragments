const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.info(`Received GET request from user ${req.user}`);
  // checking for expand query in domain
  const expandFlag = req.query['expand'] === '1';
  const { user: ownerId } = req;

  try {
    logger.debug('Attempting to fetch fragments for user:', ownerId);
    // Fetch all fragments for the current user
    const fragments = await Fragment.byUser(ownerId, expandFlag);

    // Log the number of fragments found
    logger.info(`Found ${fragments.length} fragments for user ${ownerId}`);
    // Send the fragments back in the response
    res.status(200).json(
      createSuccessResponse({ fragments: [...fragments] })
    );
    logger.info(`Successfully fetched fragments for user ${ownerId}`);
  } catch (error) {
    logger.error(`Error occurred while fetching fragments for user ${ownerId}: ${error.message}`);
    res.status(500).json(createErrorResponse(500, error.message));
  }
};
