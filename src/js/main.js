// require("./lib/pym");

import { Sidechain } from '@nprapps/sidechain';
import './nav.js';

require("./analytics");
require("./components/results-table");
require("./components/balance-of-power-combined");
require("./components/balance-of-power-bar");
require("./components/results-board");
require("./components/results-board-display");
require("./components/results-board-key");
require("./components/board-president");
require("./components/board-senate");
require("./components/board-governor");
require("./components/board-house");
require("./components/nationalMap");
require("./components/cartogram");
require("./components/electoralBubbles");
require("./components/county-map");
require("./components/results-collection");

const urlParams = new URLSearchParams(window.location.search);

if (urlParams.has('embedded')) {
    const isEmbedded = urlParams.get('embedded');

    if (isEmbedded) {
        Sidechain.registerGuest();
    }
}

if (document.querySelector("#close-disclaimer")) {
  document
    .querySelector("#close-disclaimer")
    .addEventListener("click", () => {
      document.querySelector("#about-box").classList.add("closed");
    });
}