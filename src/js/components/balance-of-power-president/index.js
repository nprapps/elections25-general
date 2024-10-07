import ElementBase from "../elementBase";
import gopher from "../gopher.js";

class BalanceOfPowerImproved extends ElementBase {
    constructor() {
        super();
        this.loadData = this.loadData.bind(this);
        this.race = this.getAttribute('race');
    }

    connectedCallback() {
        this.loadData();
        this.illuminate();
        gopher.watch(`./data/${this.race}.json`, this.loadData);
    }

    disconnectedCallback() {
        gopher.unwatch(`./data/${this.race}.json`, this.loadData);
    }

    async loadData() {
        try {
            const response = await fetch(`./data/${this.race}.json`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            this.render();
        } catch (error) {
            console.error("Could not load JSON data:", error);
        }
    }

    render() {
        if (!this.data) return;

        const results = this.data.results;
        const isSenate = this.race === 'senate';
        const totalSeats = isSenate ? 100 : 435;
        const majorityThreshold = isSenate ? 51 : 218;

        const inactiveRaces = isSenate ? {
            GOP: 29,
            Dem: 34,
            Other: 2
        } : {
            GOP: 0,
            Dem: 0,
            Other: 0
        };

        let chamber = {
            Dem: { total: inactiveRaces.Dem, gains: 0 },
            GOP: { total: inactiveRaces.GOP, gains: 0 },
            Ind: { total: inactiveRaces.Other, gains: 0 },
            Other: { total: 0, gains: 0 },
            Con: { total: 0, gains: 0 },
            Lib: { total: 0, gains: 0 }
        };

        let mcmullinWon = false;

        results.forEach(function (r) {
            if (r.hasOwnProperty('called') && r.called == true) {
                if (isSenate && r.id == '46329' && r.winnerParty == 'Ind') {
                    mcmullinWon = true;
                }

                const winnerParty = r.winnerParty;
                const previousParty = r.previousParty;

                if (!chamber[winnerParty]) {
                    chamber[winnerParty] = { total: 0, gains: 0 };
                }
                if (!chamber[previousParty]) {
                    chamber[previousParty] = { total: 0, gains: 0 };
                }

                chamber[winnerParty].total += 1;
                if (winnerParty != previousParty) {
                    chamber[winnerParty].gains += 1;
                    chamber[previousParty].gains -= 1;
                }
            }
        });

        chamber.Ind.width = chamber.Ind.total;
        if (isSenate && mcmullinWon) {
            chamber.Ind.width = chamber.Ind.total - 1;
        }

        chamber.netGainParty = "none";
        const [topChamber] = Object.keys(chamber)
            .map(k => ({ party: k, gains: chamber[k].gains }))
            .sort((a, b) => b.gains - a.gains);

        if (topChamber.gains > 0) {
            chamber.netGainParty = topChamber.party;
            chamber.netGain = topChamber.gains;
        }

        const winnerIcon = `<span class="winner-icon" role="img" aria-label="check mark"></span>`;

        this.innerHTML = `
            <div id="embed-bop-on-page">
                <a class="link-container ${this.race}" href="http://apps.npr.org/election-results-live-2022/#/${this.race}" target="_top">
                    <div class="number-container">
                        <div class="candidate dem">
                            <div class="name">Dem. ${chamber.Dem.total >= majorityThreshold ? winnerIcon : ""}</div>
                            <div class="votes">${chamber.Dem.total}</div>
                        </div>
                        ${chamber.Ind.total ?
                            `<div class="candidate other">
                                <div class="name">Ind. ${chamber.Ind.total >= majorityThreshold ? winnerIcon : ""}</div>
                                <div class="votes">${chamber.Ind.total}${isSenate && mcmullinWon ? "*" : ""}</div>
                            </div>`
                        : ""}
                        ${totalSeats - chamber.Dem.total - chamber.GOP.total - chamber.Ind.width > 0 ?
                            `<div class="candidate uncalled">
                                <div class="name">Not yet called</div>
                                <div class="votes">${totalSeats - chamber.Dem.total - chamber.GOP.total - chamber.Ind.total}</div>
                            </div>`
                        : ""}
                        <div class="candidate gop">
                            <div class="name">GOP ${chamber.GOP.total >= majorityThreshold ? winnerIcon : ""}</div>
                            <div class="votes">${chamber.GOP.total}</div>
                        </div>
                    </div>

                    <div class="bar-container">
                        <div class="bar dem" style="width: ${(chamber.Dem.total / totalSeats * 100)}%"></div>
                        <div class="bar other" style="width: ${(chamber.Ind.width / totalSeats * 100)}%"></div>
                        <div class="bar gop" style="width: ${(chamber.GOP.total / totalSeats * 100)}%"></div>
                        <div class="middle"></div>
                    </div>

                    <div class="chatter"><strong>${majorityThreshold}</strong> seats for majority</div>

                    <div class="net-gain-container">
                        <div class="net-gain ${chamber.netGainParty}">${chamber.netGainParty != "none"
                            ? `${chamber.netGainParty} +${chamber.netGain}`
                            : "No change"}</div>
                    </div>
                </a>
            </div>
        `;
    }
}

customElements.define("balance-of-power-improved", BalanceOfPowerImproved);

export default BalanceOfPowerImproved;