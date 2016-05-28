import { Component, diff } from '../utils.js';

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

        if (!p.highlight) {
          data = p.data[p.roundYear].summary;
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

        tooltip.el.text('Number of schools: ' + data.schools);
      });
  }
}
