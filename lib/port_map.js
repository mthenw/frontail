'use strict';

var net = require('net');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var PortMap = function (portNumber) {
  EventEmitter.call(this);

  var that = this;
  net.createServer(function(sock) {
    sock.on('data', function(data) {
      var lines = data.toString('utf-8').split('\n');
      lines.pop();
      lines.forEach(function (line) {
        that.emit('line', line);
      });
    });
  }).listen(portNumber);
};
util.inherits(PortMap, EventEmitter);

PortMap.prototype.getBuffer = function () {
  return ['Port mapping started'];
};

module.exports = function (path, options) {
  return new PortMap(path, options);
};
