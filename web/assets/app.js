/* global Tinycon:false, ansi_up:false */

window.App = (function app(window, document) {
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
   * @type {HTMLElement}
   * @private
   */
  var _topbar;

  /**
   * @type {HTMLElement}
   * @private
   */
  var _body;

  /**
   * @type {number}
   * @private
   */
  var _linesLimit = Math.Infinity;

  /**
   * @type {number}
   * @private
   */
  var _newLinesCount = 0;

  /**
   * @type {boolean}
   * @private
   */
  var _isWindowFocused = true;

  /**
   * @type {object}
   * @private
   */
  var _highlightConfig;

  /**
   * Hide element if doesn't contain filter value
   *
   * @param {Object} element
   * @private
   */
  var _filterElement = function(elem) {
    var pattern = new RegExp(_filterValue, 'i');
    var element = elem;
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
  var _filterLogs = function() {
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
   * Set _filterValue from URL parameter `filter`
   *
   * @function
   * @private
   */
  var _setFilterValueFromURL = function(filterInput, uri) {
    var _url = new URL(uri);
    var _filterValueFromURL = _url.searchParams.get('filter');
    if (typeof _filterValueFromURL !== 'undefined' && _filterValueFromURL !== null) {
      _filterValue = _filterValueFromURL;
      filterInput.value = _filterValue; // eslint-disable-line
    }
  };

  /**
   * Set parameter `filter` in URL
   *
   * @function
   * @private
   */
  var _setFilterParam = function(value, uri) {
    var _url = new URL(uri);
    var _params = new URLSearchParams(_url.search.slice(1));
    if (value === '') {
      _params.delete('filter');
    } else {
      _params.set('filter', value);
    }
    _url.search = _params.toString();
    window.history.replaceState(null, document.title, _url.toString());
  };

  /**
   * @return {Boolean}
   * @private
   */
  var _isScrolledBottom = function() {
    var currentScroll = document.documentElement.scrollTop || document.body.scrollTop;
    var totalHeight = document.body.offsetHeight;
    var clientHeight = document.documentElement.clientHeight; // eslint-disable-line
    return totalHeight <= currentScroll + clientHeight;
  };

  /**
   * @return void
   * @private
   */
  var _faviconReset = function() {
    _newLinesCount = 0;
    Tinycon.setBubble(0);
  };

  /**
   * @return void
   * @private
   */
  var _updateFaviconCounter = function() {
    if (_isWindowFocused) {
      return;
    }

    if (_newLinesCount < 99) {
      _newLinesCount += 1;
      Tinycon.setBubble(_newLinesCount);
    }
  };

  /**
   * @return String
   * @private
   */
  var _highlightWord = function(line) {
    var output = line;

    if (_highlightConfig && _highlightConfig.words) {
      Object.keys(_highlightConfig.words).forEach((wordCheck) => {
        output = output.replace(
          wordCheck,
          '<span style="' + _highlightConfig.words[wordCheck] + '">' + wordCheck + '</span>'
        );
      });
    }

    return output;
  };

  /**
   * @return HTMLElement
   * @private
   */
  var _highlightLine = function(line, container) {
    if (_highlightConfig && _highlightConfig.lines) {
      Object.keys(_highlightConfig.lines).forEach((lineCheck) => {
        if (line.indexOf(lineCheck) !== -1) {
          container.setAttribute('style', _highlightConfig.lines[lineCheck]);
        }
      });
    }

    return container;
  };

  return {
    /**
     * Init socket.io communication and log container
     *
     * @param {Object} opts options
     */
    init: function init(opts) {
      var self = this;

      // Elements
      _logContainer = opts.container;
      _filterInput = opts.filterInput;
      _filterInput.focus();
      _topbar = opts.topbar;
      _body = opts.body;

      _setFilterValueFromURL(_filterInput, window.location.toString());

      // Filter input bind
      _filterInput.addEventListener('keyup', function(e) {
        // ESC
        if (e.keyCode === 27) {
          this.value = '';
          _filterValue = '';
        } else {
          _filterValue = this.value;
        }
        _setFilterParam(_filterValue, window.location.toString());
        _filterLogs();
      });

      // Favicon counter bind
      window.addEventListener(
        'blur',
        function() {
          _isWindowFocused = false;
        },
        true
      );
      window.addEventListener(
        'focus',
        function() {
          _isWindowFocused = true;
          _faviconReset();
        },
        true
      );

      // socket.io init
      _socket = opts.socket;
      _socket
        .on('options:lines', function(limit) {
          _linesLimit = limit;
        })
        .on('options:hide-topbar', function() {
          _topbar.className += ' hide';
          _body.className = 'no-topbar';
        })
        .on('options:no-indent', function() {
          _logContainer.className += ' no-indent';
        })
        .on('options:highlightConfig', function(highlightConfig) {
          _highlightConfig = highlightConfig;
        })
        .on('line', function(line) {
          self.log(line);
        });
    },

    /**
     * Log data
     *
     * @param {string} data data to log
     */
    log: function log(data) {
      var wasScrolledBottom = _isScrolledBottom();
      var div = document.createElement('div');
      var p = document.createElement('p');
      p.className = 'inner-line';

      // convert ansi color codes to html && escape HTML tags
      data = ansi_up.escape_for_html(data); // eslint-disable-line
      data = ansi_up.ansi_to_html(data); // eslint-disable-line
      p.innerHTML = _highlightWord(data);

      div.className = 'line';
      div = _highlightLine(data, div);
      div.addEventListener('click', function click() {
        if (this.className.indexOf('selected') === -1) {
          this.className = 'line-selected';
        } else {
          this.className = 'line';
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

      _updateFaviconCounter();
    }
  };
}(window, document));
