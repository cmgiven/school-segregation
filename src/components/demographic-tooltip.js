import { Component, diff } from '../utils';

export default class DemographicTooltip extends Component {
  constructor(options) {
    super(options);
    this.id = 'demographics';
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

        tooltip.el.selectAll('p').remove();
        tooltip.el.append('p').text(`Number of schools: ${data.schools} (${(data.schools / totals.schools * 100).toFixed(0)}%)`);
        tooltip.el.append('p').text(`Number of students: ${data.students} (${(data.students / totals.students * 100).toFixed(0)}%)`);
      });
  }
}
