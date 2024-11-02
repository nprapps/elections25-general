var ElementBase = require("../elementBase");
const { formatAPDate, formatTime, winnerIcon } = require("../util");

import gopher from "../gopher.js";
import { getBucket, sumElectoral, groupCalled } from "../util.js";

import ResultBoardDisplay from "../results-board-display";
import ResultBoardKey from "../results-board-key";
import BalanceOfPowerCombined from "../balance-of-power-combined";


/**
 * BoardSenate - An element for displaying the board/page that holds the Senate races election results
 * Extends ElementBase to create a component inline with the rest of the project. Also has properties and classes assigned to have the three column design.
 * The results are stored and accessed in this.results = []
 *
 * @class
 * @extends ElementBase
 */
class BoardSenate extends ElementBase {
    constructor() {
        super();
        this.state = {};
        this.results = []
        //this.onData = this.onData.bind(this);
        this.loadData = this.loadData.bind(this);
    }

     /**
   * Lifecycle method called when component is added to the DOM
   * Initiates the initial data loading, after which it should keep watching gopher. Technically, no other subcomponent should need to watch gopher
   * 
   * @callback connectedCallback
   */
    connectedCallback() {
        this.loadData();
        this.illuminate();
        gopher.watch(this.getAttribute("./data/senate.json"), this.loadData);
    }

    disconnectedCallback() {
        gopher.unwatch(this.getAttribute("./data/senate.json"), this.loadData);
    }


    async loadData() {
        try {
            const response = await fetch('./data/senate.json');
            const { results = {} } = await response.json();
            this.results = results;
            this.render();
          } catch (error) {
            console.error('Error fetching senate data:', error);
          }
    }

    /**
   * Renders the senate board interface
   * Creates Creates balance-of-power-combined component and results-board-display component after sorting into buckets
   * Handles conditional rendering based on data attributes
   * @function render
   * @property {Object} buckets - Groups races by rating (likelyD, tossup, likelyR)
   */
    render() {
        const { results = [], test, latest } = this.state;

        var buckets = {
            likelyD: [],
            tossup: [],
            likelyR: [],
        };

        results.forEach(function (r) {
            r.districtDisplay = (r.district !== "AL") ? r.district : "";
        });

        var sorted = results.slice().sort(function (a, b) {
            if (a.stateName > b.stateName) return 1;
            if (a.stateName < b.stateName) return -1;
            if (a.districtDisplay > b.districtDisplay) return 1;
            if (a.districtDisplay < b.districtDisplay) return -1;
            return 0;
        });

        sorted.forEach(function (r) {
            var bucketRating = getBucket(r.rating);
            if (bucketRating) buckets[bucketRating].push(r);
        }, this);

        var called = groupCalled(this.results);

        var updated = Math.max(...this.results.map(r => r.updated));

        const date = new Date(updated);

        let timestampHTML = `Last updated ${formatAPDate(date)} at ${formatTime(date)}`;

        this.innerHTML = `
        <div class="president board">
          ${test ? '<test-banner></test-banner>' : ''}
        <div class="header">
          <div class="title-wrapper">
            <h1 tabindex="-1">Senate Results</h1>
          </div>
          <div class="bop-wrapper">
           <balance-of-power-combined race="senate"></balance-of-power-combined>
           </div>
        </div>
            <results-board-display office="Senate" split="true" hed="Competitive"></results-board-display>
            <results-board-key race="senate"></results-board-key>
        </div>
        <div class="board-footer">
        <div class="board source-footnote">${timestampHTML}</div>
        </div>
      `;
    }
}

customElements.define('board-senate', BoardSenate);
export default BoardSenate;