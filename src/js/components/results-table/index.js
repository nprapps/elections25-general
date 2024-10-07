const ElementBase = require("../elementBase");
const dot = require("../../lib/dot");
import gopher from "../gopher.js";
const template = dot.compile(require("./_results-table.html"));
const { classify, mapToElements, formatAPDate, formatTime } = require("../utils");


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
    gopher.unwatch("./data/house.json", this.loadData);
  }

  async loadData() {
    try {
      const response = await fetch('./data/house.json');
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

    const result = this.data.results.find(d => d.id === this.getAttribute("race-id"));
    const elements = this.illuminate();

    elements.updated.innerHTML = `
      ${formatAPDate(new Date(result.updated))} at ${formatTime(new Date(result.updated))}
    `;
    const candidates = mapToElements(elements.tbody, result.candidates);

    candidates.forEach(d => {
      let data = d[0];
      let el = d[1];
      
      el.classList.add("row");
      el.classList.add(classify(data.party));
      if (data.winner) {
        el.classList.add("winner");
      }

      el.innerHTML = `
        <span class="bar-container">
          <span class="bar" style="width: ${data.percent * 100}%"></span>
        </span>
        <span class="name">${data.first} ${data.last}</span>
        <span class="percentage">${data.percent * 100}%</span>
        <span class="votes">${data.votes}</span>
      `
    });
  }
}

customElements.define("results-table", ResultsTable);
