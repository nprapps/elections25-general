const ElementBase = require("../elementBase");
const { classify } = require("../util");

class TabbedResultsCollection extends ElementBase {
  constructor() {
    super();
    this.races = JSON.parse(this.getAttribute("races"));
  }

  connectedCallback() {
	  this.render();
	}

	render() {
	  this.removeAttribute("races");

	  let template = `
	  	<h3 class="section-hed dotted-line">
        <span>President</span>
      </h3>
    `

	  let tabsHTML = "<form id='race-selector'>";
	  this.races.forEach((race, i) => {
	  	let labelText = race.seat ? race.seat : "Statewide";
	  	let tab = `
		  	<input type="radio" name="district" id="option-${race.id}" value="table-${race.id}"${i === 0 ? " checked" : ""}>
		  	<label for="option-${race.id}">${labelText}</label>
	  	`

	  	tabsHTML += tab;
	  });
	  tabsHTML += "</form>";
    template += tabsHTML;

	  this.races.forEach((race, i) => {
	    let table = `
	    	<div id="table-${race.id}" class="table${i === 0 ? ' shown' : ''}">
	    		<p class="section-info">
	    			${race.electoral} ${race.seat ? "district" : "at-large"} electoral vote${race.electoral > 1 ? "s" : ""}
	    		</p>
		      <results-table 
		        state="${this.getAttribute("state")}" 
		        result='${JSON.stringify(race).replace(/'/g, "&#39;")}'>
		      </results-table>
	      </div>
	    `
	    template += table;
	  });

	  this.innerHTML = template;

	  this.querySelector("form").addEventListener("change", e => {
	  	this.querySelectorAll(".table").forEach(table => {
	  		table.classList.remove("shown");
	  	})
	  	this.querySelector("#" + e.target.value).classList.add("shown");
	  })
	}
}

customElements.define("tabbed-results-collection", TabbedResultsCollection);