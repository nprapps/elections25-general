import gopher from "../gopher.js";
const { classify } = require("../util");
const ElementBase = require("../elementBase");
const ResultsTable = require("../results-table");

const headers = {
  "P": "President",
  "G": "Governor",
  "S": "Senate",
  "H": "House",
  "I": "Ballot measures",
  "M": "Mayor"
}

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

    let raceName = "";
    if (result.name_override) {
      raceName = result.stateName + " – " + result.name_override;
    } else if (result.office === "I") {
      raceName = result.description;
    } else if (result.office == "H") {
      raceName = result.stateName + " – " + headers[result.office] + " " + result.seat;
    } else {
      raceName = result.stateName + " – " + headers[result.office];
    }

    let countyLink = "";
    if (result.office === "P" || result.office === "G" || result.office === "S" || result.office === "I") {
      countyLink = `
        <a class="county-results-link" href="${classify(result.stateName)}.html?section=${result.office}">
          County-level results
        </a>
      `
    }

    let table = `
      <h3 class="race-embed-header">
        <span class="race-embed-hed">${raceName}</span>
        ${countyLink}
      </h3>
      <results-table state="${this.getAttribute("state")}" result='${JSON.stringify(result).replace(/'/g, "&#39;")}' is-individual-embed></results-table>
    `
		this.innerHTML = table;
  }
}

customElements.define("individual-race-embed", IndividualRaceEmbed);