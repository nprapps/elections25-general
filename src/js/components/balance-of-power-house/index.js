var ElementBase = require("../elementBase");
import gopher from "../gopher.js";
import {winnerIcon} from "../util.js";

class BalanceOfPowerHouse extends ElementBase {
  constructor() {
    super();
    this.loadData = this.loadData.bind(this);
    this.race = this.getAttribute('race');
  }

  connectedCallback() {
    this.loadData();
    this.illuminate();
    //gopher.watch(`./data/house.json`, this.loadData);
  }

    // Lifecycle: Called when the element is removed from the DOM
    disconnectedCallback() {
      //gopher.unwatch(`./data/house.json`, this.loadData);
    }

  /*====================*/
  //Load the data from a local json file, and call teh render() function to fill in the shadowDom
  //TODO: verify how to make this senate vs house
  /*====================*/
  async loadData() {
    try {
      const response = await fetch('./data/house.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = await response.json();
      this.render()
    } catch (error) {
      console.error("Could not load JSON data:", error);
    }
  }
    /*====================*/
  //Some render logic, then return the template of the inner html code
  /*====================*/
  render() {
    if (!this.data) return;

    var results = (this.data.results);

    var showUnaffiliated = false;

    var house = {
      Dem: { total: (0), gains: 0 },
      GOP: { total: (0), gains: 0 },
      Ind: { total: (0), gains: 0 },
      IndCaucusDem: { total: 0, gains: 0 },
      IndCaucusGOP: { total: 0, gains: 0 },
      IndUnaffiliated: { total: 0, gains: 0 },
      Other: { total: (0), gains: 0 },
      Con: { total: (0) },
      Lib: { total: (0) }
    }

    results.forEach(function (r) {
      if (r.hasOwnProperty('called') && r.called == true) {
        var winnerParty = r.winnerParty;
        var previousParty = r.previousParty;
        if (winnerParty != "Dem" && winnerParty != "GOP") {
          winnerParty = "Ind";
        }

        if (!house[winnerParty]) {
          house[winnerParty] = { total: 0, gains: 0 };
        }
        if (!house[previousParty]) {
          house[previousParty] = { total: 0, gains: 0 };
        }
  
        house[winnerParty].total += 1;
        
        if (winnerParty !== previousParty) {
          house[winnerParty].gains += 1;
          house[previousParty].gains -= 1;
        }
        
        // account for how an independent candidate may caucus
        if (winnerParty == "Ind") {
          if (r.caucusWith && r.caucusWith == "GOP") {
            house.IndCaucusGOP.total += 1;
          }
          if (r.caucusWith && r.caucusWith == "Dem") {
            house.IndCaucusDem.total += 1;
          }
          if (!r.caucusWith) {
            house.IndUnaffiliated.total += 1;
            showUnaffiliated = true;
          }
        }
      }
    });

    var footnote = "";
    if (showUnaffiliated) {
      footnote = `<div class="footnote">* Independents who caucus with Democrats (${ house.IndCaucusDem.total }) or Republicans (${ house.IndCaucusGOP.total }) are shown in the bar chart. Unaffiliated independents (${ house.IndUnaffiliated.total }) are not shown in the chart but are included in the overall count.</div>`
    }

    house.netGainParty = "none";
    var [topHouse] = Object.keys(house)
      .filter(k => k !== 'netGainParty' && k !== 'netGain')
      .map(k => ({ party: k, gains: house[k].gains }))
      .sort((a, b) => b.gains - a.gains);
  
    if (topHouse && topHouse.gains > 0) {
      house.netGainParty = topHouse.party;
      house.netGain = topHouse.gains;
    }

    this.innerHTML = `
    <div id="embed-bop-on-page">
        <div class="number-container">
          <div class="candidate dem">
            <div class="name">Dem. ${house.Dem.total >= 218 ? winnerIcon : ""}</div>
            <div class="votes">${house.Dem.total}</div>
          </div>
          ${house.Ind.total ? `
            <div class="candidate other">
              <div class="name">Ind. ${house.Ind.total >= 218 ? winnerIcon : ""}</div>
              <div class="votes">${house.Ind.total}${showUnaffiliated ? "*" : ""}</div>
            </div>
          ` : ''}
          ${435 - house.Dem.total - house.GOP.total - house.Ind.total > 0 ? `
            <div class="candidate uncalled">
              <div class="name">Not yet called</div>
              <div class="votes">${435 - house.Dem.total - house.GOP.total - house.Ind.total}</div>
            </div>
          ` : ''}
          <div class="candidate gop">
            <div class="name">GOP ${house.GOP.total >= 218 ? winnerIcon : ""}</div>
            <div class="votes">${house.GOP.total}</div>
          </div>
        </div>

        <div class="bar-container">
          <div class="bar dem" style="width: ${(house.Dem.total / 435 * 100)}%"></div>
          <div class="bar other dem" style="width: ${(house.IndCaucusDem.total / 435 * 100)}%"></div>
          <div class="bar gop" style="width: ${(house.GOP.total / 435 * 100)}%"></div>
          <div class="bar other gop" style="width: ${(house.IndCaucusGOP.total / 435 * 100)}%"></div>
          <div class="middle"></div>
        </div>

        <div class="bop-footer">
          <div class="chatter"><strong>218</strong> seats for majority</div>
        </div>

        ${ footnote }
      </div>
    </div>
  `;
  }
}

customElements.define("balance-of-power-house", BalanceOfPowerHouse);

export default BalanceOfPowerHouse;