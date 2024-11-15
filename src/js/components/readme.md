The 2024 election results are divided into pages, each with their own sub components. All of the components can be found in the <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components" target="_blank">src/js/components</a> folder.

# Presidential Results Page
<a href="https://github.com/nprapps/elections24-general/blob/main/src/index.html" target="_blank">src/index.html</a> 

## List of Components
- `<board-president>` - the container for everything</a>
- `<electoral-bars>` builds special 270-to-win balance of power bar for the page
- `<eader-board>` reads in the current president vote tallies and display them
- `national-map>` builds out the map that displays the state-level results 
- `cartogram-map>` builds out the cartogram map that display the state-level results 
- `<electoral-bubbles>` builds out the d3 bubbles that show the current vote margins for each state
- `<results-board-display>` loads up each individual race for an office (senate, house, president) and waits for a `<results-board>` component to finish populating before setting furniture 
  - `<results-board>` loads up each individual race for an office (senate, house, president) and builds a table 
- `<results-board-key>` adds in the key and sets appropriate key items via data attributes
How it works:
- Loads in `<board-president>` custom component
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/removeLoadingScreen.js" target="_blank">Loading screen code</a> runs and continually checks the page to see if a list of named components are present on the page and are non-null
- President board component calls `loadData()`, which fetches build/president.json data
- President board component then calls its `render()` function, which starts to build out its html 
- Once `render()` is called, all of the nested components inside of `<board-president>` activate. Those components then call their respective `loadData()` and `render()` functions

**Gopher**
- <a href="https://github.com/nprapps/elections24-general/blob/45-balance-of-power-bar/src/js/components/gopher.js" target="_blank">Gopher.js</a> another example of a file carried over from past election pages that helps keep the files up to date 
- If you expect your component to be changing views depending on the data, installing gopher is a requirement
- To use gopher, we call its `watch()` function, which watches for any changes to a given file. In the case of the elections, these files are usually the json files we collect and update regularly throughout the night
- Example usage: `gopher.watch("./data/some-data.json", this.loadData)`
- When page loads, it activates <a href="https://github.com/nprapps/elections24-general/blob/45-balance-of-power-bar/src/js/components/gopher.js" target="_blank">Gopher.js</a> and attaches a watcher (which should be pointing at /data/president.json) 
  - Example usage: `gopher.watch("./data/president.json", this.loadData)`

# Senate Results Page
<a href="https://github.com/nprapps/elections24-general/blob/main/src/senate.html" target="_blank">senate.html</a> 

## List of Components
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/board-senate" target="_blank">`<board-senate>`</a> - the container for everything
- `<balance-of-power-combined>` builds balance of power bar for the page once an office (senate, house, etc) is passed as a data attribute
- `<results-board-display>` - loads up each individual race for an office (senate, house, president) and waits for a `<results-board>` component to finish populating before setting furniture 
  - <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board" target="_blank">`<results-board>`</a> - loads up each individual race for an office (senate, house, president) and builds a table 
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-key" target="_blank">`<results-board-key>`</a> - adds in the key and sets appropriate key items via data attributes

## How it works
- Loads in `<board-senate>` custom component
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/removeLoadingScreen.js" target="_blank">Loading screen code</a> runs and continually checks the page to see if a list of named components are present on the page and are non-null
- When page loads, it activates <a href="https://github.com/nprapps/elections24-general/blob/45-balance-of-power-bar/src/js/components/gopher.js" target="_blank">Gopher.js</a> and attaches a watcher (which should be pointing at /data/senate.json) 
  - Example usage: `gopher.watch("./data/senate.json", this.loadData);`
- Senate board component calls `loadData()`, which fetches build/senate.json data
- Senate board component then calls its `render()` function, which starts to build out its html 
- Once `render()` is called, all of the nested components inside of <board-senate></board-senate> activate. Those components then call their respective `loadData()` and `render()` functions


# House Results Page
<a href="https://github.com/nprapps/elections24-general/blob/main/src/house.html" target="_blank">house.html</a> 

## List of Components
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/board-house" target="_blank">`<board-house>`</a> - the container for everything
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/electoral-bars" target="_blank">`<balance-of-power-combined>`</a> - builds balance of power bar for the page once an office (senate, house, etc) is passed as a data attribute
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-display" target="_blank">`<results-board-display>`</a> - loads up each individual race for an office (senate, house, president) and waits for a <results-board></results-board> component to finish populating before setting furniture 
  - <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board" target="_blank">`<results-board>`</a> - loads up each individual race for an office (senate, house, president) and builds a table 
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-key" target="_blank">`<results-board-key>`</a> - adds in the key and sets appropriate key items via data attributes

## How it works
- Loads in `<board-house>` custom component
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/removeLoadingScreen.js" target="_blank">Loading screen code</a> runs and continually checks the page to see if a list of named components are present on the page and are non-null
- When page loads, it activates <a href="https://github.com/nprapps/elections24-general/blob/45-balance-of-power-bar/src/js/components/gopher.js" target="_blank">Gopher.js</a> and attaches a watcher (which should be pointing at /data/house.json) 
  - Example usage: `gopher.watch("./data/house.json", this.loadData);`
