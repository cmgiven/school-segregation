import { Component, diff } from '../utils.js';

import { event } from 'd3-selection';

import { START_YEAR, END_YEAR } from '../config.js';
const SLIDER_WIDTH = 28;

export default class extends Component {
  constructor(options) {
    super(options);
    this.id = 'year-control';
    this.el.classed('control ' + this.id, true);
    let control = this;

    this.playButton = this.el.append('button')
      .attr('class', 'play-button')
      .on('click', function () {
        if (!this.disabled) { control.owner.toggleAnimation(); }
      });

    this.label = this.el.append('span')
      .attr('class', 'label');

    this.slider = this.el.append('input')
      .attr('class', 'slider')
      .attr('type', 'range')
      .attr('min', START_YEAR)
      .attr('max', END_YEAR)
      .attr('step', 0.01)
      .on('mousedown', function () {
        let width = event.target.offsetWidth - SLIDER_WIDTH;
        let center = event.offsetX - SLIDER_WIDTH / 2;
        let year = START_YEAR + (END_YEAR - START_YEAR) * (center / width);

        control.owner.setYear(year);
        control.rangeSliderActive = true;
      })
      .on('mousemove', function () {
        if (control.rangeSliderActive) { control.owner.setYear(parseFloat(event.target.value)); }
      })
      .on('mouseup', function () {
        control.owner.setYear(Math.round(parseFloat(event.target.value)), true);
        control.rangeSliderActive = false;
      });
  }

  update(props) {
    let control = this;

    diff(props, this.id)
      .ifDiff('roundYear', function (p) {
        control.label.text(p.roundYear);
      })
      .ifDiff('year', function (p) {
        if (!control.rangeSliderActive) { control.slider.node().value = props.year; }
      })
      .ifDiff('animating', function (p) {
        if (p.animating) {
          control.playButton.classed('paused', false);
          control.playButton.classed('playing', true);
        } else {
          control.playButton.classed('playing', false);
          control.playButton.classed('paused', true);
        }
      });
  }
}
