var connect = require('connect');

(function() {
    'use strict';

    var ConnectBuilder = function () {
        this.app = connect();
    };

    ConnectBuilder.prototype.authorize = function (user, pass) {
        this.app.use(connect.basicAuth(function (incomingUser, incomingPass) {
            return user === incomingUser && pass === incomingPass;
        }));

        return this;
    };

    ConnectBuilder.prototype.build = function () {
        return this.app;
    };

    ConnectBuilder.prototype.session = function (secret, key) {
        this.app.use(connect.cookieParser())
        this.app.use(connect.session({secret: secret, key: key}))
        return this;
    };

    ConnectBuilder.prototype.static = function (path) {
        this.app.use(connect.static(path));
        return this;
    }

    module.exports = function () {
        return new ConnectBuilder();
    }
})();