import { Component, diff } from '../utils.js';

import { scaleLinear, scalePow } from 'd3-scale';

const MIN_MARGIN = { top: 5, right: 15, bottom: 30, left: 15 };
const ALT_X = Math.sqrt(3) / 2;
const TRIANGLE_LENGTH = 16;
const STROKE_WIDTH = 1;
const MAX_N = 10000000;
const RACES = ['white', 'asian', 'hisp', 'am', 'black', 'tr'];

export default class TriangleChart extends Component {
  constructor(options) {
    super(options);
    this.id = 'triangle-chart';

    this.el.style('width', '100%').style('height', '100%');
    this.canvas = this.el.append('canvas');
  }

  resize(props) {
    let chart = this;
    let containerWidth = chart.el.node().offsetWidth;
    let containerHeight = chart.el.node().offsetHeight;

    chart.canvas
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    chart.width = Math.min(
      containerWidth - MIN_MARGIN.left - MIN_MARGIN.right,
      (containerHeight - MIN_MARGIN.top - MIN_MARGIN.bottom) / ALT_X
    );
    chart.height = chart.width * ALT_X;

    chart.hexWidth = chart.width / TRIANGLE_LENGTH - STROKE_WIDTH * 2;
    chart.hexHeight = chart.hexWidth * ALT_X;

    chart.triangleScale = scalePow()
      .exponent(0.5)
      .domain([0,MAX_N])
      .range([0, chart.hexWidth]);

    let xScale = scaleLinear().domain([1,16]).range([chart.hexWidth / 2, chart.width - chart.hexWidth]);
    let yScale = scaleLinear().domain([1,16]).range([chart.height - chart.hexHeight, chart.hexHeight / 2]);
    chart.getHexCenter = function (dx, dy) {
      let x = xScale(dx + (dy - 1) / 2);
      let y = yScale(dy);
      return [x, y];
    };

    let margin = {
      top: (containerHeight - chart.height - MIN_MARGIN.top - MIN_MARGIN.bottom) / 2 + MIN_MARGIN.top,
      left: (containerWidth - chart.width - MIN_MARGIN.left - MIN_MARGIN.right) / 2 + MIN_MARGIN.left
    };

    chart.context = chart.canvas.node().getContext('2d');
    chart.context.translate(margin.left, margin.top);

    chart.clearCanvas = function (ctx) {
        ctx.clearRect(0 - margin.left, 0 - margin.top, containerWidth, containerHeight);
    };

    chart.update(props, true);
  }

  update(props, forceUpdate) {
    var chart = this;
    var ctx = chart.context;

    function drawTriangle(cx, cy, upsideDown, baseWidth, fill, stroke) {
      let basey = cy + (baseWidth * ALT_X / 3) * (upsideDown ? -1 : 1);
      let topy = cy + (baseWidth * ALT_X / 3 * 2) * (upsideDown ? 1 : -1);
      let lx = cx - baseWidth / 2;
      let rx = cx + baseWidth / 2;
      if (fill) { ctx.fillStyle = fill; }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = STROKE_WIDTH; }

      ctx.beginPath();
      ctx.moveTo(lx, basey);
      ctx.lineTo(rx, basey);
      ctx.lineTo(cx, topy);
      ctx.lineTo(lx, basey);

      if (fill) { ctx.fill(); }
      if (stroke) { ctx.stroke(); }
    }

    function drawHex(hex) {
      let [cx, cy] = chart.getHexCenter(hex.x, hex.y);

      let triangles = RACES.map(function (race, i) {
        let x = cx + (i % 3 === 0 ? 0 : chart.hexWidth / 4 * (i < 3 ? 1 : -1));
        let y = cy + chart.hexHeight / (i % 3 === 0 ? 3 : 6) * (i > 1 && i < 5 ? 1 : -1);
        let upsideDown = i % 2 === 0;
        return { race, x, y, upsideDown };
      });

      triangles.forEach(function (t) {
        drawTriangle(t.x, t.y, t.upsideDown, chart.hexWidth / 2, '#e9e9e9', 'white');
      });

      triangles.forEach(function (t) {
        drawTriangle(t.x, t.y, t.upsideDown, chart.triangleScale(hex[t.race]), 'red');
      });
    }

    function draw(p) {
      chart.clearCanvas(ctx);
      if (!p.data) { return; }
      let data = p.data[p.roundYear].triangle;
      data.forEach(drawHex);
    }

    if (forceUpdate) {
      draw(props);
    } else {
      diff(props, this.id)
        .ifDiff(['year', 'roundYear', 'region', 'data'], draw);
    }
  }
}
