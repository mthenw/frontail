'use strict';

const daemon = require('daemonize-process');
const sinon = require('sinon');
const fs = require('fs');
const optionsParser = require('../lib/options_parser');
const daemonize = require('../lib/daemonize');

describe('daemonize', () => {
  beforeEach(() => {
    sinon.stub(daemon, 'daemon');
    daemon.daemon.returns({
      pid: 1000,
    });
    sinon.stub(fs, 'writeFileSync');
    sinon.stub(fs, 'openSync');
  });

  afterEach(() => {
    daemon.daemon.restore();
    fs.writeFileSync.restore();
    fs.openSync.restore();
  });

  describe('should daemon', () => {
    it('current script', () => {
      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[0].should.match('script');
    });

    it('with hostname', () => {
      optionsParser.parse(['node', '/path/to/frontail', '-h', '127.0.0.1']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['-h', '127.0.0.1']);
    });

    it('with port', () => {
      optionsParser.parse(['node', '/path/to/frontail', '-p', '80']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['-p', 80]);
    });

    it('with lines number', () => {
      optionsParser.parse(['node', '/path/to/frontail', '-n', '1']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['-n', 1]);
    });

    it('with lines stored in browser', () => {
      optionsParser.parse(['node', '/path/to/frontail', '-l', '1']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['-l', 1]);
    });

    it('with theme', () => {
      optionsParser.parse(['node', '/path/to/frontail', '-t', 'dark']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['-t', 'dark']);
    });

    it('with authorization', () => {
      optionsParser.parse([
        'node',
        '/path/to/frontail',
        '-U',
        'user',
        '-P',
        'passw0rd',
      ]);

      daemonize('script', optionsParser, {
        doAuthorization: true,
      });

      daemon.daemon.lastCall.args[1].should.containDeep([
        '-U',
        'user',
        '-P',
        'passw0rd',
      ]);
    });

    it('without authorization if option doAuthorization not passed', () => {
      optionsParser.parse([
        'node',
        '/path/to/frontail',
        '-U',
        'user',
        '-P',
        'passw0rd',
      ]);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.not.containDeep([
        '-U',
        'user',
        '-P',
        'passw0rd',
      ]);
    });

    it('with secure connection', () => {
      optionsParser.parse([
        'node',
        '/path/to/frontail',
        '-k',
        'key.file',
        '-c',
        'cert.file',
      ]);

      daemonize('script', optionsParser, {
        doSecure: true,
      });

      daemon.daemon.lastCall.args[1].should.containDeep([
        '-k',
        'key.file',
        '-c',
        'cert.file',
      ]);
    });

    it('without secure connection if option doSecure not passed', () => {
      optionsParser.parse([
        'node',
        '/path/to/frontail',
        '-k',
        'key.file',
        '-c',
        'cert.file',
      ]);

      daemonize('script', optionsParser, {
        doSecure: true,
      });

      daemon.daemon.lastCall.args[1].should.containDeep([
        '-k',
        'key.file',
        '-c',
        'cert.file',
      ]);
    });

    it('with url-path option', () => {
      optionsParser.parse(['node', '/path/to/frontail', '--url-path', '/test']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep([
        '--url-path',
        '/test',
      ]);
    });

    it('with hide-topbar option', () => {
      optionsParser.parse(['node', '/path/to/frontail', '--ui-hide-topbar']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['--ui-hide-topbar']);
    });

    it('with no-indent option', () => {
      optionsParser.parse(['node', '/path/to/frontail', '--ui-no-indent']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['--ui-no-indent']);
    });

    it('with highlight option', () => {
      optionsParser.parse(['node', '/path/to/frontail', '--ui-highlight']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['--ui-highlight']);
    });

    it('with highlight preset option', () => {
      optionsParser.parse([
        'node',
        '/path/to/frontail',
        '--ui-highlight',
        '--ui-highlight-preset',
        'test.json',
      ]);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep([
        '--ui-highlight-preset',
        'test.json',
      ]);
    });

    it('with disable usage stats', () => {
      optionsParser.parse([
        'node',
        '/path/to/frontail',
        '--disable-usage-stats',
        'test.json',
      ]);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep([
        '--disable-usage-stats',
        'test.json',
      ]);
    });

    it('with file to tail', () => {
      optionsParser.parse(['node', '/path/to/frontail', '/path/to/file']);

      daemonize('script', optionsParser);

      daemon.daemon.lastCall.args[1].should.containDeep(['/path/to/file']);
    });
  });

  it('should write pid to pidfile', () => {
    optionsParser.parse([
      'node',
      '/path/to/frontail',
      '--pid-path',
      '/path/to/pid',
    ]);

    daemonize('script', optionsParser);

    fs.writeFileSync.lastCall.args[0].should.be.equal('/path/to/pid');
    fs.writeFileSync.lastCall.args[1].should.be.equal(1000);
  });

  it('should log to file', () => {
    optionsParser.parse([
      'node',
      '/path/to/frontail',
      '--log-path',
      '/path/to/log',
    ]);
    fs.openSync.returns('file');

    daemonize('script', optionsParser);

    fs.openSync.lastCall.args[0].should.equal('/path/to/log');
    fs.openSync.lastCall.args[1].should.equal('a');
    daemon.daemon.lastCall.args[2].should.eql({
      stdout: 'file',
      stderr: 'file',
    });
  });
});
