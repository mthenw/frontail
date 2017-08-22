/* eslint no-underscore-dangle: off */

'use strict';

const EventEmitter = require('events').EventEmitter;
const childProcess = require('child_process');
const util = require('util');
const CBuffer = require('CBuffer');
const byline = require('byline');

function Tail(path, opts) {
  EventEmitter.call(this);

  const options = opts || {
    buffer: 0,
  };
  this._buffer = new CBuffer(options.buffer);

  if (path[0] === '-') {
    byline(process.stdin).on('data', (line) => {
      const str = line.toString();
      this._buffer.push(str);
      this.emit('line', str);
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

    byline(tail.stdout).on('data', (line) => {
      const str = line.toString();
      this._buffer.push(str);
      this.emit('line', str);
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
