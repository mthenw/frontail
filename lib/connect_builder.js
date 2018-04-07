'use strict';

const connect = require('connect');
const fs = require('fs');

function ConnectBuilder(urlPath) {
  this.app = connect();
  this.urlPath = urlPath;
}

ConnectBuilder.prototype.authorize = function authorize(user, pass) {
  this.app.use(
    this.urlPath,
    connect.basicAuth(
      (incomingUser, incomingPass) => user === incomingUser && pass === incomingPass
    )
  );

  return this;
};

ConnectBuilder.prototype.build = function build() {
  return this.app;
};

ConnectBuilder.prototype.index = function index(path, files, filesNamespace, themeOpt) {
  const theme = themeOpt || 'default';

  this.app.use(this.urlPath, (req, res) => {
    fs.readFile(path, (err, data) => {
      res.writeHead(200, {
        'Content-Type': 'text/html',
      });
      res.end(
        data
          .toString('utf-8')
          .replace(/__TITLE__/g, files)
          .replace(/__THEME__/g, theme)
          .replace(/__NAMESPACE__/g, filesNamespace)
          .replace(/__PATH__/g, this.urlPath),
        'utf-8'
      );
    });
  });

  return this;
};

ConnectBuilder.prototype.session = function session(secret, key) {
  this.app.use(this.urlPath, connect.cookieParser());
  this.app.use(
    this.urlPath,
    connect.session({
      secret,
      key,
    })
  );
  return this;
};

ConnectBuilder.prototype.static = function staticf(path) {
  this.app.use(this.urlPath, connect.static(path));
  return this;
};

module.exports = urlPath => new ConnectBuilder(urlPath);
