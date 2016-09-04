'use strict';

var connect        = require('connect');
var cookieParser   = require('cookie');
var crypto         = require('crypto');
var path           = require('path');
var socketio       = require('socket.io');
var tail           = require('./lib/tail');
var connectBuilder = require('./lib/connect_builder');
var program        = require('./lib/options_parser');
var serverBuilder  = require('./lib/server_builder');
var daemonize      = require('./lib/daemonize');

/**
 * Parse args
 */
program.parse(process.argv);
if (program.args.length === 0) {
    console.error('Arguments needed, use --help');
    process.exit();
}

/**
 * Validate params
 */
var doAuthorization = !!(program.user && program.password);
var doSecure = !!(program.key && program.certificate);
var doSSH = !!program.remoteHost;
var sessionSecret = String(+new Date()) + Math.random();
var sessionKey = 'sid';
var files = program.args.join(' ');
var filesNamespace = crypto.createHash('md5').update(files).digest('hex');

if (program.daemonize) {
    daemonize(__filename, program, {
        doAuthorization: doAuthorization,
        doSecure: doSecure,
        doSSH: doSSH
    });
} else {
    /**
     * HTTP(s) server setup
     */
    var appBuilder = connectBuilder();
    if (doAuthorization) {
        appBuilder.session(sessionSecret, sessionKey);
        appBuilder.authorize(program.user, program.password);
    }
    appBuilder
        .static(__dirname + '/lib/web/assets')
        .index(__dirname + '/lib/web/index.html', files, filesNamespace, program.theme);

    var builder = serverBuilder();
    if (doSecure) {
        builder.secure(program.key, program.certificate);
    }
    var server = builder
        .use(appBuilder.build())
        .port(program.port)
        .host(program.host)
        .build();

    /**
     * socket.io setup
     */
    var io = socketio.listen(server, {log: false});

    if (doAuthorization) {
        io.use(function (socket, next) {
            var handshakeData = socket.request;
            if (handshakeData.headers.cookie) {
                var cookie = cookieParser.parse(handshakeData.headers.cookie);
                var sessionId = connect.utils.parseSignedCookie(cookie[sessionKey], sessionSecret);
                if (sessionId) {
                    return next(null);
                }
                return next(new Error('Invalid cookie'), false);
            } else {
                return next(new Error('No cookie in header'), false);
            }
        });
    }

    /**
     * Setup UI highlights
     */
    var highlightConfig;
    if (program.uiHighlight) {
        highlightConfig = require(path.resolve(__dirname, program.uiHighlightPreset));
    }

    /**
     * When connected send starting data
     */
    var tailer;
    if (doSSH) {
        var sshOptions = {
            remoteHost: program.remoteHost,
            remoteUser: program.remoteUser,
            remotePort: program.remotePort
        };

        tailer = tail(program.args, {buffer: program.number, grep: program.grep, ssh: sshOptions});
    } else {
        tailer = tail(program.args, {buffer: program.number, grep: program.grep});
    }

    var filesSocket = io.of('/' + filesNamespace).on('connection', function (socket) {
        socket.emit('options:lines', program.lines);

        program.uiHideTopbar && socket.emit('options:hide-topbar');
        !program.uiIndent && socket.emit('options:no-indent');
        program.uiHighlight && socket.emit('options:highlightConfig', highlightConfig);

        tailer.getBuffer().forEach(function (line) {
            socket.emit('line', line);
        });
    });

    /**
     * Send incoming data
     */
    tailer.on('line', function (line) {
        filesSocket.emit('line', line);
    });

    /**
     * Handle signals
     */
    var cleanExit = function () {
        process.exit();
    };
    process.on('SIGINT', cleanExit);
    process.on('SIGTERM', cleanExit);
}
