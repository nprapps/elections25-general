var ElementBase = require("../elementBase");

import gopher from "../gopher.js";
import { getBucket, sumElectoral, groupCalled } from "../util.js";


class ElectoralBars extends ElementBase {
    constructor() {
        super();
        console.log('electoral bars is running')
        this.called = this.getAttribute('called');
    }

    connectedCallback() {
        this.render();
    }
  
    render() {
        console.log(this.called)
        console.log(JSON.parse(this.called || '{}'))

        const called = JSON.parse(this.called || '{}');
        const sumElectoral = party => Object.values(called[party] || {}).reduce((sum, value) => sum + value, 0);
        const dWidth = sumElectoral('Dem') / 538 * 100;
        const rWidth = sumElectoral('GOP') / 538 * 100;

        this.innerHTML = `
            <div class="electoral-bars" aria-hidden="true">
                <div class="bar Dem" style="width: ${dWidth}%"></div>
                <div class="bar GOP" style="width: ${rWidth}%"></div>
                <hr class="victory">
                    <span class="label">270 to win</span>
                </hr>
            </div>
        `;
    }

  };

customElements.define('electoral-bars', ElectoralBars);