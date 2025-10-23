import gopher from "../gopher.js";
const { classify, statePostalToFull } = require("../util");
const ResultsCollection = require("../results-collection/index.js");
const TabbedResultsCollection = require("../tabbed-results-collection/index.js");
const ElementBase = require("../elementBase.js");

const offices = {
  "key-races": "key-races",
  president: "P",
  governor: "G",
  senate: "S",
  house: "H",
  "ballot-measures": "I",
  mayor: "M"
};

const officeKeywords = {
  "P": "president",
  "G": "governor",
  "S": "senate",
  "H": "house",
  "I": "ballot-measures",
  "M": "mayor"
};

const townshipStates = ["CT", "MA", "ME", "NH", "RI", "VT"];

class IndexPageResults extends ElementBase {
  constructor() {
    super();
    this.stateList = JSON.parse(this.getAttribute("state-list"));
    // this.sections = JSON.parse(this.getAttribute("sections"));
    // this.keyRaceCollections = JSON.parse(
    //   this.getAttribute("key-race-collections")
    // );
    this.countyRaces = JSON.parse(this.getAttribute("county-races"));
    this.loadData = this.loadData.bind(this);
    this.datafile = "./data/all.json";
  }

  connectedCallback() {
    this.loadData();
    this.watchData();
  }

  async loadData() {
    console.log("loadData");
    try {
      const response = await fetch(this.datafile);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.data = await response.json();
      this.render();
    } catch (error) {
      console.error("Could not load JSON data:", error);
    }
  }

  async watchData() {
    await this.loadData();
    if (this.data.results.every(d => !d.certified)) {
      gopher.watch(this.datafile, this.loadData);
    }
  }

