# frontail(1) – tail -F output in browser

```frontail``` is node.js application for serving `tail -F` output to browser.

[![Build Status](https://travis-ci.org/mthenw/frontail.png?branch=master)](https://travis-ci.org/mthenw/frontail)
[![NPM version](https://badge.fury.io/js/frontail.png)](http://badge.fury.io/js/frontail)

## Features

* search
* user authentication
* log rotation
* autoscrolling
* marking logs
* themes
* number of unreaded logs in favicon

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

Web interface is on http://localhost:[port]

## Screenshot

![screenshot1](http://dl.dropboxusercontent.com/u/3101412/frontail4.png)
