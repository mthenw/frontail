'use strict';

var EventEmitter = require('events').EventEmitter;
var spawn        = require('child_process').spawn;
var util         = require('util');

var Tail = function (path, options) {
    EventEmitter.call(this);

    this.buffer = [];
    this.options = options || {buffer: 0};

    var self = this;
    var tail = spawn('tail', ['-F'].concat(path));
    tail.stdout.on('data', function (data) {

        var lines = data.toString('utf-8');
        lines = lines.split('\n');
        lines.pop();
        lines.forEach(function (line) {
            if (self.options.buffer) {
                if (self.buffer.length === self.options.buffer) {
                    self.buffer.shift();
                }
                self.buffer.push(line);
            }
            self.emit('line', line);
        });
    });

    process.on('exit', function () {
        tail.kill();
    });
};
util.inherits(Tail, EventEmitter);

Tail.prototype.getBuffer = function () {
    return this.buffer;
};

module.exports = function (path, options) {
    return new Tail(path, options);
};