import gopher from "../gopher.js";

const ElementBase = require("../elementBase");
const dot = require("../../lib/dot");
const template = dot.compile(require("./_results-table.html"));
const { classify, mapToElements, formatAPDate, formatTime, formatComma, winnerIcon } = require("../util");

const headshots = {
  Harris:
    "./assets/synced/kamala-harris.png",
  Trump:
    "https://apps.npr.org/primary-election-results-2024/assets/synced/trump.png",
};

class ResultsTable extends ElementBase {
  constructor() {
    super();
  }

  static get template() {
    return require("./_results-table.html")
  }

  connectedCallback() {
    this.render();
  }

  disconnectedCallback() {
  }

  render() {
    const result = JSON.parse(this.getAttribute("result"));
    const elements = this.illuminate();

    this.removeAttribute("result");

    elements.updated.innerHTML = `
      ${formatAPDate(new Date(result.updated))} at ${formatTime(new Date(result.updated))}
    `;

    elements.eevp.innerHTML = result.eevp;

    if (result.office === "P") {
      elements.wrapper.classList.add("president");
    }

    if (result.office === "H") {
      elements.resultsTableHed.innerHTML = result.seat;
    } else {
      elements.resultsTableHed.style.display = "none";
    }
    const candidates = mapToElements(elements.tbody, result.candidates);

    if (candidates.length < 2) {
      elements.uncontestedFootnote.innerHTML = "The AP does not tabulate votes for uncontested races and declares their winners as soon as polls close.";
    } else {
      elements.uncontestedFootnote.style.display = "none";
    }

    candidates.forEach(candidate => {
      let d = candidate[0];
      let el = candidate[1];
      
      el.classList.add("row");
      el.classList.add(classify(d.party));
      if (d.winner === "X") {
        el.classList.add("winner");
      }

      el.innerHTML = `
        <span aria-hidden="true" class="headshot"${headshots[d.last] ? 'style="background-image: url(' + headshots[d.last] + ')"' : ''}></span>
        <span class="bar-container">
          <span class="bar" style="width: ${d.percent * 100}%"></span>
        </span>
        <span class="name">
          ${d.first} ${d.last}${d.incumbent ? "<span class='incumbent-icon'> &#x2022;</span>" : ""}${d.winner === "X" ? winnerIcon : ""}${d.winner === "R" ? "<span class='runoff-indicator'> - runoff</span>" : ""}
        </span>
        <span class="percentage">${(d.percent * 100).toFixed(1)}%</span>
        <span class="votes">${formatComma(d.votes)}</span>
      `
    });
  }
}

customElements.define("results-table", ResultsTable);