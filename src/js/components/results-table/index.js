var ElementBase = require("../elementBase");

class ResultsTable extends ElementBase {
  constructor() {
    super();
  }

  static get template() {
    return require("./_results-table.html");
  }

  connectedCallback() {
    this.illuminate();
  }
}

customElements.define("results-table", ResultsTable);
