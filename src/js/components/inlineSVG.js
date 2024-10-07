class InlineSVG extends ElementBase {
    constructor() {
        super();
        this.svgContainer = this;
      }
    
      async connectedCallback() {
        if (this.getAttribute('src')) {
          const response = await fetch(this.getAttribute('src'));
          const svgText = await response.text();
          this.innerHTML = svgText;
        }
      }
    
      static get observedAttributes() {
        return ['src', 'class'];
      }
    }
    
    customElements.define('inline-svg', InlineSVG);