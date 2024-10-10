import ElementBase from "./elementBase";

class InlineSVG extends ElementBase {
  constructor() {
    super();
    this.svgContainer = this;
  }

  async connectedCallback() {
    if (this.getAttribute('src')) {
      const response = await fetch(this.getAttribute('src'));
      this.svgContent = await response.text();
    }
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'class') {
      this.render();
    }
  }

  render() {
    this.innerHTML = `<div class="inline-svg ${this.getAttribute('class') || ''}" role="img" alt="">${this.svgContent || ''}</div>`;
  }
}

customElements.define('inline-svg', InlineSVG);
