/* eslint no-underscore-dangle: off */

'use strict';

const events = require('events');
const childProcess = require('child_process');
const tailStream = require('fs-tail-stream');
const util = require('util');
const CBuffer = require('CBuffer');
const byline = require('byline');
const commandExistsSync = require('command-exists').sync;

function Tail(path, opts) {
  events.EventEmitter.call(this);

  const options = opts || {
    buffer: 0,
  };
  this._buffer = new CBuffer(options.buffer);

  let stream;

  if (path[0] === '-') {
    stream = process.stdin;
  } else {
    /* Check if this os provides the `tail` command. */
    const hasTailCommand = commandExistsSync('tail');
    if (hasTailCommand) {
      let followOpt = '-F';
      if (process.platform === 'openbsd') {
        followOpt = '-f';
      }

      const cp = childProcess.spawn(
        'tail',
        ['-n', options.buffer, followOpt].concat(path)
      );
      cp.stderr.on('data', (data) => {
        // If there is any important error then display it in the console. Tail will keep running.
        // File can be truncated over network.
        if (data.toString().indexOf('file truncated') === -1) {
          console.error(data.toString());
        }
      });
      stream = cp.stdout;

      process.on('exit', () => {
        cp.kill();
      });
    } else {
      /* This is used if the os does not support the `tail`command. */
      stream = tailStream.createReadStream(path.join(), {
        encoding: 'utf8',
        start: options.buffer,
        tail: true,
      });
    }
  }

  byline(stream, { keepEmptyLines: true }).on('data', (line) => {
    const str = line.toString();
    this._buffer.push(str);
    this.emit('line', str);
  });
}
util.inherits(Tail, events.EventEmitter);

Tail.prototype.getBuffer = function getBuffer() {
  return this._buffer.toArray();
};

module.exports = (path, options) => new Tail(path, options);
