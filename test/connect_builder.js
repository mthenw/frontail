var connectBuilder = require('../lib/connect_builder');

(function () {
    'use strict';

    describe('connectBuilder', function () {
        it('builds connect app', function () {
            connectBuilder().build().should.have.property('use');
            connectBuilder().build().should.have.property('listen');
        });

        it('builds app requiring authorized user', function (done) {
            var app = connectBuilder().authorize('user', 'pass').build();

            app
                .request()
                .get('/')
                .end(function (res) {
                    res.statusCode.should.equal(401);
                    res.headers['www-authenticate'].should.equal('Basic realm="Authorization Required"');
                    done();
                });
        });

        it('builds app allowing user to login', function (done) {
            var app = connectBuilder().authorize('user', 'pass').build();
            app.use(function (req, res) {
                res.end('secret!');
            });

            app
                .request()
                .get('/')
                .set('Authorization', 'Basic dXNlcjpwYXNz')
                .end(function (res) {
                    res.statusCode.should.equal(200);
                    res.body.should.equal('secret!');
                    done();
                });
        });

        it('builds app that setup session', function (done)  {
            var app = connectBuilder().session('secret', 'sessionkey').build();
            app.use(function (req, res) {
                res.end();
            });

            app
                .request()
                .get('/')
                .end(function (res) {
                    res.headers['set-cookie'][0].should.startWith('sessionkey');
                    done();
                });
        });

        it('builds app that serve static files', function (done) {
            var app = connectBuilder().static(__dirname + '/fixtures').build();

            app
                .request()
                .get('/foo')
                .expect('bar', done);
        });

        it('builds app that serve index file', function (done) {
            var app = connectBuilder().index(__dirname + '/fixtures/index', '/testfile').build();

            app
                .request()
                .get('/')
                .end(function (res) {
                    res.headers['content-type'].should.equal('text/html');
                    res.statusCode.should.equal(200);
                    done();
                });
        });

        it('builds app that replace index title', function (done) {
            var app = connectBuilder()
                .index(__dirname + '/fixtures/index_with_title', '/testfile')
                .build();

            app
                .request()
                .get('/')
                .expect('<head><title>/testfile</title></head>', done);
        });

        it('builds app that sets socket.io namespace based on files', function (done) {
            var app = connectBuilder()
                .index(__dirname + '/fixtures/index_with_ns', '/testfile', 'ns', 'dark')
                .build();

            app
                .request()
                .get('/')
                .expect('ns', done);
        });

        it('builds app that sets theme', function (done) {
            var app = connectBuilder()
                .index(__dirname + '/fixtures/index_with_theme', '/testfile', 'ns', 'dark')
                .build();

            app
                .request()
                .get('/')
                .expect(
                    '<head><title>/testfile</title><link href="dark.css" rel="stylesheet" type="text/css"/></head>',
                    done
                );
        });

        it('builds app that sets default theme', function (done) {
            var app = connectBuilder()
                .index(__dirname + '/fixtures/index_with_theme', '/testfile')
                .build();

            app
                .request()
                .get('/')
                .expect(
                    '<head><title>/testfile</title><link href="default.css" rel="stylesheet" type="text/css"/></head>',
                    done
                );
        });
    });
})();