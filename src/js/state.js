require("./components/results-collection");
require("./components/results-table");

let section = document.querySelector('input[name="nav"]:checked').value;

let nav = document.querySelector("form");

nav.addEventListener("change", e => {
	const selectedSection = document.querySelector("#" + e.target.value + "-section");
	document.querySelectorAll("section").forEach(section => {
		section.classList.remove("shown");
	});
	selectedSection.classList.add("shown");
})