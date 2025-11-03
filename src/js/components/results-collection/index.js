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
    if (this.races.length === 1) {
      this.classList.add("single");
    }

    const headers = {
      "key-races": "Key races",
      P: "President",
      G: "Governor",
      S: "Senate",
      H: "Key House races",
      I: "Ballot measures",
      M: "Mayor"
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
    const embedParam = new URL(document.location.toString()).searchParams.get(
      "embedded"
    )
      ? "&embedded=true"
      : "";
    if (this.hasAttribute("key-races-only")) {
      if (this.getAttribute("office") === "P") {
        let linkElement = ` • <button class="section-link" data-value="president">${locality}-level results</button>`;
        if (stateSlug === "alaska" || stateSlug === "district-of-columbia") {
          linkElement = "";
        } else if (stateSlug === "nebraska" || stateSlug === "maine") {
          linkElement = ` • <button href="" class="section-link" data-value="president">District and ${locality.toLowerCase()}-level results</button>`;
        }
        template += `
          <p class="section-info">
            ${this.getAttribute(
              "electoral"
            )} electoral votes${linkElement}</p>`;
      } else if (this.getAttribute("office") === "G") {
        template += `<button class="section-info section-link" data-state="${ stateSlug }" data-value="governor">
          ${locality}-level results
        </button>`;
      } else if (this.getAttribute("office") === "S") {
        template += `<button class="section-info section-link" data-state="${ stateSlug }"  data-value="senate">
          ${locality}-level results
        </button>`;
      } else if (this.getAttribute("office") === "H") {
        template += `<button class="section-info section-link" data-state="${ stateSlug }"  data-value="house">
          All House results
        </button>`;
      } else if (this.getAttribute("office") === "I") {
        template += `<button class="section-info section-link" data-state="${ stateSlug }"  data-value="ballot-measures">
          ${locality}-level results
        </button>`;
      // } else if (this.getAttribute("office") === "M") {
      //   template += `<button class="section-info section-link" href='' data-value="mayor">
      //     Full mayoral results
      //   </button>`;
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
