var ElementBase = require("../elementBase");
import InactiveSenateRaces from "inactive_senate_races.sheet.json";

class BalanceOfPower extends ElementBase {
  constructor() {
    super();

    this.isHouse = props.race == "house";
    this.isSenate = props.race == "senate";
    // Hardcoded # of seats needed for majority in Senate/house
    this.seatsNeeded = this.isSenate ? 51 : 218;
  }

  static get template() {
    return require("./_balance-of-power.html");
  }

  connectedCallback() {
    this.illuminate();
  }
}

customElements.define("balance-of-power", BalanceOfPower);