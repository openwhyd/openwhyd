// @ts-check

/**
 * Custom error class to include status codes.
 */
class ErrorWithStatusCode extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   */
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

exports.ErrorWithStatusCode = ErrorWithStatusCode;
