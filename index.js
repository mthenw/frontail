var connect        = require('connect');
var cookieParser   = require('cookie');
var daemon         = require('daemon');
var fs             = require('fs');
var http           = require('http');
var https          = require('https');
var program        = require('commander');
var sanitizer      = require('validator').sanitize;
var socketio       = require('socket.io');
var tail           = require('./lib/tail');
var connectBuilder = require('./lib/connect_builder');

(function () {
    'use strict';

    program
        .version(require('./package.json').version)
        .usage('[options] [file ...]')
        .option('-h, --host <host>', 'listening host, default 0.0.0.0', String, '0.0.0.0')
        .option('-p, --port <port>', 'listening port, default 9001', Number, 9001)
        .option('-n, --number <number>', 'starting lines number, default 10', Number, 10)
        .option('-l, --lines <lines>', 'number on lines stored in browser, default 2000', Number, 2000)
        .option('-d, --daemonize', 'run as daemon')
        .option('-U, --user <username>',
            'Basic Authentication username, this option works only along with -P option', String, false)
        .option('-P, --password <password>',
            'Basic Authentication password, this option works only along with -U option', String, false)
        .option('-k, --key <path/to/key.pem>', 'Private Key for HTTPS', String, false)
        .option('-c, --certificate <path/to/cert.pem>', 'Certificate for HTTPS', String, false)
        .option('--pid-path <path>',
            'if run as daemon file that will store the process id, default /var/run/frontail.pid',
            String, '/var/run/frontail.pid')
        .option('--log-path <path>', 'if run as daemon file that will be used as a log, default /dev/null',
            String, '/dev/null')
        .parse(process.argv);

    /**
     * Validate args
     */
    var doAuthorization = false;
    var sessionSecret = null;
    var sessionKey = null;
    if (program.args.length === 0) {
        console.error('Arguments needed, use --help');
        process.exit();
    } else {
        if (program.user && program.password) {
            doAuthorization = true;
            sessionSecret = String(+new Date()) + Math.random();
            sessionKey = 'sid';
        }
    }

    if (program.daemonize) {
        /**
         * Daemonize process
         */
        var logFile = fs.openSync(program.logPath, 'a');
        var args = ['-p', program.port, '-n', program.number, '-l', program.lines];

        if (doAuthorization) {
            args = args.concat(['-U', program.user, '-P', program.password]);
        }

        args = args.concat(program.args);

        var proc = daemon.daemon(
            __filename,
            args,
            {
                stdout: logFile,
                stderr: logFile
            }
        );
        fs.writeFileSync(program.pidPath, proc.pid);
    } else {
        /**
         * HTTP server setup
         */
        var builder = connectBuilder();

        if (doAuthorization) {
            builder.session(sessionSecret, sessionKey);
            builder.authorize(program.user, program.password);
        }

        builder.static(__dirname + '/lib/web/assets');

        var app = builder.build().use(function (req, res) {
            fs.readFile(__dirname + '/lib/web/index.html', function (err, data) {
                if (err) {
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.end('Internal error');
                } else {
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(data.toString('utf-8').replace(
                        /__TITLE__/g, 'tail -F ' + program.args.join(' ')), 'utf-8'
                    );
                }
            });
        });

        var server;

        if (program.key && program.certificate) {
            var options = {
                key: fs.readFileSync(program.key),
                cert: fs.readFileSync(program.certificate)
            };
            server = https.createServer(options, app).listen(program.port, program.host);
        } else {
            server = http.createServer(app).listen(program.port, program.host);
        }

        /**
         * socket.io setup
         */
        var io = socketio.listen(server, {log: false});

        if (doAuthorization) {
            io.set('authorization', function (handshakeData, accept) {
                if (handshakeData.headers.cookie) {
                    var cookie = cookieParser.parse(handshakeData.headers.cookie);
                    var sessionId = connect.utils.parseSignedCookie(cookie[sessionKey], sessionSecret);
                    if (sessionId) {
                        return accept(null, true);
                    }
                    return accept('Invalid cookie', false);
                } else {
                    return accept('No cookie in header', false);
                }
            });
        }

        /**
         * When connected send starting data
         */
        var tailer = tail(program.args, {buffer: program.number});
        io.sockets.on('connection', function (socket) {
            socket.emit('options:lines', program.lines);

            tailer.getBuffer().forEach(function (line) {
                socket.emit('line', line);
            });
        });

        /**
         * Send incoming data
         */
        tailer.on('line', function (line) {
            io.sockets.emit('line', sanitizer(line).xss());
        });
    }
})();
