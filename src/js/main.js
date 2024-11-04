// require("./lib/pym");

import { Sidechain } from '@nprapps/sidechain';
import './nav.js';

require("./analytics");
require("./removeLoadingScreen");
require("./components/results-table");
require("./components/balance-of-power-combined");
require("./components/balance-of-power-bar");
require("./components/results-board");
require("./components/results-board-key");
require("./components/board-president");
require("./components/board-senate");
require("./components/board-governor");
require("./components/board-house");
require("./components/county-map");
require("./components/results-collection");

var baseTarget = document.head.querySelector("base");
if (baseTarget == null) {
  baseTarget = document.createElement("base");
  document.getElementsByTagName('head')[0].appendChild(baseTarget);
}
baseTarget.target = "_top";

const urlParams = new URLSearchParams(window.location.search);

if (urlParams.has('embedded')) {
  const isEmbedded = urlParams.get('embedded');

  if (isEmbedded) {
    Sidechain.registerGuest();

    document.body.classList.add("embedded");

    // everything should open in a new window from embeds
    baseTarget.target = "_blank";
  }
}

// close disclaimer alert box
if (document.querySelector("#close-disclaimer")) {
  document
    .querySelector("#close-disclaimer")
    .addEventListener("click", () => {
      document.querySelector("#about-box").classList.add("closed");
    });
}