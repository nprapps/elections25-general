var ElementBase = require("../elementBase");
import gopher from "../gopher.js";
import {winnerIcon} from "../util.js";


class BalanceOfPowerSenate extends ElementBase {
  constructor() {
    super();
    this.loadData = this.loadData.bind(this);
    this.race = this.getAttribute('race');
  }

  connectedCallback() {
    this.loadData();
    this.illuminate();
    gopher.watch(`./data/senate.json`, this.loadData);
  }

  // Lifecycle: Called when the element is removed from the DOM
  disconnectedCallback() {
    gopher.unwatch(`./data/senate.json`, this.loadData);
  }

  /*====================*/
  //Load the data from a local json file, and call teh render() function to fill in the shadowDom
  //TODO: verify how to make this senate vs house
  /*====================*/
  async loadData() {
    try {
      const response = await fetch('./data/senate.json');
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

    var InactiveSenateRaces = {
      "GOP": 38,
      "Dem": 28,
      "Other": 0,
      "house_GOP": 0,
      "house_Dem": 0,
      "house_Other": 0
    }

    var results = (this.data.results);

    var mcmullinWon = false;

    var senate = {
      Dem: { total: InactiveSenateRaces.Dem, gains: 0 },
      GOP: { total: InactiveSenateRaces.GOP, gains: 0 },
      Ind: { total: InactiveSenateRaces.Other, gains: 0 },
      Other: { total: (0), gains: 0 },
      Con: { total: (0), gains: 0 },
      Lib: { total: (0), gains: 0 }
    }

    results.forEach(function (r) {
      if (r.hasOwnProperty('called') && r.called == true) {
        if (r.id == '46329' && r.winnerParty == 'Ind') {
          mcmullinWon = true;
        }

        var winnerParty = r.winnerParty;
        var previousWinner = r.previousParty;

        if (!senate[winnerParty]) {
          senate[winnerParty] = { total: 0, gains: 0 };
        }
        if (!senate[previousWinner]) {
          senate[previousWinner] = { total: 0, gains: 0 };
        }

        senate[winnerParty].total += 1;
        if (winnerParty != previousWinner) {
          senate[winnerParty].gains += 1;
          senate[previousWinner].gains -= 1;
        }
      }
    });

    senate.Ind.width = senate.Ind.total;
    if (mcmullinWon) {
      senate.Ind.width = (senate.Ind.total) - 1;
    }

    senate.netGainParty = "none";
    var [topSenate] = Object.keys(senate)
      .map(k => ({ party: k, gains: senate[k].gains }))
      .sort((a, b) => b.gains - a.gains);

    if (topSenate.gains > 0) {
      senate.netGainParty = topSenate.party;
      senate.netGain = topSenate.gains;
    }

        //! UPDATE THIS — WE SHOULD NOT BE HARD-CODING THIS
        var InactiveSenateRaces = {
            "GOP": 38,
            "Dem": 28,
            "Other": 0,
            "house_GOP": 0,
            "house_Dem": 0,
            "house_Other": 0
        }

        var results = (this.data.results);

        var showUnaffiliated = false;

        var senate = {
            Dem: { total: InactiveSenateRaces.Dem, gains: 0 },
            GOP: { total: InactiveSenateRaces.GOP, gains: 0 },
            Ind: { total: InactiveSenateRaces.Other, gains: 0 },
            IndCaucusDem: { total: 0, gains: 0 },
            IndCaucusGOP: { total: 0, gains: 0 },
            IndUnaffiliated: { total: 0, gains: 0 },
            Other: { total: (0), gains: 0  },
            Con: { total: (0), gains: 0  },
            Lib: { total: (0), gains: 0  }
        }

        results.forEach(function (r) {
          if (r.hasOwnProperty('called') && r.called == true) {
            var winnerParty = r.winnerParty;
            if (winnerParty != "Dem" && winnerParty != "GOP") {
              winnerParty = "Ind";
            }

            var previousWinner = r.previousParty;
            var caucusWith = r.caucusWith;

            if (!senate[winnerParty]) {
              senate[winnerParty] = { total: 0, gains: 0 };
            }
            if (!senate[previousWinner]) {
              senate[previousWinner] = { total: 0, gains: 0 };
            }

            senate[winnerParty].total += 1;
            if (winnerParty != previousWinner) {
              senate[winnerParty].gains += 1;
              senate[previousWinner].gains -= 1;
            }

            // account for how an independent candidate may caucus
            if (winnerParty == "Ind") {
              if (r.caucusWith && r.caucusWith == "GOP") {
                senate.IndCaucusGOP.total += 1;
              }
              if (r.caucusWith && r.caucusWith == "Dem") {
                senate.IndCaucusDem.total += 1;
              }
              if (!r.caucusWith) {
                senate.IndUnaffiliated.total += 1;
                showUnaffiliated = true;
              }
            }
        
          }
        });
        
        var footnote = "";
        if (showUnaffiliated) {
          footnote = `<div class="footnote">* Independents who caucus with Democrats (${ senate.IndCaucusDem.total }) or Republicans (${ senate.IndCaucusGOP.total }) are shown in the bar chart. Unaffiliated independents (${ senate.IndUnaffiliated.total }) are not shown in the chart but are included in the overall count.</div>`
        }

        senate.netGainParty = "none";
        var [topSenate] = Object.keys(senate)
            .map(k => ({ party: k, gains: senate[k].gains }))
            .sort((a, b) => b.gains - a.gains);

        if (topSenate.gains > 0) {
            senate.netGainParty = topSenate.party;
            senate.netGain = topSenate.gains;
        }


        //! UPDATE OR REMOVE LINK (LINK IS ONLY NEEDED FOR EMBED)
        this.innerHTML = `
      <main class="embed-bop">
    <div id="embed-bop-on-page" class="embed-bop">
      <div class="number-container">
        <div class="candidate dem">
          <div class="name">Dem. ${senate.Dem.total >= 51 ? winnerIcon : ""}</div>
          <div class="votes">${senate.Dem.total}</div>
        </div>
        ${senate.Ind.total ?
        `<div class="candidate other">
            <div class="name">Ind. ${senate.Ind.total >= 51 ? winnerIcon : ""}</div>
            <div class="votes">${senate.Ind.total}${showUnaffiliated ? "*" : ""}</div>
          </div>`
                : ""}
        ${100 - senate.Dem.total - senate.GOP.total - senate.Ind.total ?
                `<div class="candidate uncalled">
            <div class="name">Not yet called</div>
            <div class="votes">${100 - senate.Dem.total - senate.GOP.total - senate.Ind.total}</div>
          </div>`
        : ""}
        <div class="candidate gop">
          <div class="name">GOP ${senate.GOP.total >= 51 ? winnerIcon : ""}</div>
          <div class="votes">${senate.GOP.total}</div>
        </div>
      </div>

<div class="bar-container">
  <div class="bar dem" style="width: ${senate.Dem.total}%">
  </div>
  <div class="bar other" style="width: ${senate.Ind.total}%">
  </div>
  <div class="bar gop" style="width: ${senate.GOP.total}%">
  </div>
  <div class="middle"></div>
</div>
      </div>

      <div class="bop-footer">
        <div class="chatter"><strong>51</strong> seats for majority</div>

        <div class="net-gain-container">
          <div class="net-gain ${senate.netGainParty}">${senate.netGainParty != "none"
                  ? `${senate.netGainParty} +${senate.netGain}`
                  : "No change"}</div>
        </div>
      </div>

      ${ footnote }
  </div>
  `;
  }
}

customElements.define("balance-of-power-senate", BalanceOfPowerSenate);

export default BalanceOfPowerSenate;