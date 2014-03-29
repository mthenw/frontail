# frontail(1) – tail -F output in browser

```frontail``` is node.js application for serving `tail -F` output to browser.

[![Build Status](https://travis-ci.org/mthenw/frontail.svg?branch=master)](https://travis-ci.org/mthenw/frontail)
[![NPM version](https://badge.fury.io/js/frontail.png)](http://badge.fury.io/js/frontail)

## Features

* search (```Tab``` to focus, ```Esc``` to clear)
* user basic authentication
* log rotation
* auto-scrolling
* marking logs
* themes (default, dark)
* number of unread logs in favicon

## Installation

    npm install frontail -g

## Usage

    frontail [options] [file ...]

    Options:

      -h, --help                    output usage information
      -V, --version                 output the version number
      -h, --host <host>             listening host, default 0.0.0.0
      -p, --port <port>             listening port, default 9001
      -n, --number <number>         starting lines number, default 10
      -l, --lines <lines>           number on lines stored in browser, default 2000
      -t, --theme <theme>           name of the theme (default, dark)
      -d, --daemonize               run as daemon
      -U, --user <username>         Basic Authentication username, option works only along with -P option
      -P, --password <password>     Basic Authentication password, option works only along with -U option
      -k, --key <key.pem>           Private Key for HTTPS, option works only along with -c option
      -c, --certificate <cert.pem>  Certificate for HTTPS, option works only along with -k option
      --pid-path <path>             if run as daemon file that will store the process id, default /var/run/frontail.pid
      --log-path <path>             if run as daemon file that will be used as a log, default /dev/null
      --ui-hide-topbar              hide topbar (log file name and search box)
      --ui-no-indent                don't indent log lines (every line after first one)

Web interface is on http://localhost:[port]

## Screenshot

![screenshot1](https://dl.dropboxusercontent.com/u/3101412/frontail1.0.png)
