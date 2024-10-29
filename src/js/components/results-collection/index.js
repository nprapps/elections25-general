import gopher from "../gopher.js";
const ElementBase = require("../elementBase");

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
      "P": "President",
      "G": "Governor",
      "S": "Senate",
      "H": "House",
      "I": "Ballot measures"
    }
    let template = "";

    template += `<h3 class="section-hed dotted-line"><span>${headers[this.getAttribute('office')]}</span></h3>`;

    this.races.forEach(race => {
      let table = `
        <results-table state="${this.getAttribute("state")}" result='${JSON.stringify(race).replace(/'/g, "&#39;")}'></results-table>
      `
      template += table;
    });
    this.innerHTML = template;
  }
}

customElements.define("results-collection", ResultsCollection);