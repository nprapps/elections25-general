import gopher from "../gopher.js";
const { classify, statePostalToFull } = require("../util");
const ResultsCollection = require("../results-collection/index.js");
const TabbedResultsCollection = require("../tabbed-results-collection/index.js");
const ElementBase = require("../elementBase.js");

const offices = {
  "key-races": "key-races",
  president: "P",
  governor: "G",
  senate: "S",
  house: "H",
  "ballot-measures": "I",
  mayor: "M"
};

const officeKeywords = {
  "P": "president",
  "G": "governor",
  "S": "senate",
  "H": "house",
  "I": "ballot-measures",
  "M": "mayor"
};

const townshipStates = ["CT", "MA", "ME", "NH", "RI", "VT"];

class IndexPageResults extends ElementBase {
  constructor() {
    super();
    this.stateList = JSON.parse(this.getAttribute("state-list"));
    // this.sections = JSON.parse(this.getAttribute("sections"));
    // this.keyRaceCollections = JSON.parse(
    //   this.getAttribute("key-race-collections")
    // );
    this.countyRaces = JSON.parse(this.getAttribute("county-races"));
    this.loadData = this.loadData.bind(this);
    this.datafile = "./data/all.json";
  }

  connectedCallback() {
    this.loadData();
    this.watchData();
  }

  async loadData() {
    try {
      const response = await fetch(this.datafile);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = await response.json();
      this.render();
    } catch (error) {
      console.error("Could not load JSON data:", error);
    }
  }

  async watchData() {
    await this.loadData();
    if (this.data.results.every(d => !d.certified)) {
      gopher.watch(this.datafile, this.loadData);
    }
  }

  render() {
    this.removeAttribute("state-races");
    // this.removeAttribute("sections");
    // this.removeAttribute("key-race-collections");
    this.removeAttribute("county-races");

    const results = this.data.results;
    let template = "";
    // const electoral = results
    //   .filter((d) => d.office === "P")
    //   .map((obj) => obj.electoral)
    //   .reduce((accumulator, current) => accumulator + current, 0);

    this.stateList.forEach((st) => {
      let stateData = results.filter(d => d.state === st);
      let stateSections = "";

      let stateHTML = `<h2><a href="${ classify(statePostalToFull(st)) }.html">${ statePostalToFull(st) }</a></h2>`;
      stateHTML += '<section id="key-races-section" section="key-races">';

      ["P", "G", "S", "H", "I", "M"].forEach((office) => {
        let officeData = stateData.filter(o => o.office == office );
        if (officeData.length > 0) {
          stateHTML += `
            <results-collection 
              state="${ st }"
              office="${ office }" 
              races='${JSON.stringify(officeData).replace(/'/g, "&#39;")}'
              key-races-only>
            </results-collection>
          `;
        }

      });

      stateHTML += "</section>";

      template += stateHTML;
    });

    this.innerHTML = template;
  }
}

customElements.define("index-page-results", IndexPageResults);
