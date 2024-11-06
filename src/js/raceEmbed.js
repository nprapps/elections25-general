var $ = require("./lib/qsa");

require("./analytics");
var Sidechain = require("@nprapps/sidechain");
require("./components/individual-race-embed");

var oldOnload = window.onload;
window.onload = function() { oldOnload();    var guest = Sidechain.Sidechain.registerGuest();

  const urlParams = new URLSearchParams(window.location.search);

  var main = $.one(".embed");

  var state = urlParams.get("stateAbbrev");
  var race = urlParams.get("race");

  const embed = document.createElement("individual-race-embed");
  embed.setAttribute("state", state);
  embed.setAttribute("race", race);

  main.appendChild(embed);
};
