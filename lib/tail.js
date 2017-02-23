/* eslint no-underscore-dangle: off */

'use strict';

const EventEmitter = require('events').EventEmitter;
const childProcess = require('child_process');
const util = require('util');
const CBuffer = require('CBuffer');

function Tail(path, opts) {
  EventEmitter.call(this);

  const options = opts || {
    buffer: 0,
  };
  this._buffer = new CBuffer(options.buffer);

  if (path[0] === '-') {
    process.stdin.setEncoding('utf8');

    process.stdin.on('readable', () => {
      const line = process.stdin.read();
      if (line !== null) {
        this.emit('line', line);
      }
    });
  } else {
    const tail = childProcess.spawn('tail', ['-n', options.buffer, '-F'].concat(path));

    tail.stderr.on('data', (data) => {
      // If there is any important error then display it in the console. Tail will keep running.
      // File can be truncated over network.
      if (data.toString().indexOf('file truncated') === -1) {
        console.error(data.toString());
      }
    });

    let backlog = '';
    tail.stdout.on('data', (data) => {
      backlog += data.toString('utf-8');
      let n = backlog.indexOf('\n');
      while (n >= 0) {
        const line = backlog.substring(0, n);
        backlog = backlog.substring(n + 1);
        n = backlog.indexOf('\n');
        this._buffer.push(line);
        this.emit('line', line);
      }
    });

    process.on('exit', () => {
      tail.kill();
    });
  }
}
util.inherits(Tail, EventEmitter);

Tail.prototype.getBuffer = function getBuffer() {
  return this._buffer.toArray();
};

module.exports = (path, options) => new Tail(path, options);
