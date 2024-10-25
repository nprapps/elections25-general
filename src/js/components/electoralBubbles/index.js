
const ElementBase = require("../elementBase");

import { reportingPercentage, winnerIcon } from "../util.js";
import track from "../../lib/tracking";
import gopher from "../gopher.js";
import stateSheet from "../../../../data/states.sheet.json";

var d3 = require("d3-force/dist/d3-force.min.js");

var { sqrt, PI, cos, sin } = Math;

const Y_FORCE = .03;
const X_FORCE = .4;
const COLLIDE_FORCE = 1;
const MIN_DOMAIN = .1;
const MAX_DOMAIN = .3;
const POLAR_OFFSET = .02;
const HIDE_TEXT = 7;
const MIN_TEXT = 12;
const MIN_RADIUS = 3;
const FROZEN = .001;
const HEIGHT_STEP = 70;

var nextTick = function (f) {
  requestAnimationFrame(f);
}

var clamp = (v, l, h) => Math.min(Math.max(v, l), h);

class ElectoralBubbles extends ElementBase {

  constructor() {
    super();
    this.state = {
      nodes: [],
      lookup: {},
      width: 1600,
      height: 900
    };
    this.svg = null;
    this.tooltip = null;
    this.lastHover = null;
    this.races = {}

    this.collisionRadius = this.collisionRadius.bind(this);
    this.intersect = this.intersect.bind(this);
    this.resize = this.resize.bind(this);
    this.tick = this.tick.bind(this);
    this.xAccess = this.xAccess.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onExit = this.onExit.bind(this);

    var simulation = d3.forceSimulation();
    simulation.alphaDecay(0.04);
    simulation.stop(); // only run when visible

    var xForce = d3.forceX().x(this.xAccess).strength(X_FORCE);
    var yForce = d3.forceY().strength(Y_FORCE);
    var collider = d3.forceCollide().strength(COLLIDE_FORCE);
    collider.radius(this.collisionRadius);

    simulation.force("x", xForce);
    simulation.force("y", yForce);
    simulation.force("collide", collider);

    this.simulation = simulation;
    this.running = false;
    window.addEventListener("resize", this.resize);
  }

  async loadData() {
    let presidentDataFile = './data/president.json';

    try {
      const presidentResponse = await fetch(presidentDataFile);
      const presidentData = await presidentResponse.json();

      this.races = presidentData.results || {};


      // Initialize the component after data is loaded
      this.render();
      this.svg = this.querySelector('.bubble-svg');
      this.tooltip = this.querySelector('.bubble-tooltip');
      this.observer = new IntersectionObserver(this.intersect);
      this.observer.observe(this.svg);
      

      if (this.races && Object.keys(this.races).length > 0) {
        this.updateNodes(this.races);
        for(let i = 0; i < 20; i++) {
          this.simulation.tick();
          this.resize();
        }
      } else {
        console.log('No data available for nodes');
      }
      this.resize();
    } catch (error) {
      console.error('Error fetching president data:', error);
    }
  }


  connectedCallback() {
    this.loadData()
    window.addEventListener("resize", this.resize);
  }

  disconnectedCallback() {
    this.observer.disconnect();
    window.removeEventListener("resize", this.resize);
  }

  static get observedAttributes() {
    return ['results'];
  }

  xAccess(d) {
    const centerX = this.state.width / 2;
    const { mx, alignment } = d;
    const offset = alignment == "Dem" ? -POLAR_OFFSET : POLAR_OFFSET;
    const pole = centerX + (centerX * offset);
    var x = mx * centerX + pole;
    return x;
  }

  nodeRadius(d) {
    const a = d.electoral;
    const r = Math.sqrt(a / Math.PI);
    return Math.max(r * (this.state.width / 60), MIN_RADIUS);
  }

  collisionRadius(d) {
    return this.nodeRadius(d) + 1;
  }

