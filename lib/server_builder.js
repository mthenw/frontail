'use strict';

var fs = require('fs');
var http = require('http');
var https = require('https');

var ServerBuilder = function () {
    this._host = null;
    this._port = 9001;
};

ServerBuilder.prototype.build = function () {
    if (this._key && this._cert) {
        var options = {
            key: this._key,
            cert: this._cert
        };
        return https.createServer(options, this._callback).listen(this._port, this._host);
    } else {
        return http.createServer(this._callback).listen(this._port, this._host);
    }
};

ServerBuilder.prototype.host = function (host) {
    this._host = host;
    return this;
};

ServerBuilder.prototype.port = function (port) {
    this._port = port;
    return this;
};

ServerBuilder.prototype.secure = function (keyPath, certPath) {
    try {
        this._key = fs.readFileSync(keyPath);
        this._cert = fs.readFileSync(certPath);
    } catch (e) {
        throw new Error('No key or certificate file found');
    }

    return this;
};

ServerBuilder.prototype.use = function (callback) {
    this._callback = callback;
    return this;
};

module.exports = function () {
    return new ServerBuilder();
};
