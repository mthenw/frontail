'use strict';

var EventEmitter = require('events').EventEmitter;
var spawn = require('child_process').spawn;
var util = require('util');
var CBuffer = require('CBuffer');

var Tail = function (path, options) {
    EventEmitter.call(this);

    options = options || {buffer: 0};
    this._buffer = new CBuffer(options.buffer);
    var tail;

    if (options && options.sshOptions && options.sshOptions.remoteHost) {
        var args = [options.sshOptions.remoteUser + '@' + options.sshOptions.remoteHost, '-p',
            options.sshOptions.remotePort, 'tail -f ' + path];
        tail = spawn('ssh', args);
    } else {
        tail = spawn('tail', ['-n', options.buffer, '-F', path]);
    }

    tail.stderr.on('data', function (data) {
        //if there is any error then display it in the console and then kill the tail.
        console.error(data.toString());
        process.exit();
    });

    tail.stdout.on('data', function (data) {
        var lines = data.toString('utf-8').split('\n');
        lines.pop();
        lines.forEach(function (line) {
            this._buffer.push(line);
            this.emit('line', line);
        }.bind(this));
    }.bind(this));

    process.on('exit', function () {
        tail.kill();
    });
};
util.inherits(Tail, EventEmitter);

Tail.prototype.getBuffer = function () {
    return this._buffer.toArray();
};

module.exports = function (path, options) {
    return new Tail(path, options);
};
