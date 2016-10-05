'use strict';

const fs = require('fs');
const tail = require('../lib/tail');
const temp = require('temp');

const TEMP_FILE_PROFIX = '';
const SPAWN_DELAY = 10;

function writeLines(fd, count) {
  for (let i = 0; i < count; i += 1) {
    fs.writeSync(fd, `line${i}
`);
  }
  fs.closeSync(fd);
}

describe('tail', () => {
  temp.track();

  it('calls event line if new line appear in file', (done) => {
    temp.open(TEMP_FILE_PROFIX, (err, info) => {
      tail(info.path).on('line', (line) => {
        line.should.equal('line0');
        done();
      });

      setTimeout(writeLines, SPAWN_DELAY, info.fd, 1);
    });
  });

  it('buffers lines on start', (done) => {
    temp.open(TEMP_FILE_PROFIX, (err, info) => {
      writeLines(info.fd, 20);

      const tailer = tail(info.path, {
        buffer: 2,
      });
      setTimeout(() => {
        tailer.getBuffer().should.be.eql(['line18', 'line19']);
        done();
      }, SPAWN_DELAY);
    });
  });

  it('buffers no lines on start by default', (done) => {
    temp.open(TEMP_FILE_PROFIX, (err, info) => {
      writeLines(info.fd, 3);

      const tailer = tail(info.path);
      setTimeout(() => {
        tailer.getBuffer().should.be.empty;
        done();
      }, SPAWN_DELAY);
    });
  });
});
