var program   = require('commander')
  , http      = require('http')
  , fs        = require('fs')
  , socketio  = require('socket.io')
  , spawn     = require('child_process').spawn
  , connect   = require('connect')
  , sanitizer = require('validator').sanitize
  , forever   = require('forever');


/**
 * Parse arg
 */
program
    .version(require('../package.json').version)
    .usage('[options] [file ...]')
    .option('-p, --port <port>', 'server port, default 9001', Number, 9001)
    .option('-n, --number <number>', 'starting lines number, default 10', Number, 10)
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
    forever.startDaemon(__filename, {
        'silent': false,
        'max': 3,
        'pidFile': program.pidPath,
        'outFile': program.logPath,
        'options': [
            '-p', program.port,
            '-n', program.number,
            files
        ]
    });
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
        var tail = spawn('tail', ['-n', program.number].concat(files));
        tail.stdout.on('data', function (data) {
            socket.emit('lines', sanitizer(data.toString('utf-8')).xss().split('\n'));
        });
    });

    /*
     * Send incoming data
     */
    var tail = spawn('tail', ['-F'].concat(files));
    tail.stdout.on('data', function (data) {
        io.sockets.emit('lines', sanitizer(data.toString('utf-8')).xss().split('\n'));
    });
}
