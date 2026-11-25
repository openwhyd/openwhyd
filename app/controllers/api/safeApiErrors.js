// @ts-check

/**
 * Helpers to make sure that API responses never disclose technical details
 * about errors (e.g. file paths, database errors, exception messages).
 * Unexpected errors are replaced by a generic message, and logged with details.
 */

const GENERIC_ERROR = 'An unexpected error occurred. Please try again.';
exports.GENERIC_ERROR = GENERIC_ERROR;

const MAX_LOGGED_LENGTH = 1000;

/** @param {unknown} error */
function describeError(error) {
  if (error instanceof Error) {
    const { code } = /** @type {any} */ (error);
    return `${error.name}: ${error.message}${code ? ` (code: ${code})` : ''}`;
  }
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * @param {unknown} error
 * @param {Array<string | RegExp>} userFacingErrors
 * @returns {boolean} true if `error` is a message intended to be displayed to the user
 */
function isUserFacingError(error, userFacingErrors) {
  return (
    typeof error === 'string' &&
    userFacingErrors.some((allowed) =>
      typeof allowed === 'string' ? error === allowed : allowed.test(error),
    )
  );
}

/**
 * Returns an API response that is safe to send to the client:
 * - responses without error are returned as-is;
 * - user-facing error messages (listed in `userFacingErrors`) are returned
 *   without any other field;
 * - any other error is logged to stderr, and replaced by a generic message.
 * @template T
 * @param {string} context - to identify the source of the error in logs, e.g. "api.user"
 * @param {T} result - response to be sent to the client
 * @param {Array<string | RegExp>} userFacingErrors - error messages that can be sent to the client
 * @returns {T | { error: string }}
 */
exports.sanitizeApiResponse = function (context, result, userFacingErrors) {
  if (!result || typeof result !== 'object' || !('error' in result))
    return result;
  const { error } = /** @type {{ error: unknown }} */ (result);
  if (error === undefined || error === null || error === '') return result;
  if (isUserFacingError(error, userFacingErrors))
    return { error: /** @type {string} */ (error) };
  console.error(
    `[${context}] ERROR: ${describeError(error)
      .replace(/\s+/g, ' ')
      .slice(0, MAX_LOGGED_LENGTH)}`,
  );
  return { error: GENERIC_ERROR };
};
