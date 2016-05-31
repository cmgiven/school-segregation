import './index.html';
import './assets/styles/app.scss';

import { json as d3_json } from 'd3-request';
import { select, selectAll, event } from 'd3-selection';

import { requireAll } from './utils';
import { TRANSITION_DURATION, SNAP_DURATION, END_YEAR, START_YEAR, RACES } from './config';

import YearControl from './controls/year';
import RegionControl from './controls/region';
const Sections = requireAll(require.context('./sections/', false, /^\.\/.*\.js$/));

const controlContainer = select('#controls .container');
const sectionContainer = select('main');

const regions = require('./assets/data/regions.json');

const dataPathForId = (id) => `data/${id}.json`;

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
    app.controls = [
      new YearControl({ container: controlContainer, owner: app }),
      new RegionControl({ container: controlContainer, owner: app, regions })
    ];
    app.sections = Sections.map((S) => new S({ container: sectionContainer, owner: app }));

    selectAll('a').on('click', function() {
      let href = select(event.target).attr('href');
      if (href.charAt(0) === '#') {
        app.setSection(app.sections.findIndex((s) => s.id === href.substring(1)));
        event.preventDefault();
      }
    });

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

    app.loadStateFromHash();
  },

  setSection: function (idx) {
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

    let nav = select('#section-nav');
    nav.select('.current-section').text(idx + 1);
    let prev = nav.select('.prev-section');
    if (idx >= 1) { prev.attr('href', '#' + app.sections[idx - 1].id); }
    prev.classed('disabled', idx < 1);
    let next = nav.select('.next-section');
    if (idx < app.sections.length - 1) { next.attr('href', '#' + app.sections[idx + 1].id); }
    next.classed('disabled', idx >= app.sections.length - 1);

    app.resize();
    app.setHash();
  },

  loadData: function () {
    let path = dataPathForId(app.globals.region.id);
    d3_json(path, function (data) {
      function sumStudents(row) {
        row.students = RACES.reduce((sum, r) => row[r] ? sum + row[r] : sum, 0);
      }
      for (let year in data) {
        sumStudents(data[year].summary);
        data[year].triangle.forEach(sumStudents);
      }
      app.enqueueTransitions([{ key: 'data', value: data }]);
    });
  },

  resize: function () {
    if (app.activeSection && app.activeSection.resize) { app.activeSection.resize(); }
    app.controls.forEach(function (c) { if (c.resize) { c.resize(); } });
    app.update(true);
  },

  update: function (forceUpdate) {
    if (app.activeSection && app.activeSection.update) { app.activeSection.update(app.globals, forceUpdate); }
    app.controls.forEach(function (c) { if (c.update) { c.update(app.globals, forceUpdate); } });
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
    } else {
      app.globals.region = regions[0];
    }

    app.setSection(sectionIdx);
    app.loadData();
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

    window.location.hash = location + (params ? '?' + params.map((p) => p.join('=')).join('&') : '');
  },

  setHashParam: function (key, value) {
    let currentParams = app.getHash().params || [];
    let params = currentParams.filter((p) => p[0] !== key);
    params.push([key, value]);
    app.setHash(undefined, params);
  }
};

window.addEventListener("load", app.initialize);
