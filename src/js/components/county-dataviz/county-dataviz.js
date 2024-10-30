import gopher from "../gopher.js";
import { formatters, getCountyVariable, getAvailableMetrics } from "../util.js";
var { chain, comma, percent, dollars } = formatters;
const ElementBase = require("../elementBase");

class CountyChart extends ElementBase {
    constructor() {
      super();
      this.onMove = this.onMove.bind(this);
      this.onLeave = this.onLeave.bind(this);
      this.handleResize = this.handleResize.bind(this);
      this.resizeFrame = null;

      this.data = null
  
      this.margins = {
        top: 20,
        right: 5,
        bottom: 25,
        left: 30,
      };

      this.defaultWidth = 230;
      this.minWidth = 200;
      this.maxWidth = 400;
      this.availableMetrics = getAvailableMetrics('CA');
  
      this.state = {
        dimensions: {
          width: this.defaultWidth,
          height: this.defaultWidth
        }
      };
    }
  
    connectedCallback() {
      window.addEventListener("resize", this.handleResize);
      this.render();
      this.handleResize();
    }
  
    disconnectedCallback() {
      window.removeEventListener("resize", this.handleResize);
    }
  
    static get observedAttributes() {
      return ['data', 'variable', 'order', 'title', 'corr', 'formatter'];
    }
  
    setState(newState) {
      this.state = { ...this.state, ...newState };
      this.render();
    }
  
    render() {
      const data = JSON.parse(this.getAttribute('data') || '[]');
      if (!data.length) {
        this.innerHTML = '';
        return;
      }
  
      this.innerHTML = `
      <div class="chart-wrapper">
        <div class="county-trend graphic">
          ${this.renderCorrelation()}
          <div class="graphic-wrapper">
            ${this.renderSVG()}
            <div class="tooltip"></div>
          </div>
        </div>
        </div>
      `;
  
      this.querySelector('svg').addEventListener('mousemove', this.onMove);
      //this.querySelector('svg').addEventListener('mouseleave', this.onLeave);
    }
  
    renderCorrelation() {
      const relationships = [
        "almost no",
        "weak",
        "moderate",
        "strong",
        "very strong",
      ];

      const corr = parseFloat(this.getAttribute('corr'));
      const index = Math.ceil(corr * relationships.length) - 1;
      const title = this.getAttribute('title');
      const relationship = relationships[index] ?? "no";

      return `
        <div class="description">
          <div>${title}</div>
          <div class="strength ${relationship.replace(" ","-")}">
            ${relationship} trend
          </div>
        </div>
      `;
    }
  
    renderSVG() {
    this.handleResize()
    const { width, height } = this.state.dimensions;

      if (!this.state.dimensions) {
        return '';
      }
      return `
        <svg
          role="img"
          aria-description="Scatter plot"
          class="svg-flex"
          width="${width}"
          height="${height}"
          viewBox="0 0 ${width} ${height}">
          <g transform="translate(${this.margins.left}, ${this.margins.top})">
            ${this.createAxes()}
            ${this.createDots()}
          </g>
        </svg>
      `;
    }
  
    onLeave(e) {
      const tooltip = this.querySelector('.tooltip');
      tooltip.classList.remove("shown");
    }
  
