const ElementBase = require("../elementBase");
import { classify, reportingPercentage, statePostalToFull, winnerIcon } from "../util.js";
import track from "../../lib/tracking";
import gopher from "../gopher.js";
import TestBanner from "../test-banner";


/**
 * Cartogram - Interactive electoral map visualization component that is part of the board-president parent component
 * Displays state-by-state election results in a grid-based layout
 * @extends ElementBase
 * 
 * @class
 * @property {Object} state - Component state
 * @property {Object} races - Election race results
 * @property {HTMLElement} tooltip - Tooltip element reference
 * @property {Object} svgContainerRef - Reference to SVG container
 * @property {SVGElement} svg - The SVG element
 */
class Cartogram extends ElementBase {
  constructor() {
    super();
    this.state = {};
    this.loadData = this.loadData.bind(this);
    this.loadSVG = this.loadSVG.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onClick = this.onClick.bind(this);
    this.paint = this.paint.bind(this);
    this.races = {};
    this.tooltip = null;
    this.svgContainerRef = { current: null };
    this.svg = null;
  }

  /**
   * Lifecycle method that initiates data loading and watching
   * Sets up data watcher for president.json to enable live updates
   * @callback connectedCallback
   */
  async connectedCallback() {
    this.loadData();
    //gopher.watch(`./data/president.json`, this.loadData);
  }


  disconnectedCallback() {
    if (this.svg) {
      this.svg.removeEventListener("mousemove", this.onMove);
      this.svg.removeEventListener("click", this.onClick);
    }
  }

   /**
   * Creates initial DOM structure
   * Called on first load and when data updates
   * @method render
   */
  render() {
    this.innerHTML = `
          <div class="cartogram" role="img" aria-label="Cartogram of state results">
              <div class="banner-placeholder"></div>
            <div class="svg-container"></div>
            <div class="tooltip"></div>
          </div>
        `;
  }

/**
   * Fetches and processes required data files
   * Loads states.sheet.json for electoral votes
   * Loads president.json for race results
   * Loads _map-cartogram.svg for visualization
   * Called on initialization and whenever data updates
   * @method loadData
   * @async
   * Triggers paint() and initLabels() after successful load
   * 
   * The data it fetches should look like this
    * @typedef {Object} PresidentResult
    * @property {boolean} test - Test data indicator
    * @property {string} id - Race identifier
    * @property {string} office - Office type ("P")
    * @property {number} eevp - Expected election vote percentage
    * @property {string} type - Election type
    * @property {number} winThreshold - Percentage needed to win
    * @property {boolean} rankedChoice - Ranked choice voting indicator
    * @property {string} raceCallStatus - Race call status
    * @property {string} level - Geographic level
    * @property {string} state - State abbreviation
    * @property {number} electoral - Electoral votes
    * @property {number} updated - Last update timestamp
    * @property {number} reporting - Precincts reporting count
    * @property {number} precincts - Total precincts
    * @property {string} reportingunitID - Reporting unit identifier
    * @property {number} reportingPercent - Percentage of precincts reporting
    * @property {string} stateName - Full state name
    * @property {string} stateAP - AP style state name
    * @property {string} rating - Race rating (e.g., "likely-r")
    * @property {Object[]} candidates - Array of candidate information

    * 
      @typedef {Object} Candidate - stored in the candidates property of the Results object
    * @property {string} first - First name
    * @property {string} last - Last name
    * @property {string} party - Political party ("Dem", "GOP", "Other")
    * @property {string} id - Candidate identifier
    * @property {number} votes - Vote count
    * @property {number|null} percent - Vote percentage
        */
  async loadData() {
    this.render();

    await Promise.resolve();

    this.svgContainerRef.current = this.querySelector('.svg-container');
    this.tooltip = this.querySelector('.tooltip');

    if (!this.svgContainerRef.current || !this.tooltip) {
      console.error("SVG container or tooltip not found");
      return;
    }

    let statesDataFile = './data/states.sheet.json';
    let presidentDataFile = './data/president.json';

    try {
      const [statesResponse, presidentResponse] = await Promise.all([
        fetch(statesDataFile),
        fetch(presidentDataFile)
      ]);

      const [statesData, presidentData] = await Promise.all([
        statesResponse.json(),
        presidentResponse.json()
      ]);

      this.states = statesData || {};
      this.races = presidentData.results || {};
      if (this.races?.[1]["test"]) {
        const bannerPlaceholder = this.querySelector('.banner-placeholder');
        bannerPlaceholder.innerHTML = '<test-banner></test-banner>';
      }

      try {
        const response = await fetch("./assets/synced/_map-cartogram-new.svg");
        const svgText = await response.text();
        this.svg = await this.loadSVG(svgText);
        if (this.svg) {
          this.paint();
          this.initLabels();
        }
      } catch (error) {
        console.error("Failed to load SVG:", error);
        return;
      }
    } catch (error) {
      console.error("Could not load JSON data:", error);
    } finally {
      this.isLoading = false;
    }
  }


