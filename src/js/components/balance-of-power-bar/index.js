var ElementBase = require("../elementBase.js");
import { getParty } from "../util.js";
import gopher from "../gopher.js";
const { formatAPDate, formatTime, winnerIcon } = require("../util");


class BalanceOfPowerBar extends ElementBase {
  constructor() {
    super();
    this.loadData = this.loadData.bind(this);
    this.embedClass = '';
    this.results;
    this.latest;
  }

  connectedCallback() {
    this.loadData();
    gopher.watch(`./data/bop.json`, this.loadData);

    const raceAttr = this.getAttribute('race');
    if (raceAttr) {
      this.races = raceAttr.toLowerCase().split(' ');
      
      this.embedClass = this.races.length === 2 ? 'twoEmbeds' :
      this.races.length === 1 ? 'oneEmbed' : '';
    } else {
      this.races = ['president', 'house', 'senate'];
    }
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
      this.results = results
      this.processResults(results);
      this.render();
    } catch (error) {
      console.error("Could not load JSON data:", error);
    }
  }

  processResults(results) {

    this.latest = this.results.latest

    var InactiveSenateRaces = {
      "GOP": 38,
      "Dem": 28,
      "Other": 0,
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
      Dem: { total: parseInt(InactiveSenateRaces["house_Dem"]), gains: 0 },
      GOP: { total: parseInt(InactiveSenateRaces["house_GOP"]), gains: 0 },
      Ind: { total: parseInt(InactiveSenateRaces["house_Other"]), gains: 0 },
      IndCaucusDem: { total: 0, gains: 0 },
      IndCaucusGOP: { total: 0, gains: 0 },
      IndUnaffiliated: { total: 0, gains: 0 },
    };
    this.senate = {
      Dem: { total: InactiveSenateRaces.Dem, gains: 0 },
      GOP: { total: InactiveSenateRaces.GOP, gains: 0 },
      Ind: { total: InactiveSenateRaces.Other, gains: 0 },
      IndCaucusDem: { total: 0, gains: 0 },
      IndCaucusGOP: { total: 0, gains: 0 },
      IndUnaffiliated: { total: 0, gains: 0 },
    };

    results.president.forEach(r => this.president[r.winner] += r.electoral);

    results.house.forEach(r => {
      let winnerParty = getParty(r.winner);
      if (winnerParty != "Dem" && winnerParty != "GOP") {
        winnerParty = "Ind";
      }
      var previousParty = r.previousParty;

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

      // account for how an independent candidate may caucus
      if (winnerParty == "Ind") {
        if (r.caucusWith && r.caucusWith == "GOP") {
          this.house.IndCaucusGOP.total += 1;
        }
        if (r.caucusWith && r.caucusWith == "Dem") {
          this.house.IndCaucusDem.total += 1;
        }
        if (!r.caucusWith) {
          this.house.IndUnaffiliated.total += 1;
        }
      }      
    });

    results.senate.forEach(r => {
      let winnerParty = getParty(r.winner);
      if (winnerParty != "Dem" && winnerParty != "GOP") {
        winnerParty = "Ind";
      }

      const previousParty = getParty(r.previous);

      if (!this.senate[winnerParty]) {
        this.senate[winnerParty] = { total: 0, gains: 0 };
      }
      if (!this.senate[previousParty]) {
        this.senate[previousParty] = { total: 0, gains: 0 };
      }

      this.senate[winnerParty].total += 1;

      if (r.winner !== r.previous) {
        this.senate[winnerParty].gains += 1;
        this.senate[previousParty].gains -= 1;
      }

      // account for how an independent candidate may caucus
      if (winnerParty == "Ind") {
        if (r.caucusWith && r.caucusWith == "GOP") {
          this.senate.IndCaucusGOP.total += 1;
        }
        if (r.caucusWith && r.caucusWith == "Dem") {
          this.senate.IndCaucusDem.total += 1;
        }
        if (!r.caucusWith) {
          this.senate.IndUnaffiliated.total += 1;
        }
      }
    });

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

    const date = new Date(this.latest);
    let timestampHTML = `Source: AP. Last updated ${formatAPDate(date)} at ${formatTime(date)}`;

    const winnerIcon = `<span class="winner-icon" role="img" aria-label="check mark">
      <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <path fill="#333" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
      </svg>
    </span>`;

    this.innerHTML = `
    <main class="embed-bop">
      <div class="inline">
        <div class="container ${this.embedClass}">
        ${!this.races || this.races.includes('president') ? this.renderPresident(winnerIcon) : ''}
        ${!this.races || this.races.includes('house') ? this.renderHouse(winnerIcon) : ''}
        ${!this.races || this.races.includes('senate') ? this.renderSenate(winnerIcon) : ''}
        </div>
      </div>
    </main>
      <div class="board source source-footnote">${timestampHTML}</div>
    `;
  }

  renderPresident(winnerIcon) {
    return `
      <a class="link-container president ${this.embedClass}" href="https://apps.npr.org/2024-election-results/" target="_blank">
        <h3>President</h3>
        <div class="number-container">
          <div class="candidate dem">
            <div class="name">Harris ${this.president.Dem >= 270 ? winnerIcon : ""}</div>
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
          <div class="bar other" style="width: ${this.president.Other / 538 * 100}%; ${this.president.Other === 0 ? 'display: none;' : ''}"></div>
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
      <a class="link-container house ${this.embedClass}" href="house.html" target="_blank">
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
          <div class="bar dem" style="width: ${(this.house.Dem.total / 435 * 100)}%"></div>
          <div class="bar other dem" style="width: ${(this.house.IndCaucusDem.total / 435 * 100)}%"></div>
          <div class="bar gop" style="width: ${(this.house.GOP.total / 435 * 100)}%"></div>
          <div class="bar other gop" style="width: ${(this.house.IndCaucusGOP.total / 435 * 100)}%"></div>
          <div class="middle"></div>
        </div>
        <div class="chatter"><strong>218</strong> seats for majority</div>
        <div class="full-link"><span>See full results ›</span></div>
      </a>
      <div class="second divider"></div>
    `;
  }

  renderSenate(winnerIcon) {
    return `
      <a class="link-container senate ${this.embedClass}" href="senate.html" target="_blank">
        <h3>Senate</h3>
        <div class="number-container">
          <div class="candidate dem">
            <div class="name">Dem. ${this.senate.Dem.total >= 51 ? winnerIcon : ""}</div>
            <div class="votes">${this.senate.Dem.total}</div>
          </div>
          ${this.senate.Ind.total ? `
            <div class="candidate other">
              <div class="name">Ind. ${this.senate.Ind.total >= 51 ? winnerIcon : ""}</div>
              <div class="votes">${this.senate.Ind.total}${this.IndUnaffiliated > 0 ? "*" : ""}</div>
            </div>
          ` : ""}
          <div class="candidate gop">
            <div class="name">GOP ${this.senate.GOP.total >= 51 ? winnerIcon : ""}</div>
            <div class="votes">${this.senate.GOP.total}</div>
          </div>
        </div>
        <div class="bar-container">
          <div class="bar dem" style="width: ${this.senate.Dem.total}%"></div>
          <div class="bar other dem" style="width: ${this.senate.IndCaucusDem.total}%"></div>
          <div class="bar gop" style="width: ${this.senate.GOP.total}%"></div>
          <div class="bar other gop" style="width: ${this.senate.IndCaucusGOP.total}%"></div>
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
     <div class="second divider"></div>
    `;
  }
}

customElements.define("balance-of-power-bar", BalanceOfPowerBar);

export default BalanceOfPowerBar;
