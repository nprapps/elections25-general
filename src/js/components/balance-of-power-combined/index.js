var ElementBase = require("../elementBase");
import gopher from "../gopher.js";
import BalanceOfPowerSenate from "../balance-of-power-senate";
import BalanceOfPowerHouse from "../balance-of-power-house";


class BalanceOfPowerCombined extends ElementBase {
  constructor() {
    super();
    this.loadData = this.loadData.bind(this);
    this.senate = null;
    this.house = null;
  }

  connectedCallback() {
    this.loadData();
    this.illuminate();
    gopher.watch(`./data/bop.json`, this.loadData);
  }

    // Lifecycle: Called when the element is removed from the DOM
    disconnectedCallback() {
      console.log('BalanceOfPower removed from the DOM');
      gopher.unwatch(`./data/bop.json`, this.loadData);
    }

  /*====================*/
  //Load the data from a local json file, and call teh render() function to fill in the shadowDom
  //TODO: verify how to make this senate vs house
  /*====================*/
  async loadData() {
    try {
      const response = await fetch('./data/bop.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = await response.json();


      this.senate = this.data.senate;
      this.house = this.data.house;
      console.log('=======================')
      console.log(this.data)
      console.log(this.senate)
      console.log(this.house)
      console.log('=======================')
      this.render()
    } catch (error) {
      console.error("Could not load JSON data:", error);
    }
  }
    /*====================*/
  //Some render logic, then return the template of the inner html code
  /*====================*/
  render() {
    if (!this.senate || !this.house) return;

    this.innerHTML = `
      <div class="balance-of-power-combined">
        <div class="senate-container">
          <balance-of-power-senate></balance-of-power-senate>
        </div>
        <div class="house-container">
          <balance-of-power-house></balance-of-power-house>
        </div>
      </div>
    `;

    // After rendering, set the data for child components
    const senateComponent = this.querySelector('balance-of-power-senate');
    const houseComponent = this.querySelector('balance-of-power-house');

    //use this to pass in the appropriate data
    if (senateComponent) senateComponent.setData(this.senate);
    if (houseComponent) houseComponent.setData(this.house);
  }
}

customElements.define("balance-of-power-combined", BalanceOfPowerCombined);
export default BalanceOfPowerCombined;