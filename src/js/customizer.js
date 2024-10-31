require("async");
var $ = require("./lib/qsa");
require("@nprapps/sidechain");

const classify = function (str) {
  return (str + "")
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
};

let customizerState = {
  page: "index",
  params: {
    embedded: true,
    stateName: "Alabama",
    stateAbbrev: "AL",
    section: "key-races",
    showHeader: true,
  },
};

let embedType,
  stateConfigOptions,
  stateSelectDropdown,
  stateSectionDropdown,
  stateRaceDropdown,
  stateHeaderCheckbox;

  const getSelectedCheckboxValues = (sectionId) => {
    const section = document.getElementById(sectionId);
    const inputType = section.querySelector('input')?.type || 'checkbox';

    if (inputType === 'radio') {
      const checkedRadio = section.querySelector('input[type="radio"]:checked');
      return checkedRadio ? [checkedRadio.value] : [];
    } else {
    const checkedBoxes = section.querySelectorAll('input[type="checkbox"]:checked');
    return Array.from(checkedBoxes).map(input => input.value);
    }
  };

/**
 * Create the URL that will populate the embed code, including additional parameters
 * 
 * @param {*} config 
 * @returns 
 */
const createURL = function (config) {
  var prefix = PROJECT_URL;
  var page = config["page"];

  if (page === 'bop' || page === 'presidentMaps') {
    var baseURL = prefix + page + ".html";
    const url = new URL(baseURL);
    url.searchParams.append('embedded', 'true');

    var allowedParams = []
    
    // Add any additional parameters
    // if (config.params) {
    //   Object.keys(config.params).forEach(key => {
    //     if (key !== 'embedded' && config.params[key] !== undefined) {
    //       url.searchParams.append(key, config.params[key]);
    //     }
    //   });
    // }

    if (page === "bop") {
      if (config.params["races"] !== undefined) {
        url.searchParams.append("races", config.params["races"]);
      }
    }

    if (page === "presidentMaps") {
      if (config.params["options"] !== undefined) {
        url.searchParams.append("options", config.params["options"]);
      }
    }
    
    return url.toString();
  }

  if (page == "state") {
    page = classify(config["params"]["stateName"]);
  }

  var baseURL = prefix + page + ".html";
  const url = new URL(baseURL);

  var neededParams = ["embedded"];
  if (config["page"] == "state") {
    moreParams = ["section", "showHeader"];
    neededParams.push(...moreParams);
  }
  if (config["page"] == "race-embed") {
    moreParams = [ "stateAbbrev", "race" ];
    neededParams.push(...moreParams);
  }
  neededParams.forEach(key => {
    url.searchParams.append(key, config["params"][key]);
  });

  return url.toString();
};

const createId = function (config) {
  var id = "";
  if (config["page"] == "state") {
    id = config["params"]["stateAbbrev"] + "-" + config["params"]["section"];
  } else if (config["page"] == "race-embed") {
    id = config["params"]["stateAbbrev"] + "-" + config["params"]["race"];
  } else {
    id = config["page"];
  }

  return id;
};

// Special embed handlers
const handleSpecialEmbed = function(page, params = {}) {
  if (page === 'presidentMaps') {
    const selectedOptions = getSelectedCheckboxValues('presidentOptions');
    return {
      ...params,
      options: selectedOptions.join(',')
    };
  } else if (page === 'bop') {
    const selectedRaces = getSelectedCheckboxValues('checkboxSection');
    return {
      ...params,
      races: selectedRaces.join(',') || 'senate' // Default to senate if nothing selected
    };
  }
  return params;
}

const createEmbed = function (config) {
  var form = $.one("form");
  var preview = $.one("side-chain");
  var embedPym = $.one("textarea#pym");
  var embedSidechain = $.one("textarea#sidechain");
  var prefix = "localhost:8000/";

  let params = config.params || {};
  if (config.page === 'presidentMaps' || config.page === 'bop') {
    params = handleSpecialEmbed(config.page, params);
  }

  var url = createURL(config);
  var id = createId(config);

  var embedPymHTML = `<p
  data-pym-loader
  data-child-src="${url.toString()}"
  id="responsive-embed-${id}">
    Loading...
</p>
<script src="https://pym.nprapps.org/npr-pym-loader.v2.min.js"></script>`;
  var embedPymHTML = embedPymHTML
    .replace(/[\n\s]+/g, " ");
  embedPym.textContent = embedPymHTML;

  var embedSidechainHTML = `<side-chain src="${url.toString()}"></side-chain>
  <script src="${PROJECT_URL}sidechain.js"></script>`;
  embedSidechainHTML = embedSidechainHTML
    .replace(/[\n\s]+/g, " ");
  embedSidechain.textContent = embedSidechainHTML;

  preview.setAttribute("src", url.toString().replace(prefix, ""));
};

const createPresidentEmbed = function() {
  customizerState.params = handleSpecialEmbed('presidentMaps', customizerState.params);
  createEmbed(customizerState);
};

const createBOPEmbed = function() {
  customizerState.params = handleSpecialEmbed('bop', customizerState.params);
  createEmbed(customizerState);
};


const buildSections = function () {
  var state = customizerState["params"]["stateAbbrev"];
  fetch("data/states/" + state + ".json")
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json(); // Parse the JSON data
    })
    .then(data => {
      let sections = ["key-races,key-races", "president,P"];

      if (data.results.filter(d => d.office === "G").length > 0) {
        sections.push("governor,G");
      }
      if (data.results.filter(d => d.office === "S").length > 0) {
        sections.push("senate,S");
      }
      if (state != "DC") {
        sections.push("house,H");
      }
      if (data.results.filter(d => d.office === "I").length > 0) {
        sections.push("ballot-measures,I");
      }

      stateSectionDropdown.innerHTML = "";

      sections.forEach(section => {
        var sectionItem = document.createElement("option");
        sectionItem.value = section.split(",")[1];
        sectionItem.textContent = section.split(",")[0];

        stateSectionDropdown.appendChild(sectionItem);
      });
    });
};

