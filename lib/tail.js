/* eslint no-underscore-dangle: off */

'use strict';

const events = require('events');
const fs = require('fs');
const TailLib = require('tail').Tail;
const readLastLines = require('read-last-lines');
const util = require('util');
const CBuffer = require('CBuffer');
const byline = require('byline');

const NB_OF_LINE_TO_PREFETCH = 50;
const TAIL_RETRY_DELAY = 2000;
const NEW_LINE_REGEX = /[\r]{0,1}\n/;
const IS_WIN = process.platform === 'win32';

function getLinePrefix(filePath, filePaths) {
  const oneFileIsTailed = filePaths.length <= 1;
  if (oneFileIsTailed) {
    return '';
  }
  const paddingLength = Math.max(...filePaths.map((fileName) => fileName.length));
  return `${filePath.padStart(paddingLength, ' ')} - `;
}

const fileLogger = (fileName) => ({
  info: (...data) => {
    console.info(fileName, ':', ...data);
  },
  error: (...data) => {
    console.error(fileName, ':', ...data);
  }
});

async function readLastLinesIfPossible(path, onLineCb) {
  try {
    await fs.promises.access(path, fs.constants.R_OK);
  } catch (ex) {
    // The file can not be read
    return;
  }

  try {
    const lines = await readLastLines.read(path, NB_OF_LINE_TO_PREFETCH)
    const linesWithoutLastEmptyLine = lines.replace(/[\r]{0,1}\n$/gm, '');
    if (linesWithoutLastEmptyLine === '') {
      return;
    }
    linesWithoutLastEmptyLine.split(NEW_LINE_REGEX).forEach(onLineCb);
  } catch (ex) {
    fileLogger(path).error('Failed to prefetch the file content:', ex);
  }
}

async function tailFile(path, onLineCb) {
  const logger = fileLogger(path);
  let tail;

  function rescheduleTail() {
    // Close the current tail
    if (tail) {
      try {
        tail.unwatch();
      } catch (ex) {
        // Failed to shutdown the previous tail, ignore this since we try to stop it
      }
    }
    setTimeout(() => tailFile(path, onLineCb), TAIL_RETRY_DELAY);
  }

  // Test that the file exists
  try {
    await fs.promises.access(path, fs.constants.R_OK);
  } catch (ex) {
    logger.error(`tail failure - ${ex}`);
    rescheduleTail();
    return;
  }

  try {
    logger.info('starting to watch the file');
    tail = new TailLib(path, {
      useWatchFile: IS_WIN // Use watchfile on windows as a workaround to this issue: https://docs.microsoft.com/en-us/archive/blogs/asiasupp/file-date-modified-property-are-not-updating-while-modifying-a-file-without-closing-it
    });
  } catch (ex) {
    logger.error(`tail failure - ${ex}`);
    rescheduleTail();
    return;
  }

  tail.on('line', onLineCb);
  tail.on('error', (err) => {
    logger.error('tail failure -', err);
    rescheduleTail();
  });
}

function Tail(path, opts) {
  events.EventEmitter.call(this);
  const pathArray = Array.isArray(path) ? path : [path]; // Normalize the parameter

  const pushLineToBuffer = (prefix) =>
    (line) => {
      const str = `${prefix}${line.toString()}`;
      this._buffer.push(str);
      this.emit('line', str);
    };

  const options = opts || {
    buffer: 0
  };
  this._buffer = new CBuffer(options.buffer);

  // Start to tail on every parameter
  pathArray.forEach((pathItem) => {
    if (pathItem === '-') {
      console.info('starting to watch stdin');
      const linePrefix = getLinePrefix('stdin', pathArray);
      byline(process.stdin, { keepEmptyLines: true }).on('data', pushLineToBuffer(linePrefix));
    } else {
      const linePrefix = getLinePrefix(pathItem, pathArray);
      readLastLinesIfPossible(pathItem, pushLineToBuffer(linePrefix));
      tailFile(pathItem, pushLineToBuffer(linePrefix));
    }
  });
}
util.inherits(Tail, events.EventEmitter);

Tail.prototype.getBuffer = function getBuffer() {
  return this._buffer.toArray();
};

module.exports = (path, options) => new Tail(path, options);
