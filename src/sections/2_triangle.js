import { Section } from '../utils';

import TriangleChart from '../components/triangle-chart';
import DemographicTooltip from '../components/demographic-tooltip';

export default class TriangleSection extends Section {
  constructor(options) {
    super(options);
    this.id = 'triangle';
    this.el.attr('id', this.id);

    this.state = {
      highlight: null,
      stickyHighlight: false,
      jumboHighlight: true
    };

    this.components.push(new TriangleChart({ container: this.el, owner: this }));
    this.components.push(new DemographicTooltip({ container: this.el, owner: this }));
  }

  resize(props) {
    this.state = Object.assign({}, this.state, props);
    super.resize(this.state);
  }

  update(props) {
    this.state = Object.assign({}, this.state, props);
    super.update(this.state);
  }

  highlight(target, sticky) {
    if (!this.state.stickyHighlight || typeof sticky !== 'undefined') {
      if (target && this.state.highlight && target[0] === this.state.highlight[0]) {
        if (!sticky) {
          return;
        } else if (this.state.stickyHighlight) {
          sticky = false;
        }
      }
      this.update({
        highlight: target,
        stickyHighlight: !!target && !!sticky
      });
    }
  }

  toggleHighlightSize() {
    this.update({
      highlight: null,
      stickyHighlight: false,
      jumboHighlight: !this.state.jumboHighlight
    });
  }
}
