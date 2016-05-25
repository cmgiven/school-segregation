import { Component } from '../utils.js';

import { event } from 'd3-selection';

import { START_YEAR, END_YEAR } from '../config.js';
const SLIDER_WIDTH = 28;

export default class extends Component {
  constructor(options) {
    super(options);
    let control = this;
    this.lastProps = {};
    this.el.classed('year-control control', true);

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
    var updated = false;

    if (props.roundYear !== this.lastProps.roundYear) {
      this.label.text(props.roundYear);
      updated = true;
    }

    if (props.year !== this.lastProps.year) {
      if (!this.rangeSliderActive) { this.slider.node().value = props.year; }
      updated = true;
    }

    if (props.animating !== this.lastProps.animating) {
      if (props.animating) {
        this.playButton.classed('paused', false);
        this.playButton.classed('playing', true);
      } else {
        this.playButton.classed('playing', false);
        this.playButton.classed('paused', true);
      }

      updated = true;
    }

    if (updated) { Object.assign(this.lastProps, props); }
  }
}
