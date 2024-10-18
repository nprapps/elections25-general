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
  }

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
      const state = this.getAttribute('state');
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

  disconnectedCallback() {
    //window.removeEventListener("resize", this.handleResize);
  }

  componentDidUpdate() {
    this.paint();
  }

  handleResize() {
    var newWidth = window.innerWidth;
    if (!this.state.width || newWidth != this.state.width) {
      this.setState({
        width: newWidth,
      });
      this.updateDimensions();
    }
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

  async loadSVG() {
    const state = this.getAttribute('state');
    const response = await fetch(`./assets/counties/${state}.svg`);
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

  paint() {
    if (!this.svg) return;
    var mapData = this.data;

    var incomplete = false;

    for (var d of Object.keys(mapData)) {
      var [top] = mapData[d].candidates.sort((a, b) => b.percent - a.percent);
      this.fipsLookup[mapData[d].fips] = mapData[d];
    }

    for (var d of Object.keys(mapData)) {
      var fips = mapData[d].fips;
      var candidates = mapData[d].candidates;
      var [top] = candidates.sort((a, b) => b.percent - a.percent);
      if (!top.votes) continue;

      var path = this.svg.querySelector(`[id="fips-${fips}"]`);
      if (!path) continue;
      path.classList.add("painted");

      var hitThreshold = mapData[d].reportingPercent > 0.5;
      var allReporting = mapData[d].reportingPercent >= 1;

      if (!hitThreshold) {
        path.style.fill = "#e1e1e1";
        incomplete = true;
      } else {
        var [candidate] = this.legendCands.filter(c => isSameCandidate(c, top));
        if (candidate.special) path.classList.add(`i${candidate.special}`);
        path.classList.add(getParty(top.party));
        path.classList.add("leading");
        if (allReporting) path.classList.add("allin");
      }
    }
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

    this.svg.appendChild(e.target);

    var result = this.fipsLookup[fips];

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

      var candText = displayCandidates
        .map((cand, index) => {
          var legendCandidate = this.legendCands.find(c => isSameCandidate(c, cand));
          var special = legendCandidate && legendCandidate.special ? `i${legendCandidate.special}` : "";
          var cs = `<div class="row">
            <span class="party ${getParty(cand.party)} ${special}"></span>
            <span>${cand.last} ${!legendCandidate ? `(${getParty(cand.party)})` : ""}</span>
            <span class="amt">${reportingPercentage(cand.percent)}%</span>
          </div>`;
          return cand.percent > 0 ? cs : "";
        })
        .join("");

      var countyName = result.county.countyName.replace(/\s[a-z]/g, match =>
        match.toUpperCase()
      );
      var perReporting = reportingPercentage(result.reportingPercent);
      tooltip.innerHTML = `
        <div class="name">${countyName}</div>
        ${candText}
        <div class="row pop">Population <span class="amt">${formatters.comma(
        result.county.population
      )}</span></div>
        <div class="row reporting">${perReporting}% in</div>
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