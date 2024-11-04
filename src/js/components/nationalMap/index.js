const ElementBase = require("../elementBase");
import { classify, reportingPercentage, statePostalToFull, winnerIcon } from "../util.js";
import track from "../../lib/tracking";
import gopher from "../gopher.js";
import TestBanner from "../test-banner";

const northeastStates = ["VT", "NH", "MA", "CT", "RI", "NJ", "DE", "MD", "DC"];

class NationalMap extends ElementBase {
  constructor() {
    super();
    this.state = {};
    this.loadData = this.loadData.bind(this);
    this.loadSVG = this.loadSVG.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onClick = this.onClick.bind(this);
    this.paint = this.paint.bind(this);
    this.races = {}
    this.tooltip = null;
    this.svgContainer = {}
    this.svgContainerRef = { current: null };
    this.svg = null;
  }

  static get observedAttributes() {
    return ['races'];
  }

  async connectedCallback() {
    this.render();

    await Promise.resolve();

    this.svgContainerRef.current = this.querySelector('.svg-container');
    this.tooltip = this.querySelector('.tooltip');

    if (!this.svgContainerRef.current || !this.tooltip) {
      console.error("SVG container or tooltip not found");
      return;
    }

    await this.loadData();

    try {
      const response = await fetch("./assets/_map-geo.svg");
      const svgText = await response.text();
      this.svg = await this.loadSVG(svgText); // Store the returned SVG
      this.svgContainerRef.current = this.querySelector('.svg-container');
      this.svgContainerRef.current.innerHTML = ''; // Clear existing content
      this.svgContainerRef.current.appendChild(this.svg);

    } catch (error) {
      console.error("Failed to load SVG:", error);
      return;
    }

    this.illuminate();
    this.render();
    this.initLabels();
    this.paint();

    //gopher.watch(`./data/president.json`, this.loadData);
  }

  disconnectedCallback() {
    const svg = this.svgContainer;
    //gopher.unwatch(`./data/president.json`, this.loadData);
  }

