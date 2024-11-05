import gopher from "../gopher.js";
const ElementBase = require("../elementBase");

import {
  formatters,
  reportingPercentage,
  getParty,
  getPartyPrefix,
  isSameCandidate,
  getCountyCandidates,
} from "../util.js";


/**
 * @class CountyMap
 * @extends ElementBase
 * @description Renders an interactive county-level map visualization,
 * used for displaying electoral results data.
 */
class CountyMap extends ElementBase {
  constructor() {
    super();

    this.fipsLookup = [];

    this.handleResize = this.handleResize.bind(this);
    this.state = {};
    this.width;
    this.height;
    this.data = null
    this.sortOrder;
    this.legendCands = []
    this.lastExecutionTime = 0;
    this.minInterval = 1000;
    this.newEnglandStates = ['CT', 'MA', 'ME', 'NH', 'RI', 'VT'];
    this.townCodesData = null;
  }


  /**
   * @async
   * @method connectedCallback
   * @description Lifecycle method that runs when the element is added to the DOM.
   * Fetches and processes county-level data, identifies winning candidates,
   * and initializes the visualization.
   * @throws {Error} When HTTP request fails or data cannot be processed
   * @returns {Promise<void>}
   */
  async connectedCallback() {

    const state = this.getAttribute('state');
    const race = this.getAttribute('race-id');

    let url;

    if (race !== null) {
      url = `./data/counties/${race}.json`;
    } else {
      url = `./data/counties/${state}-0.json`;
    }

    try {

      const newEnglandStates = ['CT', 'MA', 'ME', 'NH', 'RI', 'VT'];

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.data = data.results || [];

      // Only display candidates that are winning a county
      const sortOrder = this.data[0].candidates;
      this.sortOrder = sortOrder;
      const winningCandidates = getCountyCandidates(sortOrder, this.data);


      // Add in special marker if more than one candidate of same party is winning a county.
      let specialCount = 1;
      this.legendCands = winningCandidates.map(candidate => {
        const samePartyCount = winningCandidates.filter(c =>
          getParty(c.party) === getParty(candidate.party)
        ).length;

        if (samePartyCount > 1) {
          return { ...candidate, special: specialCount++ };
        }
        return candidate;
      });

      this.render();
      await this.loadSVG();
    } catch (error) {
      console.error("Could not load JSON data:", error);
      this.render(); // Render to show error state
    }
    //window.addEventListener("resize", this.handleResize);
  }

  /**
 * @method handleResize
 * @description Updates SVG dimensions based on window size and container constraints (calculated by updateDimensions)
 * Maintains aspect ratio while fitting within maximum dimensions.
 * @returns {void}
 * @throws {Error} Implicitly returns if this.svg is not available
 */
  handleResize() {
    var newWidth = window.innerWidth;
    if (!this.state.width || newWidth != this.state.width) {
      this.setState({
        width: newWidth,
      });
      this.updateDimensions();
    }
  }


  updateDimensions() {
    if (!this.svg) return;

    var embedded = false; //document.body.classList.contains("embedded");
    var mapContainer = this.querySelector('.map-container');

    var innerWidth = window.innerWidth;
    var maxH = 400;
    var maxW = 600;

    var ratio = this.height / this.width;
    var w = Math.min(innerWidth - 40, maxW);
    var h = Math.min(w * ratio, maxH);

    this.svg.setAttribute("width", w + "px");
    this.svg.setAttribute("height", h + "px");

    this.querySelector('.container').classList.toggle(
      "horizontal",
      this.width < this.height
    );
  }

  /**
 * @method render
 * @description Renders the component's HTML structure including the map container,
 * legend, and tooltip elements. Uses template literals for dynamic content generation, and the processData() and createLegend() functions
 * @returns {void}
 * @fires createLegend
 */

