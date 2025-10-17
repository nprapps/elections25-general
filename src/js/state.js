var Sidechain = require("@nprapps/sidechain");
import "./nav.js";

require("./analytics");
require("./components/state-page-results");
require("./components/results-table");
require("./components/county-map");
require("./components/county-dataviz");
require("./components/county-map");
require("./components/results-table-county");

// let section = document.querySelector('input[name="nav"]:checked').value;
const url = new URL(window.location.href);
const urlParams = new URLSearchParams(window.location.search);

const offices = {
  "key-races": "key-races",
  P: "president",
  G: "governor",
  S: "senate",
  H: "house",
  I: "ballot-measures",
  M: "mayor",
};

export const navigate = function(key) {
  var sectionCode = Object.keys(offices).find(d => offices[d] === key);
  url.searchParams.set("section", sectionCode);
  window.history.pushState({}, "", url);
  document.querySelector("body").dataset.section = key;
}

var oldOnload = window.onload;
window.onload = function() { oldOnload();
  const nav = document.querySelector("form");
  const urlParams = new URLSearchParams(window.location.search);
  let urlSection = urlParams.get("section");
  if (urlSection === null) {
    urlSection = "key-races";
  }
  nav.querySelector("#" + offices[urlSection]).checked = true;
  navigate(offices[urlSection]);

  nav.addEventListener("change", e => {
    navigate(e.target.value);
  });

  if (urlParams.has("embedded")) {
    const isEmbedded = urlParams.get("embedded");
    if (isEmbedded) {
      var guest = Sidechain.Sidechain.registerGuest();
      guest.sendHeight();
      console.log(guest);
      nav.addEventListener("change", e => {
        guest.sendHeight();
      });
    }
    var showHeader = urlParams.get("showHeader");
    if (showHeader == "false") {
      document.querySelector("body").dataset.header = "hide";
    }
  }

  if (document.querySelector("#close-disclaimer")) {
    document
      .querySelector("#close-disclaimer")
      .addEventListener("click", () => {
        document.querySelector("#about-box").classList.add("closed");
      });

    //keyboard-accessibility
    document
      .querySelector("#close-disclaimer")
      .addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          document.querySelector("#about-box").classList.add("closed");
        }
      });
  }
};

window.addEventListener("load", function () {
  document.querySelectorAll(".section-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      navigate(link.dataset.value);
      const nav = document.querySelector("form");
      nav.querySelector("#" + link.dataset.value).checked = true;

      nav.addEventListener("change", (e) => {
        navigate(e.target.value);
      });
    });
  });
});
