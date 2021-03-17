'use strict';

const cookie = require('cookie');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const path = require('path');
const { Server } = require('socket.io');
const fs = require('fs');
const untildify = require('untildify');
const tail = require('./lib/tail');
const connectBuilder = require('./lib/connect_builder');
const program = require('./lib/options_parser');
const serverBuilder = require('./lib/server_builder');
const daemonize = require('./lib/daemonize');
const usageStats = require('./lib/stats');

/**
 * Parse args
 */
program.parse(process.argv);
if (program.args.length === 0) {
  console.error('Arguments needed, use --help');
  process.exit();
}

/**
 * Init usage statistics
 */
const stats = usageStats(!program.disableUsageStats, program);
stats.track('runtime', 'init');
stats.time('runtime', 'runtime');

/**
 * Validate params
 */
const doAuthorization = !!(program.user && program.password);
const doSecure = !!(program.key && program.certificate);
const sessionSecret = String(+new Date()) + Math.random();
const files = program.args.join(' ');
const filesNamespace = crypto.createHash('md5').update(files).digest('hex');
const urlPath = program.urlPath.replace(/\/$/, ''); // remove trailing slash

if (program.daemonize) {
  daemonize(__filename, program, {
    doAuthorization,
    doSecure,
  });
} else {
  /**
   * HTTP(s) server setup
   */
  const appBuilder = connectBuilder(urlPath);
  if (doAuthorization) {
    appBuilder.session(sessionSecret);
    appBuilder.authorize(program.user, program.password);
  }
  appBuilder
    .static(path.join(__dirname, 'web', 'assets'))
    .index(
      path.join(__dirname, 'web', 'index.html'),
      files,
      filesNamespace,
      program.theme
    );

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
  const io = new Server({ path: `${urlPath}/socket.io` });
  io.attach(server);

  if (doAuthorization) {
    io.use((socket, next) => {
      const handshakeData = socket.request;
      if (handshakeData.headers.cookie) {
        const cookies = cookie.parse(handshakeData.headers.cookie);
        const sessionIdEncoded = cookies['connect.sid'];
        if (!sessionIdEncoded) {
          return next(new Error('Session cookie not provided'), false);
        }
        const sessionId = cookieParser.signedCookie(
          sessionIdEncoded,
          sessionSecret
        );
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
    let presetPath;

    if (!program.uiHighlightPreset) {
      presetPath = path.join(__dirname, 'preset', 'default.json');
    } else {
      presetPath = path.resolve(untildify(program.uiHighlightPreset));
    }

    if (fs.existsSync(presetPath)) {
      highlightConfig = JSON.parse(fs.readFileSync(presetPath));
    } else {
      throw new Error(`Preset file ${presetPath} doesn't exists`);
    }
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

  stats.track('runtime', 'started');

  /**
   * Handle signals
   */
  const cleanExit = () => {
    stats.timeEnd('runtime', 'runtime', () => {
      process.exit();
    });
  };
  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);
}
