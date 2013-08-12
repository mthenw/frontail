(function () {
    'use strict';

    var EventEmitter = require('events').EventEmitter;
    var util = require('util');
    var spawn = require('child_process').spawn;

    var Tail = function (path) {
        EventEmitter.call(this);

        var self = this;
        var tail = spawn('tail', ['-F'].concat(path));

        tail.stdout.on('data', function (data) {
            var line = data.toString('utf-8');
            self.emit('line', line);
        });
    };
    util.inherits(Tail, EventEmitter);


    module.exports = function (path) {
        return new Tail(path);
    };
})();
