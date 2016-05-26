import { Section } from '../utils';

import TriangleChart from '../components/triangle-chart';

export default class TriangleSection extends Section {
  constructor(options) {
    super(options);
    this.id = 'triangle';
    this.el.attr('id', this.id);

    this.components.push(new TriangleChart({ container: this.el, owner: this }));
  }
}
