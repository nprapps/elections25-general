import gopher from "../gopher.js";
const ElementBase = require("../elementBase");
const { classify } = require("../util");

class ResultsCollection extends ElementBase {
  constructor() {
    super();
    this.races = JSON.parse(this.getAttribute("races"));
    if (this.getAttribute("office") === "H") {
      this.races.sort((a, b) => a.seatNumber - b.seatNumber < 0 ? -1 : 1);
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.removeAttribute("races");

    const headers = {
      "key-races": "Key races",
      "P": "President",
      "G": "Governor",
      "S": "Senate",
      "H": "House",
      "I": "Ballot measures"
    }
    let template = "";

    template += `
      <h3 class="section-hed dotted-line">
        <span>${headers[this.getAttribute('office')]}</span>
      </h3>
    `;

    let stateSlug = classify(this.races[0].stateName);

    if (this.hasAttribute("key-races-only")) {
      if (this.getAttribute("office") === "P") {
        template += `
          <p class="section-info">
            ${this.getAttribute("electoral")} electoral votes • 
            <a href="${stateSlug}.html?section=P">County-level results</a>
          </p>`
      } else if (this.getAttribute("office") === "S") {
        template += `<a class='section-info' href="${stateSlug}.html?section=S">
          County-level results
        </a>`
      } else if (this.getAttribute("office") === "H") {
        template += `<a class="section-info" href='${stateSlug}.html?section=H'>
          All House results
        </a>`
      }
    } else {
      if (this.getAttribute("office") === "P") {
        template += `
          <p class="section-info">${this.getAttribute("electoral")} electoral votes</p>
          `
      }
    }

    this.races.forEach(race => {
      let table = `
        <results-table 
          state="${this.getAttribute("state")}" 
          result='${JSON.stringify(race).replace(/'/g, "&#39;")}'>
        </results-table>
      `
      template += table;
    });
    this.innerHTML = template;
  }
}

customElements.define("results-collection", ResultsCollection);