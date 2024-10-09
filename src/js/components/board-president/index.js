var ElementBase = require("../elementBase");

import gopher from "../gopher.js";
import { getBucket, sumElectoral, groupCalled } from "../util.js";
import ElectoralBars from "../electoral-bars";
import Leaderboard from "../leader-board";
import ResultBoardDisplay from "../results-board-display";


class BoardPresident extends ElementBase {
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
    }

    disconnectedCallback() {
        gopher.unwatch(this.getAttribute("data-file"), this.onData);
    }


    async loadData() {
        let presidentDataFile = './data/president.json';
    
        try {
          const presidentResponse = await fetch(presidentDataFile);
          const presidentData = await presidentResponse.json();
          this.results = presidentData.results || {};
          this.render();
        } catch (error) {
          console.error('Error fetching president data:', error);
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

          <electoral-bars called='${JSON.stringify(called)}'></electoral-bars>
          <h1 tabindex="-1">Presidential Results</h1>
              <results-board-display office="president" split="true" hed="Competitive"></results-board-display>

          <hr class="divider" />
        </div>
      `;
    }
}

customElements.define('board-president', BoardPresident);
export default BoardPresident;