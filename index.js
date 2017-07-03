'use strict';

const connect = require('connect');
const cookieParser = require('cookie');
const crypto = require('crypto');
const path = require('path');
const socketio = require('socket.io');
const tail = require('./lib/tail');
const connectBuilder = require('./lib/connect_builder');
const program = require('./lib/options_parser');
const serverBuilder = require('./lib/server_builder');
const daemonize = require('./lib/daemonize');

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
const doAuthorization = !!(program.user && program.password);
const doSecure = !!(program.key && program.certificate);
const sessionSecret = String(+new Date()) + Math.random();
const sessionKey = 'sid';
const files = program.args.join(' ');
const filesNamespace = crypto.createHash('md5').update(files).digest('hex');

if (program.daemonize) {
  daemonize(__filename, program, {
    doAuthorization,
    doSecure,
  });
} else {
  /**
   * HTTP(s) server setup
   */
  const appBuilder = connectBuilder();
  if (doAuthorization) {
    appBuilder.session(sessionSecret, sessionKey);
    appBuilder.authorize(program.user, program.password);
  }
  appBuilder
    .static(path.join(__dirname, 'lib/web/assets'))
    .index(path.join(__dirname, 'lib/web/index.html'), files, filesNamespace, program.theme);

  const builder = serverBuilder();
  if (doSecure) {
    builder.secure(program.key, program.certificate);
  }
  const server = builder
    .use(appBuilder.build())
    .port(program.port)
    .host(program.host)
    .build();

  /**
   * socket.io setup
   */
  const io = socketio.listen(server, {
    log: false,
  });

  if (doAuthorization) {
    io.use((socket, next) => {
      const handshakeData = socket.request;
      if (handshakeData.headers.cookie) {
        const cookies = cookieParser.parse(handshakeData.headers.cookie);
        const sessionIdEncoded = cookies[sessionKey];
        if (!sessionIdEncoded) {
          return next(new Error('Session cookie not provided'), false);
        }
        const sessionId = connect.utils.parseSignedCookie(sessionIdEncoded, sessionSecret);
        if (sessionId) {
          return next(null);
        }
        return next(new Error('Invalid cookie'), false);
      }

      return next(new Error('No cookie in header'), false);
    });
  }

  /**
   * Setup UI highlights
   */
  let highlightConfig;
  if (program.uiHighlight) {
    highlightConfig = require(path.resolve(__dirname, program.uiHighlightPreset)); // eslint-disable-line
  }

  /**
   * When connected send starting data
   */
  const tailer = tail(program.args, {
    buffer: program.number,
  });

  const filesSocket = io.of(`/${filesNamespace}`).on('connection', (socket) => {
    socket.emit('options:lines', program.lines);

    if (program.uiHideTopbar) {
      socket.emit('options:hide-topbar');
    }

    if (!program.uiIndent) {
      socket.emit('options:no-indent');
    }

    if (program.uiHighlight) {
      socket.emit('options:highlightConfig', highlightConfig);
    }

    tailer.getBuffer().forEach((line) => {
      socket.emit('line', line);
    });
  });

  /**
   * Send incoming data
   */
  tailer.on('line', (line) => {
    filesSocket.emit('line', line);
  });

  /**
   * Handle signals
   */
  const cleanExit = () => {
    process.exit();
  };
  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);
}
