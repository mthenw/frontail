var program   = require('commander')
  , http      = require('http')
  , fs        = require('fs')
  , socketio  = require('socket.io')
  , spawn     = require('child_process').spawn
  , connect   = require('connect')
  , sanitizer = require('validator').sanitize
  , daemon    = require('daemon');

/**
 * Parse arg
 */
program
    .version(require('../package.json').version)
    .usage('[options] [file ...]')
    .option('-p, --port <port>', 'server port, default 9001', Number, 9001)
    .option('-n, --number <number>', 'starting lines number, default 10', Number, 10)
    .option('-l, --lines <number>', 'number on lines stored in frontend, default 2000', Number, 2000)
    .option('-d, --daemonize', 'run as daemon')
    .option('--pid-path <path>', 'if run as deamon file that will store the process ID, default /var/run/frontail.pid',
        String, '/var/run/frontail.pid')
    .option('--log-path <path>', 'if run as deamon file that will be used as a log, default /dev/null',
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
}

if (program.daemonize) {
    var logFile = fs.openSync(program.logPath, 'a');
    var proc = daemon.daemon(
        __filename,
        ['-p', program.port, '-n', program.number, files],
        {
            stdout: logFile,
            stderr: logFile
        }
    );
    fs.writeFileSync(program.pidPath, proc.pid);
} else {
    /**
     * Server setup
     */
    var app = connect()
            .use(connect.static(__dirname + '/assets'))
            .use(function (req, res) {
                fs.readFile(__dirname + '/index.html', function (err, data) {
                    if (err) {
                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end('Interal error');
                    } else {
                        res.writeHead(200, {'Content-Type': 'text/html'});
                        res.end(data.toString('utf-8').replace(/__TITLE__/g, 'tail -F ' + files.join(' ')), 'utf-8');
                    }
                });
            });
    var server = http.createServer(app).listen(program.port);

    /**
     * socket.io setup
     */
    var io = socketio.listen(server, {
        log: false
    });

    /**
     * Connect to socket and send starting data
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