  processData(data) {
    this.legendCands = getCountyCandidates(this.getAttribute('sort-order'), data);
    let specialCount = 1;
    this.legendCands.forEach((c, index) => {
      if (this.legendCands.filter(l => getParty(l.party) == getParty(c.party)).length > 1) {
        c.special = specialCount;
        specialCount += 1;
      }
    });
    this.render();
  }

  createLegend(candidate) {
    if (!candidate.id) return;
    var name = `${candidate.last}`;
    var specialShading = candidate.special;
    return (`
      <div class="key-row">
        <div
          class="swatch ${getParty(
      candidate.party
    )} i${specialShading}"></div>
        <div class="name">${name}</div>
      </div>
    `);
  }


  render() {
    this.innerHTML = `
      <div class="county-map" data-as="map" aria-hidden="true">
        <div class="container" data-as="container">
          <div class="key" data-as="key">
            <div class="key-grid">
              ${this.legendCands.map(candidate => this.createLegend(candidate)).join('')}
            </div>
          </div>
         <div class="map-container" data-as="mapContainer">
            <div class="map" data-as="map">
              <div class="svg-container"></div>
            </div>
            <div class="tooltip"></div>
          </div>
        </div>
      </div>
    `
  }

  /**
 * @method loadSVG
 * @description Loads and initializes the SVG map depending on the state. attaches event listeners to the svg
 * @returns {Promise<void>}
 * @async
 * @throws {Error} If SVG loading or processing fails
 */
  async loadSVG() {
    const state = this.getAttribute('state');
    const newEnglandStates = ['CT', 'MA', 'ME', 'NH', 'RI', 'VT'];
    const basePath = newEnglandStates.includes(state)
      ? './assets/synced/towns/'
      : './assets/counties/';

    const response = await fetch(`${basePath}${state}.svg`);
    const text = await response.text();
    this.svgContainer = this.querySelector('.svg-container');
    this.svgContainer.innerHTML = text;
    this.svg = this.svgContainer.querySelector('svg');
    this.width = this.svg.getAttribute("width") * 1;
    this.height = this.svg.getAttribute("height") * 1;

    this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

    var paths = this.svg.querySelectorAll("path");
    paths.forEach((p, i) => {
      p.setAttribute("vector-effect", "non-scaling-stroke");
    });

    this.svg.addEventListener("mousemove", e => this.onMove(e));
    this.svg.addEventListener("mouseleave", e => this.onMove(e));

    this.paint();
    this.updateDimensions();

    return this.svg;
  }

  /**
   * @method paint
   * @description Paints the county map SVG based on electoral data. Handles special cases for
   * New England townships and implements a two-pass system for data processing and visualization.
   * 
   * @returns {void}
   * @throws {Error} Implicitly returns if this.svg is not available
   * 
   * @property {Object} this.fipsLookup - Stores processed FIPS data for quick lookups
   * @property {Array} this.data - Source data for the map
   * @property {SVGElement} this.svg - The SVG element to be painted
   * 
   * @example
   * // Example data structure expected in this.data:
   * // [
   * //   {
   * //     state: "MA",
   * //     fips: "25001",
   * //     candidates: [
   * //       { percent: 55.5, votes: 1000, party: "DEM" },
   * //       { percent: 44.5, votes: 800, party: "REP" }
   * //     ],
   * //     reportingPercent: 0.95
   * //   }
   * // ]
   */

