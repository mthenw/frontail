'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');
const serverBuilder = require('../lib/server_builder');
const sinon = require('sinon');

describe('serverBuilder', () => {
  describe('http server', () => {
    let httpServer;
    let createServer;

    beforeEach(() => {
      httpServer = sinon.createStubInstance(http.Server);
      httpServer.listen.returns(httpServer);
      createServer = sinon.stub(http, 'createServer').returns(httpServer);
    });

    afterEach(() => {
      createServer.restore();
    });

    it('should build server', () => {
      const server = serverBuilder().build();

      createServer.calledOnce.should.equal(true);
      server.should.be.an.instanceof(http.Server);
    });

    it('should build server accepting requests', () => {
      const callback = () => {
      };

      serverBuilder().use(callback).build();

      createServer.calledWith(callback).should.equal(true);
    });

    it('should build listening server', () => {
      serverBuilder().build();

      httpServer.listen.calledOnce.should.equal(true);
    });

    it('should build server listening on specified port', () => {
      serverBuilder().port(6666).build();

      httpServer.listen.calledWith(6666).should.equal(true);
    });

    it('should build server listening on default port', () => {
      serverBuilder().build();

      httpServer.listen.calledWith(9001).should.equal(true);
    });

    it('should build server listening on specified host', () => {
      serverBuilder().host('127.0.0.1').build();

      httpServer.listen.calledWith(9001, '127.0.0.1').should.equal(true);
    });

    it('should build server listening on default host', () => {
      serverBuilder().build();

      httpServer.listen.calledWith(9001, null).should.equal(true);
    });
  });

  describe('https server', () => {
    let httpsServer;
    let createHttpsServer;
    let readFileSyncStub;

    beforeEach(() => {
      httpsServer = sinon.createStubInstance(https.Server);
      httpsServer.listen.returns(httpsServer);
      createHttpsServer = sinon.stub(https, 'createServer').returns(httpsServer);
      readFileSyncStub = sinon.stub(fs, 'readFileSync');
      readFileSyncStub.withArgs('key.pem').returns('testkey');
      readFileSyncStub.withArgs('cert.pem').returns('testcert');
    });

    afterEach(() => {
      createHttpsServer.restore();
      readFileSyncStub.restore();
    });

    it('should build server', () => {
      const server = serverBuilder().secure('key.pem', 'cert.pem').build();

      server.should.be.an.instanceof(https.Server);
      createHttpsServer.calledWith({
        key: 'testkey',
        cert: 'testcert',
      }).should.equal(true);
    });

    it('should build server accepting requests', () => {
      const callback = () => {
      };

      serverBuilder().use(callback).secure('key.pem', 'cert.pem').build();

      createHttpsServer.calledWith({
        key: 'testkey',
        cert: 'testcert',
      }, callback).should.equal(true);
    });

    it('should throw error if key or cert not provided', () => {
      readFileSyncStub.restore();

      (() => {
        serverBuilder().secure('nofile', 'nofile');
      }).should.throw('No key or certificate file found');
    });
  });
});
