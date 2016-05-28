import { Component, diff } from '../utils';
import { select } from 'd3-selection';
import { format } from 'd3-format';

import { RACE_LABELS } from '../config';

const commaFormatter = format(',.0f');
const percentFormatter = format('.1%');

export default class DemographicTooltip extends Component {
  constructor(options) {
    super(options);
    this.id = 'demographic-tooltip';
    this.el.attr('id', this.id);
    let tooltip = this;

    tooltip.enrollment = tooltip.el.selectAll('.enrollment-bar')
      .data(Object.keys(RACE_LABELS))
      .enter().append('div')
      .attr('class', (d) => 'enrollment-bar ' + d)
      .each(function (d) {
        let selection = select(this);
        selection.append('span').attr('class', 'label').text(RACE_LABELS[d]);

        let bar = selection.append('span').attr('class', 'bar-wrapper');
        bar.append('span').attr('class', 'bar');
        bar.append('span').attr('class', 'value-label');
      });

    tooltip.counts = tooltip.el.selectAll('.count')
      .data(['students', 'schools'])
      .enter().append('div')
      .attr('class', 'count')
      .each(function (d) {
        let selection = select(this);
        selection.append('span').attr('class', 'value-label');
        selection.append('span').attr('class', 'label').text(d);
      });

    tooltip.el.append('button')
      .text('Toggle size')
      .on('click', () => tooltip.owner.toggleHighlightSize());
  }

  update(props) {
    let tooltip = this;
    diff(props, this.id)
      .ifDiff(['roundYear', 'highlight', 'region', 'data'], function (p) {
        if (!p.data) { return; }
        let data;
        let totals = p.data[p.roundYear].summary;

        if (!p.highlight) {
          data = totals;
        } else {
          data = p.data[p.roundYear].triangle
            .filter((hex) => p.highlight.find((target) => hex.x === target.x && hex.y === target.y))
            .reduce(function (sum, hex) {
              for (let k in hex) {
                if (!sum[k]) {
                  sum[k] = hex[k];
                } else {
                  sum[k] += hex[k];
                }
              }
              return sum;
            }, {});
        }

        tooltip.enrollment.each(function (d) {
          let selection = select(this);
          let percentage = percentFormatter(data[d] / data.students);

          selection.select('.bar').style('width', percentage);
          selection.select('.value-label').text(percentage);
        });

        tooltip.counts.select('.value-label').text((d) => commaFormatter(data[d]) + ' ');
      });
  }
}
