import { Section } from '../utils';

export default class Notes extends Section {
  constructor(options) {
    super(options);
    this.id = 'notes';
    this.el.attr('id', this.id);
  }
}
