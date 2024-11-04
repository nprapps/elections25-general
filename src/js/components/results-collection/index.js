const ElementBase = require("../elementBase");
const { classify } = require("../util");

const townshipStates = ["CT", "MA", "ME", "NH", "RI", "VT"];

class ResultsCollection extends ElementBase {
  constructor() {
    super();
    this.races = JSON.parse(this.getAttribute("races"));
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.removeAttribute("races");

    const headers = {
      "key-races": "Key races",
      P: "President",
      G: "Governor",
      S: "Senate",
      H: "House",
      I: "Ballot measures",
    };
    let template = "";

    template += `
      <h3 class="section-hed dotted-line">
        <span>${headers[this.getAttribute("office")]}</span>
      </h3>
    `;

    const stateSlug = classify(this.races[0].stateName);
    const locality = townshipStates.includes(this.getAttribute("state"))
      ? "Township"
      : "County";
    if (this.hasAttribute("key-races-only")) {
      if (this.getAttribute("office") === "P") {
        let linkElement = ` • <a href="${stateSlug}.html?section=P">${locality}-level results</a>`;
        if (stateSlug === "alaska" || stateSlug === "district-of-columbia") {
          linkElement = "";
        } else if (stateSlug === "nebraska" || stateSlug === "maine") {
          linkElement = ` • <a href="${stateSlug}.html?section=P">District and ${locality.toLowerCase()}-level results</a>`;
        }
        template += `
          <p class="section-info">
            ${this.getAttribute(
              "electoral"
            )} electoral votes${linkElement}</p>`;
      } else if (this.getAttribute("office") === "S") {
        template += `<a class='section-info' href="${stateSlug}.html?section=S">
          ${locality}-level results
        </a>`;
      } else if (this.getAttribute("office") === "H") {
        template += `<a class="section-info" href='${stateSlug}.html?section=H'>
          All House results
        </a>`;
      } else if (this.getAttribute("office") === "I") {
        template += `<a class="section-info" href='${stateSlug}.html?section=I'>
          All ballot measure results
        </a>`;
      }
    } else {
      if (this.getAttribute("office") === "P") {
        template += `
          <p class="section-info">${this.getAttribute(
            "electoral"
          )} electoral votes</p>
        `;
      }
    }

    this.races.forEach((race) => {
      let table = `
        <results-table 
          state="${this.getAttribute("state")}" 
          result='${JSON.stringify(race).replace(/'/g, "&#39;")}'>
        </results-table>
      `;
      template += table;
    });
    this.innerHTML = template;
  }
}

customElements.define("results-collection", ResultsCollection);
