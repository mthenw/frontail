'use strict';

require('should');
var jsdom = require('jsdom');
var EventEmitter = require('events').EventEmitter;

describe('browser application', function () {
    var window, io;

    beforeEach(function (done) {
        io = new EventEmitter();

        jsdom.env(
            '<title></title><body><div class="topbar"></div>' +
                '<div class="log"></div><input type="test" id="filter"/></body>',
            ['../lib/web/assets/app.js', './lib/jquery.js'],
            function (errors, domWindow) {
                window = domWindow;

                initApp();
                done();
            }
        );
    });

    it('should show lines from socket.io', function () {
        io.emit('line', 'test');

        var log = window.document.querySelector('.log');
        log.childNodes.length.should.be.equal(1);
        log.childNodes[0].textContent.should.be.equal('test');
        log.childNodes[0].className.should.be.equal('line');
        log.childNodes[0].tagName.should.be.equal('DIV');
        log.childNodes[0].innerHTML.should.be.equal('<p class="inner-line">test</p>');
    });

    it('should select line when clicked', function () {
        io.emit('line', 'test');

        var line = window.document.querySelector('.line');
        clickOnElement(line);

        line.className.should.be.equal('line-selected');
    });

    it('should deselect line when selected line clicked', function () {
        io.emit('line', 'test');

        var line = window.document.querySelector('.line');
        clickOnElement(line);
        clickOnElement(line);

        line.className.should.be.equal('line');
    });

    it('should limit number of lines in browser', function () {
        io.emit('options:lines', 2);
        io.emit('line', 'line1');
        io.emit('line', 'line2');
        io.emit('line', 'line3');

        var log = window.document.querySelector('.log');
        log.childNodes.length.should.be.equal(2);
        log.childNodes[0].textContent.should.be.equal('line2');
        log.childNodes[1].textContent.should.be.equal('line3');
    });

    it('should hide topbar', function () {
        io.emit('options:hide-topbar');

        var topbar = window.document.querySelector('.topbar');
        topbar.className.should.match(/hide/);
        var body = window.document.querySelector('body');
        body.className.should.match(/no-topbar/);
    });

    it('should not indent log lines', function () {
        io.emit('options:no-indent');

        var log = window.document.querySelector('.log');
        log.className.should.match(/no-indent/);
    });

    it('should highlight word', function () {
        io.emit('options:highlightConfig', {words: {line: 'background: black'}});
        io.emit('line', 'line1');

        var line = window.document.querySelector('.line');
        line.innerHTML.should.containEql('<span style="background: black">line</span>');
    });

    it('should highlight line', function () {
        io.emit('options:highlightConfig', {lines: {line: 'background: black'}});
        io.emit('line', 'line1');

        var line = window.document.querySelector('.line');
        line.parentNode.innerHTML.should.equal(
            '<div class="line" style="background: black;"><p class="inner-line">line1</p></div>'
        );
    });

    function initApp() {
        window.App.init({
            socket: io,
            container: window.document.querySelector('.log'),
            filterInput: window.document.querySelector('#filter'),
            topbar: window.document.querySelector('.topbar'),
            body: window.document.querySelector('body')
        });
    }

    function clickOnElement(line) {
        var click = window.document.createEvent('MouseEvents');
        click.initMouseEvent('click', true, true);
        line.dispatchEvent(click);
    }
});
