'use strict';

const fs = require('fs');
const temp = require('temp');
const tail = require('../lib/tail');

const TEMP_FILE_PROFIX = '';
const SPAWN_DELAY = 40;

function writeLines(fd, count) {
  for (let i = 0; i < count; i += 1) {
    fs.writeSync(
      fd,
      `line${i}
`
    );
  }
}

function endsWith(str, suffix) {
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

describe('tail', () => {
  temp.track();

  it('calls event line if new line appear in file', (done) => {
    temp.open(TEMP_FILE_PROFIX, (err, info) => {
      tail(info.path).on('line', (line) => {
        line.should.equal('line0');
        fs.closeSync(info.fd);
        done();
      });

      setTimeout(writeLines, SPAWN_DELAY, info.fd, 1);
    });
  });

  it('calls event line if new line appear in files', (done) => {
    const buffer = [];

    temp.open(TEMP_FILE_PROFIX, (err, info) => {
      temp.open(TEMP_FILE_PROFIX, (err2, info2) => {
        tail([info.path, info2.path]).on('line', (line) => {
          buffer.push(line);
        });

        setTimeout(() => {
          writeLines(info.fd, 2);
          writeLines(info2.fd, 2);

          setTimeout(() => {
            buffer.length.should.equal(4);
            endsWith(buffer[0], `${info.path} - line0`).should.be.true;
            endsWith(buffer[1], `${info.path} - line1`).should.be.true;
            endsWith(buffer[2], `${info2.path} - line0`).should.be.true;
            endsWith(buffer[3], `${info2.path} - line1`).should.be.true;
            fs.closeSync(info.fd);
            fs.closeSync(info2.fd);
            done();
          }, SPAWN_DELAY);
        }, SPAWN_DELAY);
      });
    });
  });

  it('buffers lines on start', (done) => {
    temp.open(TEMP_FILE_PROFIX, (err, info) => {
      writeLines(info.fd, 20);

      const tailer = tail(info.path, {
        buffer: 2
      });
      setTimeout(() => {
        tailer.getBuffer().should.be.eql(['line18', 'line19']);
        fs.closeSync(info.fd);
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
        fs.closeSync(info.fd);
        done();
      }, SPAWN_DELAY);
    });
  });
});
