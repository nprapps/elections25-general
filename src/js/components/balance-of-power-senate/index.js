var ElementBase = require("../elementBase");
import gopher from "../gopher.js";


class BalanceOfPowerSenate extends ElementBase {
    constructor() {
        super();
        this.loadData = this.loadData.bind(this);
        this.race = this.getAttribute('race');
    }

    connectedCallback() {
        this.loadData();
        this.illuminate();
        console.log('senate has changed')
        gopher.watch(`./data/senate.json`, this.loadData);
    }

    // Lifecycle: Called when the element is removed from the DOM
    disconnectedCallback() {
        console.log('BalanceOfPower removed from the DOM');
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
            "GOP": 29,
            "Dem": 34,
            "Other": 2,
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
            Other: { total: (0), gains: 0  },
            Con: { total: (0), gains: 0  },
            Lib: { total: (0), gains: 0  }
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

        this.innerHTML = `
      <main class="embed-bop">
    <div id="embed-bop-on-page" class="embed-bop">
    <a class="link-container senate" href="http://apps.npr.org/election-results-live-2022/#/senate" target="_top">
      <div class="number-container">
        <div class="candidate dem">
          <div class="name">Dem. ${senate.Dem.total >= 51 ? winnerIcon : ""}</div>
          <div class="votes">${senate.Dem.total}</div>
        </div>
        ${senate.Ind.total ?
                `<div class="candidate other">
            <div class="name">Ind. ${senate.Ind.total >= 51 ? winnerIcon : ""}</div>
            <div class="votes">${senate.Ind.total}${mcmullinWon ? "*" : ""}</div>
          </div>`
                : ""}
        ${100 - senate.Dem.total - senate.GOP.total - senate.Ind.width ?
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
  <div class="bar other" style="width: ${senate.Ind.width}%">
  </div>
  <div class="bar gop" style="width: ${senate.GOP.total}%">
  </div>
  <div class="middle"></div>
</div>
      </div>

      <div class="chatter"><strong>51</strong> seats for majority</div>

      <div class="net-gain-container">
        <div class="net-gain ${senate.netGainParty}">${senate.netGainParty != "none"
                ? `${senate.netGainParty} +${senate.netGain}`
                : "No change"}</div>
      </div>
    </a>
  </div>
  `;
    }
}

customElements.define("balance-of-power-senate", BalanceOfPowerSenate);

export default BalanceOfPowerSenate;