- House board component calls `loadData()`, which fetches build/house.json data
- House board component then calls its `render()` function, which starts to build out its html 
- Once `render()` is called, all of the nested components inside of <board-house></board-house> activate. Those components then call their respective `loadData()` and `render()` functions

# Governors Results Page

## List of Components
<a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/board-house" target="_blank">`<board-governor>`</a> - the container for everything
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-display" target="_blank">`<results-board-display>`</a> - loads up each individual race for an office (senate, house, president) and waits for a `<results-board>` component to finish populating before setting furniture 
  - <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board" target="_blank">`<results-board>`</a> - loads up each individual race for an office (senate, house, president) and builds a table 
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-key" target="_blank">`<results-board-key>`</a> - adds in the key and sets appropriate key items via data attributes

## How it works:
- Loads in `<board-house>` custom component
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/removeLoadingScreen.js" target="_blank">Loading screen code</a> runs and continually checks the page to see if a list of named components are present on the page and are non-null
- When page loads, it activates <a href="https://github.com/nprapps/elections24-general/blob/45-balance-of-power-bar/src/js/components/gopher.js" target="_blank">Gopher.js</a> and attaches a watcher (which should be pointing at /data/gov.json) 
  - Example usage: `gopher.watch("./data/gov.json", this.loadData);`
- Governor board component calls `loadData()`, which fetches build/gov.json data
- Governor board component then calls its `render()`` function, which starts to build out its html 
- Once `render()` is called, all of the nested components inside of `<board-governor>` activate. Those components then call their respective `loadData()` and `render()` functions


# State results pages (and state-level embeds)

## The state page
- Template: <a href="https://github.com/nprapps/elections24-general/blob/main/src/_state.html" target="_blank">src/_state.html</a>
- In EJS, we figure out what “sections” this state page should have
  - Every page has Key races and President
  - Every page other than DC has House (sorry, DC)
  - Some states have Senate, Governor, and Ballot measures
- The `_statePageHeader` partial contains the headline, section navigation, intro text (if it exists in the Google doc) and links to resources (like voter guides) from local stations
  - Functionality for section navigation happens in `src/state.js`. Be mindful that this script runs on standalone state pages <i>and</i> on state page embeds.
  - Intro text was primarily used for swing states; it was also written for states that use ranked choice voting or award electoral votes by congressional district
- Page-level JS lives in `src/js/state.js`
  - We hide certain elements if this is an embed
  - The section nav is just showing and hiding `<section>`s. They're really all there on the same page.

## Components
- `<state-page-results>` loads data and contains the entire dynamic portion of the page
  - Various special cases are handled in this component, like Alaska and DC not having county-level results, and New England states having township-level results
- In `<state-page-results>`, we loop through the sections and render them 
  - Each section has a `<results-collection>` or a `<tabbed-results-collection>`
  - `<tabbed-results-collection>` is used in the President section of the <a href="https://apps.npr.org/2024-election-results/maine.html?section=P" target="_blank">Maine</a> and <a href="https://apps.npr.org/2024-election-results/nebraska.html?section=P" target="_blank">Nebraska</a> pages to show district-level results. In theory this component could be used in other places, like in an embed?! to show a series of results tables
- The `<results-collection>` loads a series of `<results-table>`s
- TODO: add county/township-level components here

## How data is passed through components
- `<state-page-results>` loads a state-level data file from the `data/states/` directory
  - If not all results have not been certified, then Gopher watches for updates
- In each section, state-level data is filtered, stringified and passed into a `<results-collection>` (or `<tabbed-results-collection>`) through the `races` attribute
- In `<results-collection>`, we grab the data from the attribute, parse it and attach it to `this`. Then we remove the attribute, so that the user can't see a bunch of JSON in the HTML.
- Also in `<results-collection>`, we loop through the results and render a `<results-table>` for each race.
- In `<results-table>`, a similar thing happens again, where we remove the attribute that holds the data.
  - The `<results-table>` component makes liberal use of the `illuminate` function — so that only the parts that really need to be updated live get updated live. Not sure if custom components will be used in future election rigs, but if they are, this would be cool to do this in more components!

# Customizer pages
<a href="https://github.com/nprapps/elections24-general/blob/main/src/_state.html" target="_blank">HTML template link</a> | <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/components/state-page-results/index.js" target="_blank">Shared javascript link</a> 

## List of Components: 
- WIP

## How it works
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/customizer.html" target="_blank">Customizer.html</a> has a list of all the components, including nested components to allow for more customization 
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/customizer.js" target="_blank">Customizer.js</a> fetches each of the components and <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/customizer.js#L333-L373" target="_blank">attaches event handlers</a> that show and hide the <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/customizer.js#L274C1-L315C3" target="_blank">sub-options</a>


