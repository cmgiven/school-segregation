import { Section } from '../utils';

import Histogram from '../components/histogram';

import { RACES } from '../config';

export default class Histograms extends Section {
  constructor(options) {
    super(options);
    this.id = 'histograms';
    this.el.attr('id', this.id);

    this.state = {
      brushExtent: [0.65, 1]
    };

    this.components = RACES.map((race) => new Histogram({ container: this.el, owner: this, race }));
  }

  update(props, forceUpdate) {
    let state = this.state = Object.assign({}, this.state, props);
    super.update(state, forceUpdate);
  }

  setBrushExtent(brushExtent) {
    this.update({ brushExtent });
  }
}