  paint() {
    if (!this.svg) return;
    var mapData = this.data;
    var incomplete = false;
    this.fipsLookup = {};

    const newEnglandStates = ['CT', 'MA', 'ME', 'NH', 'RI', 'VT'];
    const isNewEngland = mapData.length > 0 && newEnglandStates.includes(mapData[0].state);

    const dataKeys = [...mapData.keys()];
    const missingCounties = [];

    // First pass: build fipsLookup
    mapData.forEach((entry, index) => {
      var [top] = entry.candidates.sort((a, b) => b.percent - a.percent);
      const lookupKey = isNewEngland ? `${entry.censusID}` : entry.fips;
      this.fipsLookup[lookupKey] = entry;

      // Debug: Check if the entry can be found in SVG
      const pathId = isNewEngland ? `fips-${entry.censusID}` : `fips-${entry.fips}`;
      const path = this.svg.querySelector(`[id="${pathId}"]`);
      if (!path) {
        missingCounties.push({
          index,
          pathId,
          name: entry.name,
          state: entry.state,
          censusID: entry.censusID,
          fips: entry.fips,
          originalData: entry  // Added this line to include original data
        });
      }
    });

    // Sort missing counties by state and name
    missingCounties.sort((a, b) => {
      if (a.state !== b.state) return a.state.localeCompare(b.state);
      return a.name.localeCompare(b.name);
    });


    // Optional: Group by state for easier reading
    const missingByState = missingCounties.reduce((acc, county) => {
      acc[county.state] = acc[county.state] || [];
      acc[county.state].push({
        name: county.name,
        censusID: county.censusID,
        originalData: county.originalData  // Include original data in grouped view
      });
      return acc;
    }, {});

    // Second pass: paint the map
    for (var d of dataKeys) {
      const entry = mapData[d];
      if (!entry.candidates) continue;

      var candidates = entry.candidates;
      var [top] = entry.candidates.sort((a, b) => b.percent - a.percent);
      if (!top.votes) continue;
      let tie = candidates[0].percent === candidates[1].percent ? true : false;

      // Use the same key format as above
      const pathId = isNewEngland ? `fips-${entry.censusID}` : `fips-${entry.fips}`;
      let path = this.svg.querySelector(`[id="${pathId}"]`);

      // If path not found and this is a missing county, try alternative formats
      if (!path && missingByState[entry.state]) {
        const missingCounty = missingByState[entry.state].find(c => c.originalData === entry);
        if (missingCounty) {
          const altPathIds = [
            `fips-${entry.censusID}`,
            `fips-${entry.fips}`,
            entry.censusID,
            entry.fips
          ];

          for (const altPathId of altPathIds) {
            path = this.svg.querySelector(`[id="${altPathId}"]`);
            if (path) break;
          }
        }
      }

      if (!path) continue;

      // Skip if already painted
      if (path.classList.contains("painted")) continue;

      path.classList.add("painted");
      var hitThreshold = entry.reportingPercent > 0.01;
      var allReporting = entry.reportingPercent >= 1;

      if (!hitThreshold) {
        path.style.fill = "#e1e1e1";
        incomplete = true;
      } else {
        var [candidate] = this.legendCands.filter(c => isSameCandidate(c, top));
        if (candidate.special) path.classList.add(`i${candidate.special}`);
        if (tie) {
          path.classList.add("tie")
        } else {
          path.classList.add(getParty(top.party));
        }
        path.classList.add("leading");
        if (allReporting) path.classList.add("allin");
      }
    }

    // After painting all counties, find any that weren't painted
    const allCountyPaths = this.svg.querySelectorAll('.map g path[id^="fips-"]');
    const unpaintedCounties = Array.from(allCountyPaths)
      .filter(path => !path.classList.contains("painted"));

    // Group unpainted counties
    const unpaintedByState = unpaintedCounties.reduce((acc, path) => {
      const stateCode = path.id.replace('fips-', '').slice(0, 2);

      acc[stateCode] = acc[stateCode] || [];
      acc[stateCode].push(path.id);

      return acc;
    }, {});

    // Prepare summary object and log reuslts
    const summary = {
      totalCountiesInData: mapData.length,
      totalMapElements: allCountyPaths.length,
      missingCounties: missingByState,
      unpaintedElements: unpaintedByState
    };

    /*
    console.log('=================');
    console.log('Election Map Summary:', summary);
    console.log('Full county data:', mapData);
    */
  }


  highlightCounty(fips) {
    if (!this.svg) return;
    var county = this.svg.querySelector(`[id="fips-${fips}"]`);
    if (county == this.lastClicked) return;
    if (this.lastClicked) this.lastClicked.classList.remove("clicked");
    county.parentElement.appendChild(county);
    county.classList.add("clicked");
    this.lastClicked = county;
  }

