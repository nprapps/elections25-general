var Sidechain = require("@nprapps/sidechain");

import "./nav.js";

require("./components/state-page-results");
require("./components/results-table");
require("./components/county-map");
require("./components/county-dataviz");
require("./components/county-map");
require("./components/results-table-county");

// let section = document.querySelector('input[name="nav"]:checked').value;
const url = new URL(window.location.href);
const urlParams = new URLSearchParams(window.location.search);

const navigate = function (e) {
  var sectionCode = Object.keys(offices).find(key => offices[key] === e);
  url.searchParams.set("section", sectionCode);
  window.history.pushState({}, "", url);
  const selectedSection = document.querySelector("#" + e + "-section");
  document.querySelectorAll("section").forEach(section => {
    section.classList.remove("shown");
  });
  selectedSection.classList.add("shown");
};

let nav = document.querySelector("form");

nav.addEventListener("change", e => {
  navigate(e.target.value);
});

const offices = {
  "key-races": "key-races",
  P: "president",
  G: "governor",
  S: "senate",
  H: "house",
  I: "ballot-measures",
};

// const showSection = selectedSection => {
//   document.querySelectorAll("section").forEach(section => {
//     section.classList.remove("shown");
//   });

//   document.querySelectorAll("input[name='nav']").forEach(input => {
//     input.checked = false;
//   });

//   document.querySelector(`#${selectedSection}-section`).classList.add("shown");
//   document.querySelector(`input[id=${selectedSection}]`).checked = true;
// };

window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  let urlSection = urlParams.get("section");
  if (urlSection === null) {
    urlSection = "key-races";
  }

  nav.querySelector("#" + offices[urlSection]).checked = true;
  navigate(offices[urlSection]);

  if (urlParams.has("embedded")) {
    const isEmbedded = urlParams.get("embedded");
    if (isEmbedded) {
      var guest = Sidechain.Sidechain.registerGuest();
    }
    var showHeader = urlParams.get("showHeader");
    if (showHeader == "false") {
      const headerElement = document.querySelector("header");
      headerElement.style.display = "none";
    }
  }

  if (document.querySelector("#close-disclaimer")) {
    document
      .querySelector("#close-disclaimer")
      .addEventListener("click", () => {
        document.querySelector("#about-box").classList.add("closed");
      });
  }
};
