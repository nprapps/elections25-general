var ElementBase = require("../elementBase");
import {
    reportingPercentage,
    sortByOrder,
    formatters,
    getAvailableMetrics,
    getParty,
    getCountyCandidates,
} from "../util.js";
import track from "../../lib/tracking";
import ResultsRowCounty from "../results-row-county";


const { percentDecimal, voteMargin } = formatters;

class ResultsTableCounty extends ElementBase {
    constructor() {
        super();
        this.state = {
            sortMetric: null,
            displayedMetric: null,
            collapsed: true,
            order: -1,
        };
        this.currentState = this.getAttribute('state');
        this.race = this.getAttribute('race-id');

        this.toggleCollapsed = this.toggleCollapsed.bind(this);
        this.updateSort = this.updateSort.bind(this);
    }

    static get observedAttributes() {
        return ['state', 'data', 'sort-order'];
    }

    async connectedCallback() {

        this.availableMetrics = getAvailableMetrics(this.state);
        this.state.sortMetric = this.availableMetrics.population;
        this.state.displayedMetric = this.availableMetrics.population;

        this.currentState = this.getAttribute('state');
        this.race = this.getAttribute('race-id');

        try {
            let url;
            if (this.race !== null) {
                url = `./data/counties/${this.currentState}-${this.race}.json`;
            } else {
                url = `./data/counties/${this.currentState}-0.json`;
            }


            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.data = data.results || [];
            this.initialCandidates = this.data[0].candidates.slice(0, 2);
            this.render();
            this.attachEventListeners();
        } catch (error) {
            console.error("Could not load JSON data:", error);
            //this.render(); // Render to show error state
        }
    }

    attachEventListeners() {
        this.querySelectorAll('[data-sort]').forEach(el => {
            el.onclick = () => this.updateSort(el.dataset.sort);
        });

        this.querySelectorAll('[data-sort-metric]').forEach(el => {
            el.onclick = () => this.updateSort(el.dataset.sortMetric, true);
        });

        const toggleButton = this.querySelector('.toggle-table');
        if (toggleButton) {
            toggleButton.onclick = this.toggleCollapsed;
        }
    }

    toggleCollapsed() {
        this.state.collapsed = !this.state.collapsed;
        this.render();
        this.attachEventListeners();
    }

    updateSort(metricName, opt_newMetric = false) {
        const sortMetric = this.availableMetrics[metricName];
        let order = sortMetric.alpha ? 1 : -1;
        if (sortMetric === this.state.sortMetric) {
            order = this.state.order * -1;
            track("county-sort", metricName);
        } else {
            track("county-metric", metricName);
        }
        this.state.sortMetric = sortMetric;
        this.state.order = order;
        if (opt_newMetric) {
            this.state.displayedMetric = this.availableMetrics[metricName];
        }
        this.render();
        this.attachEventListeners();
    }

    getIcon(metric) {
        const sorted = this.state.sortMetric.key === metric;
        return `
      <span>
        <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="10" height="16" viewBox="0 0 320 512">
          <path fill="${sorted && this.state.order < 0 ? '#999' : '#ddd'}" d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41z"></path>
          <path fill="${sorted && this.state.order > 0 ? '#999' : '#ddd'}" d="M279 224H41c-21.4 0-32.1-25.9-17-41L143 64c9.4-9.4 24.6-9.4 33.9 0l119 119c15.2 15.1 4.5 41-16.9 41z"></path>
        </svg>
      </span>
    `;
    }

    sortCountyResults() {
        const { sortMetric, order } = this.state;

        return this.data.sort((a, b) => {
            let sorterA = a.county[sortMetric.key];
            let sorterB = b.county[sortMetric.key];

            if (sortMetric.alpha) {
                return sorterA == sorterB ? 0 : sorterA < sorterB ? order : order * -1;
            } else if (sortMetric.key == "past_margin") {
                if (sorterA.party !== sorterB.party) {
                    return sorterA.party === 'Dem' ? -1 * order : 1 * order;
                }
                if (sorterA.party === 'Dem') {
                    return (sorterB.margin - sorterA.margin) * order; 
                } else {
                    return (sorterA.margin - sorterB.margin) * order; 
                }
            }
            return (sorterA - sorterB) * order;
        });
    }

