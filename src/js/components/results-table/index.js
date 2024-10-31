import gopher from "../gopher.js";
import TestBanner from "../test-banner"

const ElementBase = require("../elementBase");
const dot = require("../../lib/dot");
const template = dot.compile(require("./_results-table.html"));
const { classify, mapToElements, formatAPDate, formatTime, formatComma, winnerIcon, formatEEVP } = require("../util");
import stringsSheet from "../../../../data/strings.sheet.json";

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
    return require("./_results-table.html");
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const result = JSON.parse(this.getAttribute("result"));
    const elements = this.illuminate();

    this.removeAttribute("result");

    if (!result.test) {
      elements.testBanner.remove();
    }

    elements.updated.innerHTML = `${formatAPDate(new Date(result.updated))} at ${formatTime(new Date(result.updated))}`;
    elements.eevp.innerHTML = formatEEVP(result.eevp);

    var diff = (new Date(result.updated) - new Date(result.candidates[0].winnerDateTime)) / 1000;
    if (diff > 0) {
      console.log(`${ result.state }-${ result.office }: ${ diff } seconds difference`);
      console.log("result.updated", new Date(result.updated));
      console.log("winnerDateTime", new Date(result.candidates[0].winnerDateTime));
    }

    if (result.candidates[0].winner === "X" && result.candidates[0].winnerDateTime) {
      var winnerDateTime = result.candidates[0].winnerDateTime;
      elements.callTimestamp.innerHTML = ` &bull; Winner called: ${formatAPDate(new Date(winnerDateTime))} at ${formatTime(new Date(winnerDateTime))}.`;
    } else {
      elements.callTimestamp.remove();
    }

    if (result.office === "P") {
      elements.wrapper.classList.add("president");
    }

    if (this.hasAttribute("is-individual-embed")) {
      elements.resultsTableHed.remove();
    // on state pages, only show heds for house races and ballot measures
    } else {
      if (result.name_override) {
        elements.resultsTableHed.innerHTML = result.name_override;
      } else if (result.office === "H") {
        elements.resultsTableHed.innerHTML = result.seat;
      } else if (result.office === "I") {
        elements.resultsTableHed.innerHTML = result.description;
      } else {
        elements.resultsTableHed.remove();
      }
    }

    const candidates = mapToElements(elements.tbody, result.candidates).filter(d => {
      return !(d[0].last === "Other" && d[0].votes === 0);
    });

    if (candidates.length > 1) {
      elements.uncontestedFootnote.remove();
    } else {
      elements.footnoteMetadata.style.display = "none";
    }

    if (result.flags) {
      elements.specialElectionFootnote.innerHTML = result.flags[0];
    } else {
      elements.specialElectionFootnote.remove();
    }

    if (result.rcvResult) {
      switch (result.rcvResult) {
        case "pending":
          elements.rcvFootnote.innerHTML = stringsSheet.rcv_pending_footnote;
          break;
        case "final":
          elements.rcvFootnote.innerHTML = stringsSheet.rcv_final_footnote;
          break;
      }
    } else {
      elements.rcvFootnote.remove();
    }

    // show winThreshold for ballot measures where the threshold isn't a simple majority
    if (result.office == "I" && result.winThreshold && result.winThreshold != 50) {
      elements.winThresholdFootnote.innerHTML = `This measure must win at least ${ result.winThreshold }% of the vote to pass.`
    } else {
      elements.winThresholdFootnote.remove();
    }

    if (candidates.some(d => d[0].incumbent) === true) {
      elements.incumbentLegend.style.display = "block";
    }

    candidates.forEach(candidate => {
      let d = candidate[0];
      let el = candidate[1];
      
      el.classList.add("row");
      el.classList.add(classify(d.party));
      if (d.winner === "X") {
        el.classList.add("winner");
      }

      const name = `
        ${d.first ? "<span class='first-name'>" + d.first + " </span>" : ""}
        ${d.last === "Other" ? "Other candidates" : d.last}
      `;
      let party = " (" + d.party + ")";
      if (d.party === "Other" || d.party === "Yes" || d.party === "No") {
        party = "";
      }

      el.innerHTML = `
        <span aria-hidden="true" class="${headshots[d.last] ? 'headshot has-image" style="background-image: url(' + headshots[d.last] + ')"' : 'headshot no-image"'}></span>
        <span class="bar-container">
          <span class="bar" style="width: ${d.percent * 100}%"></span>
        </span>
        <span class="name">
          ${name}${party}${d.incumbent ? "<span class='incumbent-icon'> &#x2022;</span>" : ""}${d.winner === "X" ? winnerIcon : ""}${d.winner === "R" ? "<span class='runoff-indicator'> - runoff</span>" : ""}
        </span>
        <span class="percentage">${(d.percent * 100).toFixed(1)}%</span>
        <span class="votes">${formatComma(d.votes)}</span>
      `
    });
  }
}

customElements.define("results-table", ResultsTable);