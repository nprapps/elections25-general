var ElementBase = require("../elementBase");
const { formatAPDate, formatTime, winnerIcon } = require("../util");

import gopher from "../gopher.js";
import { getBucket, sumElectoral, groupCalled } from "../util.js";

import ResultBoardDisplay from "../results-board-display";
import ResultBoardKey from "../results-board-key";
import BalanceOfPowerCombined from "../balance-of-power-combined";

/**
 * BoardHouse - An element for displaying the board/page that holds the House key-races election results
 * Extends ElementBase to create a component inline with the rest of the project. Also has properties and classes assigned to have the three column design.
 * The results are stored and accessed in this.results = []
 *
 * @class
 * @extends ElementBase
 */
class BoardHouse extends ElementBase {
  constructor() {
    super();
    this.state = {};
    this.results = []
    //this.onData = this.onData.bind(this);
    this.loadData = this.loadData.bind(this);
  }

  /**
   * Lifecycle method called when component is added to the DOM
   * Initiates the initial data loading, after which it should keep watching gopher
   * 
   * @callback connectedCallback
   */
  connectedCallback() {
    this.loadData();
    gopher.watch(`./data/house.json`, this.loadData);
    this.illuminate();
  }

  disconnectedCallback() {
    gopher.unwatch(`./data/house.json`, this.loadData);
  }

  /**
   * Asynchronously loads house race data from the house.json JSON file
   * Sets the global results variable and triggers render()
   * 
   * @async
   * @function loadData
   * @returns {Promise<void>}
   * 
   * The data it fetches should look like this
   * @property {boolean} test - Indicates if this is test data
   * @property {string} id - Unique race identifier
   * @property {string} office - Office type ("H" for House)
   * @property {number} eevp - Expected election vote percentage
   * @property {string} type - Election type (e.g., "General")
   * @property {string} seatNumber - District number
   * @property {string} seat - District name (e.g., "District 1")
   * @property {boolean} flippedSeat - Whether the seat changed parties
   * @property {number} winThreshold - Percentage needed to win
   * @property {boolean} rankedChoice - Whether race uses ranked choice voting
   * @property {string} raceCallStatus - Current status (e.g., "Too Early to Call")
   * @property {string} level - Geographic level (e.g., "state")
   * @property {string} state - State abbreviation
   * @property {number} updated - Timestamp of last update
   * @property {number} reporting - Number of precincts reporting
   * @property {number} precincts - Total number of precincts
   * @property {string} reportingunitID - Reporting unit identifier
   * @property {number} reportingPercent - Percentage of precincts reporting
   * @property {string} stateName - Full state name
   * @property {string} stateAP - AP style state name
   * @property {string} rating - Race rating (e.g., "toss-up")
   * @property {string} previousParty - Previous winning party
   * @property {string} keyRace - Whether this is a key race ("yes" or "")
   * @property {Object[]} candidates - Array of candidate information
   
    @typedef {Object} Candidate - stored in the candidates property of the Results object
   * @property {string} first - Candidate's first name
   * @property {string} last - Candidate's last name
   * @property {string} party - Political party (e.g., "Dem", "GOP", "Other")
   * @property {string} id - Unique candidate identifier
   * @property {number} votes - Number of votes received
   * @property {number|null} percent - Percentage of total votes
   * @property {number} [avotes] - Additional votes (for "Other" candidates)
   * @property {number} [electoral] - Electoral votes (for "Other" candidates)
   * @property {number} [count] - Number of additional candidates (for "Other")
   */

  async loadData() {
    let houseDataFile = './data/house.json';

    try {
      const houseResponse = await fetch(houseDataFile);
      const houseData = await houseResponse.json();
      this.results = houseData.results || {};
      this.render();
    } catch (error) {
      console.error('Error fetching president data:', error);
    }
  }

  /**
   * Renders the house board interface
   * Creates balance-of-power-combined component and results-board-display component after sorting into buckets
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
        <div class="house board">
          <div class="header">
            <div class="title-wrapper">
              <h1 tabindex="-1">Key House results</h1>
            </div>
            <div class="bop-wrapper">
             <balance-of-power-combined race="house"></balance-of-power-combined>
            </div>
          </div>
          <results-board-display office="House" split="true" hed="Competitive"></results-board-display>
          <results-board-key race="house"></results-board-key>
        </div>
          <div class="board-footer">
        <div class="footnote board-footnote">${timestampHTML}</div>
        </div>
      `;
  }
}

customElements.define('board-house', BoardHouse);
export default BoardHouse;