/**
 * facebookLogin controller
 * checks if a facebook connect action leads to an existing user (=> login)
 * @author adrienjoly, whyd
 */

const facebookModel = require('../../models/facebook.js');
const userModel = require('../../models/user.js');
const loggingCtr = require('../../controllers/api/login.js');

// testing "link" action:
// $ curl --cookie "whydSid=rFfJv52ZkDe5CGViKR16PgXasUZuW8YWgYjsWj76iLGcDwA35kCXTtod2Q+X3Uhsg" http://localhost:8080/api/user
// $ curl --data "action=link&fbUid=510739408&fbAccessToken=CAABrVGSZBH1gBAO774iaYNoCB9SI6HCZCYTZAgumdn6MNING1iqGwwZB3ZBPkZCTJVjBqwaomXCBH0ZBe9ZAf89xSHVKAmehHgL5jjPLjjjZB44ocdlajBzpZCtMrmSA2nDXqePCuBmgO1T34lWBEJxMKyu2Oe863BULqzmOA0MbDSxt2JpHaU1VEG6bac7yBsBaQZD" --cookie "whydSid=rFfJv52ZkDe5CGViKR16PgXasUZuW8YWgYjsWj76iLGcDwA35kCXTtod2Q+X3Uhsg" http://localhost:8080/facebookLogin

exports.handleRequest = async function (request, reqParams, response) {
  request.logToConsole('facebookLogin.handleRequest', reqParams);

  function renderJSON(json) {
    response[reqParams.ajax == 'iframe' ? 'renderWrappedJSON' : 'renderJSON'](
      json,
    );
  }

  function renderError(msg, more) {
    console.error(msg, more);
    renderJSON({ result: msg });
  }

  if (!reqParams || !reqParams.fbAccessToken || !reqParams.fbUid)
    return renderError('invalid facebook login request');

  const fbCookieUid = request.getFbUid();
  if (fbCookieUid) {
    console.log('facebook cookie uid:', fbCookieUid);
    if (!reqParams.fbUid || fbCookieUid != reqParams.fbUid)
      return renderError('invalid facebook cookie');
  }

  // check validity of the token by making a graph api request
  facebookModel.fetchMe(reqParams.fbAccessToken, async function (fbUser) {
    const loggedUser = await request.getUser();
    console.log('fb session returned user id', (fbUser || {}).id);
    if (!fbUser || fbUser.id != reqParams.fbUid)
      renderError('facebook session token does not match user id', fbUser);
    else if (reqParams.action && reqParams.action == 'link' && loggedUser) {
      console.log('storing fb id and accesstoken (fbTok) for current user...');
      userModel.setFbId(
        loggedUser.id,
        reqParams.fbUid,
        function (res) {
          renderJSON(res);
        },
        reqParams.fbAccessToken,
      );
    } else {
      // actual facebook login
      userModel.fetchByFbUid(reqParams.fbUid, function (dbUser) {
        if (dbUser) {
          const result =
            'ok, user id=' +
            reqParams.fbUid +
            ' found in db as: ' +
            dbUser.name;
          console.log(result);
          //var redirect = "/"
          dbUser.fbUid = reqParams.fbUid;
          dbUser.fbTok = reqParams.fbAccessToken;
          dbUser.ajax = reqParams.ajax || true; // => to prevent redirect to login page
          dbUser.action = 'login';
          dbUser.includeUser = reqParams.includeUser;

          // delegate to classical login handler
          loggingCtr.handleRequest(
            request,
            dbUser,
            response,
            /*ignorePassword:*/ true,
          );
        } else {
          // user not found => new user or legacy user (not yet connected to fb)
          const result = 'nok, user id=' + reqParams.fbUid + ' not found in db';
          console.log(result);
          renderJSON({ result, fbUser });
        }
      });
    }
  });
};

exports.controller = async function (request, getParams, response) {
  if (request.method.toLowerCase() === 'post')
    await exports.handleRequest(request, request.body, response);
  else await exports.handleRequest(request, getParams, response);
};
