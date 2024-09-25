// require("./lib/pym");

require("./analytics");

class ResultsTable extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({ mode: 'open' });
    const container = document.createElement('div');
		const templateString = require("./components/results-table/_results-table.html");
    container.innerHTML = templateString;

    shadow.appendChild(container);
  }
}

customElements.define("results-table", ResultsTable);
