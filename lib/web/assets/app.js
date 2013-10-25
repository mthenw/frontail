window.App = (function (window, document, io) {
    'use strict';

    /**
     * @type {Object}
     * @private
     */
    var _socket;

    /**
     * @type {HTMLElement}
     * @private
     */
    var _logContainer;

    /**
     * @type {HTMLElement}
     * @private
     */
    var _filterInput;

    /**
     * @type {String}
     * @private
     */
    var _filterValue = '';

    /**
     * @type {number}
     * @private
     */
    var _linesLimit = Math.Infinity;

    /**
     * Hide element if doesn't contain filter value
     *
     * @param {Object} element
     * @private
     */
    var _filterElement = function (element) {
        var pattern = new RegExp(_filterValue, 'i');
        if (pattern.test(element.textContent)) {
            element.style.display = '';
        } else {
            element.style.display = 'none';
        }
    };

    /**
     * Filter logs based on _filterValue
     *
     * @function
     * @private
     */
    var _filterLogs = function () {
        var collection = _logContainer.childNodes;
        var i = collection.length;

        if (i === 0) {
            return;
        }

        while (i) {
            _filterElement(collection[i - 1]);
            i -= 1;
        }
        window.scrollTo(0, document.body.scrollHeight);
    };

    /**
     * Is page is scrolled to bottom
     *
     * @return {Boolean}
     * @private
     */
    var _scrolledBottom = function () {
        var currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
        var totalHeight = document.body.offsetHeight;
        var clientHeight = document.documentElement.clientHeight;
        return totalHeight <= currentScroll + clientHeight;
    };

    return {
        /**
         * Init socket.io communication and log container
         *
         * @param {Object} opts options
         */
        init: function (opts) {
            var that = this;

            // socket.io init
            _socket  = new io.connect();
            _socket
                .on('options:lines', function (limit) {
                    _linesLimit = limit;
                })
                .on('line', function (line) {
                    that.log(line);
                });

            // Elements
            _logContainer = opts.container;
            _filterInput = opts.filterInput;
            _filterInput.focus();

            // Filter input bind
            _filterInput.addEventListener('keyup', function (e) {
                if (e.keyCode === 27) { //esc
                    this.value = '';
                    _filterValue = '';
                } else {
                    _filterValue = this.value;
                }
                _filterLogs();
            });
        },

        /**
         * Log data
         *
         * @param {string} data data to log
         */
        log: function (data) {
            var wasScrolledBottom = _scrolledBottom();
            var div = document.createElement('div');
            var p = document.createElement('p');
            p.className = 'inner-line';
            p.innerHTML = data;

            div.className = 'line';
            div.addEventListener('click', function () {
                if (this.className.indexOf('selected') === -1) {
                    this.className += ' selected';
                } else {
                    this.className = this.className.replace(/selected/g, '');
                }
            });

            div.appendChild(p);
            _filterElement(div);
            _logContainer.appendChild(div);

            if (_logContainer.children.length > _linesLimit) {
                _logContainer.removeChild(_logContainer.children[0]);
            }

            if (wasScrolledBottom) {
                window.scrollTo(0, document.body.scrollHeight);
            }
        }
    };
})(window, document, io);
