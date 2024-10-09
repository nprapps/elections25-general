var ElementBase = require("../elementBase");

import gopher from "../gopher.js";
import { sumElectoral } from "../util.js";

var winnerIcon = `<span class="winner-icon" role="img" aria-label="check mark">
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512">
      <path
        fill="#333"
        d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
    </svg>
  </span>`;

class Leaderboard extends ElementBase {
    constructor() {
        super();
        this.called = this.getAttribute('called');
    }

    static get observedAttributes() {
        return ['called'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'called') {
            this.called = newValue;
            this.render();
        }
    }

    connectedCallback() {
        this.render();
    }
    
    render() {
        console.log(this.called);
        const called = JSON.parse(this.called || '{}');
        const sumElectoral = party => Object.values(called[party] || {}).reduce((sum, value) => sum + value, 0);

        const demSum = sumElectoral('Dem');
        const gopSum = sumElectoral('GOP');
        const uncalledSum = sumElectoral('Not Called');
        const otherSum = sumElectoral('Other');

        this.innerHTML = `
            <ul class="electoral-leaderboard">
                <li class="party dem">
                    <label>Biden ${demSum >= 270 ? winnerIcon : ""}</label>
                    ${demSum}
                </li>

                ${uncalledSum ? `
                    <li class="party not-called">
                        <label>Not Yet Called</label>
                        ${uncalledSum}
                    </li>
                ` : ''}

                <li class="party gop">
                    <label>Trump ${gopSum >= 270 ? winnerIcon : ""}</label>
                    ${gopSum}
                </li>

                ${otherSum ? `
                    <li class="party other">
                        <label>Other ${otherSum >= 270 ? winnerIcon : ""}</label>
                        ${otherSum}
                    </li>
                ` : ''}
            </ul>
        `;
    }
}

customElements.define('leader-board', Leaderboard);