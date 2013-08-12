(function () {
    'use strict';

    require('should');

    var fs = require('fs');
    var tail = require('../lib/tail');
    var temp = require('temp');

    describe('tail', function () {
        temp.track();

        it('should call event line if new line appear in file', function (done) {
            temp.open('test', function (err, info) {
                tail(info.path).on('line', function (line) {
                    line.should.equal('testline');
                    done();
                });

                fs.write(info.fd, 'testline');
                fs.close(info.fd);
            });
        });
    });
})();