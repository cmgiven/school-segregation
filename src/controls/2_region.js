import { Component } from '../utils';

export default class RegionControl extends Component {
  constructor(options) {
    super(options);
    this.el.classed('region-control control', true);

    this.button = this.el.append('button')
      .attr('class', 'selected-region');

    this.panel = this.el.append('div')
      .attr('class', 'region-panel');
  }
}
