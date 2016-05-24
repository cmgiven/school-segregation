import { Section } from '../utils.js';

export default class extends Section {
  constructor(options) {
    super(options);
    this.id = 'triangle';
    this.el.attr('id', this.id);
  }
}
