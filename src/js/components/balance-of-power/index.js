var ElementBase = require("../elementBase");

class BalanceOfPower extends ElementBase {
  constructor() {
    super();
  }

  static get template() {
    return require("./_balance-of-power.html");
  }

  connectedCallback() {
    this.illuminate();
  }
}

customElements.define("balance-of-power", BalanceOfPower);