  resize() {
    if (!this.svg) return;
    const bounds = this.svg.getBoundingClientRect();
    const { width, height } = bounds;

    if (width != this.state.width) {
      // Reset forces with new width
      const xForce = d3.forceX().x(this.xAccess).strength(X_FORCE);
      const yForce = d3.forceY().strength(Y_FORCE);
      const collider = d3.forceCollide().strength(COLLIDE_FORCE);
      collider.radius(this.collisionRadius);

      this.simulation
          .force("x", xForce)
          .force("y", yForce)
          .force("collide", collider)
          .alpha(1)
          .restart();
    }
    this.state.width = window.innerWidth;
    this.render();
  }

  intersect([e]) {
    if (e.isIntersecting) {
      if (!this.running) {
        if (this.svg) {
          const bounds = this.svg.getBoundingClientRect();
          this.state.width = bounds.width;
          console.log("Starting force sim...");
          this.running = true;
          this.simulation.alpha(1);
          requestAnimationFrame(this.tick);
        }
      }
    } else {
      console.log("Pausing force sim...");
      this.running = false;
    }
  }

  tick() {
    if (!this.running) return;
    nextTick(this.tick);

    if (!this.svg) return;
    const bounds = this.svg.getBoundingClientRect();
    const { width } = bounds;
    if (!width) return;
    if (width != this.state.width) {
      this.state.width = width;
    }

    const alpha = this.simulation.alpha();
    if (alpha > FROZEN) {
      this.simulation.nodes(this.state.nodes);
      this.simulation.tick();
      this.render();
    }
  }

  createNode(r, dataDomain) {
    const [winner, loser] = r.candidates;
    const margin = winner.percent - loser.percent;
    const party = r.winnerParty || winner.party;
    const alignment = winner.party;
    const mx = Math.log(Math.min(margin, MAX_DOMAIN) / dataDomain + 1) * (alignment == "Dem" ? -1 : 1);
    const { state, district, called, electoral } = r;
    const key = district ? state + district : state;
    return { key, state, district, called, electoral, margin, mx, party, alignment, original: r };
  }

  updateNodes(results) {
    let { nodes } = this.state;


    const touched = new Set();
    const lookup = {};
    results.forEach(r => lookup[r.state + (r.district || "")] = r);

    const called = results.filter(r => r.called || r.eevp > 0.5);
    var dataDomain = Math.max(...called.map(r => {
      const [winner, loser] = r.candidates;
      return Math.abs(winner.percent - loser.percent);
    }));
    dataDomain = clamp(Math.ceil(dataDomain * 10) / 10, MIN_DOMAIN, MAX_DOMAIN);

    const maxRadius = this.nodeRadius({ electoral: 55 });

    for (var r of called) {
      const upsert = this.createNode(r, dataDomain);
      const existing = nodes.find(n => n.key == upsert.key);
      if (existing) {
        Object.assign(existing, upsert);
        touched.add(existing);
      } else {
        upsert.x = this.xAccess(upsert);
        upsert.y = (maxRadius * 2 - this.nodeRadius(r)) * 
        (Math.random() > 0.5 ? 1.2 : -1.2) * 
        (Math.random() + 0.5);
        nodes.push(upsert);
        touched.add(upsert);
      }
      lookup[upsert.key] = r;
    }
    nodes = nodes.filter(n => touched.has(n));
    this.state.nodes = nodes.filter(n => touched.has(n));


    this.simulation.alpha(1).restart();
    this.state.nodes = nodes;
    this.state.lookup = lookup;
    this.render();
  }

  goToState(state) {
    track("clicked-bubble", state);
    window.location.href = `#/states/${state}/P`;
  }

