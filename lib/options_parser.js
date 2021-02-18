const program = require('commander');

program
  .version(require('../package.json').version)
  .usage('[options] [file ...]')
  .helpOption('--help')
  .option(
    '-h, --host <host>',
    'listening host, default 0.0.0.0',
    String,
    '0.0.0.0'
  )
  .option('-p, --port <port>', 'listening port, default 9001', Number, 9001)
  .option(
    '-n, --number <number>',
    'starting lines number, default 10',
    Number,
    10
  )
  .option(
    '-l, --lines <lines>',
    'number on lines stored in browser, default 2000',
    Number,
    2000
  )
  .option('-d, --daemonize', 'run as daemon')
  .option(
    '-U, --user <username>',
    'Basic Authentication username, option works only along with -P option',
    String,
    false
  )
  .option(
    '-P, --password <password>',
    'Basic Authentication password, option works only along with -U option',
    String,
    false
  )
  .option(
    '-k, --key <key.pem>',
    'Private Key for HTTPS, option works only along with -c option',
    String,
    false
  )
  .option(
    '-c, --certificate <cert.pem>',
    'Certificate for HTTPS, option works only along with -k option',
    String,
    false
  )
  .option(
    '--pid-path <path>',
    'if run as daemon file that will store the process id, default /var/run/frontail.pid',
    String,
    '/var/run/frontail.pid'
  )
  .option(
    '--log-path <path>',
    'if run as daemon file that will be used as a log, default /dev/null',
    String,
    '/dev/null'
  )
  .option(
    '--url-path <path>',
    'URL path for the browser application, default /',
    String,
    '/'
  )
  .option('--ui-hide-topbar', 'hide topbar (log file name and search box)')
  .option('--ui-no-indent', "don't indent log lines")
  .option(
    '--ui-highlight',
    'highlight words or lines if defined string found in logs, default preset'
  )
  .option(
    '--ui-highlight-preset <path>',
    'custom preset for highlighting (see ./preset/default.json)'
  )
  .option('--disable-usage-stats', 'disable gathering usage statistics');

module.exports = program;
