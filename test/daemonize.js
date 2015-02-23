'use strict';

require('should');
var daemon = require('daemon');
var optionsParser = require('../lib/options_parser');
var daemonize = require('../lib/daemonize');
var sinon = require('sinon');
var fs = require('fs');

describe('daemonize', function () {
    beforeEach(function () {
        sinon.stub(daemon, 'daemon');
        daemon.daemon.returns({pid: 1000});
        sinon.stub(fs, 'writeFileSync');
        sinon.stub(fs, 'openSync');
    });

    afterEach(function () {
        daemon.daemon.restore();
        fs.writeFileSync.restore();
        fs.openSync.restore();
    });

    describe('should daemon', function () {
        it('current script', function () {
            daemonize('script', optionsParser);

            daemon.daemon.lastCall.args[0].should.match('script');
        });

        it('with hostname', function () {
            optionsParser.parse(['node', '/path/to/frontail', '-h', '127.0.0.1']);

            daemonize('script', optionsParser);

            daemon.daemon.lastCall.args[1].should.containDeep(['-h', '127.0.0.1']);
        });

        it('with port', function () {
            optionsParser.parse(['node', '/path/to/frontail', '-p', '80']);

            daemonize('script', optionsParser);

            daemon.daemon.lastCall.args[1].should.containDeep(['-p', 80]);
        });

        it('with lines number', function () {
            optionsParser.parse(['node', '/path/to/frontail', '-n', '1']);

            daemonize('script', optionsParser);

            daemon.daemon.lastCall.args[1].should.containDeep(['-n', 1]);
        });

        it('with lines stored in browser', function () {
            optionsParser.parse(['node', '/path/to/frontail', '-l', '1']);

            daemonize('script', optionsParser);

            daemon.daemon.lastCall.args[1].should.containDeep(['-l', 1]);
        });

        it('with theme', function () {
            optionsParser.parse(['node', '/path/to/frontail', '-t', 'dark']);

            daemonize('script', optionsParser);

            daemon.daemon.lastCall.args[1].should.containDeep(['-t', 'dark']);
        });

        it('with authorization', function () {
            optionsParser.parse(['node', '/path/to/frontail', '-U', 'user', '-P', 'passw0rd']);

            daemonize('script', optionsParser, {doAuthorization: true});

            daemon.daemon.lastCall.args[1].should.containDeep(['-U', 'user', '-P', 'passw0rd']);
        });

        it('without authorization if option doAuthorization not passed', function () {
            optionsParser.parse(['node', '/path/to/frontail', '-U', 'user', '-P', 'passw0rd']);

            daemonize('script', optionsParser);

            daemon.daemon.lastCall.args[1].should.not.containDeep(['-U', 'user', '-P', 'passw0rd']);
        });

        it('with secure connection', function () {
            optionsParser.parse(['node', '/path/to/frontail', '-k', 'key.file', '-c', 'cert.file']);

            daemonize('script', optionsParser, {doSecure: true});

            daemon.daemon.lastCall.args[1].should.containDeep(['-k', 'key.file', '-c', 'cert.file']);
        });

        it('with ssh configuration', function () {
            optionsParser.parse([
                'node', '/path/to/frontail',
                '--remote-host', 'remoteHost',
                '--remote-user', 'remoteUser',
                '--remote-port', '23'
            ]);

            daemonize('script', optionsParser, {doSSH: true});

            daemon.daemon.lastCall.args[1].should.containDeep([
                '--remote-host', 'remoteHost',
                '--remote-user', 'remoteUser',
                '--remote-port', '23'
            ]);
        });

        it('without ssh configuration', function () {
            optionsParser.parse([
                'node', '/path/to/frontail',
                '--remote-user', 'remoteUser',
                '--remote-port', '23'
            ]);

            daemonize('script', optionsParser, {doSSH: false});

            daemon.daemon.lastCall.args[1].should.not.containDeep([
                '--remote-host', 'remoteHost',
                '--remote-user', 'remoteUser',
                '--remote-port', '23'
            ]);
        });

        it('without secure connection if option doSecure not passed', function () {
            optionsParser.parse(['node', '/path/to/frontail', '-k', 'key.file', '-c', 'cert.file']);

            daemonize('script', optionsParser, {doSecure: true});

            daemon.daemon.lastCall.args[1].should.containDeep(['-k', 'key.file', '-c', 'cert.file']);
        });

        it('with hide-topbar option', function () {
            optionsParser.parse(['node', '/path/to/frontail', '--ui-hide-topbar']);

            daemonize('script', optionsParser);

            daemon.daemon.lastCall.args[1].should.containDeep(['--ui-hide-topbar']);
        });

        it('with no-indent option', function () {
            optionsParser.parse(['node', '/path/to/frontail', '--ui-no-indent']);

            daemonize('script', optionsParser);

            daemon.daemon.lastCall.args[1].should.containDeep(['--ui-no-indent']);
        });

        it('with file to tail', function () {
            optionsParser.parse(['node', '/path/to/frontail', '/path/to/file']);

            daemonize('script', optionsParser);

            daemon.daemon.lastCall.args[1].should.containDeep(['/path/to/file']);
        });
    });

    it('should write pid to pidfile', function () {
        optionsParser.parse(['node', '/path/to/frontail', '--pid-path', '/path/to/pid']);

        daemonize('script', optionsParser);

        fs.writeFileSync.lastCall.args[0].should.be.equal('/path/to/pid');
        fs.writeFileSync.lastCall.args[1].should.be.equal(1000);
    });

    it('should log to file', function () {
        optionsParser.parse(['node', '/path/to/frontail', '--log-path', '/path/to/log']);
        fs.openSync.returns('file');

        daemonize('script', optionsParser);

        fs.openSync.lastCall.args[0].should.equal('/path/to/log');
        fs.openSync.lastCall.args[1].should.equal('a');
        daemon.daemon.lastCall.args[2].should.eql({
            stdout: 'file',
            stderr: 'file'
        });
    });
});
