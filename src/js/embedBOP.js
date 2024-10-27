var Sidechain = require("@nprapps/sidechain");

require("./analytics");
var BalanceOfPowerCombined = require("./components/balance-of-power-combined");
// require("./components/balance-of-power-bar");

// look for URL params
var search = new URLSearchParams(window.location.search);
var params = {
  president: null,
  inline: null,
  theme: null,
  hideCongress: null,
  onlyPresident: null
};
for (var k in params) params[k] = search.get(k);