  onMove(e) {
    var tooltip = this.querySelector('.tooltip');
    var fips = e.target.id.replace("fips-", "");

    if (!fips || e.type == "mouseleave") {
      tooltip.classList.remove("shown");
      return;
    }

    const newEnglandStates = ['CT', 'MA', 'ME', 'NH', 'RI', 'VT'];
    const isNewEngland = Object.values(this.fipsLookup).length > 0 &&
      newEnglandStates.includes(Object.values(this.fipsLookup)[0].state);

    let lookupKey = fips;
    var result

    if (isNewEngland) {
      result = Object.values(this.fipsLookup).find(entry => entry.censusID === lookupKey);
    } else {
      result = this.fipsLookup[lookupKey];
    }


    this.svg.appendChild(e.target);

    if(!result) {
      tooltip.classList.remove("shown");
      return
    }

    if (result) {
      // Update this.sortOrder with the current county's candidates
      this.sortOrder = result.candidates;

      // Recalculate winningCandidates
      const winningCandidates = getCountyCandidates(this.sortOrder, [result]);
      // Your existing code, modified to check execution time
      const currentTime = Date.now();
      if (currentTime - this.lastExecutionTime >= this.minInterval) {
        // Only display candidates that are winning a county
        const sortOrder = result.candidates;
        this.sortOrder = sortOrder;

        // Update the last execution time
        this.lastExecutionTime = currentTime;
      }

      // Update this.legendCands
      let specialCount = 0;
      this.legendCands = winningCandidates.map(candidate => {
        const samePartyCount = winningCandidates.filter(c =>
          getParty(c.party) === getParty(candidate.party)
        ).length;

        if (samePartyCount > 1) {
          return { ...candidate, special: specialCount++ };
        }
        return candidate;
      });

      var displayCandidates = result.candidates
        .sort((a, b) => b.percent - a.percent)
        .slice(0, 2);

      const tooltipReportingPercentage = function (pct) {
        if (pct > 0 && pct < 0.005) {
          return "<1";
        } else if (pct > 0.995 && pct < 1) {
          return ">99";
        } else {
          return (pct * 100).toFixed(1)
        }
      }

      var candText = displayCandidates
        .map((cand, index) => {
          var legendCandidate = this.legendCands.find(c => isSameCandidate(c, cand));
          var special = legendCandidate && legendCandidate.special ? `i${legendCandidate.special}` : "";
          var cs = `<div class="row">
            <span class="party ${getParty(cand.party)} ${special}"></span>
            <span>${cand.last} ${!legendCandidate ? `(${getParty(cand.party)})` : ""}</span>
            <span class="amt">${tooltipReportingPercentage(cand.percent)}%</span>
          </div>`;
          return cand.percent > 0 ? cs : "";
        })
        .join("");

      var locationName = isNewEngland ? result.name :
        result.county.countyName.replace(/\s[a-z]/g, match => match.toUpperCase());

      var countyName = result.county.countyName.replace(/\s[a-z]/g, match =>
        match.toUpperCase()
      );
      var perReporting = reportingPercentage(result.reportingPercent);
      tooltip.innerHTML = `
        <div class="name">${locationName}</div>
        ${candText}
        <div class="row pop">Population <span class="amt">${formatters.comma(
        result.county.population
      )}</span></div>
        <div class="row reporting">${perReporting}% in</div>
      `;
    } else {
      tooltip.innerHTML = `
        <div class="name">N/A</div>
        <div class="row">AP is not reporting results for this location</div>
      `;
    }
    var bounds = this.svg.getBoundingClientRect();
    var x = e.clientX - bounds.left;
    var y = e.clientY - bounds.top;
    if (x > bounds.width / 2) {
      x -= 150;
    } else {
      x += 20;
    }
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";

    tooltip.classList.add("shown");
  }
}

customElements.define("county-map", CountyMap);