  /**
  * Prepares SVG for interaction and sets up event listeners for hover and click
  * Called after SVG text is loaded
  * @method loadSVG
  * @async
  * @param {string} svgText - Raw SVG content
  * @returns {SVGElement|null}
  */
  async loadSVG(svgText) {
    if (!this.svgContainerRef.current) {
      console.error("SVG container not found");
      return;
    }

    this.svgContainerRef.current.innerHTML = svgText;
    this.svg = this.svgContainerRef.current.querySelector("svg");

    if (!this.svg) {
      console.error("SVG element not found after insertion");
      return;
    }

    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');

    this.svg.addEventListener("mousemove", this.onMove);
    this.svg.addEventListener("click", this.onClick);
    return this.svg;
  }

 /**
  * Handles state/district selection
  * Redirects to detailed state view
  * Triggers analytics tracking
  * @method onClick
  * @param {Event} e - Click event
  */
  onClick(e) {
    const group = e.target.closest("svg > g");
    if (!group) return;
    const state = group.getAttribute("data-postal");
    if (state) {
      track("clicked-cartogram", state);
      var linkTarget = document.head.querySelector("base").target || "_blank";
      var stateFull = statePostalToFull(state);
      window.open(`${ classify(stateFull) }.html?section=P`, linkTarget);
    }
  }

  /**
   * Called on mouse movement over states and manages hover state and tooltip position and content
   * Shows electoral votes and candidate percentages
   * @method onMove
   * @param {MouseEvent} e - Mouse event object
 * @requires {SVGElement} this.svg - SVG element must be loaded
 * @requires {HTMLElement} this.tooltip - Tooltip element
 * @requires {Array} this.races - Race results data
 * 
 * @effects
 * - Positions tooltip relative to mouse and viewport
 *   - Left side if cursor in right half of SVG
 *   - Right side if cursor in left half
 *   - x offset: -150px (left) or +20px (right)
 * - Displays race information in tooltip
 *   - State/district header with electoral votes
 *   - Candidate rows with party color, name, winner icon
 *   - Reporting percentage footer
 * 
 * @dataHandling
 * - Handles special cases:
 *   - At-Large districts ("AL")
 *   - Multi-district states
 *   - Missing or incomplete results
 * 
 * @triggers
 * - On mousemove over SVG
 * - Removes tooltip when leaving postal group
   */
  onMove(e) {
    const currentHover = this.svg.querySelector(".hover");
    if (currentHover) {
      currentHover.classList.remove("hover");
    }

    this.tooltip.classList.remove("shown");
    const postalGroup = e.target.closest("[data-postal]");
    if (!postalGroup) {
      return;
    }
    const postal = postalGroup.getAttribute("data-postal");

    this.svg.querySelectorAll(`[data-postal="${postal}"]`).forEach(g => g.classList.add("hover"));

    // Tooltip positioning logic
    const bounds = this.svg.getBoundingClientRect();
    let x = e.clientX - bounds.left;
    let y = e.clientY - bounds.top;
    if (x > bounds.width / 2) {
      x -= 150;
    } else {
      x += 20;
    }
    this.tooltip.style.left = x + "px";
    this.tooltip.style.top = y + "px";

    // Tooltip content logic
    const [stateName, district] = postal.split("-");
    const districtDisplay = district == "AL" ? " At-Large" : " " + district;
    const results = this.races.filter((r) => r.state == stateName);
    let result;

    if (district === "AL") {
      result = results[0];
    } else if (district) {
      result = results.find(r => r.seatNumber === district);
    } else {
      result = results[0];
    }

    if (!result) return;

    // Filter candidates with a percent value; old way is commented out
    //const candidates = result.candidates.filter(c => c.percent);
    const candidates = result.candidates


    this.tooltip.innerHTML = `
          <h3>${result.stateName}${district ? districtDisplay : ""} <span>(${result.electoral})</span></h3>
          <div class="candidates">${candidates.map(c =>
      `<div class="row">
                <div class="party ${c.party}"></div>
                <div class="name">${c.last}</div> ${c.winner == "X" ? winnerIcon : ""}
                <div class="perc">${Math.round(c.percent * 1000) / 10}%</div>
            </div>`
    ).join("")}</div>
          <div class="reporting">${reportingPercentage(
      result.eevp || result.reportingPercent
    )}% in</div>
        `;

    this.tooltip.classList.add("shown");
  }

