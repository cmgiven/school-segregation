import { Component } from '../utils.js';

export default class extends Component {
  constructor(options) {
    super(options);
    this.el.classed('region-control control', true);

    let button = this.el.append('button')
      .attr('class', 'selected-region');

    let panel = this.el.append('div')
      .attr('class', 'region-panel');
  }
}
