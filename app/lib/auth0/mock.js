// @ts-check

/**
 * Mock implementation of Auth0 authentication for testing purposes.
 * This allows tests to run without requiring real Auth0 credentials.
 */

const userModel = require('../../models/user.js');
const loggingTemplate = require('../../templates/logging.js');

/**
 * Create mock OIDC user from Openwhyd user data
 * @param {object} user - Openwhyd user object
 * @returns {{sub: string, name: string, email: string, picture: string}}
 */
const makeOidcUser = (user) => ({
  sub: `auth0|${user._id || user.id}`,
  name: user.name || user.email.split('@')[0],
  email: user.email,
  picture: user.img || '',
});

/**
 * Mock Auth0Wrapper for testing
 */
class MockAuth0Wrapper {
  constructor(env) {
    this.env = env;
  }

  /**
   * Returns Express.js middleware that mocks Auth0 OIDC authentication.
   * Creates a mock /login endpoint that authenticates users from the database.
   * @param {string} _urlPrefix - URL prefix (unused in mock implementation)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  makeExpressAuthMiddleware(_urlPrefix) {
    // For the mock, we need to integrate with the existing session middleware
    // Return a middleware that adds the oidc interface to requests
    return (req, res, next) => {
      // Initialize mock OIDC context based on session data
      if (!req.oidc) {
        req.oidc = {
          isAuthenticated: () => !!(req.session && req.session.oidcUser),
          get user() {
            return req.session?.oidcUser || null;
          },
          login: async (options = {}) => {
            // This would normally redirect to Auth0
            const returnTo = options.returnTo || '/';
            res.redirect(returnTo);
          },
        };
      }
      next();
    };
  }

  /**
   * Returns Express.js route handler that mocks Auth0's sign up dialog.
   */
  makeSignupRoute({ returnTo }) {
    return (req, res) => {
      res.redirect(returnTo);
    };
  }

  async patchUser(userId, patch) {
    console.debug(`[mock-auth0] patching user ${userId}:`, patch);
    // In mock mode, we don't need to update Auth0
  }

  async sendPasswordChangeRequest(email) {
    console.debug(`[mock-auth0] password change request for ${email}`);
    // In mock mode, we don't need to send emails
  }

  async deleteUser(userId) {
    console.debug(`[mock-auth0] deleting user ${userId}`);
    // In mock mode, we don't need to delete from Auth0
  }
}

/**
 * Get authenticated user from mock OIDC session
 * @param {import('express').Request} request
 * @returns {{sub: string, name: string, email: string, picture: string} | null}
 */
const getAuthenticatedUser = (request) => {
  return request.oidc?.isAuthenticated() ? request.oidc.user : null;
};

/**
 * Map OIDC user to Openwhyd user format
 * @param {{sub: string, name: string, email: string, picture: string}} oidcUser
 * @returns {import('../my-http-wrapper/http/AuthFeatures').OpenwhydUser}
 */
const mapToOpenwhydUser = (oidcUser) => {
  return {
    id: oidcUser.sub.replace('auth0|', ''),
    name: oidcUser.name.split('@')[0],
    email: oidcUser.email,
    img: oidcUser.picture,
  };
};

/**
 * Create mock authentication features for testing
 * @param {typeof process.env} env
 * @returns {import('../my-http-wrapper/http/AuthFeatures').AuthFeatures}
 */