/**
 * Build dropdown list of available races in a state
 */
const buildRaces = function () {
  var state = customizerState["params"]["stateAbbrev"];
  fetch("data/states/" + state + ".json")
    .then(response => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json(); // Parse the JSON data
    })
    .then(data => {
      const listOfStateRaces = data.results.map(race => ({
        id: race.id,
        office: race.office,
        seat: race.seat,
        keyRace: race.keyRace,
      }));

      const raceTypeLookup = {
        P: "President",
        G: "Governor",
        S: "Senate",
        H: "House",
        I: "Ballot Measure",
      };

      stateRaceDropdown.innerHTML = "";

      listOfStateRaces.forEach(race => {
        raceOffice = raceTypeLookup[race.office];
        raceName = raceOffice;
        if (race.office == "H" || race.office == "I") {
          raceName += " " + race.seat;
        }

        var sectionItem = document.createElement("option");
        sectionItem.value = race.id;
        sectionItem.textContent = raceName;

        stateRaceDropdown.appendChild(sectionItem);
      });

      stateRaceDropdown.selectedIndex = 0;
      customizerState["params"]["race"] = stateRaceDropdown.value;
      createEmbed(customizerState);
    });
};

const updateView = function () {
  var page = customizerState["page"];
  var params = customizerState["params"];

  if (page == "state") {
    stateConfigOptions.classList.remove("hidden");
    $.one("#stateSectionContain").classList.remove("hidden");
    $.one("#stateRaceContain").classList.add("hidden");
    $.one("#showStateHeader").classList.remove("hidden");
    checkboxSection.classList.add("hidden");
    presidentOptions.classList.add("hidden");
    buildSections();
  } else if (page == "race-embed") {
    stateConfigOptions.classList.remove("hidden");
    $.one("#showStateHeader").classList.add("hidden");
    $.one("#stateSectionContain").classList.add("hidden");
    $.one("#stateRaceContain").classList.remove("hidden");
    checkboxSection.classList.add("hidden");
    presidentOptions.classList.add("hidden");
    buildRaces();
  } else if (page === "bop") {
    $.one("#showStateHeader").classList.add("hidden");
    checkboxSection.classList.remove("hidden");
    stateConfig.classList.add("hidden");
    presidentOptions.classList.add("hidden");
    createBOPEmbed();
    return;
  } else if (page === "presidentMaps") {
    $.one("#showStateHeader").classList.add("hidden");
    presidentOptions.classList.remove("hidden");
    stateConfig.classList.add("hidden");
    checkboxSection.classList.add("hidden");
    createPresidentEmbed();
    return;
  } else {
    stateConfigOptions.classList.add("hidden");
    checkboxSection.classList.add("hidden");
    presidentOptions.classList.add("hidden");
  }

  createEmbed(customizerState);
};


window.handleSelection = function (option) {
  // Show the relevant section based on the selected option
  if (option === "bop") {
    checkboxSection.classList.remove("hidden");
    stateConfig.classList.add("hidden");
    presidentOptions.classList.add("hidden");
    createBOPEmbed();
  } else if (option === "presidentMaps") {
    presidentOptions.classList.remove("hidden");
    stateConfig.classList.add("hidden");
    checkboxSection.classList.add("hidden");
    createPresidentEmbed();
  }
};

window.onload = function () {
  embedType = $("#embedType label input");
  stateConfigOptions = $.one("#stateConfig");
  stateSelectDropdown = $.one("#stateSelect");
  stateSectionDropdown = $.one("#stateSectionSelect");
  stateRaceDropdown = $.one("#stateRaceSelect");
  stateHeaderCheckbox = $.one("#stateHeaderTrue");

  embedType.forEach(el => {
    el.addEventListener("change", () => {
      if (!el.classList.contains('nestedCheckbox')) {
        customizerState["page"] = el.value;
        updateView();
      } else {
        console.log(el.value)
      }
    });
  });

  stateSelectDropdown.addEventListener("change", () => {
    customizerState["params"]["stateName"] =
      stateSelectDropdown.value.split(",")[1];
    customizerState["params"]["stateAbbrev"] =
      stateSelectDropdown.value.split(",")[0];
    updateView();
  });

  stateSectionDropdown.addEventListener("change", () => {
    customizerState["params"]["section"] = stateSectionDropdown.value;
    createEmbed(customizerState);
  });

  stateRaceDropdown.addEventListener("change", () => {
    customizerState["params"]["race"] = stateRaceDropdown.value;
    createEmbed(customizerState);
  });

  stateHeaderCheckbox.addEventListener("change", () => {
    customizerState["params"]["showHeader"] = stateHeaderCheckbox.checked;
    createEmbed(customizerState);
  });

  const dropdownSection = document.getElementById("stateConfig");
  const checkboxSection = document.getElementById("checkboxSection");
  const stateDropdown = document.getElementById("stateSelect");
  const raceDropdown = document.getElementById("stateRaceSelect");
  const presidentOptions = document.getElementById("presidentOptions");

  // load president board by default
  document.querySelector("#embedType input[value='index']").setAttribute("checked", true);
  updateView();  

  //createEmbed("president");
};
