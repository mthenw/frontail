'use strict';

var EventEmitter = require('events').EventEmitter;
var childProcess = require('child_process');
var util = require('util');
var CBuffer = require('CBuffer');

var Tail = function (path, options) {
    EventEmitter.call(this);

    options = options || {buffer: 0};
    this._buffer = new CBuffer(options.buffer);
    var tail;

    if (options.ssh) {
        var args = [
            options.ssh.remoteUser + '@' + options.ssh.remoteHost,
            '-p', options.ssh.remotePort,
            'tail -f'
        ].concat(path);

        tail = childProcess.spawn('ssh', args);
    } else {
        tail = childProcess.spawn('tail', ['-n', options.buffer, '-F'].concat(path));
    }

    tail.stderr.on('data', function (data) {
        //if there is any important errors then display it in the console. Tail will keep running.
        if (data.toString().indexOf('file truncated') === -1) { // File kan be truncated over network.
            console.error(data.toString());
        }
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