    getSorter(currentState) {

        const townshipStates = ['CT', 'MA', 'ME', 'NH', 'RI', 'VT'];
        return `
      <ul class="sorter">
        <li class="label">Sort ${townshipStates.includes(currentState) ? 'Townships' : 'Counties'} By:</li>
        ${Object.keys(this.availableMetrics)
                .map(m => this.getSorterLi(this.availableMetrics[m]))
                .join('')}
      </ul>
    `;
    }

    getSorterLi(metric) {
        if (metric.hideFromToggle) {
            return '';
        }
        const selected = metric === this.state.displayedMetric ? "selected" : "";
        return `
      <li class="sortButton ${selected}" data-sort-metric="${metric.key}">
        <span class="metric">${metric.name}</span>
      </li>
    `;
    }

    mergeOthers(candidates, raceID, topCandidates) {
        // Only merged not top X candidates in state.
        var remaining = candidates.filter(c => !topCandidates.includes(c.last));
        var other = {
            first: "",
            last: "Other",
            party: "Other",
            id: `other-${raceID}`,
            percent: 0,
            mobilePercent: 0,
        };
        for (var c of remaining) {
            other.percent += c.percent || 0;
        }
        return other;
    }

    calculateVoteMargin(candidates) {
        var [a, b] = candidates;
        if (!a.votes) {
            return "-";
        } else if (a.votes === b.votes) {
            return "Tie";
        }
        var winnerMargin = a.percent - b.percent;
        return voteMargin({ party: getParty(a.party), margin: winnerMargin });
    }

    candidatePercentCell(candidate, leading, percentIn) {
        const displayPercent = percentDecimal(candidate.percent);
        const party = getParty(candidate.party);

        const allIn = percentIn >= 1;
        return `
          <td class="vote ${party}${leading ? " leading" : ""}${allIn ? " allin" : ""}" key="${candidate.id}">
           ${displayPercent}
          </td>
        `;
    }

    marginCell(candidates, leadingCand, topCands) {
        let voteMargin = "-";
        let party = getParty(candidates[0]?.party || "");
        if (candidates[0].votes === candidates[1].votes) {
            party = "";
        }

        if (topCands.includes(candidates[0].last)) {
            const calculatedMargin = this.calculateVoteMargin(candidates);
            voteMargin = calculatedMargin;
        }

        return `<td class="vote margin ${party}">${voteMargin}</td>`;
    }

    renderCountyRow(c, orderedCandidates) {
        const row = c;
        const metric = this.state.displayedMetric;

        const topCands = orderedCandidates.map(c => c.last);

        const candidates = orderedCandidates.map(header => {
            if (header.last == "Other") {
                return this.mergeOthers(row.candidates, header.id, topCands);
            }
            return header;
        });

        candidates.forEach(c => {
            if (c.party === 'Other' && c.percent === 0) {
              const sum = candidates
                .filter(c => c.party !== 'Other')
                .reduce((sum, c) => sum + (c.percent || 0), 0);
              
              if (sum > 0 && sum < 1) {
                c.percent = Math.max(0, 1 - sum);
              }
            }
        });

        let metricValue = row.county[metric.key];
        if (metric.format) {
            metricValue = metric.format(metricValue);
        }

        let leadingCand = row.eevp > 0 ? row.candidates[0] : "";
        if (row.candidates[0].votes === row.candidates[1].votes) {
            leadingCand = "";
        }
        const reportingPercent = reportingPercentage(row.eevp) + "% in";
        const candidateCells = candidates.map(c => 
            this.candidatePercentCell(
                c,
                c.party == leadingCand.party && c.last == leadingCand.last,
                row.eevp
            )
        ).join('');

        const marginCell = this.marginCell(row.candidates, leadingCand, topCands);
        const comparisonClass = metricValue.includes('D') ? 'Dem' : metricValue.includes('R') ? 'GOP' : '';

        return `
            <tr>
                <td class="county">
                    <span>${row.county.countyName.replace(/\s[a-z]/g, match =>
                    match.toUpperCase())}</span>
                    <span class="precincts mobile">${reportingPercent}</span>
                </td>
                <td class="precincts amt">${reportingPercent}</td>
                ${candidateCells}
                ${marginCell}
                <td class="comparison ${comparisonClass}">
                            ${!metricValue.includes('NaN') && metricValue != null ? metricValue : '-'}
                </td>
            </tr>
        `;
    }

