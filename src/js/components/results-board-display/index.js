var ElementBase = require("../elementBase");
import gopher from "../gopher.js";
import { getBucket } from "../util.js";
import ResultsBoard from "../results-board";

class ResultsBoardDisplay extends ElementBase {
    constructor() {
        super();
        this.loadData = this.loadData.bind(this);
        this.senate = null;
        this.house = null;
        this.races = [];
        this.office = this.getAttribute('office') || '';
        this.split = this.getAttribute('split') === 'true';
        this.hed = this.getAttribute('hed') || '';
        this.state = {};

    }

    connectedCallback() {
        this.loadData();
        this.illuminate();
        gopher.watch(`./data/senate.json`, this.loadData);
        gopher.watch(`./data/house.json`, this.loadData);

        // Parse the race attribute
        const raceAttr = this.getAttribute('race');
        if (raceAttr) {
            this.races = raceAttr.toLowerCase().split(' ');
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'office':
                    this.office = newValue;
                    break;
                case 'split':
                    this.split = newValue === 'true';
                    break;
                case 'hed':
                    this.hed = newValue;
                    break;
            }
        }
    }

    disconnectedCallback() {
        gopher.unwatch(`./data/senate.json`, this.loadData);
        gopher.unwatch(`./data/house.json`, this.loadData);
    }

    async loadData() {
        this.isLoading = true;


        let raceDataFile, statesDataFile;

        if (this.office.toLowerCase() === 'senate') {
            raceDataFile = './data/senate.json';
            statesDataFile = './data/states.sheet.json';
        } else if (this.office.toLowerCase() === 'house') {
            raceDataFile = './data/house.json';
            statesDataFile = './data/states.sheet.json';
        } else {
            console.error('Invalid office type');
            this.isLoading = false;
            this.render();
            return;
        }

        try {
            const [raceResponse, statesResponse] = await Promise.all([
                fetch(raceDataFile),
                fetch(statesDataFile)
            ]);

            if (!raceResponse.ok || !statesResponse.ok) {
                throw new Error(`HTTP error! race status: ${raceResponse.status}, states/districts status: ${statesResponse.status}`);
            }

            const [raceData, statesData] = await Promise.all([
                raceResponse.json(),
                statesResponse.json()
            ]);

            //===========//
            //this is where set the races for that feel into the results board 
            //=============//
            this.races = raceData.results || [];
            this.results = raceData.results || [];
            this.states = statesData || {};

            this.isLoading = false;
            this.render();
        } catch (error) {
            console.error("Could not load JSON data:", error);
            this.isLoading = false;
            this.render(); // Render to show error state
        }
    }

    render() {
        //if (!this.senate || !this.house) return;

        var { results, test, latest, alert } = this.state;
        this.state.results = this.results

        if (!alert) {
            alert = '';
        }
        if (alert.includes("~")) {
            alert = '';
        }



        if (results) {
            var sorted = results.slice().sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0);

            var buckets = {
                likelyD: [],
                tossup: [],
                likelyR: [],
            };

            sorted.forEach(function (r) {
                var bucketRating = getBucket(r.rating);
                if (bucketRating) buckets[bucketRating].push(r);
            });

        }

        let content = '';
      
        if (this.office.includes('Senate')) {
            console.log('yahhoooo')
            console.log(buckets)
            content += `
                <div class="board-container Senate">
                    ${this.results ? `
                        <results-board 
                            office="Senate"
                            split="true"
                            hed="Competitive Seats"
                            class="middle"
                            races='${JSON.stringify(buckets.tossup)}'>
                        </results-board>
                        <results-board 
                            office="Senate"
                            hed="Likely/Solid Democratic"
                            class="first"
                            races='${JSON.stringify(buckets.likelyD)}'>
                        </results-board>
                        <results-board 
                            office="Senate"
                            hed="Likely/Solid Republican"
                            class="last"
                            races='${JSON.stringify(buckets.likelyR)}'>
                        </results-board>
                    ` : 'hello'}
                </div>
            `;
            console.log(this.results )
        }
        content += '</div>'
        this.innerHTML = content
    }
}

customElements.define('results-board-display', ResultsBoardDisplay);
export default ResultsBoardDisplay;