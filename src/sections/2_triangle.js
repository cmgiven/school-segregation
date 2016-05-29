import { Section, diff } from '../utils';
import { RACES } from '../config';

import TriangleChart from '../components/triangle-chart';
import DemographicTooltip from '../components/demographic-tooltip';

export default class TriangleSection extends Section {
  constructor(options) {
    super(options);
    this.id = 'triangle';
    this.el.attr('id', this.id);

    this.state = {
      highlight: null,
      stickyHighlight: false,
      jumboHighlight: true
    };

    this.components.push(new TriangleChart({ container: this.el, owner: this }));
    this.components.push(new DemographicTooltip({ container: this.el, owner: this }));
  }

  update(props, forceUpdate) {
    let state = this.state = Object.assign({}, this.state, props);
    diff(state, this.id)
      .ifDiff(['year', 'data'], function (p) {
        if (p.data) {
          let tween = p.year % 1;

          if (tween === 0) {
            state.tweenedTriangle = p.data[p.year].triangle;
            state.tweenedSummary = p.data[p.year].summary;
          } else {
            let data0 = p.data[Math.floor(p.year)].triangle;
            let data1 = p.data[Math.ceil(p.year)].triangle;
            state.tweenedTriangle = data0.map(function (d0, i) {
              let d1 = data1[i];
              let result = {};
              Object.keys(d1).forEach(function (k) {
                result[k] = d0[k] * (1 - tween) + d1[k] * tween;
              });
              return result;
            });
            let summaryData0 = p.data[Math.floor(p.year)].summary;
            let summaryData1 = p.data[Math.ceil(p.year)].summary;
            let tweenedSummary = {};
            Object.keys(summaryData1).forEach(function (k) {
              tweenedSummary[k] = summaryData0[k] * (1 - tween) + summaryData1[k] * tween;
            });
            state.tweenedSummary = tweenedSummary;
          }
        } else {
          state.tweenedTriangle = null;
          state.tweenedSummary = null;
        }
      });
    super.update(state, forceUpdate);
  }

  highlight(target, sticky) {
    if (!this.state.stickyHighlight || typeof sticky !== 'undefined') {
      if (target && this.state.highlight && target[0] === this.state.highlight[0]) {
        if (!sticky) {
          return;
        } else if (this.state.stickyHighlight) {
          sticky = false;
        }
      }
      this.update({
        highlight: target,
        stickyHighlight: !!target && !!sticky
      });
    }
  }

  toggleHighlightSize() {
    this.update({
      highlight: null,
      stickyHighlight: false,
      jumboHighlight: !this.state.jumboHighlight
    });
  }
}
