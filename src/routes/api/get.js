// src/routes/api/get.js

/**
 * Get a list of fragments for the current user
 */
const { createSuccessResponse } = require('../../response');
module.exports = (req, res) => {
  // TODO: this is just a placeholder. To get something working, return an empty array...
  const fragments = [];
  res.status(200).json(createSuccessResponse({ fragments }));
}; //{
//status: 'ok',
// TODO: change me
//fragments: [],
//});
//};
