import ElementBase from "../elementBase";
import gopher from "../gopher.js";
import ResultsTable from "../results-table";

const STATES_WITHOUT_COUNTY_INFO = ["AK"];

class StateLevelResults extends ElementBase {
    constructor() {
        super();
        this.showHousesIfMoreThanN = 10;
        this.state = {};
        this.onData = this.onData.bind(this);
        this.Strings = null;
    }

    connectedCallback() {
        this.loadData();
        this.illuminate();
    }

    disconnectedCallback() {
        gopher.unwatch(this.getAttribute("data-file"), this.onData);
    }
    async loadData() {

        let stringsDataFile = './data/strings.sheet.json';
        let statesDataFile = './data/states.sheet.json';
        
        try {
            const [statesResponse, stingsResponse] = await Promise.all([
                fetch(statesDataFile),
                fetch(stringsDataFile)
            ]);

            const [statesData, stringsData] = await Promise.all([
                statesResponse.json(),
                stingsResponse.json()
            ]);

            this.Strings = stringsData || {};
            this.states = statesData || {};

            gopher.watch(`./data/states/${this.getAttribute("state")}.json`, this.onData);

        } catch (error) {
            console.error('Error fetching president data:', error);
        }
    }

    onData(data) {
        console.log(data)
        var updated = Math.max(...data.results.map(r => r.updated));
        var event = new CustomEvent("updatedtime", {
            detail: updated,
            bubbles: true,
        });
        this.dispatchEvent(event);

        var grouped = {};
        for (var r of data.results) {
            if (!grouped[r.office]) grouped[r.office] = [];
            grouped[r.office].push(r);
        }

        this.state = { races: data.results, grouped };
        this.render();
    }

    render() {
        var { races, grouped } = this.state;
        if (!races) {
            this.innerHTML = "";
            return;
        }

        var offices = "PGSHI".split("").filter(o => o in grouped);

        var numberSort = (a, b) => a.seatNumber * 1 - b.seatNumber * 1;
        var nameSort = (a, b) => a.seat < b.seat ? -1 : 1;

        var content = offices.map(o => {
            var data = grouped[o];
            console.log('///////////////////////////////////////')
            console.log(o)
            console.log(data)
            // Filter house races for keyRaces
            if (o == "H") {
                console.log(data)
                data = data.filter(d => d.keyRace);
                console.log(data)
                console.log('///////////')
                data.sort(numberSort);
                if (!data.length) return "";
            }
            if (o == "I") {
                data = data.filter(d => d.featured);
                data.sort(nameSort);
                if (!data.length) return "";
            }
            console.log('///////////////////////////////////////')
            var label = this.Strings[`office-${o}`];
            var noCountyResults = STATES_WITHOUT_COUNTY_INFO.includes(
                this.getAttribute("state")
            );
            var linkText =
                o == "H" || o == "I"
                    ? `All ${label} results ›`
                    : noCountyResults
                        ? ""
                        : "County-level results ›";

            return `
        <div class="key-race-group">
          <h2>
            ${label}
            <a
              class="county-results"
              href="#/states/${this.getAttribute("state")}/${o}">
              ${linkText}
            </a>
          </h2>
          <div class="races">
            ${data.map(r => {
                var isMultiple = data.length > 1;
                var title = "";
                if (isMultiple) {
                    title = this.states[r.state].name + " " + (r.seatNumber || 1);
                }
                return `<results-table data-file="./data/states/${this.getAttribute("state")}.json" race-id="${r.id}" state="${r.state}" title="${title}"></results-table>`;
            }).join("")}
          </div>
        </div>
      `;
        }).join("");

        this.innerHTML = content;
    }
}

customElements.define("state-level-results", StateLevelResults);