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
      H: "Key House races",
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
    const embedParam = new URL(document.location.toString()).searchParams.get("embedded")
      ? "&embedded=true"
      : "";
    if (this.hasAttribute("key-races-only")) {
      if (this.getAttribute("office") === "P") {
        let linkElement = ` • <a href="${stateSlug}.html?section=P${embedParam}">${locality}-level results</a>`;
        if (stateSlug === "alaska" || stateSlug === "district-of-columbia") {
          linkElement = "";
        } else if (stateSlug === "nebraska" || stateSlug === "maine") {
          linkElement = ` • <a href="${stateSlug}.html?section=P${embedParam}">District and ${locality.toLowerCase()}-level results</a>`;
        }
        template += `
          <p class="section-info">
            ${this.getAttribute(
              "electoral"
            )} electoral votes${linkElement}</p>`;
      } else if (this.getAttribute("office") === "G") {
        template += `<a class='section-info' href="${stateSlug}.html?section=G${embedParam}">
          ${locality}-level results
        </a>`;
      } else if (this.getAttribute("office") === "S") {
        template += `<a class='section-info' href="${stateSlug}.html?section=S${embedParam}">
          ${locality}-level results
        </a>`;
      } else if (this.getAttribute("office") === "H") {
        template += `<a class="section-info" href='${stateSlug}.html?section=H${embedParam}'>
          All House results
        </a>`;
      } else if (this.getAttribute("office") === "I") {
        template += `<a class="section-info" href='${stateSlug}.html?section=I${embedParam}'>
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
