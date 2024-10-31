import gopher from "../gopher.js";
import {
    formatters, getCountyVariable
} from "../util.js";
import CountyChart from "./county-dataviz.js";
import { getAvailableMetrics, sortByParty } from "../util.js";
import { filter } from "async";


var { chain, comma, percent, dollars } = formatters;
const ElementBase = require("../elementBase");


class CountyDataViz extends ElementBase {
    constructor() {
        super();
        this.ommittedCounties = 0;
        this.toggleCollapsed = this.toggleCollapsed.bind(this);
        this.data = null
        this.state = {
            collapsed: true,
            cleanedData: null,
            sorted: null,
            charts: null
        };
    }

    async connectedCallback() {
        const state = this.getAttribute('state');
            const race = this.getAttribute('race');

            let url;
            if (race !== null) {
                url = `./data/counties/${race}.json`;
            } else {
                url = `./data/counties/${state}-0.json`;
            }

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            this.data = data.results || [];


            // Only display candidates that are winning a county
            const order = this.data[0].candidates;
            this.sortOrder = order;

            // Sort by party for consistent display.
            const sorted = order.slice().sort(sortByParty);


            const cleanedData = this.getCleanedData(this.data, sorted);
            this.state.cleanedData = this.getCleanedData(this.data, sorted);

            // Create display charts and sort by their correlations
            const metrics = getAvailableMetrics(state);
            const charts = [];
            for (const m of Object.keys(metrics)) {
                const metric = metrics[m];
                if (metric.hideFromToggle) continue;
                metric.corr = this.getCorrs(metric.key, this.state.cleanedData);
                charts.push(metric);
            }
            this.state.charts = charts

            if (cleanedData.length >= 10) {
                this.setState({
                    cleanedData,
                    sorted,
                    charts: this.state.charts.sort((a, b) => b.corr - a.corr),
                });
            }

            this.render();
        } catch (error) {
            console.error("Could not load JSON data:", error);
            this.render();
        }
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    render() {
        if (!this.state.cleanedData) {
            this.innerHTML = '';
            return;
        }

        const footnote = this.ommittedCounties
            ? "Counties where leading parties differ from statewide leading parties are omitted."
            : "";

        this.innerHTML = `
        <div class="trends" role="region" aria-labelledby="trends-heading">
          <h3>Demographic trends</h3>
          <div class="${this.state.collapsed ? 'collapsed' : ''}" id="trendsRef">
            ${this.state.charts.map(c => `
                <county-chart
                data="${encodeURIComponent(JSON.stringify(this.state.cleanedData))}"
                  variable="${c.key}" 
                  title="${c.name}" 
                  corr="${c.corr}"
                ></county-chart>
            `).join('')}
          </div>
          <div class="footnote" role="note">Trends subject to change as results come in. ${footnote}</div>
          <button
            class="toggle-table ${this.state.cleanedData.length > 4 ? '' : 'hidden'}"
            data-more="Show all"
            tabindex="0"
            data-less="Show less">
            ${this.state.collapsed ? 'Show all ▼' : 'Show less ▲'}
          </button>
        </div>
      `;

        this.querySelector('button').addEventListener('click', this.toggleCollapsed);
    }

    getCleanedData(data, order) {

        const sortedOrder = [...order].sort((a, b) => b.percent - a.percent);


        const lead = sortedOrder[0].party;
        const second = sortedOrder[1].party;

        //original line
        //const resultsIn = this.data.filter(d => d.reportingPercent > 0.5);
        const resultsIn = data


        // Filter out counties whose top 2 candidates don't match state.
        const filtered = resultsIn.filter(function (d) {
            const countyParties = d.candidates.slice(0, 2).map(c => c.party);
            //original line, but not great for empty state
            return countyParties.includes(lead) && countyParties.includes(second);
        });
        this.ommittedCounties = resultsIn.length - filtered.length;

        return filtered.map(f => ({
            name: f.county.countyName,
            x: this.getX(f, lead, second),
            party: f.candidates[0].party,
            fips: f.fips,
            ...f.county,
        }));
    }

    getX(county, lead, second) {
        var [secondParty] = county.candidates.filter(c => c.party == second);
        var [firstParty] = county.candidates.filter(c => c.party == lead);
        var leadPer = firstParty.percent * 100;
        var secondPer = secondParty.percent * 100;

        return secondPer / (leadPer + secondPer);
    }

    getCorrs(v, data) {
        const correlation = pearsonCorrelation([data.map(d => d.x),
        data.map(d => getCountyVariable(d, v))], 0, 1);
        return Math.abs(correlation);
    }

    toggleCollapsed() {
        this.state.collapsed = !this.state.collapsed;
        this.render();
        setTimeout(() => {
            const trendsRef = this.querySelector('#trendsRef');
            if (trendsRef) {
                trendsRef.scrollIntoView({ behavior: 'smooth' });
            }
        }, 100);
    }
}


// Source: https://gist.github.com/matt-west/6500993//
/**
 *  Calculate the person correlation score between two items in a dataset.
 *
 *  @param  {object}  prefs The dataset containing data about both items that
 *                    are being compared.
 *  @param  {string}  p1 Item one for comparison.
 *  @param  {string}  p2 Item two for comparison.
 *  @return {float}  The pearson correlation score.
 */
function pearsonCorrelation(prefs, p1, p2) {
    var si = [];

    for (var key in prefs[p1]) {
        if (prefs[p2][key]) si.push(key);
    }

    var n = si.length;

    if (n == 0) return 0;

    var sum1 = 0;
    for (var i = 0; i < si.length; i++) sum1 += prefs[p1][si[i]];

    var sum2 = 0;
    for (var i = 0; i < si.length; i++) sum2 += prefs[p2][si[i]];

    var sum1Sq = 0;
    for (var i = 0; i < si.length; i++) {
        sum1Sq += Math.pow(prefs[p1][si[i]], 2);
    }

    var sum2Sq = 0;
    for (var i = 0; i < si.length; i++) {
        sum2Sq += Math.pow(prefs[p2][si[i]], 2);
    }

    var pSum = 0;
    for (var i = 0; i < si.length; i++) {
        pSum += prefs[p1][si[i]] * prefs[p2][si[i]];
    }

    var num = pSum - (sum1 * sum2 / n);
    var den = Math.sqrt((sum1Sq - Math.pow(sum1, 2) / n) *
        (sum2Sq - Math.pow(sum2, 2) / n));

    if (den == 0) return 0;
    

    return num / den;
    
}

customElements.define('county-dataviz', CountyDataViz);