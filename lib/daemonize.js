'use strict';

var daemon = require('daemon');
var fs = require('fs');

var defaultOptions = {
    doAuthorization: false,
    doSecure: false
};

module.exports = function (script, params, options) {
    options = options || defaultOptions;

    var logFile = fs.openSync(params.logPath, 'a');

    var args = [
        '-h', params.host,
        '-p', params.port,
        '-n', params.number,
        '-l', params.lines,
        '-t', params.theme
    ];

    if (options.doAuthorization) {
        args.push(
            '-U', params.user,
            '-P', params.password
        );
    }

    if (options.doSecure) {
        args.push(
            '-k', params.key,
            '-c', params.certificate
        );
    }

    if (options.doSSH) {
        args.push(
            '--remote-host', params.remoteHost,
            '--remote-user', params.remoteUser,
            '--remote-port', params.remotePort
        );
    }

    if (params.uiHideTopbar) {
        args.push('--ui-hide-topbar');
    }

    if (!params.uiIndent) {
        args.push('--ui-no-indent');
    }

    if (params.uiHighlight) {
        args.push('--ui-highlight', '--ui-highlight-preset', params.uiHighlightPreset);
    }

    args = args.concat(params.args);

    var proc = daemon.daemon(script, args, {
        stdout: logFile,
        stderr: logFile
    });

    fs.writeFileSync(params.pidPath, proc.pid);
};
