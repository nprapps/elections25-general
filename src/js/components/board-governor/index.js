var ElementBase = require("../elementBase");
const { formatAPDate, formatTime, winnerIcon } = require("../util");

import gopher from "../gopher.js";
import { getBucket, sumElectoral, groupCalled } from "../util.js";

import ResultBoardDisplay from "../results-board-display";
import ResultBoardKey from "../results-board-key";
import BalanceOfPowerCombined from "../balance-of-power-combined";

/**
 * BoardGovernor - An element for displaying the board/page that holds the governor election results
 * Extends ElementBase to create a component inline with the rest of the project,
 * including competitive races and a results key.
 *
 * @class
 * @extends ElementBase
 */
class BoardGovernor extends ElementBase {
    constructor() {
        super();
        this.state = {};
        this.results = []
        //this.onData = this.onData.bind(this);
        this.loadData = this.loadData.bind(this);

        // Set up gopher watcher directly in constructor
    const governorDataFile = './data/gov.json';
    this.gopherCallback = (data) => {
      if (data && data.results) {
        this.results = data.results;
        this.render();
      }
    };
    gopher.watch(governorDataFile, this.gopherCallback);
    }

      /**
   * Lifecycle method called when component is added to the DOM
   * Initiates the initial data loading, after which it shhould watch gopher
   * 
   * @callback connectedCallback
   */
    connectedCallback() {
        this.loadData();
        this.illuminate();
    }

    disconnectedCallback() {
      if (this.gopherCallback) {
        const houseDataFile = './data/gov.json';
        gopher.unwatch(houseDataFile, this.gopherCallback);
      }
    }


    /**
   * Asynchronously loads governor race data from the gov.json JSON file
   * Sets component results and triggers render
   * 
   * @async
   * @function loadData
   * @returns {Promise<void>}
   */
  /**
   * The data it fetches should look like this
* @typedef {Object[]} Results - the results returned from AP
* @property {boolean} test - Indicates if this is test data
* @property {string} id - Unique identifier for the race
* @property {string} office - Office type (e.g., 'G' for Governor)
* @property {string} type - Election type (e.g., 'General')
* @property {boolean} flippedSeat - Indicates if the seat changed party control
* @property {string} raceCallStatus - Current status of race results (e.g., 'Too Early to Call')
* @property {string} level - Geographic level of the race (e.g., 'state')
* @property {string} state - Two-letter state code
* @property {number} updated - Timestamp of last update
* @property {number} reporting - Number of reporting units
* @property {number} precincts - Total number of precincts
* @property {string} reportingunitID - Identifier for the reporting unit
* @property {number} reportingPercent - Percentage of precincts reporting
* @property {string} stateName - Full state name
* @property {string} stateAP - AP style state abbreviation
* @property {string} rating - Political rating (e.g., 'solid-d', 'likely-r')
* @property {string} previousParty - Party that previously held the seat
* @property {Object[]} candidates - Array of candidate information
 
@typedef {Object} Candidate - stored in the candidates property of the Results object
* @property {string} first - Candidate's first name
* @property {string} last - Candidate's last name
* @property {string} party - Political party (e.g., "Dem", "GOP")
* @property {string} id - Unique candidate identifier
* @property {number} votes - Number of votes received
* @property {number|null} percent - Percentage of total votes
*/
    async loadData() {
        let presidentDataFile = './data/gov.json';
    
        try {
          const presidentResponse = await fetch(presidentDataFile);
          const presidentData = await presidentResponse.json();
          this.results = presidentData.results || {};
          this.render();
        } catch (error) {
          console.error('Error fetching president data:', error);
        }
    }

/**
   * Renders the governor board interface
   * Creates just the results display after sorting into buckets
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
            <h1 tabindex="-1">Governor results</h1>
            <results-board-display office="governor"  hed="Competitive"></results-board-display>
            <results-board-key race="gov"></results-board-key>
        </div>
        <div class="board-footer">
        <div class="footnote board-footnote">${timestampHTML}</div>
        </div>
      `;
    }
}

customElements.define('board-governor', BoardGovernor);
export default BoardGovernor;