var ElementBase = require("../elementBase");
import { reportingPercentage, sortByParty, goingToRCVRunOff } from "../util";
import gopher from "../gopher.js";
const { classify } = require("../util");

//import states from "../data/states.sheet.json";


class ResultsBoard extends ElementBase {
    constructor() {
      super();
      this.loadData = this.loadData.bind(this);
      this.races = JSON.parse(this.getAttribute('races') || '[]');
      this.states = {};
      this.office = this.getAttribute('office') || '';
      this.hed = this.getAttribute('hed') || '';
      this.split = this.getAttribute('split') === 'true';
      this.addClass = this.getAttribute('add-class') || '';
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
      //gopher.watch(`./data/senate.json`, this.loadData);
    }

    async loadData() {
        this.isLoading = true;

        let statesDataFile = './data/states.sheet.json';

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

        var highestPercent = Math.max(...race.candidates.map(c => c.percent));

        return sorted.map(function (c) {        
            var className = ["candidate", c.party];
            
            // Apply 'leading' class to the candidate(s) with the highest percentage
            if (c.percent === highestPercent) className.push("leading");
            
            if (c.winner == "X") className.push("winner");
            if (winner && !c.winner) className.push("loser");
            if (race.runoff) className.push("runoff");
 
            return `
                <td role="cell" class="${className.join(" ")}">
                   ${race.office !== 'P' ? `
                    <div class="name">
                        <div class="last">${c.last}</div>
                        <div class="incumbent">${c.incumbent ? "●" : ""}</div>
                    </div>
                ` : ''}
                  <div class="perc">${Math.round(c.percent * 1000) / 10}%</div> 
                </td>
            `;
        }).join('');
    }


    render() {
        let hasFlips = false;

        this.races.some(function (r) {
            let [winner] = r.candidates.filter(c => c.winner);
            // if (goingToRCVRunOff(r.id)) {
            //     hasFlips = true;
            // }

            if (winner && (
                r.previousParty !== winner.party ||
                winner.winner == "R")
            ) {
                hasFlips = true;
            }
        });

        hasFlips = true;

        let tables = [this.races];

        if (this.split) {
            let half = Math.ceil(this.races.length / 2);
            let firstHalf = this.races.slice(0, half);
            let secondHalf = this.races.slice(half);
            tables = [firstHalf, secondHalf];
        }

        let classNames = [
            "board-wrapper president",
            this.office,
            this.addClass,
            hasFlips ? "has-flips" : "no-flips"
        ];

        const anyHasResult = this.races.some(r => r.eevp || r.reporting || r.called || r.runoff || r.rcvResult);

        this.innerHTML = `
    <div class="${classNames.filter(c => c).join(" ")}">
        ${this.hed ? `<h3 class="board-hed">${this.hed}</h3>` : ""}
        <div class="board-inner">
            ${tables.map(races => `
                <table class="${this.office === 'President' ? 'president' : 'named'} results table" role="table">
                    <tr>
                      ${this.office === 'President' ? 
                        `<th class="state-hed">State</th>
                        <th class="electoral-hed">E.V.</th>
                        <th class="party-hed">${anyHasResult ? 'Harris' : ''}</th>
                        <th class="party-hed">${anyHasResult ? 'Trump' : ''}</th>
                        <th class="reporting-hed">${anyHasResult ? '% in' : ''}</th>` : 
                        ''
                      }
                      <th></th>
                    </tr>
                    ${races.map((r, i) => {
                        var hasResult = r.eevp || r.reporting || r.called || r.runoff;
                        var reporting = r.eevp;
                        var percentIn = reporting || reporting == 0
                            ? `<span>${reportingPercentage(reporting)}%<span class="in"> in</span></span>`
                            : "";
                        var [winner] = r.candidates.filter(c => c.winner == "X");
                        var flipped = winner && (r.previousParty !== winner.party);
                        var stateDetail = this.states[r.state] || {};

                        if (this.office === 'President') {
                            // Presidential race case
                            return `
                                <tr key="${r.state}${r.district}" role="row" class="${hasResult ? "closed" : "open"} index-${i}">
                                    <td role="cell" class="state">
                                        <a href="./${ classify(r.stateName) }.html?section=${r.office}" target="_top">
                                            ${stateDetail.ap} ${r.seatNumber && r.seatNumber !== "AL" ? r.seatNumber : ""}
                                        </a>
                                    </td>
                                    <td role="cell" class="electoral">${r.electoral}</td>
                                    <td role="cell" class="open-label" colspan="3">Last polls close at ${stateDetail.closingTime} ET</td>
                                    ${this.CandidateCells(r, winner)}
                                    <td role="cell" class="reporting">${percentIn}</td>
                                    <td role="cell" class="little-label ${flipped ? winner.party : ''}">
                                        <span class="${r.rcvResult ? "rcv-label" : ""}">${r.rcvResult ? "RCV" : ""}</span>
                                        <span class="${r.runoff ? "runoff-label" : ""}">${r.runoff ? "R.O." : ""}</span>
                                        <span class="${flipped ? "flip-label" : ""}">${flipped ? "Flip" : ""}</span>
                                    </td>
                                </tr>
                            `;
                        } else {
                            // Existing case for other race types
                            var seatLabel = "";
                            var ballotLabel = "";
                  
                            switch (r.office) {
                                case "H": 
                                    seatLabel = ` ${r.seatNumber}`;
                                    break;
                                case "S":
                                    seatLabel = ` `;
                                    break;
                                case "I":
                                    ballotLabel = ` ${r.seat}`;
                                    break;
                            }

                            return `
                                <tr key="${r.id}" class="tr ${hasResult ? "closed" : "open"} index-${i}" role="row">
                                    <td class="state" role="cell">
                                        <a target="_top" href="./${ classify(r.stateName) }.html?section=${r.office}">
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
                                    ${this.office === "Senate" || this.office === "House" || this.office === "governor" ? `
                                        <td class="little-label ${flipped ? winner.party : ''}" role="cell">
                                            <span class="${r.rcvResult ? "rcv-label" : ""}">${r.rcvResult ? "RCV" : ""}</span>
                                            <span class="${r.runoff ? "runoff-label" : ""}">${r.runoff ? "R.O." : ""}</span>
                                            ${this.office !== "House" ? `<span class="${flipped ? "flip-label" : ""}">${flipped ? "Flip" : ""}</span>` : ''}
                                        </td>
                                    ` : ''}
                                </tr>
                            `;
                        }
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