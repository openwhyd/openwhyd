//@ts-check

const { authMiddleware } = require('./auth.js');
const { loggingMiddleware } = require('./logging.js');
const { responseMiddleware } = require('./response.js');

/**
 * Combined middleware that adds all Openwhyd request/response extensions
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {() => void} next
 */
function openwhydMiddleware(req, res, next) {
  // Apply all middleware in sequence
  authMiddleware(req, res, () => {
    loggingMiddleware(req, res, () => {
      responseMiddleware(req, res, next);
    });
  });
}

module.exports = {
  openwhydMiddleware,
  authMiddleware,
  loggingMiddleware,
  responseMiddleware,
};
