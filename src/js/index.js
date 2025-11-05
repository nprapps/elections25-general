var Sidechain = require("@nprapps/sidechain");
import "./nav.js";

require("./analytics");
require("./components/index-page-results");
require("./components/results-table");

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

export const navigate = function(key, state) {
  // console.log(key, state);
  // var sectionCode = Object.keys(offices).find(d => offices[d] === key);
  // url.searchParams.set("section", sectionCode);
  // document.querySelector("body").dataset.section = key;
  // url.pathname = `${ url.pathname }${ state }.html`;
  // location.href = url;
  
  // gross hotfix
  location.href = `https://apps.npr.org/2025-election-results/${ state }.html`;
}

var oldOnload = window.onload;
window.onload = function() { oldOnload();
  const nav = document.querySelector("form");
  const urlParams = new URLSearchParams(window.location.search);
  let urlSection = urlParams.get("section");
  if (urlSection === null) {
    urlSection = "key-races";
  }
  /*
  nav.querySelector("#" + offices[urlSection]).checked = true;
  navigate(offices[urlSection]);

  nav.addEventListener("change", e => {
    navigate(e.target.value);
  });
  */

  // not relevant for this particular template b/c we're not
  // offering an embedded version
  if (urlParams.has("embedded")) {
    const isEmbedded = urlParams.get("embedded");
    if (isEmbedded) {
      var guest = Sidechain.Sidechain.registerGuest();
      guest.sendHeight();
      console.log(guest);
      nav.addEventListener("change", (e) => {
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

  // handlers for county results buttons
  document.querySelectorAll(".section-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      navigate(link.dataset.value, link.dataset.state);
      // const nav = document.querySelector("form");
      // nav.querySelector("#" + link.dataset.value).checked = true;

      // nav.addEventListener("change", (e) => {
      //   navigate(e.target.value);
      // });
    });
  });
};
