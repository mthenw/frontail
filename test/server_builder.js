var fs = require('fs');
var http = require('http');
var https = require('https');
var serverBuilder = require('../lib/server_builder');
var sinon = require('sinon');

(function () {
    'use strict';

    describe('serverBuilder', function () {

        describe('http server', function () {
            var httpServer;
            var createServer;

            beforeEach(function () {
                httpServer = sinon.createStubInstance(http.Server);
                httpServer.listen.returns(httpServer);
                createServer = sinon.stub(http, 'createServer').returns(httpServer);
            });

            afterEach(function () {
                createServer.restore();
            });

            it('should build server', function () {
                var server = serverBuilder().build();

                createServer.calledOnce.should.equal(true);
                server.should.be.an.instanceof(http.Server);
            });

            it('should build server accepting requests', function () {
                var callback = function () {};

                serverBuilder().use(callback).build();

                createServer.calledWith(callback).should.equal(true);
            });

            it('should build listening server', function () {
                serverBuilder().build();

                httpServer.listen.calledOnce.should.equal(true);
            });

            it('should build server listening on specified port', function () {
                serverBuilder().port(6666).build();

                httpServer.listen.calledWith(6666).should.equal(true);
            });

            it('should build server listening on default port', function () {
                serverBuilder().build();

                httpServer.listen.calledWith(9001).should.equal(true);
            });

            it('should build server listening on specified host', function () {
                serverBuilder().host('127.0.0.1').build();

                httpServer.listen.calledWith(9001, '127.0.0.1').should.equal(true);
            });

            it('should build server listening on default host', function () {
                serverBuilder().build();

                httpServer.listen.calledWith(9001, null).should.equal(true);
            });
        });

        describe('https server', function () {
            var httpsServer;
            var createHttpsServer;
            var readFileSyncStub;

            beforeEach(function () {
                httpsServer = sinon.createStubInstance(https.Server);
                httpsServer.listen.returns(httpsServer);
                createHttpsServer = sinon.stub(https, 'createServer').returns(httpsServer);
                readFileSyncStub = sinon.stub(fs, 'readFileSync');
                readFileSyncStub.withArgs('key.pem').returns('testkey');
                readFileSyncStub.withArgs('cert.pem').returns('testcert');
            });

            afterEach(function () {
                createHttpsServer.restore();
                readFileSyncStub.restore();
            });

            it('should build server', function () {
                var server = serverBuilder().secure('key.pem', 'cert.pem').build();

                server.should.be.an.instanceof(https.Server);
                createHttpsServer.calledWith({key: 'testkey', cert: 'testcert'}).should.equal(true);
            });

            it('should build server accepting requests', function () {
                var callback = function () {};

                serverBuilder().use(callback).secure('key.pem', 'cert.pem').build();

                createHttpsServer.calledWith({key: 'testkey', cert: 'testcert'}, callback).should.equal(true);
            });

            it('should throw error if key or cert not provided', function () {
                readFileSyncStub.restore();

                (function () {
                    serverBuilder().secure('nofile', 'nofile');
                }).should.throw('No key or certificate file found');
            });
        });
    });
})();