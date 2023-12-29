## Legacy (pre-Auth0) login flow

- the user arrives on https://openwhyd.org/login
- when the user submits the form with their email and password, that password is turned into a md5 hash, and the whole form is submitted through a HTTP POST request to the `/login` API endpoint
- as defined in [`/config/app.route`](../config/app.route), this endpoint leads to [`app/controllers/api/login.js`](/app/controllers/api/login.js)
- in the case of a successfull login, `renderRedirect()` will indirectly initiate a cookie session, by storing the user id in `request.session`
- the cookie will be created by `express-session` which is attached to the web framework in the `start()` function of [`/app.js`](/app.js) (main entry point of the web app)
- the session is stored in the mongodb database by `connect-mongo`
- the session will be checked in all following HTTP requests received by openwhyd's web app, if they contain the `whydUid` cookie in their headers, thru the `getUid()` or `getUser()` methods added by `logging.js` to `IncomingMessage.prototype`

Notes:

- You can find the documentation of API endpoints in [`API.md`](API.md).
- As mentioned in the API reference documentation, cookies are also used to check the identity of the user on all API endpoints.
