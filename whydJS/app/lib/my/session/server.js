var http = require('http');
var url = require('url');
var formidable = require('formidable');
var sessions = require('./index');

var sessionsProcess = sessions({
  secret: 'Super Secret',
  key: 'customSID'
});

http
  .createServer(function(req, res) {
    sessionsProcess(req, res, function(req, res) {
      switch (req.url) {
        case '/login':
          if (req.session) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('You are already login as ' + req.session.user);
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(
              '<form action="/processForm" method="POST">' +
                'user<input type="text" name="user"><br>' +
                '<input type="submit" value="login">' +
                '</form>'
            );
          }
          break;

        case '/processForm':
          new formidable.IncomingForm().parse(req, function(_, fields) {
            req.session = { user: fields.user };
            res.end('Thank you for login ' + fields.user);
          });
          break;

        case '/logout':
          var session = req.session;
          if (session) {
            delete req.session;
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('You logged out ' + session.user);
          } else {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('You are not logged in');
          }
          break;

        case '/home':
          if (req.session) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('Welcome to your home ' + req.session.user);
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<a href="/login">Login first</a>');
          }
          break;

        default:
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Error 404: unknown page');
      }
    });
  })
  .listen(5000);
