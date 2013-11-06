var connectBuilder = require('../lib/connect_builder');
var request = require('supertest');

(function () {
    'use strict';

    describe('connectBuilder', function () {
        it('should build connect app', function () {
            connectBuilder().build().should.have.property('use');
            connectBuilder().build().should.have.property('listen');
        });

        it('should build app requiring authorized user', function (done) {
            var app = connectBuilder().authorize('user', 'pass').build();

            request(app)
                .get('/')
                .expect('www-authenticate', 'Basic realm="Authorization Required"')
                .expect(401, done);
        });

        it('should build app allowing user to login', function (done) {
            var app = connectBuilder().authorize('user', 'pass').build();
            app.use(function (req, res) {
                res.end('secret!');
            });

            request(app)
                .get('/')
                .set('Authorization', 'Basic dXNlcjpwYXNz')
                .expect(200, 'secret!', done);
        });

        it('should build app that setup session', function (done)  {
            var app = connectBuilder().session('secret', 'sessionkey').build();
            app.use(function (req, res) {
                res.end();
            });

            request(app)
                .get('/')
                .expect('set-cookie', /^sessionkey/, done);
        });

        it('should build app that serve static files', function (done) {
            var app = connectBuilder().static(__dirname + '/fixtures').build();

            request(app)
                .get('/foo')
                .expect('bar', done);
        });

        it('should build app that serve index file', function (done) {
            var app = connectBuilder().index(__dirname + '/fixtures/index').build();

            request(app)
                .get('/')
                .expect(200)
                .expect('Content-Type', 'text/html', done);
        });

        it('should build app that replace index title', function (done) {
            var app = connectBuilder()
                .index(__dirname + '/fixtures/index_with_title', 'Test')
                .build();

            request(app)
                .get('/')
                .expect('<head><title>Test</title></head>', done);
        });

        it('should build app that sets theme', function (done) {
            var app = connectBuilder()
                .index(__dirname + '/fixtures/index_with_theme', 'Test', 'dark')
                .build();

            request(app)
                .get('/')
                .expect(
                    '<head><title>Test</title><link href="dark.css" rel="stylesheet" type="text/css"/></head>',
                    done
                );
        });

        it('should build app that sets default theme', function (done) {
            var app = connectBuilder()
                .index(__dirname + '/fixtures/index_with_theme', 'Test')
                .build();

            request(app)
                .get('/')
                .expect(
                    '<head><title>Test</title><link href="default.css" rel="stylesheet" type="text/css"/></head>',
                    done
                );
        });
    });
})();