    onMove(e) {
      const tooltip = this.querySelector('.tooltip');

      tooltip.classList.remove("shown");
      const data = JSON.parse(this.getAttribute('data') || '[]');
      const fips = e.target.dataset.fips;
      const county = data.find(d => d.fips == fips);
  
      if (county) {
        const variable = this.getAttribute('variable');
        const displayVar = county[variable];
        const metric = this.availableMetrics[variable];
        const formatter = metric?.format || (x => x);
  
        tooltip.innerHTML = `
          <div class="name">${county.countyName}</div>
          <div class="row"><span class="metric">${this.getAttribute('title')}: </span><span class="amt"> ${formatter(displayVar)}</span></div>
        `;
  
        const bounds = this.querySelector('svg').getBoundingClientRect();
        let x = e.clientX - bounds.left;
        let y = e.clientY - bounds.top;
        if (x - 2 > bounds.width / 2) {
          x -= 140;
          y += 10;
        }
        tooltip.style.left = x + 15 + "px";
        tooltip.style.top = y + "px";
  
        tooltip.classList.add("shown");
      }
    }
    
  
    createAxes() {
        const [xStart, xEnd] = this.xScale.range();
        const [yStart, yEnd] = this.yScale.range();

        
        const data = JSON.parse(this.getAttribute('data') || '[]')
        .sort((a, b) => b.percent - a.percent);
      
      // Find top two different parties
      const firstParty = data[0]?.party;
      const secondParty = data.find(d => d.party !== firstParty)?.party;
      
      const order = [
        { party: firstParty || 'Unknown' },
        { party: secondParty || 'Unknown' }
      ];


        const [orderLess, orderMore] = order;
    
        let yLabel;
        if (this.getAttribute('variable') == "past_margin") {
          yLabel = "More Democratic in 2016 →";
        } else {
          yLabel = `Higher ${this.getAttribute('title')} →`;
        }
    
        return `
          <line x1="${xStart}" x2="${xEnd}" y1="${yStart}" y2="${yStart}" stroke="#ccc" />
          <line x1="${xStart}" x2="${xStart}" y1="${yEnd}" y2="${yStart}" stroke="#ccc" />
          <line x1="${xStart}" x2="${xEnd}" y1="${yStart / 2}" y2="${yStart / 2}" stroke="#ccc" />
          <line x1="${xEnd / 2}" x2="${xEnd / 2}" y1="${yEnd}" y2="${yStart}" stroke="#ccc" />
          <text class="x axis-label" text-anchor="end" transform="rotate(-90)" x="0" dy=".35em" y="-10">
            ${yLabel}
          </text>
          <text class="x axis-label" text-anchor="start" x="${xStart}" y="${yStart + 15}">
            ← More ${orderLess.party}
          </text>
          <text class="x axis-label" text-anchor="end" x="${xEnd}" y="${yStart + 15}">
            More ${orderMore.party} →
          </text>
        `;
      }
  
      createDots() {
        const data = JSON.parse(this.getAttribute('data') || '[]');
        const variable = this.getAttribute('variable');
    
        return `
          <g class="dots">
            ${data
              .filter(t => t.x !== null && !isNaN(getCountyVariable(t, variable)) && getCountyVariable(t, variable) !== null)
              .map((t, i) => {
              const value = getCountyVariable(t, variable);
              const y = this.yScale(value);
              const x = this.xScale(t.x);
              return `
                <circle
                  cx="${x}"
                  cy="${y}"
                  r="5"
                  stroke="#ccc"
                  stroke-width="1"
                  class="${t.party}"
                  data-fips="${t.fips}"
                />
              `;
            }).join('')}
          </g>
        `;
      }
  
      handleResize() {
        const containerWidth = this.parentElement.offsetWidth;
        const chartsPerRow = 3

        let newWidth = Math.floor((containerWidth / 3) - 20);

        newWidth = Math.max(this.minWidth, Math.min(newWidth, this.maxWidth));
        const newHeight = newWidth * this.aspectRatio;
    
        const chartWidth = newWidth - this.margins.left - this.margins.right;
        const chartHeight = newWidth - this.margins.top - this.margins.bottom;
    
        // Get min/max for Y axis
        const variable = this.getAttribute('variable');
        const data = JSON.parse(this.getAttribute('data') || '[]');
        const currV = data
          .filter(d => !isNaN(getCountyVariable(d, variable)) && getCountyVariable(d, variable) !== null)
          .map(d => getCountyVariable(d, variable));
        let maxY = Math.max(...currV);
        let minY = Math.min(...currV);
        maxY = Math.ceil(maxY * 100) / 100;
        minY = Math.floor(minY * 100) / 100;
    
        if (variable == "past_margin") {
          minY = -1;
          maxY = 1;
        }
    
        this.xScale = this.scaleFactory([0, 1], [0, chartWidth]);
        this.yScale = this.scaleFactory([minY, maxY], [chartHeight, 0]);
    
        const height = chartHeight + this.margins.top + this.margins.bottom;
        const width = chartWidth + this.margins.left + this.margins.right;
        // Update dimensions
        if (!this.dimensions || newWidth != this.dimensions.width) {
          this.dimensions = { width, height };
          this.state.dimensions = { width, height };
          this.render(); // Trigger a re-render with new dimensions
        }
      }

    // Stand in for d3's scale functionality
    scaleFactory(domain, range) {
    var [rangeStart, rangeEnd] = range;
    var rangeSize = rangeEnd - rangeStart;
    var [domainStart, domainEnd] = domain;
    var domainSize = domainEnd - domainStart;
    var scale = function (input) {
      var normalized = (input - domainStart) / domainSize;
      return normalized * rangeSize + rangeStart;
    };
    scale.range = () => range;
    scale.domain = () => domain;

    return scale;
  };
    }
  
  customElements.define('county-chart', CountyChart);