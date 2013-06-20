var program      = require('commander')
  , http         = require('http')
  , fs           = require('fs')
  , socketio     = require('socket.io')
  , spawn        = require('child_process').spawn
  , connect      = require('connect')
  , cookieParser = require('cookie')
  , sanitizer    = require('validator').sanitize
  , daemon       = require('daemon');

/**
 * Parse arg
 */
program
    .version(require('../package.json').version)
    .usage('[options] [file ...]')
    .option('-p, --port <port>', 'server port, default 9001', Number, 9001)
    .option('-n, --number <number>', 'starting lines number, default 10', Number, 10)
    .option('-l, --lines <lines>', 'number on lines stored in browser, default 2000', Number, 2000)
    .option('-d, --daemonize', 'run as daemon')
    .option('-U, --user <username>', 'Basic Authentication username, this option works only along with -P option', String, false)
    .option('-P, --password <password>', 'Basic Authentication password, this option works only along with -U option', String, false)
    .option('--pid-path <path>', 'if run as daemon file that will store the process id, default /var/run/frontail.pid',
        String, '/var/run/frontail.pid')
    .option('--log-path <path>', 'if run as daemon file that will be used as a log, default /dev/null',
        String, '/dev/null')
    .parse(process.argv);

/**
 * Validate args
 */
if (program.args.length === 0) {
    console.error('Arguments needed, use --help');
    process.exit();
} else {
    var files = program.args;

    var doAuthorization = false;
    if (program.user && program.password) {
        doAuthorization = true;
        var sessionSecret = String(+new Date()) + Math.random();
        var sessionKey = 'sid';
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

    args = args.concat(files);

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
    var app = connect();

    if (doAuthorization) {
        app
        .use(connect.cookieParser())
        .use(connect.session({secret: sessionSecret, key: sessionKey}))
        .use(connect.basicAuth(function (user, password) {
            return program.user == user & program.password == password;
        }));
    }

    app
    .use(connect.static(__dirname + '/web/assets'))
    .use(function (req, res) {
        fs.readFile(__dirname + '/web/index.html', function (err, data) {
            if (err) {
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end('Internal error');
            } else {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(data.toString('utf-8').replace(
                    /__TITLE__/g, 'tail -F ' + files.join(' ')), 'utf-8'
                );
            }
        });
    });

    var server = http.createServer(app).listen(program.port);

    /**
     * socket.io setup
     */
    var io = socketio.listen(server, {log: false});

    if (doAuthorization) {
        io.set('authorization', function(handshakeData, accept) {
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
    io.sockets.on('connection', function (socket) {
        socket.emit('options:lines', program.lines);

        var tail = spawn('tail', ['-n', program.number].concat(files));
        tail.stdout.on('data', function (data) {
            var lines = sanitizer(data.toString('utf-8')).xss().split('\n');
            lines.pop();
            socket.emit('lines', lines);
        });
    });

    /*
     * Send incoming data
     */
    var tail = spawn('tail', ['-F'].concat(files));
    tail.stdout.on('data', function (data) {
        var lines = sanitizer(data.toString('utf-8')).xss().split('\n');
        lines.pop();
        io.sockets.emit('lines', lines);
    });
}
