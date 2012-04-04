# frontail – tail -F output in browser

## Introduction

frontail is node.js application for serving `tail -F` output to browser using [socket.io](http://socket.io/).

## Usage

    frontail [options] [file ...]

    Options:

      -h, --help             output usage information
      -V, --version          output the version number
      -p, --port <port>      server port, default 9001
      -n, --number <number>  starting lines number, default 10
      -d, --daemonize        run as daemon
      --pid-path <path>      if run as deamon file that will store the process ID, default /var/run/frontail.pid
      --log-path <path>      if run as deamon file that will be used as a log, default /dev/null

## Screenshot

![screenshot1](http://dl.dropbox.com/u/3101412/frontail1.png)