  /**
   * Positions state labels and electoral vote counts and adjusts the labels based on viewport width
   * Called after SVG load and on resize, though may occaisonally not finish in time
   * @method initLabels
   *  @requires {Object} this.states - State data containing electoral votes
 * 
 * @effects
 * - Positions state abbreviation labels, with special handling for ME (4 votes) and NE (5 votes)
 * - Adds electoral vote counts if viewport > 650px
 * - Attempts getBBox() for positioning, falls back to attribute calculations
* 
 * @triggers
 * - After SVG load
 * - On viewport resize (though not automatically)
 * - Should re-run if SVG dimensions change
   */
  initLabels() {
    if (!this.svg) {
      console.error("SVG not available for initializing labels");
      return;
    }
    const groups = this.svg.querySelectorAll("svg > g[data-postal]");
    groups.forEach((g) => {
      const stateName = g.dataset.postal;
      const square = g.querySelector("rect");
      const label = g.querySelector("text");
      const bbox = square.getBBox();
      const labelBox = label.getBBox();
      const hasDistricts = g.querySelector("[data-postal]");

      let x, y;
      if (hasDistricts) {
        if (stateName === "NE") {
          x = parseFloat(square.getAttribute('x')) - 8;
        } else if (stateName === "ME") {
          x = parseFloat(square.getAttribute('x')) - 24;
        }        
        y = parseFloat(square.getAttribute('y')) + 20;
      } else {
        const squareX = parseFloat(square.getAttribute('x'));
        const squareY = parseFloat(square.getAttribute('y'));
        const squareWidth = parseFloat(square.getAttribute('width'));
        const squareHeight = parseFloat(square.getAttribute('height'));

        x = squareX + (squareWidth / 2);
        y = squareY + (squareHeight / 2) + 5;
      }

      if (window.innerWidth > 650) {
        y -= labelBox.height / 2;
        let votes = this.states[stateName].electoral;
        switch (stateName) {
          case "NE":
            votes = 5;
            break;
          case "ME":
            votes = 4;
            break;
        }
        const electoralLabel = document.createElementNS(this.svg.namespaceURI, "text");
        electoralLabel.textContent = votes;

        g.appendChild(electoralLabel);

        electoralLabel.setAttribute("x", x);
        electoralLabel.setAttribute("y", y + 10);
        electoralLabel.setAttribute("class", "votes");
      }

      label.setAttribute("x", x);
      label.setAttribute("y", y);
    });
  }

   /**
   * Colors states based on results and reporting status and called after data load and updates
   *
   * @method paint
  * @requires {SVGElement} this.svg - SVG element must be loaded
  * @requires {Array} this.races - Array of race results with at least these elements 
  *   {
  *     eevp: number -  Expected vote percentage
  *     reportingPercent - number,
  *     district: string -  District identifier
  *     seatNumber: string -  Alternate district identifier
  *     state: string - State abbreviation
  *     candidates: [{
  *       party: string  - Party identifier
  *     }],
  *     winnerParty: string - Winner's party if race called
  *   }
  * 
  * @effects
  * - Adds classes to state elements based on reporting status:
  *   - "early": When any votes reported (eevp > 0)
  *   - "leader"+"party": When majority reported (eevp > 0.5)
  *   - "winner"+"party": When race is called
  * - Handles special cases for ME/NE districts
  * - Skips states not found in SVG
  * 
  * @triggers
  * - After initial data load
  * - When race results update
  * - When SVG is loaded/reloaded
  */
  paint() {
    if (!this.svg) return;

    this.races.forEach((r) => {
      const eevp = r.eevp || r.reportingPercent;
      const district = r.district || r.seatNumber
      let state = r.state + (district ? "-" + district : "");
      let stateName = r.state.toUpperCase();

      if (state === 'ME' || state === 'NE') {
        if (district) {
          state += `-${district}`;
        } else {
          state += '-AL';
        }
      }

      const leader = r.candidates[0].party;
      const winner = r.winnerParty;
      const groups = this.svg.querySelectorAll(`[data-postal="${state}"]`);
      if (!groups.length) return;

      groups.forEach((g) => {
        g.classList.remove("early", "winner", "leader", "GOP", "Dem");

        if (eevp > 0) {
          g.classList.add("early");
        }
        if (eevp > 0.5) {
          g.classList.add("leader");
          g.classList.add(leader);
        }
        if (winner) {
          g.classList.add("winner");
          g.classList.add(winner);
        }
      });
    });
  }
}

customElements.define('cartogram-map', Cartogram);