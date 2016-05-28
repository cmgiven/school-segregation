import { Component, diff } from '../utils';

import { event } from 'd3-selection';
import { scaleLinear, scalePow } from 'd3-scale';

import { RACES, COLORS } from '../config';
const MIN_MARGIN = { top: 5, right: 15, bottom: 30, left: 15 };
const ALT_X = Math.sqrt(3) / 2;
const TRIANGLE_LENGTH = 13;
const STROKE_WIDTH = 1;
const MAX_N = 10279040;

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

function majGroup(hex) {
  let breakpoint = TRIANGLE_LENGTH / 2 + 1;
  return (hex.y > breakpoint) ? 'white' :
    (hex.x + hex.y < breakpoint) ? 'black' :
    (hex.x > breakpoint) ? 'hisp' :
    'mix';
}

export default class TriangleChart extends Component {
  constructor(options) {
    super(options);
    this.id = 'triangle-chart';
    let chart = this;

    function getTarget(offsetX, offsetY) {
      offsetX -= chart.margin.left;
      offsetY -= chart.margin.top;

      let y = TRIANGLE_LENGTH - Math.floor(offsetY / chart.hexHeight);
      let x = Math.floor(offsetX / chart.hexWidth - (y - 1) / 2) + 1;
      if (x <= 0 || y <= 0 || x + y > TRIANGLE_LENGTH + 1) { return null; }

      if (chart.jumboHighlight) {
        let group = majGroup({ x, y });
        return chart.hexes.filter((hex) => majGroup(hex) === group);
      }

      return [chart.hexes.find((hex) => hex.x === x && hex.y === y)];
    }

    function mousemove() {
      chart.owner.highlight(getTarget(event.offsetX, event.offsetY));
    }

    function mouseout() {
      chart.owner.highlight(null);
    }

    function click() {
      chart.owner.highlight(getTarget(event.offsetX, event.offsetY), true);
    }

    this.el.style('width', '100%').style('height', '100%');
    this.canvas = this.el.append('canvas')
      .on('mousemove', mousemove)
      .on('mouseout', mouseout)
      .on('click', click);
  }

  resize(props) {
    let chart = this;
    let containerWidth = chart.el.node().offsetWidth;
    let containerHeight = chart.el.node().offsetHeight;

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

    chart.margin = {
      top: (containerHeight - chart.height - MIN_MARGIN.top - MIN_MARGIN.bottom) / 2 + MIN_MARGIN.top,
      left: (containerWidth - chart.width - MIN_MARGIN.left - MIN_MARGIN.right) / 2 + MIN_MARGIN.left
    };

    chart.context = chart.canvas.node().getContext('2d');

    if (window.devicePixelRatio) {
      chart.canvas
        .attr('width', containerWidth * window.devicePixelRatio)
        .attr('height', containerHeight * window.devicePixelRatio)
        .attr('style', `width: ${containerWidth}px; height: ${containerHeight}px;`);
      chart.context.scale(window.devicePixelRatio, window.devicePixelRatio);
    } else {
      chart.canvas
        .attr('width', containerWidth)
        .attr('height', containerHeight);
    }

    chart.context.translate(chart.margin.left, chart.margin.top);

    chart.clearCanvas = function (ctx) {
        ctx.clearRect(0 - chart.margin.left, 0 - chart.margin.top, containerWidth, containerHeight);
    };

    chart.update(props, true);
  }

  update(props, forceUpdate) {
    var chart = this;
    var ctx = chart.context;

    function draw(p) {
      chart.clearCanvas(ctx);
      if (!p.data) { return; }
      let tween = p.year % 1;
      let roundData = p.data[p.roundYear].triangle;
      let totals = p.data[p.roundYear].summary;
      let data;

      if (tween === 0) {
        data = roundData;
      } else {
        let data0 = p.data[Math.floor(p.year)].triangle;
        let data1 = p.data[Math.ceil(p.year)].triangle;
        data = data0.map(function (d0, i) {
          let d1 = data1[i];
          let result = {};
          RACES.forEach(function (r) {
            result[r] = d0[r] * (1 - tween) + d1[r] * tween;
          });
          return result;
        });
      }

      chart.hexes.forEach(function (hex) {
        let highlighted = p.highlight &&
          p.highlight.findIndex((target) => target.x === hex.x && target.y === hex.y) !== -1;
        let color = COLORS['maj_' + majGroup(hex) + (highlighted ? '_highlighted' : '')];
        hex.triangles.forEach(function (t) {
          drawTriangle(ctx, t.cx, t.cy, t.upsideDown, chart.hexWidth / 2, color, '#ffffff');
        });
      });

      data.forEach(function (d, i) {
        let hex = chart.hexes[i];
        hex.triangles.sort((a, b) => d[b.race] - d[a.race]);
        hex.triangles.forEach(function (t) {
          drawTriangle(ctx, t.cx, t.cy, t.upsideDown, chart.triangleScale(d[t.race]), COLORS[t.race]);
        });
      });

      if (p.jumboHighlight) {
        let bigFontSize = chart.hexHeight * TRIANGLE_LENGTH / 5;
        let smallFontSize = bigFontSize / 9.4;
        ctx.font = bigFontSize + 'px "Lato", "Helvetica Neue", sans-serif';
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.4;

        let positions = [[0.48, 0.284], [0.211, 0.803], [0.749, 0.803], [0.48, 0.58]];

        ['white', 'black', 'hisp', 'mix'].forEach(function(group, i) {
          let students = roundData.filter((d) => majGroup(d) === group)
            .reduce((sum, d) => sum + d.students, 0);
          let text = (students / totals.students * 100).toFixed(0) + '%';
          let x = positions[i][0] * chart.width - ctx.measureText(text).width / 2;
          let y = positions[i][1] * chart.height + bigFontSize * .33;
          ctx.fillText(text, x, y);
        });
        ctx.font = smallFontSize + 'px "Lato", "Helvetica Neue", sans-serif';
        ctx.globalAlpha = 0.6;
        ['majority white', 'majority black', 'majority Hispanic', 'balanced/other'].forEach(function(label, i) {
          let text = 'enrolled in schools with ' + label + ' enrollment';
          let x = positions[i][0] * chart.width - ctx.measureText(text).width / 2;
          let y = positions[i][1] * chart.height + bigFontSize * 0.45;
          ctx.fillText(text, x, y);
        });
        ctx.globalAlpha = 1;
      } else {
        let fontSize = chart.hexHeight / 2;
        ctx.font = fontSize + 'px "Lato", "Helvetica Neue", sans-serif';
        ctx.fillStyle = '#000';
        ctx.globalAlpha = 0.4;

        roundData.forEach(function (d, i) {
          let hex = chart.hexes[i];
          let text = (d.students / totals.students * 100).toFixed(0) + '%';
          let x = hex.hx - ctx.measureText(text).width / 2;
          let y = hex.hy + fontSize * .33;
          ctx.fillText(text, x, y);
        });
        ctx.globalAlpha = 1;
      }
    }

    if (forceUpdate) {
      draw(props);
    } else {
      diff(props, this.id)
        .ifDiff(['year', 'roundYear', 'highlight', 'jumboHighlight', 'region', 'data'], draw)
        .ifDiff(['jumboHighlight'], function (p) {
          chart.jumboHighlight = p.jumboHighlight;
        });
    }
  }
}
