import gopher from "../gopher.js";
const ElementBase = require("../elementBase");
const ResultsTable = require("../results-table");

class IndividualRaceEmbed extends ElementBase {
  constructor() {
  	super();
  	this.race = this.getAttribute("race");
  	this.loadData = this.loadData.bind(this);
  }

  connectedCallback() {
    this.race = this.getAttribute("race");
    this.state = this.getAttribute("state");

    gopher.watch("./data/states/" + this.getAttribute("state") + ".json", this.loadData);
  }

  disconnectedCallback() {
    gopher.unwatch("./data/states/" + this.getAttribute("state") + ".json", this.loadData);
  }

  async loadData() {
    try {
      const response = await fetch("./data/states/" + this.getAttribute("state") + ".json");
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
  	let result = this.data.results.find(d => d.id === this.race);
    let table = `
      <results-table state="${this.getAttribute("state")}" result='${JSON.stringify(result).replace(/'/g, "&#39;")}'></results-table>
    `
		this.innerHTML = table;
  }
}

customElements.define("individual-race-embed", IndividualRaceEmbed);