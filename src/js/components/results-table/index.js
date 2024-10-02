const ElementBase = require("../elementBase");
// var dot = require("../../lib/dot");
// var template = dot.compile(require("./_results-table.html"));

class ResultsTable extends ElementBase {
  constructor() {
    super();
    this.loadData = this.loadData.bind(this);
  }

  static get template() {
    return require("./_results-table.html")
  }

  connectedCallback() {
    this.loadData();
  }

  async loadData() {
    try {
      const response = await fetch('./data/house.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = await response.json();
      this.render();
    } catch (error) {
      console.error("Could not load JSON data:", error);
    }
  }

  render() {
    if (!this.data) return;

    // let result = this.data.results[0];
    // this.innerHTML = template({result});

    var elements = this.illuminate();
    elements.updated.innerHTML = new Date(this.data.results[0].updated);
  }
}

customElements.define("results-table", ResultsTable);
