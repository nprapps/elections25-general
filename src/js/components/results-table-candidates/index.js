var ElementBase = require("../elementBase");
import { reportingPercentage, getParty } from "../util.js";

const activeMugshots = {
  Biden: "https://apps.npr.org/dailygraphics/graphics/prez-candidates-jan-list-20190116/assets/joe_biden.png",
  Trump: "https://apps.npr.org/dailygraphics/graphics/prez-candidates-jan-list-20190116/assets/donald_trump.png",
};

class ResultsTableCandidates extends ElementBase {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['data', 'title'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    this.render();
  }

  render() {
    const props = {
      data: JSON.parse(this.getAttribute('data') || 'null'),
      title: this.getAttribute('title')
    };

    if (!props.data) {
      this.innerHTML = "";
      return;
    }

    const results = props.data;
    const notStatewide = results.office === "H" || results.office === "I";
    const seatName = notStatewide ? results.seat : props.title;

    let totalVotes = results.candidates.reduce((sum, c) => sum + c.votes, 0);

    const isUncontested = results.candidates.length < 2;
    const reporting = `${reportingPercentage(
      (notStatewide ? results.reportingPercent : results.eevp) || 0
    )}% in`;

    const hasMugs = results.candidates.some(c => Object.keys(activeMugshots).includes(c.last));
    const hasIncumbent = results.candidates.some(c => c.incumbent);
    const ballot = results.office == "I";
    const house = results.office == "H";

    this.innerHTML = `
      <div class="results-table statewide ${ballot ? "ballot" : ""} ${house ? "house" : ""}">
        ${seatName ? `
          <div class="results-header">
            <caption>${seatName} <span class="state-label">- ${results.stateName}</span></caption>
          </div>
        ` : ''}
        <div class="board ${isUncontested ? "uncontested" : ""}" role="table">
          <div class="thead" role="rowgroup">
            <div class="tr" role="row">
              <div role="columnheader" class="th name" colspan="2">${ballot ? "Option" : "Candidate"}</div>
              <div role="columnheader" class="th percentage">Percent</div>
              <div role="columnheader" class="th votes">Votes</div>
            </div>
          </div>
          <div class="tbody" role="rowgroup">
            ${results.candidates.map(c => this.renderCandidateRow(c, isUncontested, hasMugs, results.office)).join('')}
          </div>
        </div>
        <div class="footnote">
          <span class="left">${hasIncumbent ? '<div>● - Incumbent</div>' : ''}</span>
          <span class="right">${isUncontested ? "" : reporting}</span>
        </div>
        ${isUncontested ? `
          <div class="footnote uncontested">
            The AP does not tabulate votes for uncontested races and declares its winner as soon as polls close.
          </div>
        ` : ''}
      </div>
    `;
  }

  renderCandidateRow(result, uncontested, mugs, office) {
    if (!result.votes && result.last == "Other") {
      return '';
    }
    const mugshot = activeMugshots[result.last];

    const classes = ["tr", "candidate", getParty(result.party)];
    if (result.winner == "X") classes.push("winner");
    if (result.incumbent) classes.push("incumbent");
    if (!mugs) classes.push("noimg");
    const imgClass = mugshot ? "" : "noimg";

    return `
      <div class="row-wrapper" role="presentation">
        <div class="${classes.join(" ")}" role="row">
          <div aria-hidden="true" class="td flourishes ${mugs ? "" : imgClass}">
            <div class="mugshot ${imgClass}" style="background-image: url(${mugshot || ''})"></div>
            ${result.votes ? `
              <div class="bar-container">
                <div class="bar" style="width: ${result.percent * 100 || 0}%"></div>
              </div>
            ` : ''}
          </div>
          ${this.renderCandidateNameCell(result, office)}
          ${this.renderCandidateVoteCell(result, uncontested)}
          <div role="cell" class="td votes">${result.votes ? result.votes.toLocaleString() : "-"}</div>
        </div>
      </div>
      <div class="row-wrapper column-fixer" role="presentation"></div>
    `;
  }

  renderCandidateNameCell(candidate, office) {
    let name;
    if (candidate.last == "Other") {
      name = '<span>Other Candidates</span>';
    } else {
      name = `
        <span class="first">${candidate.first || ""}</span> ${candidate.last}
        ${office === "I" ? "" : ` (${getParty(candidate.party)})`}
      `;
    }

    const incumbent = candidate.incumbent ? '<span class="incumbent-icon"> &#9679;</span>' : '';

    let winner = '';
    if (candidate.winner == "X") {
      winner = `
        <span class="winner-icon" role="img" aria-label="check mark">
          <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path fill="currentColor" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
          </svg>
        </span>
      `;
    } else if (candidate.winner == "R") {
      winner = '<span class="runoff-text"> - runoff</span>';
    }

    return `
      <div role="cell" class="td name">
        ${name}
        ${incumbent}
        ${winner}
      </div>
    `;
  }

  renderCandidateVoteCell(candidate, uncontested) {
    if (uncontested) {
      return '<div role="cell" class="td votes uncontested" colspan="2">Uncontested</div>';
    }
    const candPercent = candidate.percent ? `${Math.round(candidate.percent * 1000) / 10}%` : "-";
    return `<div role="cell" class="td percentage">${candPercent}</div>`;
  }
}

customElements.define("results-table-candidates", ResultsTableCandidates);