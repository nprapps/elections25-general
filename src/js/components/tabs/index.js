import ElementBase from "../elementBase";
import track from "../../lib/tracking";
import InlineSVG from "../inlineSVG";


function Tab(props) {
  console.log(props)
  return `
    <button
      role="tab"
      aria-controls="tab-${props.tab}"
      aria-selected="${props.selected}"
      onclick="this.getRootNode().host.choose(${props.tab})">
      ${props.icon ? `<inline-svg alt="" src="${props.icon}" class="icon"></inline-svg>` : ''}
      ${props.label}
    </button>
  `;
}

function Panel(props) {
  return `
    <div
      class="${props.shown ? 'active' : 'inactive'}"
      role="tabpanel"
      tabindex="-1"
      aria-hidden="${!props.shown}"
      id="tab-${props.id}"
    >
      ${props.children}
    </div>
  `;
}

const firstNotNull = function(...values) {
  for (var v of values) {
    if (v !== null) return v;
  }
};

class Tabs extends ElementBase {
  constructor() {
    super();
    this.choose = this.choose.bind(this);
    this.state = {
      id: 0,
      selected: 0,
      clicked: false
    };
  }

  static get observedAttributes() {
    return ['id'];
  }

  connectedCallback() {
    const id = this.getAttribute('id') || 0;
    const children = Array.from(this.children);
    const selectedChild = children.find(c => c.hasAttribute('selected'));
    let childIndex = null;
    if (selectedChild) {
      childIndex = children.indexOf(selectedChild);
    }
    
    let stored = null;
    try {
      stored = localStorage.getItem(`tabs-${id}`);
    } catch (err) {
      console.log("Unable to access local storage");
    }
    
    const selected = firstNotNull(childIndex, stored, 0);
    this.state = { id, selected, clicked: false };
    
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'id' && oldValue !== newValue) {
      this.state.id = newValue;
      this.render();
    }
  }

  choose(selected) {
    try {
      localStorage.setItem(`tabs-${this.state.id}`, selected);
    } catch (err) {
      console.log("Unable to save tab state to local storage");
    }
    this.state = { ...this.state, selected, clicked: true };
    this.render();
    track("tab-selected", this.children[selected].getAttribute('label'));
  }

  render() {
    const children = Array.from(this.children);
    
    this.innerHTML = `
      <div>
        <div role="tablist" class="tabs">
          ${children.map((c, i) => 
            Tab({
              icon: c.getAttribute('icon'),
              label: c.getAttribute('label'),
              tab: i,
              selected: this.state.selected == i,
              choose: () => this.choose(i)
            })
          ).join('')}
        </div>
        <div class="tabgroup">
          ${children.map((c, i) => 
            Panel({
              id: i,
              shown: this.state.selected == i,
              children: c.innerHTML
            })
          ).join('')}
        </div>
      </div>
    `;

    if (this.state.clicked) {
      this.querySelector(`#tab-${this.state.selected}`).focus({ preventScroll: true });
      this.state.clicked = false;
    }
  }
}

customElements.define('tabs-component', Tabs);