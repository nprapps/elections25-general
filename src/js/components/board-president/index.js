var ElementBase = require("../elementBase");

import gopher from "../gopher.js";
import { getBucket, sumElectoral, groupCalled } from "../util.js";
import ElectoralBars from "../electoral-bars";
import Leaderboard from "../leader-board";
import ResultBoardDisplay from "../results-board-display";
import ResultBoardKey from "../results-board-key";
import Cartogram from "../cartogram";
import NationalMap from "../nationalMap";
import Tabs from "../tabs";

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
    gopher.unwatch(this.getAttribute("./data/president.json"), this.onData);
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
        <leader-board called='${JSON.stringify(called)}'></leader-board>
          <h1 tabindex="-1">Presidential Results</h1>
              <results-board-key race="president" simple="true"></results-board-key>
              <tabs-component>
              <div icon="./assets/icons/ico-cartogram.svg" label="Electoral">
                <cartogram-map races="{results}"></cartogram-map>
              </div>
              <div icon="./assets/icons/ico-geo.svg" label="Geography">
                <national-map races="{results}"></national-map>
              </div>
              <div icon="./assets/icons/ico-bubbles.svg" label="Margins">
                <electoral-bubbles results="{results}" races="{results}"></electoral-bubbles>
              </div>
              </tabs-component>
              <results-board-display office="president" split="true" hed="Competitive"></results-board-display>
              <results-board-key race="president"></results-board-key>
          <hr class="divider" />
        </div>
      `;
  }
}

customElements.define('board-president', BoardPresident);
export default BoardPresident;