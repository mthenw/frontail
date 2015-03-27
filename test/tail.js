'use strict';

require('should');
var fs = require('fs');
var tail = require('../lib/tail');
var temp = require('temp');
var sinon = require('sinon');
var childProcess = require('child_process');

var TEMP_FILE_PROFIX = '';
var SPAWN_DELAY = 10;

describe('tail', function () {
    temp.track();

    it('calls event line if new line appear in file', function (done) {
        temp.open(TEMP_FILE_PROFIX, function (err, info) {
            tail(info.path).on('line', function (line) {
                line.should.equal('line0');
                done();
            });

            setTimeout(writeLines, SPAWN_DELAY, info.fd, 1);
        });
    });

    it('buffers lines on start', function (done) {
        temp.open(TEMP_FILE_PROFIX, function (err, info) {
            writeLines(info.fd, 20);

            var tailer = tail(info.path, {buffer: 2});
            setTimeout(function () {
                tailer.getBuffer().should.be.eql(['line18', 'line19']);
                done();
            }, SPAWN_DELAY);
        });
    });

    it('buffers no lines on start by default', function (done) {
        temp.open(TEMP_FILE_PROFIX, function (err, info) {
            writeLines(info.fd, 3);

            var tailer = tail(info.path);
            setTimeout(function () {
                tailer.getBuffer().should.be.empty;
                done();
            }, SPAWN_DELAY);
        });
    });

    describe('with ssh options', function () {
        it('should call ssh command', function () {
            sinon.spy(childProcess, 'spawn');
            var sshOptions = {
                remoteUser: 'testUser',
                remoteHost: 'host',
                remotePort: 1234
            };

            tail('test/path', {ssh: sshOptions});

            childProcess.spawn.calledWith('ssh', ['testUser@host', '-p', 1234, 'tail -f', 'test/path']).should.be.true;
            childProcess.spawn.restore();
        });
    });

    function writeLines(fd, count) {
        for (var i = 0; i < count; i += 1) {
            fs.writeSync(fd, 'line' + i + '\n');
        }
        fs.closeSync(fd);
    }
});
