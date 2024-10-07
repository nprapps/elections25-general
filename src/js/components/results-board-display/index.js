var ElementBase = require("../elementBase");
import gopher from "../gopher.js";
import { getBucket } from "../util.js";
import ResultsBoard from "../results-board";

class ResultsBoardDisplay extends ElementBase {
    constructor() {
        super();
        this.loadData = this.loadData.bind(this);
        this.results = [];
        this.office = this.getAttribute('office') || '';
        this.split = this.getAttribute('split') === 'true';
        this.hed = this.getAttribute('hed') || '';
        this.state = {};

        // Set the data file name based on the office type
        switch (this.office.toLowerCase()) {
            case 'senate':
                this.dataFileName = 'senate.json';
                break;
            case 'house':
                this.dataFileName = 'house.json';
                break;
            case 'governor':
                this.dataFileName = 'gov.json';
                break;
            case 'president':
                this.dataFileName = 'president.json';
                break;
            default:
                this.dataFileName = null;
                console.error('Invalid office type');
        }
    }

    connectedCallback() {
        this.loadData();
        this.illuminate();

        // Watch the appropriate data file if it's set
        if (this.dataFileName) {
            gopher.watch(`./data/${this.dataFileName}`, this.loadData);
        }

        // Always watch states data
        gopher.watch(`./data/states.sheet.json`, this.loadData);
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
        if (this.dataFileName) {
            gopher.unwatch(`./data/${this.dataFileName}`, this.loadData);
        }
        gopher.unwatch(`./data/states.sheet.json`, this.loadData);
    }

    async loadData() {
        this.isLoading = true;

        if (!this.dataFileName) {
            console.error('Invalid office type');
            this.isLoading = false;
            this.render();
            return;
        }

        try {
            const [raceResponse, statesResponse] = await Promise.all([
                fetch(`./data/${this.dataFileName}`),
                fetch('./data/states.sheet.json')
            ]);

            if (!raceResponse.ok || !statesResponse.ok) {
                throw new Error(`HTTP error! race status: ${raceResponse.status}, states status: ${statesResponse.status}`);
            }

            const [raceData, statesData] = await Promise.all([
                raceResponse.json(),
                statesResponse.json()
            ]);

            this.results = raceData.results || [];
            this.states = statesData || {};

            console.log('/////')
            console.log(this.results)
            console.log('/////')

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

        console.log('=========')
        console.log(buckets)
        console.log('=========')

        let content = '';

        if (this.office.includes('Senate')) {
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
                    ` : ''}
                </div>
            `;
        } else if (this.office.includes('House')) {
            content += `
                <div class="board-container House">
                    ${this.results ? `
                        <results-board 
                            office="House"
                            split="true"
                            hed="Competitive Seats"
                            class="middle"
                            races='${JSON.stringify(buckets.tossup)}'>
                        </results-board>
                        <results-board 
                            office="House"
                            hed="Likely/Solid Democratic"
                            class="first"
                            races='${JSON.stringify(buckets.likelyD)}'>
                        </results-board>
                        <results-board 
                            office="House"
                            hed="Likely/Solid Republican"
                            class="last"
                            races='${JSON.stringify(buckets.likelyR)}'>
                        </results-board>
                    ` : ''}
                </div>
            `;
        } else if (this.office.includes('governor')) {
            console.log('governor')
            content += `
                <div class="board-container Gov">
                    ${this.results ? `
                        <results-board 
                            office="Governor"
                            split="true"
                            hed="Competitive Seats"
                            class="middle"
                            races='${JSON.stringify(sorted)}'>
                        </results-board>
                    ` : ''}
                </div>
            `;
        } else if (this.office.includes('president')) {
            console.log('president')
            content += `
                <div class="board-container President">
                    ${this.results ? `
                        <results-board 
                            office="President"
                            split="true"
                            hed="Competitive States"
                            class="middle"
                            races='${JSON.stringify(buckets.tossup)}'>
                        </results-board>
                        <results-board 
                            office="President"
                            hed="Likely Democratic"
                            class="first"
                            races='${JSON.stringify(buckets.likelyD)}'>
                        </results-board>
                        <results-board 
                            office="President"
                            hed="Likely Republican"
                            class="last"
                            races='${JSON.stringify(buckets.likelyR)}'>
                        </results-board>
                    ` : ''}
                </div>
            `;
        }

        content += '</div>';
        this.innerHTML = content;
    }
}

customElements.define('results-board-display', ResultsBoardDisplay);
export default ResultsBoardDisplay;