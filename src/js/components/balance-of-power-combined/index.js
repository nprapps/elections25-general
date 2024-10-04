var ElementBase = require("../elementBase");
import gopher from "../gopher.js";
import BalanceOfPowerSenate from "../balance-of-power-senate";
import BalanceOfPowerHouse from "../balance-of-power-house";


class BalanceOfPowerCombined extends ElementBase {
    constructor() {
        super();
        this.loadData = this.loadData.bind(this);
        this.senate = null;
        this.house = null;
        this.races = [];
    }

    connectedCallback() {
        this.loadData();
        this.illuminate();
        console.log('bop has changed');
        gopher.watch(`./data/bop.json`, this.loadData);

        // Parse the race attribute
        const raceAttr = this.getAttribute('race');
        if (raceAttr) {
            this.races = raceAttr.toLowerCase().split(' ');
        }
    }

    disconnectedCallback() {
        console.log('BalanceOfPower removed from the DOM');
        gopher.unwatch(`./data/bop.json`, this.loadData);
    }

    async loadData() {
        try {
            const response = await fetch('./data/bop.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();

            this.senate = this.data.senate;
            this.house = this.data.house;
            this.render();
        } catch (error) {
            console.error("Could not load JSON data:", error);
        }
    }

    render() {
        if (!this.senate || !this.house) return;

        let content = '<main class="embed-bop"><div class="balance-of-power-combined">';

        if (this.races.length === 0 || this.races.includes('senate')) {
            content += `
                <balance-of-power-senate></balance-of-power-senate>
            `;
        }

        if (this.races.length === 0 || this.races.includes('house')) {
            content += `
                <balance-of-power-house></balance-of-power-house>
            `;
        }

        content += '</div></main>';

        this.innerHTML = content;
    }
}

customElements.define('balance-of-power-combined', BalanceOfPowerCombined);
export default BalanceOfPowerCombined;