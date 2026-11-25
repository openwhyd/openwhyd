//@ts-check

const errorTemplate = require('../templates/error.js');
const auth0 = require('../lib/auth0');
const userModel = require('../models/user.js');
const config = require('../models/config.js');
const loggingTemplate = require('../templates/logging.js');

const { useAuth0AsIdentityProvider } = process.appParams;

/**
 * Returns the logged in user's uid
 * @param {import('http').IncomingMessage} request
 * @returns {string | undefined}
 */
function getUid(request) {
  if (useAuth0AsIdentityProvider) {
    // For Auth0, we need to handle the type mismatch differently
    try {
      const userId = auth0.getAuthenticatedUserId(/** @type {any} */ (request));
      request.session = request.session || {};
      request.session.whydUid = userId;
      return userId;
    } catch (error) {
      console.warn('Auth0 authentication error:', error);
      return undefined;
    }
  }
  return (request.session || {}).whydUid;
}

/**
 * Returns the logged in user as an object {_id, id, name, img}
 * @param {import('http').IncomingMessage} request
 * @returns {Promise<{ _id: string | number, id: string, name: string, email?: string, img?: string, isAdmin?: boolean } | null>}
 */
async function getUser(request) {
  const uid = getUid(request);
  if (!uid) return null;
  const user = await userModel.fetchAndProcessUserById(uid);
  if (!user) console.trace(`logged user ${uid} not found in database`);
  if (!user) return null;

  // Transform the user object to match expected type
  return {
    _id: String(user._id),
    id: String(user._id),
    name: user.name,
    email: user.email,
    img: user.img,
  };
}

/**
 * Checks that a registered user is logged in, and return that user, or show an error page
 * @param {import('http').IncomingMessage} request
 * @param {import('http').ServerResponse} [response]
 * @param {'json' | string} [format]
 * @returns {Promise<false | { id: string, name: string, email?: string, img?: string, isAdmin?: boolean }>}
 */
async function checkLogin(request, response, format) {
  const user = await getUser(request);
  if (!user) {
    if (response) {
      if (format && format.toLowerCase() == 'json')
        errorTemplate.renderErrorResponse(
          { errorCode: 'REQ_LOGIN' },
          response,
          'json',
        );
      else response.renderHTML(loggingTemplate.renderUnauthorizedPage());
    }
    return false;
  }
  return user;
}

/**
 * @param {{ email?: string }} user
 * @returns {boolean}
 */
function isUserAdmin(user) {
  return user.email && config.adminEmails[user.email];
}

/**
 * @param {import('http').IncomingMessage} request
 * @returns {Promise<boolean>}
 */
async function isAdmin(request) {
  const user = await getUser(request);
  return user ? isUserAdmin(user) : false;
}

/**
 * @param {import('http').IncomingMessage} request
 * @param {import('http').ServerResponse} [response]
 * @param {'json' | string} [format]
 * @returns {Promise<false | { id: string, name: string, email?: string, img?: string, isAdmin?: boolean }>}
 */
async function checkAdmin(request, response, format) {
  const user = await checkLogin(request, response, format);
  if (!user) return false;
  else if (!isUserAdmin(user)) {
    console.log('access restricted, user is not an admin: ', user.id);
    response && response.legacyRender('nice try! ;-)');
    return false;
  }
  return user;
}

/**
 * Middleware that adds authentication methods to request object
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {() => void} next
 */
function authMiddleware(req, res, next) {
  // Add authentication methods to request object
  req.getUid = () => getUid(req);
  req.getUser = () => getUser(req);
  req.checkLogin = (response, format) => checkLogin(req, response, format);
  req.isUserAdmin = isUserAdmin;
  req.isAdmin = () => isAdmin(req);
  req.checkAdmin = (response, format) => checkAdmin(req, response, format);

  next();
}

module.exports = {
  authMiddleware,
  getUid,
  getUser,
  checkLogin,
  isUserAdmin,
  isAdmin,
  checkAdmin,
};
