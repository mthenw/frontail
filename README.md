# frontail – tail -F output in browser

frontail is node.js application for serving `tail -F` output to browser using [socket.io](http://socket.io/).

### Features

* basic auth
* filtering logs (press Tab to focus input)
* terminal-like autoscrolling
* marking logs

## Installation

    npm install frontail -g

## Usage

    frontail [options] [file ...]

    Options:

      -h, --help                output usage information
      -V, --version             output the version number
      -p, --port <port>         server port, default 9001
      -n, --number <number>     starting lines number, default 10
      -l, --lines <number>      number on lines stored in frontend, default 2000
      -d, --daemonize           run as daemon
      -U, --user <username>     Basic Auth user
      -P, --password <password> Basic Auth password
      --pid-path <path>         if run as daemon file that will store the process ID, default /var/run/frontail.pid
      --log-path <path>         if run as daemon file that will be used as a log, default /dev/null

Web interface is on http://localhost:[port]

## Screenshot

![screenshot1](http://dl.dropbox.com/u/3101412/frontail3.png)

## License

(The MIT License)

Copyright 2013 Maciej Winnicki http://maciejwinnicki.pl

This project is free software released under the MIT/X11 license:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
