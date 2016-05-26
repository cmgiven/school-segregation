import { Section } from '../utils';

export default class Histograms extends Section {
  constructor(options) {
    super(options);
    this.id = 'histograms';
    this.el.attr('id', this.id);
  }
}
