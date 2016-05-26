// Require every file in provided context as an array
export function requireAll(req) { return req.keys().map(req).map((m) => m.default); }

export class Component {
  constructor(options) {
    this.el = options.container.append('div');
    this.owner = options.owner;
  }

  resize(props) { if (this.update) { this.update(props); } }
}

export class Section extends Component {
  constructor(options) {
    super(options);
    this.wrap = this.el.attr('class', 'section-wrap');
    this.el = this.wrap.append('div').attr('class', 'section');
    this.components = [];
  }

  resize(props) { this.components.forEach(function (c) { if (c.resize) { c.resize(props); } }); }
  update(props) { this.components.forEach(function (c) { if (c.update) { c.update(props); } }); }
}

let cachedProps = {};

export function diff(props, id) {
  let oldProps = cachedProps[id] || {};
  cachedProps[id] = props;

  function ifDiff(keys, callback) {
    keys = typeof keys === 'string' ? [keys] : keys;

    if (keys.findIndex((key) => props[key] !== oldProps[key]) !== -1) { callback(props); }

    return this;
  }

  return { ifDiff };
}
