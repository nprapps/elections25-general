var ElementBase = require("../elementBase");
import { percentDecimal, reportingPercentage, getParty, voteMargin } from "../util.js";

class ResultsRowCounty extends ElementBase {
    constructor() {
        super();
    }

    connectedCallback() {
        this.render();
    }

    static get observedAttributes() {
        return ['ordered-candidates', 'row', 'metric'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.render();
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
        }
        var winnerMargin = a.percent - b.percent;
        return voteMargin({ party: getParty(a.party), margin: winnerMargin });
    }

    render() {
        const orderedCandidates = JSON.parse(this.getAttribute('ordered-candidates') || '[]');
        const row = JSON.parse(this.getAttribute('row') || '{}');
        const metric = JSON.parse(this.getAttribute('metric') || '{}');
    
        const topCands = orderedCandidates.map(c => c.last);
        const candidates = orderedCandidates.map(header => {
            if (header.last == "Other") {
                return this.mergeOthers(row.candidates, header.id, topCands);
            }
            const [match] = row.candidates.filter(c => header.id == c.id);
            return match || "";
        });
    
        let metricValue = row.county[metric.key];
        if (metric.format) {
            metricValue = metric.format(metricValue);
        }
    
        const leadingCand = row.reportingPercent > 0 ? row.candidates[0] : "";
        const reportingPercent = reportingPercentage(row.reportingPercent) + "% in";
    
        const candidateCells = candidates.map(c =>
            this.candidatePercentCell(
                c,
                c.party == leadingCand.party && c.last == leadingCand.last,
                row.reportingPercent
            )
        ).join('');
    
        const marginCell = this.marginCell(row.candidates, leadingCand, topCands);
    
        this.innerHTML = `
            <td class="county">
                <span>${row.county.countyName.replace(/\s[a-z]/g, match =>
                    match.toUpperCase())}</span>
                <span class="precincts mobile">${reportingPercent}</span>
            </td>
            <td class="precincts amt">${reportingPercent}</td>
            ${candidateCells}
            ${marginCell}
            <td class="comparison">${metricValue}</td>
        `;
    }
    
    candidatePercentCell(candidate, leading, percentIn) {
        const displayPercent = percentDecimal(candidate.percent);
        const party = getParty(candidate.party);
        const allIn = percentIn >= 1;
        return `
            <td class="vote ${party} ${leading ? "leading" : ""} ${allIn ? "allin" : ""}" key="${candidate.id}">
                ${displayPercent}
            </td>
        `;
    }
    
    marginCell(candidates, leadingCand, topCands) {
        let party = "";
        let voteMargin = "-";
        if (topCands.includes(candidates[0].last)) {
            voteMargin = this.calculateVoteMargin(candidates);
            if (leadingCand) {
                party = getParty(leadingCand.party);
            }
        }
    
        return `<td class="vote margin ${party}">${voteMargin}</td>`;
    }
}

customElements.define("results-row-county", ResultsRowCounty);