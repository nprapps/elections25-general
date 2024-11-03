var ElementBase = require("../elementBase");
import gopher from "../gopher.js";

class ResultsBoardKey extends ElementBase {
    constructor() {
      super();
      this.race = '';
      this.simple = this.hasAttribute('simple'); // for the small key above the presidential national maps
      this.full = !this.simple; // for the larger key under the boards
    }
  
    static get observedAttributes() {
      return ['race', 'simple'];
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        switch (name) {
          case 'race':
            this.race = newValue;
            break;
          case 'simple':
            this.simple = newValue === 'true';
            break;
        }
        this.render();
      }
    }
  
    connectedCallback() {
      this.render();
    }

    render() {
      this.hasParties = this.race !== "ballot";
      this.hasFlip = this.race === "senate" || this.race === "president"; // suppress flips in house '22 race b/c redistricting
      this.hasPickup = this.race === "senate"; // suppress flips in house '22 race b/c redistricting
      this.hasIncumbent = this.race === "house" || this.race === "senate" || this.race === "gov";
      this.hasRCV = this.race !== "ballot";
      this.hasEEVP = true;

      let stateNavHTML = `
        <hr class="divider" />
      `

      this.innerHTML = `
        ${this.full ? stateNavHTML : ""}

        <div class="board-key">
          <ul>
            ${this.hasParties ? `
              <li class="dem">${this.full ? "Democrat" : "Harris"} / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
              <li class="gop">${this.full ? "Republican" : "Trump"} / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
              ${this.full ? '<li class="ind">Independent / <span class="leading">Leading</span> <span class="winner">Winner</span></li>' : ''}
            ` : ''}
            ${this.full && !this.hasParties ? `
              <li class="yes">Yes / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
              <li class="no">No / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
            ` : ''}
            ${this.full ? `<li class="eevp"><span class="perc">76% in</span> ${this.hasEEVP ? '<span>Estimated share of votes counted</span>' : "Precincts reporting"}</li>` : ''}
            ${this.full && this.hasIncumbent ? '<li class="incumbent">● Incumbent</li>' : ''}
            ${this.full && this.hasFlip ? `<li class="pickup"><span>FLIP</span> ${this.hasPickup ? "Seat pickup" : "Change in winning party"} (party color)</li>` : ''}
            ${this.full && this.hasParties ? '<li class="runoff"><span>R.O.</span> Going to a runoff election</li>' : ''}
            ${this.full ? '<li class="rcv"><span>RCV</span> Going to ranked choice vote tabulation</li>' : ''}
          </ul>
        </div>
      `;
    }
  }
  
  customElements.define('results-board-key', ResultsBoardKey);