# frontail – streaming logs to the browser

```frontail``` is a Node.js application for streaming logs to the browser. It's a `tail -F` with UI.

![frontial](https://user-images.githubusercontent.com/455261/29570317-660c8122-8756-11e7-9d2f-8fea19e05211.gif)

[![Build Status](https://img.shields.io/travis/mthenw/frontail.svg?style=flat)](https://travis-ci.org/mthenw/frontail)
[![Docker Pulls](https://img.shields.io/docker/pulls/mthenw/frontail.svg)](https://hub.docker.com/r/mthenw/frontail/)

## Quick start

- `npm i frontail -g` or download a binary file from [Releases](https://github.com/mthenw/frontail/releases) page
- `frontail /var/log/syslog`
- visit [http://127.0.0.1:9001](http://127.0.0.1:9001)

## Features

* log rotation
* auto-scrolling
* marking logs
* number of unread logs in favicon
* themes (default, dark)
* [highlighting](#highlighting)
* search (```Tab``` to focus, ```Esc``` to clear)
* tailing [multiple files](#tailing-multiple-files) and [stdin](#stdin)
* basic authentication

## Installation options

* download a binary file from [Releases](https://github.com/mthenw/frontail/releases) page
* using [npm package](https://www.npmjs.com/package/frontail): `npm i frontail -g`
* using [Docker image](https://registry.hub.docker.com/u/mthenw/frontail/): `docker run -d -P -v /var/log:/log mthenw/frontail /log/syslog`

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
      --ui-no-indent                don't indent log lines
      --ui-highlight                highlight words or lines if defined string found in logs, default preset
      --ui-highlight-preset <path>  custom preset for highlighting (see ./preset/default.json)
      --path <path>                 prefix path for the running application, default /

Web interface runs on **http://127.0.0.1:[port]**.

### Tailing multiple files

`[file ...]` accepts multiple paths, `*`, `?` and other shell special characters([Wildcards, Quotes, Back Quotes and Apostrophes in shell commands](http://www.codecoffee.com/tipsforlinux/articles/26-1.html)).

### stdin

Use `-` for streaming stdin:

    ./server | frontail -

### Highlighting

```--ui-highlight``` option turns on highlighting in UI. By default preset from ```./preset/default.json``` is used:

```
{
    "words": {
        "err": "color: red;"
    },
    "lines": {
        "err": "font-weight: bold;"
    }
}
```

which means that every "err" string will be in red and every line containing "err" will be bolded.

*New presets are very welcome. If you don't like default or you would like to share yours, please create PR with json file.*

### Running behind nginx

Using the `--path` option frontail can run behind nginx with the example configuration

Using frontail with `--path /frontail`


```
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

location ~/frontail/(?<rst>.*)$ {
    proxy_pass http://127.0.0.1:9001/$rst?$args;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $connection_upgrade;

    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $http_host;
}
```
