var ElementBase = require("../elementBase");

import gopher from "../gopher.js";
import { getBucket, sumElectoral, groupCalled } from "../util.js";

import ResultBoardDisplay from "../results-board-display";
import ResultBoardKey from "../results-board-key";
import BalanceOfPowerCombined from "../balance-of-power-combined";


class BoardSenate extends ElementBase {
    constructor() {
        super();
        this.state = {};
        this.results = []
        //this.onData = this.onData.bind(this);
        this.loadData = this.loadData.bind(this);
    }

    connectedCallback() {
        this.loadData();
        this.illuminate();
        gopher.watch(this.getAttribute("./data/senate.json"), this.onData);
    }

    disconnectedCallback() {
        gopher.unwatch(this.getAttribute("./data/senate.json"), this.onData);
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
      `;
    }
}

customElements.define('board-senate', BoardSenate);
export default BoardSenate;