import { Component, diff } from '../utils';

import { scaleLinear } from 'd3-scale';
import { axisBottom } from 'd3-axis';
import { format } from 'd3-format';
import { max as d3_max } from 'd3-array';
import 'd3-transition';

import { TRANSITION_DURATION } from '../config';

const HEIGHT = 250;
const MARGINS = { top: 10, right: 15, bottom: 20, left: 15 };

const percentFormatter = format('.0%');

export default class Histogram extends Component {
  constructor(options) {
    super(options);
    this.race = options.race;
    this.id = 'histogram-' + this.race;
    this.el
      .attr('id', this.id)
      .attr('class', 'histogram ' + this.race);
    let chart = this;

    chart.svg = this.el.append('svg')
      .attr('height', HEIGHT + MARGINS.top + MARGINS.bottom);

    let offsetGroup = chart.svg.append('g')
      .attr('transform', `translate(${MARGINS.left},${MARGINS.top})`);

    chart.layers = {
      bg: offsetGroup.append('g'),
      data: offsetGroup.append('g')
    };

    chart.scales = {
      x: scaleLinear().domain([0, 1]),
      y: scaleLinear().range([HEIGHT, 0])
    };

    let xAxis = axisBottom()
      .scale(chart.scales.x)
      .tickFormat(percentFormatter);

    chart.axes = {
      x: chart.layers.bg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0,${HEIGHT})`)
    };

    chart.axes.resize = function () {
      chart.axes.x.call(xAxis);
    };
  }

  resize() {
    let chart = this;
    let width = chart.el.node().offsetWidth;
    chart.svg.attr('width', width);
    width = width - MARGINS.left - MARGINS.right;
    chart.scales.x.range([0, width]);
    chart.barWidth = chart.scales.x(0.05);
    chart.axes.resize();
  }

  update(props, forceUpdate) {
    let chart = this;

    function draw(p) {
      if (!p.data) { return; }
      let data = p.data[p.roundYear].histogram;

      let key = chart.race;
      let max = d3_max(data, (d) => d[key]);
      chart.scales.y.domain([0, max]);

      let bars = chart.layers.data.selectAll('.bar')
        .data(data, (d) => d.cut);

      bars = bars.enter().append('rect')
        .attr('class', 'bar')
        .attr('y', HEIGHT)
        .attr('height', 0)
        .merge(bars)
        .attr('x', (d) => chart.scales.x(d.cut - 0.05))
        .attr('width', chart.barWidth)
        .transition()
        .ease((t) => t) // linear easing
        .duration(TRANSITION_DURATION)
        .attr('y', (d) => chart.scales.y(d[key]))
        .attr('height', (d) => HEIGHT - chart.scales.y(d[key]));
    }

    if (forceUpdate) {
      draw(props);
    } else {
      diff(props, this.id)
        .ifDiff(['roundYear', 'brushExtent', 'region', 'data'], draw);
    }
  }
}
