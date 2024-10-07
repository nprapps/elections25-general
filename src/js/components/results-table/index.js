import gopher from "../gopher.js";

const ElementBase = require("../elementBase");
const dot = require("../../lib/dot");
const template = dot.compile(require("./_results-table.html"));
const { classify, mapToElements, formatAPDate, formatTime, formatComma, winnerIcon } = require("../utils");

const headshots = {
  Harris:
    "./assets/synced/kamala-harris.png",
  Trump:
    "https://apps.npr.org/primary-election-results-2024/assets/synced/trump.png",
};

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
    gopher.watch(this.getAttribute("data-file"), this.loadData);
  }

  disconnectedCallback() {
    gopher.unwatch(this.getAttribute("data-file"), this.loadData);
  }

  async loadData() {
    try {
      const response = await fetch(this.getAttribute("data-file"));
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

    const result = this.data.results.find(d => {
      return d.id === this.getAttribute("race-id") && d.state === this.getAttribute("state")
    });
    const elements = this.illuminate();

    elements.updated.innerHTML = `
      ${formatAPDate(new Date(result.updated))} at ${formatTime(new Date(result.updated))}
    `;

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