  onMove(e) {


    const bounds = this.getBoundingClientRect();
    const offsetX = e.clientX - bounds.left;
    const offsetY = e.clientY - bounds.top;


    const key = e.target.dataset.key;
    const data = this.state.lookup[key];


    if (!key || !data) {
      return this.tooltip.classList.remove("show");
    }

    this.tooltip.classList.add("show");

    if (this.lastHover != key) {
      const stateName = stateSheet[data.state].name;
      const districtDisplay = data.district == "AL" ? "At-Large" : data.district;
      const h3 = data.district ? `${stateName} ${districtDisplay}` : stateName;
      const candidates = data.candidates.filter(c => c.percent);

      this.tooltip.innerHTML = `
            <h3>${h3} (${data.electoral})</h3>
            <div class="candidates">${candidates.map(c =>
        `<div class="row">
                  <div class="party ${c.party}"></div>
                  <div class="name">${c.last}</div> ${c.winner == "X" ? winnerIcon : ""}
                  <div class="perc">${Math.round(c.percent * 1000) / 10}%</div>
              </div>`
      ).join("")}</div>
            <div class="reporting">${reportingPercentage(
        data.eevp || data.reportingPercent
      )}% in</div>
          `;
      this.lastHover = key;
    }

    const left = offsetX < bounds.width / 2 ? offsetX + 10 : offsetX - 4 - this.tooltip.offsetWidth;
    this.tooltip.style.left = left + "px";
    this.tooltip.style.top = offsetY + 10 + "px";

  }

  onExit() {
    this.tooltip.classList.remove("show");
  }

  render() {
    let { nodes, width } = this.state;
    let distance = 0;
    nodes.forEach(n => {
      n.r = this.nodeRadius(n);
      const outerBounds = Math.abs(n.y) + n.r;
      if (outerBounds > distance) {
        distance = outerBounds;
      }
    });

    this.simulation.nodes(nodes);

    const xForce = d3.forceX().x(this.xAccess).strength(X_FORCE);
    const yForce = d3.forceY().strength(Y_FORCE);
    const collider = d3.forceCollide().strength(COLLIDE_FORCE);
    collider.radius(this.collisionRadius);

    this.simulation
      .force("x", xForce)
      .force("y", yForce)
      .force("collide", collider)
      .nodes(nodes)
      .alpha(1)
      .restart();


    var yBounds = Math.ceil(distance / HEIGHT_STEP) * HEIGHT_STEP;
    if (yBounds - distance < 30) yBounds += 30;
    const height = yBounds * 2;
    const offset = 30;
    // create spacer for labels if they start to crowd the top
    // var offset = (height - distance * 2) < 30 ? 30 : 0;

    const uncalled = {};

    //TODO: make this better
    //this is where we define the buckets. technically, this should happen in the parent div
    if (this.results) {
      var sorted = results.slice().sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);

      var buckets = {
        likelyD: [],
        tossup: [],
        likelyR: [],
      };

      sorted.forEach(function (r) {
        var bucketRating = getBucket(r.rating);
        if (bucketRating) buckets[bucketRating].push(r);
      });
    }

    for (const k in buckets) {
      uncalled[k] = buckets[k].filter(r => !r.called && (r.eevp || 0) <= .5);
    }


    const hasUncalled = [...(uncalled.likelyD || []), ...(uncalled.tossup || []), ...(uncalled.likelyR || [])].length;

    const titles = {
      likelyD: "Likely Democratic",
      tossup: "Competitive states",
      likelyR: "Likely Republican"
    };

    const bannerHtml = `${this.races?.[1] ? '<test-banner></test-banner>' : ''}`;

