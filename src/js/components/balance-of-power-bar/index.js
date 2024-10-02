var ElementBase = require("../elementBase.js");
import { getParty } from "../util.js";
import gopher from "../gopher.js";


class BalanceOfPowerBar extends ElementBase {
  constructor() {
    super();
    this.loadData = this.loadData.bind(this);
  }

  connectedCallback() {
    this.loadData();
    console.log('bop has changed')
    gopher.watch("./data/bop.json", this.loadData);
  }

  disconnectedCallback() {
    gopher.unwatch("./data/bop.json", this.loadData);
  }

  async loadData() {
    try {
      const response = await fetch('./data/bop.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const results = await response.json();
      this.processResults(results);
      this.render();
    } catch (error) {
      console.error("Could not load JSON data:", error);
    }
  }

  processResults(results) {

    console.log(results)

    var InactiveSenateRaces = {
      "GOP": 29,
      "Dem": 34,
      "Other": 2,
      "house_GOP": 0,
      "house_Dem": 0,
      "house_Other": 0
  }

    this.president = {
      Dem: 0,
      GOP: 0,
      Other: 0,
      winner: ""
    };
    this.house = {
      Dem: {total: parseInt(InactiveSenateRaces["house_Dem"]), gains: 0},
      GOP: {total: parseInt(InactiveSenateRaces["house_GOP"]), gains: 0},
      Ind: {total: parseInt(InactiveSenateRaces["house_Other"]), gains: 0},
    };
    this.senate = {
      Dem: {total: InactiveSenateRaces.Dem, gains: 0},
      GOP: {total: InactiveSenateRaces.GOP, gains: 0},
      Ind: {total: InactiveSenateRaces.Other, gains: 0},
    };

    results.president.forEach(r => this.president[r.winner] += r.electoral);

    this.mcmullinWon = false;

    results.house.forEach(r => {
      const winnerParty = getParty(r.winner);
      const priorWinner = getParty(r.previous);
      
      if (!this.house[winnerParty]) {
        this.house[winnerParty] = { total: 0, gains: 0 };
      }
      if (!this.house[priorWinner]) {
        this.house[priorWinner] = { total: 0, gains: 0 };
      }
      
      this.house[winnerParty].total += 1;
    
      if (r.winner !== r.previous) {
        this.house[winnerParty].gains += 1;
        this.house[priorWinner].gains -= 1;
      }
    });

    results.senate.forEach(r => {
      const winnerParty = getParty(r.winner);
      const previousParty = getParty(r.previous);
    
      if (!this.senate[winnerParty]) {
        this.senate[winnerParty] = { total: 0, gains: 0 };
      }
      if (!this.senate[previousParty]) {
        this.senate[previousParty] = { total: 0, gains: 0 };
      }
    
      if (r.hasOwnProperty('winner')) {
        if (r.id == '46329' && r.winner == 'Ind') {
          this.mcmullinWon = true;
        }
      }
    
      this.senate[winnerParty].total += 1;
    
      if (r.winner !== r.previous) {
        this.senate[winnerParty].gains += 1;
        this.senate[previousParty].gains -= 1;
      }
    });

    this.senate.Ind.width = this.senate.Ind.total;
    if (this.mcmullinWon) {
      this.senate.Ind.width = (this.senate.Ind.total) - 1;
    }

    // Calculate net gains
    this.calculateNetGains();
  }

  calculateNetGains() {
    const calculateNetGain = (chamber) => {
      chamber.netGainParty = "none";
      const [top] = Object.keys(chamber)
        .map(k => ({ party: k, gains: chamber[k].gains }))
        .sort((a, b) => b.gains - a.gains);
      if (top.gains > 0) {
        chamber.netGainParty = top.party;
        chamber.netGain = top.gains;
      }
    };

    calculateNetGain(this.house);
    calculateNetGain(this.senate);
  }

  render() {
    const winnerIcon = `<span class="winner-icon" role="img" aria-label="check mark">
      <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path fill="#333" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
      </svg>
    </span>`;

    this.innerHTML = `
          <main class="embed-bop">
 <div class="inline">
      <div class="container">
        ${this.renderPresident(winnerIcon)}
        ${this.renderHouse(winnerIcon)}
        ${this.renderSenate(winnerIcon)}
      </div>
      <div class="source">Source: AP (as of <date-formatter value="${this.results?.latest}"></date-formatter>)</div>
      ${this.mcmullinWon ? `<div id="mcmullin_note" class="source"><span style="color:#15b16e; font-family: Helvetica, Arial, sans-serif; font-weight: normal; font-weight: 400; font-size: 20px; font-weight: bold;">*</span><span id="mcmullin_text" style="font-style:italic;">In the Senate, Bernie Sanders (I-VT) and Angus King (I-ME) caucus with Democrats. The bar chart does not include newly-elected Evan McMullin (I-UT), who has said he will not caucus with either party.</span></div>
    </div>
        </main>
` : ''}
    `;
  }

  renderPresident(winnerIcon) {
    return `
      <a class="link-container president" href="https://apps.npr.org/elections20-interactive/#/president" target="_blank">
        <h3>President</h3>
        <div class="number-container">
          <div class="candidate dem">
            <div class="name">Biden ${this.president.Dem >= 270 ? winnerIcon : ""}</div>
            <div class="votes">${this.president.Dem}</div>
          </div>
          ${this.president.Other ? `
            <div class="candidate other">
              <div class="name">Other ${this.president.Other >= 270 ? winnerIcon : ""}</div>
              <div class="votes">${this.president.Other}</div>
            </div>
          ` : ""}
          <div class="candidate gop">
            <div class="name">Trump ${this.president.GOP >= 270 ? winnerIcon : ""}</div>
            <div class="votes">${this.president.GOP}</div>
          </div>
        </div>
        <div class="bar-container">
          <div class="bar dem" style="width: ${this.president.Dem / 538 * 100}%"></div>
          <div class="bar other" style="width: ${this.president.Other / 538 * 100}%"></div>
          <div class="bar gop" style="width: ${this.president.GOP / 538 * 100}%"></div>
          <div class="middle"></div>
        </div>
        <div class="chatter"><strong>270</strong> electoral votes to win</div>
        <div class="full-link"><span>See full results ›</span></div>
      </a>
      <div class="divider"></div>
    `;
  }

  renderHouse(winnerIcon) {
    return `
      <h2 class="bop">Balance of Power</h2>
      <a class="link-container house" href="https://apps.npr.org/election-results-live-2022/#/house" target="_blank">
        <h3>House</h3>
        <div class="number-container">
          <div class="candidate dem">
            <div class="name">Dem. ${this.house.Dem.total >= 218 ? winnerIcon : ""}</div>
            <div class="votes">${this.house.Dem.total}</div>
          </div>
          ${this.house.Ind.total ? `
            <div class="candidate other">
              <div class="name">Ind. ${this.house.Ind.total >= 218 ? winnerIcon : ""}</div>
              <div class="votes">${this.house.Ind.total}</div>
            </div>
          ` : ""}
          <div class="candidate gop">
            <div class="name">GOP ${this.house.GOP.total >= 218 ? winnerIcon : ""}</div>
            <div class="votes">${this.house.GOP.total}</div>
          </div>
        </div>
        <div class="bar-container">
          <div class="bar dem" style="width: ${this.house.Dem.total / 435 * 100}%"></div>
          <div class="bar other" style="width: ${this.house.Ind.total / 435 * 100}%"></div>
          <div class="bar gop" style="width: ${this.house.GOP.total / 435 * 100}%"></div>
          <div class="middle"></div>
        </div>
        <div class="chatter"><strong>218</strong> seats for majority</div>
       <div class="net-gain-container">
          <div class="gain-label">Net gain</div>
          <div class="net-gain ${this.house.netGainParty}">
            ${this.house.netGainParty != "none"
              ? this.house.netGainParty + " +" + this.house.netGain
              : "No change"}
          </div>
        </div>
        <div class="full-link"><span>See full results ›</span></div>
      </a>
      <div class="second divider"></div>
    `;
  }

  renderSenate(winnerIcon) {
    return `
      <a class="link-container senate" href="https://apps.npr.org/election-results-live-2022/#/senate" target="_blank">
        <h3>Senate</h3>
        <div class="number-container">
          <div class="candidate dem">
            <div class="name">Dem. ${this.senate.Dem.total >= 51 ? winnerIcon : ""}</div>
            <div class="votes">${this.senate.Dem.total}</div>
          </div>
          ${this.senate.Ind.total ? `
            <div class="candidate other">
              <div class="name">Ind. ${this.senate.Ind.total >= 51 ? winnerIcon : ""}</div>
              <div class="votes">${this.senate.Ind.total}${this.mcmullinWon ? "*" : ""}</div>
            </div>
          ` : ""}
          <div class="candidate gop">
            <div class="name">GOP ${this.senate.GOP.total >= 51 ? winnerIcon : ""}</div>
            <div class="votes">${this.senate.GOP.total}</div>
          </div>
        </div>
        <div class="bar-container">
          <div class="bar dem" style="width: ${this.senate.Dem.total}%"></div>
          <div class="bar other" style="width: ${this.senate.Ind.width}%"></div>
          <div class="bar gop" style="width: ${this.senate.GOP.total}%"></div>
          <div class="middle"></div>
        </div>
        <div class="chatter"><strong>51</strong> seats for majority</div>
        <div class="net-gain-container">
          <div class="gain-label">Net gain</div>
          <div class="net-gain ${this.senate.netGainParty}">
            ${this.senate.netGainParty != "none"
              ? this.senate.netGainParty + " +" + this.senate.netGain
              : "No change"}
          </div>
        </div>
        <div class="full-link"><span>See full results ›</span></div>
      </a>
    `;
  }
}

customElements.define("balance-of-power-bar", BalanceOfPowerBar);

export default BalanceOfPowerBar;
