'use strict';

const ua = require('universal-analytics');
const isDocker = require('is-docker');
const Configstore = require('configstore');
const { v4: uuidv4 } = require('uuid');
const pkg = require('../package.json');

const trackingID = 'UA-129582046-1';

// Usage stats
function Stats(enabled, opts) {
  this.timer = {};

  if (enabled === true) {
    const config = new Configstore(pkg.name);
    let clientID = uuidv4();
    if (config.has('clientID')) {
      clientID = config.get('clientID');
    } else {
      config.set('clientID', clientID);
    }

    const tracker = ua(trackingID, clientID);
    tracker.set('aip', 1); // Anonymize IP
    tracker.set('an', 'frontail'); // Application Name
    tracker.set('av', pkg.version); // Application Version
    tracker.set('ds', 'app'); // Data Source
    tracker.set('cd1', process.platform); // platform
    tracker.set('cd2', process.arch); // arch
    tracker.set('cd3', process.version.match(/^v(\d+\.\d+)/)[1]); // Node version
    tracker.set('cd4', isDocker()); // is Docker
    tracker.set('cd5', opts.number !== 10); // is --number parameter set
    this.tracker = tracker;
  }

  return this;
}

Stats.prototype.track = function track(category, action) {
  if (!this.tracker) {
    return;
  }
  this.tracker.event(category, action).send();
};

Stats.prototype.time = function time(category, action) {
  if (!this.tracker) {
    return;
  }

  if (!this.timer[category]) {
    this.timer[category] = {};
  }
  this.timer[category][action] = Date.now();
};

Stats.prototype.timeEnd = function timeEnd(category, action, cb) {
  if (!this.tracker) {
    cb();
    return;
  }

  this.tracker
    .timing(category, action, Date.now() - this.timer[category][action])
    .send(cb);
};

module.exports = (enabled, opts) => new Stats(enabled, opts);