  async loadData() {
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
    } catch (error) {
      console.error("Could not load JSON data:", error);
    } finally {
      this.isLoading = false;
    }
  }


  render() {
    // Create the basic structure

    const bannerHtml = `${this.races?.[1] ? '<test-banner></test-banner>' : ''}`;
    
    this.innerHTML = ` 
      <div class="map">
        ${bannerHtml}
        <div class="svg-container" role="img" aria-label="National map of results"></div>
        <div class="tooltip"></div>
      </div>
    `;

    const svgContainer = this.querySelector('.svg-container');
    const tooltipContainer = this.querySelector('.tooltip');

    if (this.svg) {
      this.svg.setAttribute('width', '100%');
      this.svg.setAttribute('height', '100%');

      this.svg.addEventListener("mousemove", this.onMove);
      this.svg.addEventListener("click", this.onClick);

      svgContainer.appendChild(this.svg);
    }

    if (this.tooltip) {
      tooltipContainer.innerHTML = this.tooltip.innerHTML;
      tooltipContainer.className = this.tooltip.className;
      tooltipContainer.style.cssText = this.tooltip.style.cssText;
    }

    this.svgContainerRef.current = svgContainer;
    this.tooltip = tooltipContainer;

    return;
  }

  async loadSVG(svgText) {
    if (!this.svgContainerRef.current) {
      console.error("SVG container not found");
      return;
    }

    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = svgText;

    // Get the SVG element
    this.svg = tempContainer.querySelector("svg");

    if (!this.svg) {
      console.error("SVG element not found in the provided SVG text");
      return;
    }

    // Ensure the SVG takes up the full space of its container
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');

    // Add event listeners
    this.svg.addEventListener("mousemove", this.onMove);
    this.svg.addEventListener("click", this.onClick);

    // Initialize labels
    this.initLabels();
    this.paint();

    this.svgContainerRef.current.innerHTML = '';
    this.svgContainerRef.current.appendChild(this.svg);

    // Dispatch an event to signal that the SVG has been loaded and incorporated

    return this.svg;
  }

  onClick(e) {
    const state = e.target.getAttribute("data-postal");
    if (state) {
      track("clicked-map", state);
      var linkTarget = document.head.querySelector("base").target || "_blank";
      var stateFull = statePostalToFull(state);
      window.open(`${ classify(stateFull) }.html?section=P`, linkTarget);
    }
  }

  onMove(e) {
    // Select the SVG element
    this.svg = this.svgContainerRef.current.querySelector("svg");
    const tooltip = this.querySelector('.tooltip');

    // hover styles
    const currentHover = this.svg.querySelector(".hover");
    if (currentHover) {
      currentHover.classList.remove("hover");
    }

    this.tooltip.classList.remove("shown");
    if (!e.target.hasAttribute("data-postal")) {
      return;
    }

    const group = e.target.closest("svg > g");
    this.svg.appendChild(group);
    e.target.parentNode.classList.add("hover");

    // tooltips
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

    const stateName = e.target.getAttribute("data-postal");
    const district = e.target.getAttribute("data-district");
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

    // Filter candidates with a percent value; old way is commented out
    //const candidates = result.candidates.filter(c => c.percent);
    const candidates = result.candidates;

    // Generate tooltip content
    const candidateRows = candidates.map(candidate => `
      <div class="row">
        <div class="party ${candidate.party}"></div>
        <div class="name">${candidate.last}</div>
        ${candidate.winner === "X" ? winnerIcon : ""}
        <div class="perc">${Math.round(candidate.percent * 1000) / 10}%</div>
      </div>
    `).join("");

    const tooltipContent = `
      <h3>${result.stateName}${district ? districtDisplay : ""} <span>(${result.electoral})</span></h3>
      <div class="candidates">${candidateRows}</div>
      <div class="reporting">${reportingPercentage(result.eevp || result.reportingPercent)}% in</div>
    `;

    this.tooltip.innerHTML = tooltipContent;

    this.tooltip.classList.add("shown");
  }

  initLabels() {
    if (!this.svg) {
      console.error("SVG not available for initializing labels");
      return;
    }
    const groups = this.querySelectorAll("g");

    groups.forEach((g) => {
      const stateOutline = g.querySelector("path");
      const stateLabel = g.querySelector("text");

      if (!stateOutline) return;

      // handle NE and ME labels
      if (!stateOutline.hasAttribute("data-postal")) {
        const thisBlock = g.querySelector("rect");
        const positionX = parseInt(thisBlock.getAttribute("x")) - 12 + "px";
        const positionY = parseInt(thisBlock.getAttribute("y")) + "px";
        stateLabel.setAttribute("x", positionX);
        stateLabel.setAttribute("y", positionY);
        return;
      }

      const stateName = stateOutline.getAttribute("data-postal");
      const offsetX = this.states[stateName].geo_offset_x;
      const offsetY = this.states[stateName].geo_offset_y;

      var svg = this.svg

      // handle Northeastern state labels
      if (northeastStates.indexOf(stateName) > -1) {
        g.classList.add("northeast");
        const rect = document.createElementNS(this.svg.namespaceURI, "rect");
        g.append(rect);
        rect.setAttribute("data-postal", stateName)
        rect.setAttribute("x", offsetX - 15);
        rect.setAttribute("y", offsetY - 9);
        rect.setAttribute("width", 10);
        rect.setAttribute("height", 10);

        stateLabel.setAttribute("x", offsetX);
        stateLabel.setAttribute("y", offsetY);
      } else {
        const bounds = stateOutline.getBBox();
        const labelBox = stateLabel.getBBox();

        const positionX = bounds.x + bounds.width / 2;
        stateLabel.setAttribute("x", positionX);

        const positionY = bounds.y + bounds.height / 2 + labelBox.height / 3 - 1;
        stateLabel.setAttribute("y", positionY);

        if (offsetX) {
          stateLabel.setAttribute("dx", offsetX);
        }
        if (offsetY) {
          stateLabel.setAttribute("dy", offsetY);
        }
      }

      // electoral vote labels
      const voteLabel = document.createElementNS(this.svg.namespaceURI, "text");
      voteLabel.classList.add("votes");
      voteLabel.innerHTML = this.states[stateName].electoral;

      voteLabel.setAttribute("x", parseInt(stateLabel.getAttribute("x")));
      voteLabel.setAttribute("y", parseInt(stateLabel.getAttribute("y")) + 11);
      voteLabel.setAttribute("dx", parseInt(stateLabel.getAttribute("dx") || 0));
      voteLabel.setAttribute("dy", parseInt(stateLabel.getAttribute("dy") || 0));
      g.append(voteLabel);

      if (offsetX && northeastStates.indexOf(stateName) <= -1) {
        voteLabel.setAttribute("dx", offsetX);
      }
    });
  }

  paint() {
    if (!this.svg) {
      console.error("SVG not available for painting");
      return;
    }
    const mapData = this.races;

    mapData.forEach((r) => {
      if (!r || !r.state) {
        console.warn("Invalid race data:", r);
        return;
      }

      const eevp = r.eevp || r.reportingPercent || 0;
      const stateName = r.state.toUpperCase();
      const district = r.district || r.seatNumber;

      let stateSelector = stateName.toLowerCase();

      if (stateName === 'ME' || stateName === 'NE') {
        if (district) {
          stateSelector += `-${district}`;
        } else {
          stateSelector += '-AL';
        }
      }

      const stateGroup = this.svg.querySelector(`.${stateSelector}`);
      if (!stateGroup) {
        console.warn(`No SVG group found for state: ${stateSelector}`);
        return;
      }

      const leader = r.candidates && r.candidates.length > 0 ? r.candidates[0].party : null;
      const winner = r.winnerParty;

      stateGroup.classList.remove("early", "winner", "leader", "GOP", "Dem");

      if (eevp > 0) {
        stateGroup.classList.add("early");
      }
      if (eevp > 0.5 && leader) {
        stateGroup.classList.add("leader");
        stateGroup.classList.add(leader);
      }
      if (winner) {
        stateGroup.classList.add("winner");
        stateGroup.classList.add(winner);
      }
    });
  }
}

customElements.define('national-map', NationalMap);