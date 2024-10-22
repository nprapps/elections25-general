const ElementBase = require("../elementBase");
import { reportingPercentage, winnerIcon } from "../util.js";
import track from "../../lib/tracking";
import gopher from "../gopher.js";

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
        this.svgContainer = {};
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
          const response = await fetch("./assets/_map-cartogram.svg");
          const svgText = await response.text();
          this.svg = await this.loadSVG(svgText);
          this.initLabels();
        } catch (error) {
          console.error("Failed to load SVG:", error);
          return;
        }
    
        this.paint();
      }
    

    
      disconnectedCallback() {
        if (this.svg) {
          this.svg.removeEventListener("mousemove", this.onMove);
          this.svg.removeEventListener("click", this.onClick);
        }
      }

      render() {
        this.innerHTML = `
          <div class="cartogram" role="img" aria-label="Cartogram of state results">
            <div class="svg-container"></div>
            <div class="tooltip"></div>
          </div>
        `;
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

    this.initLabels();
    return this.svg;
  }
    
      onClick(e) {
        const group = e.target.closest("svg > g");
        if (!group) return;
        const state = group.getAttribute("data-postal");
        if (state) {
          window.location.href = `#/states/${state}/P`;
          track("clicked-cartogram", state);
        }
      }
    
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
    
        if (district) {
          result = results.filter((r) => (r.seatNumber == district))[0];
        } if (district === "AL") {
          result = results[0];
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
    
      initLabels() {
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
            x = bbox.x - 10;
            y = bbox.y + labelBox.height;
          } else {
            x = bbox.x + bbox.width / 2;
            y = bbox.y + bbox.height / 2 + labelBox.height / 2 - 3;
          }
    
          if (window.innerWidth > 650) {
            y -= labelBox.height / 2 - 2;
            const votes = this.states[stateName].electoral;
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
    
      paint() {
        if (!this.svg) return;
    
        this.races.forEach((r) => {
          const eevp = r.eevp || r.reportingPercent;
          const district = r.district;
          const state = r.state + (district ? "-" + district : "");
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