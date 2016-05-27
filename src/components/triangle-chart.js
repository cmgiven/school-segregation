import { Component, diff } from '../utils.js';

import { scaleLinear, scalePow } from 'd3-scale';

const MIN_MARGIN = { top: 5, right: 15, bottom: 30, left: 15 };
const ALT_X = Math.sqrt(3) / 2;
const TRIANGLE_LENGTH = 10;
const STROKE_WIDTH = 1;
const MAX_N = 15000000;
const RACES = ['white', 'asian', 'hisp', 'am', 'black', 'tr'];
const COLORS = {
  'white': '#7493C7',
  'asian': '#ACC45D',
  'hisp': '#81528B',
  'am': '#B84D71',
  'black': '#71AD91',
  'tr': '#BC703B'
};

function drawTriangle(ctx, cx, cy, upsideDown, baseWidth, fill, stroke) {
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

    chart.hexWidth = chart.width / TRIANGLE_LENGTH * 0.95;
    chart.hexHeight = chart.hexWidth * ALT_X;

    chart.triangleScale = scalePow()
      .exponent(0.5)
      .domain([0,MAX_N])
      .range([0, chart.hexWidth]);

    let xScale = scaleLinear().domain([1,TRIANGLE_LENGTH]).range([chart.hexWidth / 2, chart.width - chart.hexWidth]);
    let yScale = scaleLinear().domain([1,TRIANGLE_LENGTH]).range([chart.height - chart.hexHeight, chart.hexHeight / 2]);
    function getHexCenter(x, y) {
      let hx = xScale(x + (y - 1) / 2);
      let hy = yScale(y);
      return [hx, hy];
    }

    chart.hexes = [];

    for (let y = 1; y <= TRIANGLE_LENGTH; y++) {
      for (let x = 1; x <= TRIANGLE_LENGTH + 1 - y; x++) {
        let [ hx, hy ] = getHexCenter(x, y);
        let triangles = RACES.map(function (race, i) {
          let cx = hx + (i % 3 === 0 ? 0 : chart.hexWidth / 4 * (i < 3 ? 1 : -1));
          let cy = hy + chart.hexHeight / (i % 3 === 0 ? 3 : 6) * (i > 1 && i < 5 ? 1 : -1);
          let upsideDown = i % 2 === 0;
          return { race, cx, cy, upsideDown };
        });
        chart.hexes.push({ x, y, hx, hy, triangles });
      }
    }

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

    function draw(p) {
      chart.clearCanvas(ctx);
      if (!p.data) { return; }
      let data = p.data[p.roundYear].triangle;
      let data0 = p.data[Math.floor(p.year)].triangle;
      let data1 = p.data[Math.ceil(p.year)].triangle;
      let tween = p.year % 1;
      let tweenData;

      if (tween === 0) {
        tweenData = data;
      } else {
        tweenData = data0.map(function (d0, i) {
          let d1 = data1[i];
          let result = {};
          RACES.forEach(function (r) {
            result[r] = d0[r] * (1 - tween) + d1[r] * tween;
          });
          return result;
        });
      }

      chart.hexes.forEach(function (hex) {
        hex.triangles.forEach(function (t) {
          drawTriangle(ctx, t.cx, t.cy, t.upsideDown, chart.hexWidth / 2, '#e9e9e9', 'white');
        });
      });

      tweenData.forEach(function (d, i) {
        let hex = chart.hexes[i];
        hex.triangles.forEach(function (t) {
          drawTriangle(ctx, t.cx, t.cy, t.upsideDown, chart.triangleScale(d[t.race]), COLORS[t.race]);
        });
      });
    }

    if (forceUpdate) {
      draw(props);
    } else {
      diff(props, this.id)
        .ifDiff(['year', 'roundYear', 'region', 'data'], draw);
    }
  }
}