    render() {
        const sortedData = this.sortCountyResults();
        const sortOrder = JSON.parse(this.getAttribute('sort-order') || '[]');

        const allCandidates = sortedData[0].candidates;

        // Sort candidates by EEVP and get top 3
        const orderedCandidates = this.initialCandidates
        .map(candidate => ({
            last: candidate.last,
            party: candidate.party,
            percent: candidate.percent
        }))
        .sort((a, b) => a.last.localeCompare(b.last));


        // Add "Other" if there are more than 3 candidates
        if (allCandidates.length > 2) {
            const otherEEVP = allCandidates
                .slice(3)
                .reduce((sum, candidate) => sum + candidate.percent, 0);

            orderedCandidates.push({ last: "Other", party: "Other", percent: otherEEVP });
        }

        const townshipStates = ['CT', 'MA', 'ME', 'NH', 'RI', 'VT'];

        this.innerHTML = `
        <div class="results-counties ${this.state.sortMetric.key.split("_").join("-")}">
            <h3 class="section-hed">Demographics by ${townshipStates.includes(this.currentState) ? 'township' : 'county'}</h3>
            ${this.getSorter(this.currentState)}
            <table class="results-table candidates-${orderedCandidates.length}">
                <thead>
                    <tr>
                        <th class="county sortable" data-sort="countyName">
                            <div>
                                <span class="county">${townshipStates.includes(this.currentState) ? 'Township' : 'County'}</span>
                            </div>
                        </th>
                        <th class="amt precincts" data-sort="countyName">
                            <div>${this.getIcon("countyName")}</div>
                        </th>
                        ${orderedCandidates.map(cand => `
                            <th class="vote" key="${cand.party}">
                                <div>
                                    <span class="title">${cand.last}</span>
                                </div>
                            </th>
                        `).join('')}
                        <th class="vote margin">
                            <div>
                                <span class="title">Vote margin</span>
                            </div>
                        </th>
                        <th class="comparison sortable" data-sort="${this.state.displayedMetric.key}">
                            <div>
                                <span class="title">${this.state.displayedMetric.name}</span>
                                ${this.getIcon(this.state.displayedMetric.key)}
                            </div>
                        </th>
                    </tr>
                </thead>
<tbody class="${this.state.collapsed ? "collapsed" : ""}">
                ${sortedData.map(county => {
            const countyOrderedCandidates = orderedCandidates.map(headerCand => {
                if (headerCand.last === "Other") {
                    if (county.censusID) {
                        const otherCandidate = county.candidates.find(c => c.last === 'Other' || c.party === 'Other');
                        return { ...headerCand, percent: otherCandidate?.percent || 0 };
                    } else {
                        // Original logic for non-census counties
                        const otherPercent = county.candidates
                            .filter(c => !orderedCandidates.find(h => h.last === c.last))
                            .reduce((sum, c) => sum + (c.percent || 0), 0);
                        return { ...headerCand, percent: otherPercent };
                    }
                }
                // Find matching candidate from this county
                const countyCand = county.candidates.find(c => 
                    c.last === headerCand.last || 
                    (headerCand.last === 'Other' && (c.last === 'Other' || c.party === 'Other'))
                ) || { ...headerCand, percent: 0 };
                
                return {
                    last: headerCand.last,
                    party: headerCand.party,
                    percent: countyCand.percent || 0
                };
            });
            return this.renderCountyRow(county, countyOrderedCandidates);
        }).join('')}
            </tbody>
            </table>
            <button
                class="toggle-table ${sortedData.length > 10 ? "" : "hidden"}"
                data-more="Show all"
                data-less="Show less">
                ${this.state.collapsed ? "Show all ▼" : "Show less ▲"}
            </button>
        </div>
        `;
    }
}

customElements.define("results-table-county", ResultsTableCounty);