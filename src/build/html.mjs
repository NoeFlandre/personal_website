// Safe HTML templating.
//
//   html`<a href="${url}">${label}</a>`
//
// Interpolated values are escaped unless they are themselves the result of
// `html` or wrapped in `raw()`. Arrays are joined, and null/undefined/false
// render as nothing, so conditionals and lists need no extra helpers.

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

class Raw {
  constructor(value) {
    this.value = value;
  }

  toString() {
    return this.value;
  }
}

export function escape(value) {
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

export function raw(value) {
  return value instanceof Raw ? value : new Raw(String(value));
}

function render(value) {
  if (value == null || value === false) return "";
  if (value instanceof Raw) return value.value;
  if (Array.isArray(value)) return value.map(render).join("");
  return escape(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return new Raw(out);
}

// attrs({ class: "a", hidden: true, title: null }) -> ` class="a" hidden`
export function attrs(map) {
  let out = "";
  for (const [name, value] of Object.entries(map)) {
    if (value == null || value === false) continue;
    out += value === true ? ` ${name}` : ` ${name}="${escape(value)}"`;
  }
  return new Raw(out);
}
