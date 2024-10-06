var ElementBase = require("../elementBase");
import { reportingPercentage, sortByParty, goingToRCVRunOff } from "../util";
//import states from "../data/states.sheet.json";


class ResultsBoard extends ElementBase {
    constructor() {
        super();
        this.loadData = this.loadData.bind(this);
        this.races = JSON.parse(this.getAttribute('races'));
        this.states = {};
        this.office = '';
        this.hed = this.getAttribute('hed') || '';
        this.split = false;
        this.addClass = '';
    }

    static get observedAttributes() {
        return ['data-races', 'office', 'split', 'add-class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'office':
                this.office = newValue;
                break;
            case 'split':
                this.split = newValue === 'true';
                break;
            case 'add-class':
                this.addClass = newValue;
                break;
            case 'hed':
                this.hed = newValue;
                break;
        }
    }

    connectedCallback() {
        this.loadData();
    }

    async loadData() {
        this.isLoading = true;

        let statesDataFile;

        if (this.office.toLowerCase() === 'senate') {
            statesDataFile = './data/states.sheet.json';
        } else if (this.office.toLowerCase() === 'house') {
            statesDataFile = './data/states.sheet.json';
        } else {
            console.error('Invalid office type');
            this.isLoading = false;
            this.render();
            return;
        }

        try {
            const response = await fetch(statesDataFile);
            
            if (!response.ok) {
              throw new Error(`HTTP error! states/districts status: ${response.status}`);
            }
      
            this.states = await response.json() || {};
            this.isLoading = false;
            this.render();
          } catch (error) {
            console.error("Could not load JSON data:", error);
            this.isLoading = false;
            this.render(); // Render to show error state
        }
    }

    CandidateCells(race, winner) {
        var sorted = race.candidates.slice(0, 2).sort(sortByParty);
        var leading = race.candidates[0];
        var reporting = race.eevp;

        return sorted.map(function (c) {
            var className = ["candidate", c.party];
            if (reporting > .5 && c == leading) className.push("leading");
            if (c.winner == "X") className.push("winner");
            if (winner && !c.winner) className.push("loser");
            if (race.runoff) className.push("runoff");

            return `
        <td role="cell" class="${className.join(" ")}">
          <div class="name">
            <div class="last">${c.last}</div>
            <div class="incumbent">${c.incumbent ? "●" : ""}</div>
          </div>
          <div class="perc">${Math.round(c.percent * 1000) / 10}%</div> 
        </td>
      `;
        }).join('');
    }


    render() {
        let hasFlips = false;

        this.races.some(function (r) {
            let [winner] = r.candidates.filter(c => c.winner);
            if (goingToRCVRunOff(r.id)) {
                hasFlips = true;
            }

            if (winner && (
                r.previousParty !== winner.party ||
                winner.winner == "R")
            ) {
                hasFlips = true;
            }
        });

        //console.log("hasflips: " + hasFlips);

        hasFlips = true;

        let tables = [this.races];

        if (this.split) {
            let half = Math.ceil(this.races.length / 2);
            let firstHalf = this.races.slice(0, half);
            let secondHalf = this.races.slice(-half);
            tables = [firstHalf, secondHalf];
        }

        let classNames = [
            "board-wrapper president",
            this.office,
            this.addClass,
            hasFlips ? "has-flips" : "no-flips"
        ];


        this.innerHTML = `
    <div class="${classNames.filter(c => c).join(" ")} middle">
      ${this.hed ? `<h3 class="board-hed">${this.hed}</h3>` : ""}
      <div class="board-inner">
        ${tables.map(races => `
          <table class="named results table" role="table">
            ${races.map((r, i) => {
            var goingToRCV = goingToRCVRunOff(r.id);
            //if (goingToRCV) {
            //console.log("Found RCV race...");
            //console.log(r);
            //}
            var hasResult = r.eevp || r.reporting || r.called || r.runoff;

            var reporting = r.eevp;
            var percentIn = reporting || reporting == 0
                ? `<span>${reportingPercentage(reporting)}%<span class="in"> in</span></span>`
                : "";
            var [winner] = r.candidates.filter(c => c.winner == "X");
            var [incumbent] = r.candidates.filter(c => c.incumbent);
            var flipped = winner && (r.previousParty !== winner.party);
            var seatLabel = "";
            var ballotLabel = "";
            switch (r.office) {
                case "H": seatLabel = ` ${r.seatNumber}`;
                case "S":
                    if (r.seatNumber) {
                        seatLabel = ` ${r.seatNumber}`;
                    }
                    break;
                case "I":
                    ballotLabel = ` ${r.seat}`;
                    break;
            }

            return `
                <tr key="${r.id}" class="tr ${hasResult ? "open" : "closed"} index-${i}" role="row">
                  <td class="state" role="cell">
                    <a target="_top" href="?#/states/${r.state}/${r.office}">
                      <span class="not-small">
                        ${this.states[r.state].ap + seatLabel + ballotLabel}
                      </span>
                      <span class="x-small">
                        ${r.state + seatLabel + ballotLabel}
                      </span>
                    </a>
                  </td>
                  <td class="open-label" colspan="3" role="cell">Last polls close at ${this.states[r.state].closingTime} ET</td>
                  ${this.CandidateCells(r, winner)}
                  <td class="reporting" role="cell">${percentIn}</td>
                  ${this.office == "Senate" ? `
                    <td class="little-label ${flipped ? winner.party : ''}" role="cell">
                      <span class="${goingToRCV ? "rcv-label" : ""}">${goingToRCV ? "RCV" : ""}</span>
                      <span class="${r.runoff ? "runoff-label" : ""}">${r.runoff ? "R.O." : ""}</span>
                      <span class="${flipped ? "flip-label" : ""}">${flipped ? "Flip" : ""}</span>
                    </td>
                  ` : ''}
                  ${this.office == "House" ? `
                    <td class="little-label" role="cell">
                      <span class="${goingToRCV ? "runoff-label" : ""}">${goingToRCV ? "RCV" : ""}</span>
                      <span class="${r.runoff ? "runoff-label" : ""}">${r.runoff ? "R.O." : ""}</span>
                    </td>
                  ` : ''}
                </tr>
              `;
        }).join('')}
          </table>
        `).join('')}
      </div>
    </div>
  `;
    }
}

customElements.define('results-board', ResultsBoard);

export default ResultsBoard;