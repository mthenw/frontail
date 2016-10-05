'use strict';

const fs = require('fs');
const jsdom = require('jsdom');
const EventEmitter = require('events').EventEmitter;

describe('browser application', () => {
  let io;
  let window;

  function initApp() {
    window.App.init({
      socket: io,
      container: window.document.querySelector('.log'),
      filterInput: window.document.querySelector('#filter'),
      topbar: window.document.querySelector('.topbar'),
      body: window.document.querySelector('body'),
    });
  }

  function clickOnElement(line) {
    const click = window.document.createEvent('MouseEvents');
    click.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    line.dispatchEvent(click);
  }

  beforeEach((done) => {
    io = new EventEmitter();
    const html = '<title></title><body><div class="topbar"></div>' +
      '<div class="log"></div><input type="test" id="filter"/></body>';
    const ansiup = fs.readFileSync('./lib/web/assets/ansi_up.js', 'utf-8');
    const src = fs.readFileSync('./lib/web/assets/app.js', 'utf-8');

    jsdom.env({
      html,
      src: [ansiup, src],
      onload: (domWindow) => {
        window = domWindow;

        initApp();
        done();
      },
    });
  });

  it('should show lines from socket.io', () => {
    io.emit('line', 'test');

    const log = window.document.querySelector('.log');
    log.childNodes.length.should.be.equal(1);
    log.childNodes[0].textContent.should.be.equal('test');
    log.childNodes[0].className.should.be.equal('line');
    log.childNodes[0].tagName.should.be.equal('DIV');
    log.childNodes[0].innerHTML.should.be.equal('<p class="inner-line">test</p>');
  });

  it('should select line when clicked', () => {
    io.emit('line', 'test');

    const line = window.document.querySelector('.line');
    clickOnElement(line);

    line.className.should.be.equal('line-selected');
  });

  it('should deselect line when selected line clicked', () => {
    io.emit('line', 'test');

    const line = window.document.querySelector('.line');
    clickOnElement(line);
    clickOnElement(line);

    line.className.should.be.equal('line');
  });

  it('should limit number of lines in browser', () => {
    io.emit('options:lines', 2);
    io.emit('line', 'line1');
    io.emit('line', 'line2');
    io.emit('line', 'line3');

    const log = window.document.querySelector('.log');
    log.childNodes.length.should.be.equal(2);
    log.childNodes[0].textContent.should.be.equal('line2');
    log.childNodes[1].textContent.should.be.equal('line3');
  });

  it('should hide topbar', () => {
    io.emit('options:hide-topbar');

    const topbar = window.document.querySelector('.topbar');
    topbar.className.should.match(/hide/);
    const body = window.document.querySelector('body');
    body.className.should.match(/no-topbar/);
  });

  it('should not indent log lines', () => {
    io.emit('options:no-indent');

    const log = window.document.querySelector('.log');
    log.className.should.match(/no-indent/);
  });

  it('should highlight word', () => {
    io.emit('options:highlightConfig', {
      words: {
        line: 'background: black',
      },
    });
    io.emit('line', 'line1');

    const line = window.document.querySelector('.line');
    line.innerHTML.should.containEql('<span style="background: black">line</span>');
  });

  it('should highlight line', () => {
    io.emit('options:highlightConfig', {
      lines: {
        line: 'background: black',
      },
    });
    io.emit('line', 'line1');

    const line = window.document.querySelector('.line');
    line.parentNode.innerHTML.should.equal(
      '<div class="line" style="background: black"><p class="inner-line">line1</p></div>'
    );
  });

  it('should escape HTML', () => {
    io.emit('line', '<a/>');

    const line = window.document.querySelector('.line');
    line.innerHTML.should.equal('<p class="inner-line">&lt;a/&gt;</p>');
  });
});
