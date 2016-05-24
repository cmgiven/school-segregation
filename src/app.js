import './index.html';
import './assets/styles/app.scss';

import { json as d3_json } from 'd3-request';
import { select, event } from 'd3-selection';

import { requireAll } from './utils.js';

const START_YEAR = 1993;
const END_YEAR = 2013;

const TRANSITION_DURATION = 300; // 18 frames
const SNAP_DURATION = 83; // 5 frames

const Controls = requireAll(require.context('./controls/', false, /^\.\/.*\.js$/));
const Sections = requireAll(require.context('./sections/', false, /^\.\/.*\.js$/));

const controlContainer = select('#controls .container');
const sectionContainer = select('main');

const regions = require('./assets/data/regions.json');

const dataPathForId = (id) => `/data/${id}.json`;

const app = {
  globals: {
    controlsVisible: false,
    animating: false,
    year: END_YEAR,
    roundYear: END_YEAR,
    region: undefined,
    data: null
  },

  controls: [],
  sections: [],
  activeSection: undefined,

  transitionQueue: [],
  activeTransitions: {},
  needsUpdate: false,

  initialize: function () {
    app.controls = Controls.map((C) => new C({ container: controlContainer, owner: app }));
    app.sections = Sections.map((S) => new S({ container: sectionContainer, owner: app }));

    app.loadStateFromHash();

    select(window)
      .on('resize', app.resize)
      .on('hashchange', app.loadStateFromHash)
      .on('keydown', function () {
        switch (event.which) {
        case 32: // space
          app.toggleAnimation();
          break;

        default:
          return;
        }

        event.preventDefault();
      });
  },

  setSection: function (idx) {
    console.log(idx);
    if (idx < 0 || idx >= app.sections.length) { return; }

    let currentSection = app.activeSection;
    app.activeSection = app.sections[idx];

    if (currentSection) {
      let currentIdx = app.sections.findIndex((s) => s === currentSection);
      if (currentIdx === idx) { return; }

      // TODO: animate in/out the sections
      currentSection.wrap.classed('visible', false);
      app.activeSection.wrap.classed('visible', true);
    } else {
      app.activeSection.wrap.classed('visible', true);
    }

    app.resize();
    app.setHash();
  },

  loadData: function () {
    let path = dataPathForId(app.globals.region.id);
    d3_json(path, function (data) {
      app.enqueueTransitions([{ key: 'data', value: data }]);
    });
  },

  resize: function () {
    if (app.activeSection && app.activeSection.resize) { app.activeSection.resize(app.globals); }
    // app.controls.forEach(function (c) { if (c.resize) { c.resize(); } });
  },

  update: function () {
    if (app.activeSection && app.activeSection.update) { app.activeSection.update(app.globals); }
    app.controls.forEach(function (c) { if (c.update) { c.update(app.globals); } });
  },

  animationFrame: function (time) {
    var updatedProps = {};

    while (app.transitionQueue.length) {
      var update = app.transitionQueue.shift();

      if (update.transition === 0) {
        updatedProps[update.key] = update.value;
        if (app.activeTransitions[update.key]) {
          delete app.activeTransitions[update.key];
        }
      } else {
        var originalValue = updatedProps[update.key] || app.globals[update.key];

        app.activeTransitions[update.key] = {
          value: update.value,
          distance: originalValue - update.value,
          duration: update.transition,
          start: time
        };
      }
    }

    for (var property in app.activeTransitions) {
      var transition = app.activeTransitions[property];
      var remaining = time === transition.start ? 1 :
        Math.max(1 - (time - transition.start) / transition.duration, 0);

      updatedProps[property] = transition.value + (transition.distance * remaining);

      if (remaining === 0) { delete app.activeTransitions[property]; }
    }

    if (Object.keys(updatedProps).length) {
      if (updatedProps.year) { updatedProps.roundYear = Math.round(updatedProps.year); }
      if (updatedProps.region) { updatedProps.data = null; app.loadData(); }

      updatedProps.animating = app.activeTransitions.year &&
        app.activeTransitions.year.duration > SNAP_DURATION;

      app.globals = Object.assign({}, app.globals, updatedProps);
      app.update();

      window.requestAnimationFrame(app.animationFrame);
    } else {
      app.needsUpdate = false;
    }
  },

  enqueueTransitions: function (arr) {
    arr.forEach(function (prop) {
      app.transitionQueue.push({
        key: prop.key,
        value: prop.value,
        transition: prop.transition || 0
      });
    });

    if (!app.needsUpdate) {
      app.needsUpdate = true;
      window.requestAnimationFrame(app.animationFrame);
    }
  },

  toggleAnimation: function () {
    var currentYear = app.globals.year;

    if (app.globals.animating) {
      app.enqueueTransitions([{
        key: 'year',
        value: app.globals.roundYear,
        transition: SNAP_DURATION
      }]);
    } else {
      var transitions = [];

      if (currentYear === END_YEAR) {
        transitions.push({ key: 'year', value: START_YEAR });
        currentYear = START_YEAR;
      }

      transitions.push({
        key: 'year',
        value: END_YEAR,
        transition: (END_YEAR - currentYear) * TRANSITION_DURATION
      });

      app.enqueueTransitions(transitions);
    }
  },

  setYear: function (year, smooth) {
    app.enqueueTransitions([{
      key: 'year',
      value: year,
      transition: smooth ? SNAP_DURATION : 0
    }]);
  },

  setRegion: function (id) {
    app.enqueueTransitions([{ key: 'region', value: regions.find((d) => d.id === id) }]);
    app.setHashParam('region', id);
  },

  setControlsVisibility: function (visible) {
    app.enqueueTransitions([{ key: 'controlsVisible', value: visible }]);
  },

  loadStateFromHash: function () {
    let { location, params } = app.getHash();

    let sectionIdx = location ? Math.max(app.sections.findIndex((s) => s.id === location), 0) : 0;

    if (params) {
      let regionP = params.find((p) => p[0] === 'region');
      let regionId = regionP ? regionP[1] : 'all';
      app.globals.region = regions.find((d) => d.id === regionId);
    }

    app.setSection(sectionIdx);
  },

  getHash: function () {
    let hash = window.location.hash;
    if (!hash) { return {}; }

    let [location, paramStr] = hash.substring(1).split('?');
    if (!paramStr) { return { location }; }

    let params = paramStr.split('&').map((p) => p.split('='));
    return { location, params };
  },

  setHash: function (location, params) {
    location = location || app.activeSection.id;
    params = params || app.getHash().params;

    return location + (params ? '?' + params.map((p) => p.join('=')).join('&') : '');
  },

  setHashParam: function (key, value) {
    let currentParams = app.getHash().params || [];
    let params = currentParams.filter((p) => p[0] !== key).push([key, value]);
    app.setHash(undefined, params);
  }
};

app.initialize();