    this.innerHTML = `
      <div class="electoral-bubbles">
        ${bannerHtml}
        <div class="aspect-ratio">
          <svg class="bubble-svg" 
            role="img"
            aria-label="Bubble plot of state margins"
            preserveAspectRatio="none"
            width="${width}" height="${height + offset}"
            viewBox="0 0 ${width} ${height + offset}"
          >
            <text class="leading-cue dem desktop" x="${width / 2 - 40}" y="20">
              &lt; Stronger Harris Lead
            </text>
            <text class="leading-cue dem mobile" x="${width / 2 - 40}" y="20">
              Stronger
            </text>
            <text class="leading-cue dem mobile" x="${width / 2 - 40}" y="35">
              &lt; Harris Lead
            </text>
            <text class="tied" x="${width / 2}" y="20">
              Tied
            </text>
            <text class="leading-cue gop desktop" x="${width / 2 + 40}" y="20">
              Stronger Trump lead &gt;
            </text>
            <text class="leading-cue gop mobile" x="${width / 2 + 40}" y="20">
              Stronger
            </text>
            <text class="leading-cue gop mobile" x="${width / 2 + 40}" y="35">
               Trump lead &gt;
            </text>
            <line class="separator" x1="${width / 2}" x2="${width / 2}" y1="25" y2="${height - 10 + offset}" />
            <g class="force-sim">
            ${nodes.map(n => {
      const textSize = this.nodeRadius(n) * 0.5;
      return `
                <circle
                  class="${n.party} ${n.called ? "called" : "pending"}"
                  vector-effect="non-scaling-stroke"
                  data-key="${n.key}"
                  cx="${n.x}"
                  cy="${(n.y || 0) + height / 2 + offset}"
                  r="${n.r}"
                />
                ${textSize > HIDE_TEXT ? `
                  <text 
                    class="${n.party} ${n.called ? "called" : "pending"}"
                    x="${n.x}" 
                    y="${n.y + (height / 2) + (textSize * 0.4) + offset}"
                    font-size="${Math.max(textSize, MIN_TEXT)}px">${n.state}</text>
                ` : ''}
              `;
    }).join('')}
            </g>
          </svg>
        </div>
        <p class="disclaimer">
          To appear in this chart, a state must have either a declared winner or more than 50% of the estimated vote tabulated. States will be added as results come in. Early returns may not initially match up with the race call. So you may see a state called for one candidate but, for a time, appear in the other candidate's side of the chart. <a href="https://www.npr.org/2020/10/29/928863973/heres-how-npr-reports-election-results">How NPR Makes Calls</a>
        </p>
        ${hasUncalled > 0 ? `
          <div class="uncalled">
            <h3>Early or no results yet:</h3>
            <div class="triplets">
              ${["likelyD", "tossup", "likelyR"].map(rating =>
      uncalled[rating] && uncalled[rating].length ? `
                  <div class="uncalled">
                    <h4>${titles[rating]}</h4>
                    <ul class="circles">
                      ${uncalled[rating].sort((a, b) => b.electoral - a.electoral).map(result => {
        const reporting = result.eevp || result.reportingPercent;
        const r = Math.max(this.nodeRadius(result), MIN_RADIUS);
        const size = r * .5;
        return `
                          <li>
                            <svg width="${r * 2}" height="${r * 2}"
                              class="uncalled-race"
                              role="img"
                              aria-label="${result.stateName}"
                              alt="${result.stateName}"
                            >
                              <circle
                                role="presentation"
                                class="uncalled-race ${reporting ? "early" : "open"}"
                                cx="${r}" cy="${r}" r="${r - 1}"
                                data-key="${result.district ? result.state + result.district : result.state}"
                              />
                              ${size > HIDE_TEXT ? `
                                <text
                                  x="${r}" y="${r + size * .4}" 
                                  font-size="${Math.max(MIN_TEXT, size)}px"
                                  class="uncalled-race ${reporting ? "early" : "open"}"
                                >
                                  ${result.state}
                                </text>
                              ` : ''}
                            </svg>
                          </li>
                        `;
      }).join('')}
                    </ul>
                  </div>
                ` : ''
    ).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    const tooltipDiv = document.createElement('div');
    tooltipDiv.className = 'bubble-tooltip tooltip';
    this.querySelector('.electoral-bubbles').appendChild(tooltipDiv);
    this.tooltip = tooltipDiv;

    this.querySelectorAll('circle').forEach(circle => {
      circle.addEventListener('click', () => this.goToState(circle.dataset.key.slice(0, 2)));
      circle.addEventListener('mousemove', this.onMove);
      circle.addEventListener('mouseleave', this.onExit);
    });
  }
}
customElements.define('electoral-bubbles', ElectoralBubbles);