  render() {
    console.log("WTF render");
    this.removeAttribute("state-races");
    // this.removeAttribute("sections");
    // this.removeAttribute("key-race-collections");
    this.removeAttribute("county-races");

    const results = this.data.results;
    let template = "";
    // const electoral = results
    //   .filter((d) => d.office === "P")
    //   .map((obj) => obj.electoral)
    //   .reduce((accumulator, current) => accumulator + current, 0);

    console.log(results);
    console.log(this.stateList);

    this.stateList.forEach((st) => {
      console.log(st);
      let stateData = results.filter(d => d.state === st);
      let stateSections = "";
      console.log(stateData);

      let stateHTML = `<h2><a href="${ classify(statePostalToFull(st)) }.html">${ statePostalToFull(st) }</a></h2>`;
      stateHTML += '<section id="key-races-section" section="key-races">';

      ["P", "G", "S", "H", "I", "M"].forEach((office) => {
        let officeData = stateData.filter(o => o.office == office );
        if (officeData.length > 0) {
          console.log(office, officeData);

          stateHTML += `
            <results-collection 
              state="${ st }"
              office="${ office }" 
              races='${JSON.stringify(officeData).replace(/'/g, "&#39;")}'
              key-races-only>
            </results-collection>
          `;
        }

      });

      stateHTML += "</section>";

      template += stateHTML;
    });

    /*
    this.sections.forEach((section) => {
      let sectionHTML = "";

      if (section === "key-races") {
        sectionHTML += '<section id="key-races-section" section="key-races">';
        this.keyRaceCollections.forEach((office) => {
          let races = results.filter((d) => {
            if (
              office === "president" &&
              (this.state === "NE" || this.state === "ME")
            ) {
              return d.office === "P" && d.electoral === 2;
            } else if (office === "house") {
              return d.office === "H" && d.keyRace === "yes";
            } else if (office === "ballot-measures") {
              return d.office === "I" && d.featured === "yes";
            } else {
              return d.office === offices[office];
            }
          });
          sectionHTML += `
            <results-collection state="${this.state}" office="${
            offices[office]
          }" races='${JSON.stringify(races).replace(
            /'/g,
            "&#39;"
          )}' key-races-only electoral=${electoral}></results-collection>
          `;
        });
        sectionHTML += "</section>";
      } else {
        let races = results.filter((d) => d.office === offices[section]);

        if (section === "president") {
          if (this.state === "AK" || this.state === "DC") {
            sectionHTML += `
              <section id="president-section" section="president">
                <results-collection 
                  state=${this.state}
                  office="${offices[section]}" 
                  races='${JSON.stringify(races).replace(/'/g, "&#39;")}' 
                  electoral=${electoral} 
                >
                </results-collection>

                <p class="county-data-note"> County-level results not available for ${
                  this.state === "AK" ? "Alaska" : "District of Columbia"
                }. </p>
              </section>
            `;
          } else if (this.state === "NE" || this.state === "ME") {
            sectionHTML += `
              <section id="president-section" section="president">
                <tabbed-results-collection
                  state="${this.state}"
                  races='${JSON.stringify(races).replace(/'/g, "&#39;")}'
                ></tabbed-results-collection>
                <h3 class="section-hed">Presidential results by ${
                  townshipStates.includes(this.state) ? "township" : "county"
                }</h3>
                <county-map state="${this.state}"></county-map>
                ${
                  !races.some((d) => d.office === "P" && d.eevp === 0)
                    ? `<county-dataviz state="${this.state}"></county-dataviz>`
                    : ""
                }
                <results-table-county
                  state="${this.state}"
                  race-id="0"
                  order="1">
                </results-table-county>
              </section>
            `;
          } else {
            sectionHTML += `
              <section id="president-section" section="president">
                <results-collection state="${this.state}" office="${
              offices[section]
            }" races='${JSON.stringify(races).replace(
              /'/g,
              "&#39;"
            )}' electoral=${electoral} 
                ></results-collection>
                <h3 class="section-hed">Presidential results by ${
                  townshipStates.includes(this.state) ? "township" : "county"
                }</h3>
                <county-map state="${this.state}"></county-map>
                ${
                  !races.some((d) => d.office === "P" && d.eevp === 0)
                    ? `<county-dataviz state="${this.state}"></county-dataviz>`
                    : ""
                }
                <results-table-county
                  state="${this.state}"
                  race-id="0"
                  order="1">
                </results-table-county>
              </section>
            `;
          }
        } else if (section === "senate" || section === "governor" || section === "ballot-measures") {
          let countiesHTML = "";
          let countyRaces = this.countyRaces.filter(
            (d) => d.office === offices[section]
          );
          races.forEach((race) => {
            let countyHTML = "";
            if (races.length > 1) {
              countyHTML += "<h3>" + race.name_override + "</h3>";
            }
            countyHTML += `
              <county-map state="${this.state}" race-id="${this.state}-${
              race.id
            }"></county-map>
              ${
                !races.some((d) => d.office === "S" && d.eevp === 0)
                  ? `<county-dataviz state="${this.state}" race="${this.state}-${race.id}"></county-dataviz>`
                  : ""
              }
              <results-table-county
                state="${this.state}"
                race-id="${race.id}"
                order="1">
              </results-table-county>
            `;
            countiesHTML += countyHTML;
          });

          sectionHTML += `
            <section id="${section}-section" section="${section}">
              <results-collection state="${this.state}" office="${
            offices[section]
          }" races='${JSON.stringify(races).replace(
            /'/g,
            "&#39;"
          )}'></results-collection>
              <h3 class="section-hed">${
                section.charAt(0).toUpperCase() + section.slice(1)
              } results by county</h3>
          `;
          sectionHTML += countiesHTML;
          sectionHTML += "</section>";
        } else {
          console.log(section);
          sectionHTML += `
            <section id="${section}-section" section="${section}">
              <results-collection state="${this.state}" office="${
            offices[section]
          }" races='${JSON.stringify(races).replace(
            /'/g,
            "&#39;"
          )}'></results-collection>
            </section>
          `;
        }
      }

      template += sectionHTML;
    });
    */

    this.innerHTML = template;
  }
}

customElements.define("index-page-results", IndexPageResults);
