import { Component, diff } from '../utils';

export default class RegionControl extends Component {
  constructor(options) {
    super(options);
    this.id = 'region-control';
    this.el.classed('region-control control', true);

    this.dropdown = this.el.append('select')
      .attr('class', 'dropdown')
      .on('change', function () {
        options.owner.setRegion(this.value);
      });

    this.regions = this.dropdown.selectAll('option')
      .data(options.regions)
      .enter().append('option')
      .attr('value', (d) => d.id)
      .text((d) => d.name);
  }

  update(props) {
    let control = this;
    diff(props, this.id)
      .ifDiff('region', function (p) {
        control.dropdown.node().value = p.region.id;
      });
  }
}
