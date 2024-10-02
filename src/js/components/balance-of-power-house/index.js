var ElementBase = require("../elementBase");
import gopher from "../gopher.js";

class BalanceOfPowerHouse extends ElementBase {
  constructor() {
    super();
    this.loadData = this.loadData.bind(this);
    this.race = this.getAttribute('race');
  }

  connectedCallback() {
    this.loadData();
    this.illuminate();
    gopher.watch(`./data/house.json`, this.loadData);
  }

    // Lifecycle: Called when the element is removed from the DOM
    disconnectedCallback() {
      console.log('BalanceOfPower removed from the DOM');
      gopher.unwatch(`./data/house.json`, this.loadData);
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

    var house = {
      Dem: { total: (0) },
      GOP: { total: (0) },
      Ind: { total: (0) }
    }

    results.forEach(function (r) {
      if (r.hasOwnProperty('called') && r.called == true) {
        var winnerParty = r.winnerParty;
        house[winnerParty].total += 1;
      }
    });

    var winnerIcon = `<span class="winner-icon" role="img" aria-label="check mark">
    </span>`
    

    this.innerHTML = `
    <div id="embed-bop-on-page">
      <a class="link-container house" href="http://apps.npr.org/election-results-live-2022/#/house" target="_top">
        <div class="number-container">
          <div class="candidate dem">
            <div class="name">Dem. ${house.Dem.total >= 218 ? winnerIcon : ""}</div>
            <div class="votes">${house.Dem.total}</div>
          </div>
          ${house.Ind.total ? `
            <div class="candidate other">
              <div class="name">Ind. ${house.Ind.total >= 218 ? winnerIcon : ""}</div>
              <div class="votes">${house.Ind.total}</div>
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
          <div class="bar other" style="width: ${(house.Ind.total / 435 * 100)}%"></div>
          <div class="bar gop" style="width: ${(house.GOP.total / 435 * 100)}%"></div>
          <div class="middle"></div>
        </div>

        <div class="chatter"><strong>218</strong> seats for majority</div>
      </a>
    </div>
  `;
  }
}

customElements.define("balance-of-power-house", BalanceOfPowerHouse);

export default BalanceOfPowerHouse;