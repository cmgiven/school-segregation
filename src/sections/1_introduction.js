import { Section } from '../utils';

const template = require('!html!./1_introduction.html');

export default class Introduction extends Section {
  constructor(options) {
    super(options);
    this.id = 'introduction';
    this.el.attr('id', this.id);
    this.el.html(template);
  }
}
