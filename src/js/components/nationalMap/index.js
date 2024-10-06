const ElementBase = require("../elementBase");
import { reportingPercentage, winnerIcon } from "../util.js";
import track from "../../lib/tracking";
import gopher from "../gopher.js";

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
    } catch (error) {
      console.error("Failed to load SVG:", error);
      return;
    }

    this.illuminate();
    gopher.watch(`./data/president.json`, this.loadData);

    this.paint();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case 'races':
        this.loadData();
        //this.races  JSON.parse(newValue);
        this.paint();
        break;
    }
  }

  disconnectedCallback() {
    const svg = this.svgContainer;
    if (svg) {
      svg.removeEventListener("mousemove", this.onMove);
      svg.removeEventListener("click", this.onClick);
    }
    gopher.unwatch(`./data/president.json`, this.loadData);
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
    this.innerHTML = `
      <board-key race="president" simple="true"></board-key>
      <div class="map">
        <div class="svg-container" role="img" aria-label="National map of results"></div>
        <div class="tooltip"></div>
      </div>
    `;
    return;
  }

  async loadSVG(svgText) {
    if (!this.svgContainerRef.current) {
      console.error("SVG container not found");
      return;
    }

    // Insert the SVG text into the container
    this.svgContainerRef.current.innerHTML = svgText;

    this.svg = this.svgContainerRef.current.querySelector("svg");

    if (!this.svg) {
      console.error("SVG element not found after insertion");
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

    console.log(svg)
    return svg;
  }

  onClick(e) {
    const state = e.target.getAttribute("data-postal");
    if (state) {
      track("clicked-map", state);
      window.location.href = `#/states/${state}/P`;
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
  
    if (district) {
      result = results.filter((r) => (r.district == district))[0];
    } else {
      result = results[0];
    }
  
    // Filter candidates with a percent value
    const candidates = result.candidates
  
    console.log('Filtered candidates:', candidates);
  
    // Generate tooltip content
    const candidateRows = candidates.map(candidate => `
      <div class="row">
        <div class="party ${candidate.party}"></div>
        <div class="name">${candidate.last}</div>
        ${candidate.winner === "X" ? winnerIcon : ""}
        <div class="perc">${Math.round(candidate.votes * 1000) / 10}%</div>
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
        const positionY = parseInt(thisBlock.getAttribute("y")) + 11 + "px";
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
    console.log(this.svg)
    if (!this.svg) {
      console.error("SVG not available for painting");
      return;
    }

    const mapData = this.races;

    mapData.forEach((r) => {
      const eevp = r.eevp || r.reportingPercent;
      const district = r.district;
      const state = r.state.toLowerCase() + (district ? "-" + district : "");
      const leader = r.candidates[0].party;
      const winner = r.winnerParty;
      const stateGroup = this.svg.querySelector(`.${state}`);
      if (!stateGroup) return;

      stateGroup.classList.remove("early", "winner", "leader", "GOP", "Dem");

      if (eevp > 0) {
        stateGroup.classList.add("early");
      }
      if (eevp > 0.5) {
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