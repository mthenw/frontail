'use strict';

require('should');
var fs = require('fs');
var tail = require('../lib/tail');
var temp = require('temp');

describe('tail', function () {
    temp.track();

    it('calls event line if new line appear in file', function (done) {
        temp.open('', function (err, info) {
            tail(info.path).on('line', function (line) {
                line.should.equal('testline');
                done();
            });

            fs.writeSync(info.fd, 'testline\n');
            fs.closeSync(info.fd);
        });
    });

    it('buffers lines on start', function (done) {
        temp.open('', function (err, info) {
            fs.writeSync(info.fd, 'testline1\n');
            fs.writeSync(info.fd, 'testline2\n');
            fs.writeSync(info.fd, 'testline3\n');
            fs.closeSync(info.fd);

            var calls = 0;
            var tailer = tail(info.path, {buffer: 2}).on('line', function () {
                calls += 1;

                if (calls === 3) {
                    tailer.getBuffer().should.eql(['testline2', 'testline3']);
                    done();
                }
            });
        });
    });
});
