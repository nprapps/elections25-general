var ElementBase = require("../elementBase");
import gopher from "../gopher.js";

class ResultsBoardKey extends ElementBase {
    constructor() {
      super();
      this.race = '';
      this.simple = this.hasAttribute('simple');
      this.full = !this.simple;
      this.hasParties = this.race !== "ballot";
      this.hasPickup = this.race === "senate"; // suppress flips in house '22 race b/c redistricting
      this.hasIncumbent = this.race === "house" || this.race === "senate" || this.race === "gov";
      this.hasEEVP = true;
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
  
      // McMullin logic (you may need to adjust this based on your data structure)
      let mcmullinWon = false;
      if (this.data) {
        const results = this.data;
        results.forEach(function(r) {
          if (r.hasOwnProperty('called') && r.called === true) {
            if (r.id === '46329' && r.winnerParty === 'Ind') {
              mcmullinWon = true;
            }
          }
        });
      }
  
      this.innerHTML = `
        <div class="board-key">
          ${this.full ? '<h3>Key</h3>' : ''}
          <ul>
            ${this.hasParties ? `
              <li class="dem">${this.full ? "Democrat" : "Harris"} / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
              <li class="gop">${this.full ? "Republican" : "Trump"} / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
              ${this.full ? '<li class="ind">Independent / <span class="leading">Leading</span> <span class="winner">Winner</span></li>' : ''}
            ` : ''}
            ${this.hasPickup ? `<li class="pickup"><span>FLIP</span> ${this.hasPickup ? "Seat pickup" : "Change in winning party"} (party color)</li>` : ''}
            ${this.full && this.hasParties ? '<li class="runoff"><span>R.O.</span> Going to a runoff election</li>' : ''}
            ${this.full && !this.hasParties ? `
              <li class="yes">Yes / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
              <li class="no">No / <span class="leading">Leading</span> <span class="winner">Winner</span></li>
            ` : ''}
            ${this.full ? `<li class="eevp"><span class="perc">76% in</span> ${this.hasEEVP ? '<span>Estimated share of votes counted*</span>' : "Precincts reporting"}</li>` : ''}
            ${this.full && this.hasIncumbent ? '<li class="incumbent">● Incumbent</li>' : ''}
            <li class="runoff"><span>RCV</span> Headed to ranked choice vote tabulation</li>
          </ul>
          ${mcmullinWon ? `
            <div id="mcmullin_note">
              <span style="color:#15b16e; font-family: Helvetica, Arial, sans-serif; font-weight: normal; font-weight: 400; font-size: 20px; font-weight: bold;">*</span>
              <span id="mcmullin_text" style="font-style:italic;">In the Senate, Bernie Sanders (I-VT) and Angus King (I-ME) caucus with Democrats. The bar chart does not include newly-elected Evan McMullin (I-UT), who has said he will not caucus with either party.</span>
            </div>
          ` : ''}
        </div>
      `;
    }
  }
  
  customElements.define('results-board-key', ResultsBoardKey);