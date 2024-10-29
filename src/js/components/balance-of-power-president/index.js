import ElementBase from "../elementBase";
import gopher from "../gopher.js";

class BalanceOfPowerPresident extends ElementBase {
    constructor() {
        super();
        this.loadData = this.loadData.bind(this);
      }
    
      connectedCallback() {
        this.loadData();
        this.illuminate();
        gopher.watch(`./data/bop.json`, this.loadData);
      }
    
      disconnectedCallback() {
        gopher.unwatch(`./data/bop.json`, this.loadData);
      }
    
      async loadData() {
        try {
          const response = await fetch('./data/bop.json');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          this.data = await response.json();
          console.log(this.data)
          this.render();
        } catch (error) {
          console.error("Could not load JSON data:", error);
        }
      }
    
      render() {
        if (!this.data) return;
    
        var results = this.data.president;
        
        var president = {
          Dem: { total: 0 },
          GOP: { total: 0 },
          Other: { total: 0 }
        };
    
        // Process results
        results.forEach(function(r) {
          if (r.hasOwnProperty('winner')) {
            president[r.winner].total += r.electoral;
          }
        });
    
        const winnerIcon = `<span class="winner-icon" role="img" aria-label="check mark">
          <svg aria-hidden="true" focusable="false" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path fill="#333" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
          </svg>
        </span>`;
    
        this.innerHTML = `
          <div id="embed-bop-on-page">
            <a class="link-container president" href="https://apps.npr.org/elections20-interactive/#/president" target="_blank">
              <div class="number-container">
                <div class="candidate dem">
                  <div class="name">Harris ${president.Dem.total >= 270 ? winnerIcon : ""}</div>
                  <div class="votes">${president.Dem.total}</div>
                </div>
                ${president.Other.total ? `
                  <div class="candidate other">
                    <div class="name">Other ${president.Other.total >= 270 ? winnerIcon : ""}</div>
                    <div class="votes">${president.Other.total}</div>
                  </div>
                ` : ""}
                ${538 - president.Dem.total - president.GOP.total - president.Other.total > 0 ? `
                  <div class="candidate uncalled">
                    <div class="name">Not yet called</div>
                    <div class="votes">${538 - president.Dem.total - president.GOP.total - president.Other.total}</div>
                  </div>
                ` : ''}
                <div class="candidate gop">
                  <div class="name">Trump ${president.GOP.total >= 270 ? winnerIcon : ""}</div>
                  <div class="votes">${president.GOP.total}</div>
                </div>
              </div>
    
              <div class="bar-container">
                <div class="bar dem" style="width: ${(president.Dem.total / 538 * 100)}%"></div>
                <div class="bar other" style="width: ${president.Other.total ? (president.Other.total / 538 * 100) : 0}%; ${president.Other.total === 0 ? 'display: none;' : ''}"></div>
                <div class="bar gop" style="width: ${(president.GOP.total / 538 * 100)}%"></div>
                <div class="middle"></div>
              </div>
    
              <div class="chatter"><strong>270</strong> electoral votes to win</div>
            </a>
          </div>
        `;
      }
}

customElements.define("balance-of-power-president", BalanceOfPowerPresident);

export default BalanceOfPowerPresident;