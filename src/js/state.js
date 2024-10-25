import './nav.js';

require("./components/results-collection");
require("./components/results-table");
require("./components/county-map")
require("./components/county-dataviz")
require("./components/county-map")
require("./components/results-table-county")

let section = document.querySelector('input[name="nav"]:checked').value;

let nav = document.querySelector("form");

nav.addEventListener("change", e => {
	const selectedSection = document.querySelector("#" + e.target.value + "-section");
	document.querySelectorAll("section").forEach(section => {
		section.classList.remove("shown");
	});
	selectedSection.classList.add("shown");
})

document.querySelector("#close-disclaimer").addEventListener("click", () => {
	document.querySelector("#about-box").classList.add("closed");
})