exports.makeMockAuthFeatures = (env) => {
  const auth0 = new MockAuth0Wrapper(env);

  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    injectExpressRoutes(app, _urlPrefix) {
      // Attach mock OIDC middleware - this MUST be attached AFTER session middleware
      // So we defer the middleware attachment and let the mock login routes be defined here
      app.use((req, res, next) => {
        // Initialize mock OIDC context based on session data
        if (!req.oidc) {
          req.oidc = {
            isAuthenticated: () => {
              // Check for OIDC user first, then fall back to legacy whydUid
              return !!(
                req.session &&
                (req.session.oidcUser || req.session.whydUid)
              );
            },
            get user() {
              if (req.session?.oidcUser) {
                return req.session.oidcUser;
              }
              // For legacy sessions that only have whydUid (e.g., from /register),
              // return a minimal user object. The actual user data will be fetched
              // from database when needed.
              if (req.session?.whydUid) {
                return {
                  sub: `auth0|${req.session.whydUid}`,
                  name: '',
                  email: '',
                  picture: '',
                };
              }
              return null;
            },
            login: async (options = {}) => {
              const returnTo = options.returnTo || '/';
              res.redirect(returnTo);
            },
          };
        }
        next();
      });

      // Mock /login route - compatible with both Auth0 and legacy format
      // This handles: GET /login?action=login&email=...&md5=...
      app.get('/login', (req, res) => {
        const { action, email, md5, ajax } = req.query;

        if (action === 'logout') {
          if (req.session) {
            delete req.session.oidcUser;
            delete req.session.whydUid;
          }
          if (ajax) {
            res.json({ ok: 'logged out' });
          } else {
            res.redirect('/');
          }
          return;
        }

        if (action === 'login') {
          if (!email || !md5) {
            res.status(400).json({ error: 'Missing email or password' });
            return;
          }

          // Authenticate against database
          const fetchUser =
            email.indexOf('@') > -1
              ? userModel.fetchByEmail
              : userModel.fetchByHandle;

          fetchUser(email, (dbUser) => {
            if (!dbUser) {
              const error =
                "Are you sure? We don't recognize your email address!";
              if (ajax) {
                res.json({ error });
              } else {
                res.status(401).send(error);
              }
              return;
            }

            if (dbUser.pwd !== md5) {
              const error = 'Your password seems wrong... Try again!';
              if (ajax) {
                res.json({ wrongPassword: 1, error });
              } else {
                res.status(401).send(error);
              }
              return;
            }

            // Create mock OIDC session - req.session exists from session middleware
            req.session.oidcUser = makeOidcUser(dbUser);
            req.session.whydUid = dbUser._id;

            const redirect = req.query.redirect || '/';
            if (ajax) {
              res.json({ redirect });
            } else {
              // Return HTML redirect for non-ajax requests
              res.send(loggingTemplate.htmlRedirect(redirect));
            }
          });
          return;
        }

        // Default behavior - redirect to Auth0 (but in mock, just redirect to home)
        res.redirect('/');
      });

      // POST /login - for form submissions
      app.post('/login', (req, res) => {
        const { action, email, md5, ajax } = req.body;

        if (action === 'logout') {
          if (req.session) {
            delete req.session.oidcUser;
            delete req.session.whydUid;
          }
          if (ajax) {
            res.json({ ok: 'logged out' });
          } else {
            res.redirect('/');
          }
          return;
        }

        if (action === 'login' || (!action && email && md5)) {
          if (!email || !md5) {
            res.status(400).json({ error: 'Missing email or password' });
            return;
          }

          // Authenticate against database
          const fetchUser =
            email.indexOf('@') > -1
              ? userModel.fetchByEmail
              : userModel.fetchByHandle;

          fetchUser(email, (dbUser) => {
            if (!dbUser) {
              const error =
                "Are you sure? We don't recognize your email address!";
              if (ajax) {
                res.json({ error });
              } else {
                res.status(401).send(error);
              }
              return;
            }

            if (dbUser.pwd !== md5) {
              const error = 'Your password seems wrong... Try again!';
              if (ajax) {
                res.json({ wrongPassword: 1, error });
              } else {
                res.status(401).send(error);
              }
              return;
            }

            // Create mock OIDC session - req.session exists from session middleware
            req.session.oidcUser = makeOidcUser(dbUser);
            req.session.whydUid = dbUser._id;

            const redirect = req.body.redirect || '/';
            if (ajax) {
              res.json({ redirect });
            } else {
              // Return HTML redirect for non-ajax requests
              res.send(loggingTemplate.htmlRedirect(redirect));
            }
          });
          return;
        }

        // Default behavior
        res.redirect('/');
      });

      // Mock signup route
      app.get('/signup', auth0.makeSignupRoute({ returnTo: '/register' }));

      // Mock callback route (not used in tests but needed for completeness)
      app.get('/callback', (req, res) => {
        res.redirect('/');
      });

      // Mock logout route
      app.get('/logout', (req, res) => {
        if (req.session) {
          delete req.session.oidcUser;
          delete req.session.whydUid;
        }
        res.redirect('/');
      });
    },

    getAuthenticatedUser(request) {
      const oidcUser = getAuthenticatedUser(request);
      if (oidcUser) {
        return mapToOpenwhydUser(oidcUser);
      }

      // Fallback: check for legacy session (whydUid) set by /register endpoint
      // This allows newly registered users to be logged in even though /register
      // doesn't set up the full OIDC session
      if (request.session?.whydUid) {
        // Create a temporary OIDC user from the legacy session
        // This will be fetched from the database on next request
        return {
          id: request.session.whydUid,
          name: '', // Will be populated from DB on actual use
          email: '',
          img: '',
        };
      }

      // Note: Do NOT delete request.session here for mock Auth0,
      // because we're using express-session middleware which needs the session object
      return null;
    },

    async sendPasswordChangeRequest(email) {
      await auth0.sendPasswordChangeRequest(email);
    },

    async setUserHandle(userId, username) {
      await auth0.patchUser(userId, { username });
    },

    async setUserEmail(userId, email) {
      await auth0.patchUser(userId, { email });
    },

    async setUserProfileName(userId, name) {
      await auth0.patchUser(userId, { name });
    },

    async deleteUser(userId) {
      await auth0.deleteUser(userId);
    },
  };
};

exports.MockAuth0Wrapper = MockAuth0Wrapper;
exports.getAuthenticatedUser = getAuthenticatedUser;
exports.mapToOpenwhydUser = mapToOpenwhydUser;
