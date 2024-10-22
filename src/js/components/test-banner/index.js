var ElementBase = require("../elementBase");

class TestBanner extends ElementBase {
	constructor() {
		super();
	}

	connectedCallback() {
		this.innerHTML = `
			<div class="test-banner">TEST</div>
		`
	}
}

customElements.define("test-banner", TestBanner);