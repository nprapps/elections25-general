The 2024 election results are divided into pages, each with their own sub components. All of the components can be found in the <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components" target="_blank">src/js/components</a> folder in the github project

CSS | Embeds 

—-----—-----—-----—-----—-----—-----—-----
Presidential Results Page
Link: <a href="https://github.com/nprapps/elections24-general/blob/main/src/index.html" target="_blank">https://github.com/nprapps/elections24-general/blob/main/src/index.html</a> 
List of Components: 
<a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/board-president" target="_blank"><board-president></board-president></a> - the container for everything
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/electoral-bars" target="_blank"><electoral-bars></electoral-bars></a> -  builds special 270-to-win balance of power bar for the page
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/leader-board" target="_blank"><leader-board></leader-board></a> - reads in the current president vote tallies and display them
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/nationalMap" target="_blank"><national-map></national-map></a> - builds out the map that displays the state-level results 
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/cartogram" target="_blank"><cartogram-map></cartogram-map></a> - builds out the cartogram map that display the state-level results 
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/electoralBubbles" target="_blank"><electoral-bubbles></electoral-bubbles></a> - builds out the d3 bubbles that show the current vote margins for each state
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-display" target="_blank"><results-board-display></results-board-display></a> - loads up each individual race for an office (senate, house, president) and waits for a <results-board></results-board> component to finish populating before setting furniture 
  - <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board" target="_blank"><results-board></results-board></a> - loads up each individual race for an office (senate, house, president) and builds a table 
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-key" target="_blank"><results-board-key></results-board-key></a> - adds in the key and sets appropriate key items via data attributes
How it works:
- Loads in <board-president></board-president> custom component
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/removeLoadingScreen.js" target="_blank">Loading screen code</a> runs and continually checks the page to see if a list of named components are present on the page and are non-null
- President board component calls loadData(), which fetches build/president.json data
- President board component then calls its render() function, which starts to build out its html 
- Once render() is called, all of the nested components inside of <board-president></board-president> activate. Those components then call their respective loadData() and render() functions
Gopher
- <a href="https://github.com/nprapps/elections24-general/blob/45-balance-of-power-bar/src/js/components/gopher.js" target="_blank">Gopher.js</a> another example of a file carried over from past election pages that helps keep the files up to date 
- If you expect your component to be changing views depending on the data, installing gopher is a requirement
- To use gopher, we call its watch() function, which watches for any changes to a given file. In the case of the elections, these files are usually the json files we collect and update regularly throughout the night
- Example usage: gopher.watch("./data/some-data.json", this.loadData);
- When page loads, it activates <a href="https://github.com/nprapps/elections24-general/blob/45-balance-of-power-bar/src/js/components/gopher.js" target="_blank">Gopher.js</a> and attaches a watcher (which should be pointing at /data/president.json) 
  - Example usage: gopher.watch("./data/president.json", this.loadData);

—-----—-----—-----—-----—-----—-----—----
Senate Results Page
Link: <a href="https://github.com/nprapps/elections24-general/blob/main/src/senate.html" target="_blank">https://github.com/nprapps/elections24-general/blob/main/src/senate.html</a> 
List of Components: 
<a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/board-senate" target="_blank"><board-senate></board-senate></a> - the container for everything
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/electoral-bars" target="_blank"><balance-of-power-combined></balance-of-power-combined></a> -  builds balance of power bar for the page once an office (senate, house, etc) is passed as a data attribute
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-display" target="_blank"><results-board-display></results-board-display></a> - loads up each individual race for an office (senate, house, president) and waits for a <results-board></results-board> component to finish populating before setting furniture 
  - <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board" target="_blank"><results-board></results-board></a> - loads up each individual race for an office (senate, house, president) and builds a table 
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-key" target="_blank"><results-board-key></results-board-key></a> - adds in the key and sets appropriate key items via data attributes
How it works:
- Loads in <board-senate></board-senate> custom component
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/removeLoadingScreen.js" target="_blank">Loading screen code</a> runs and continually checks the page to see if a list of named components are present on the page and are non-null
- When page loads, it activates <a href="https://github.com/nprapps/elections24-general/blob/45-balance-of-power-bar/src/js/components/gopher.js" target="_blank">Gopher.js</a> and attaches a watcher (which should be pointing at /data/senate.json) 
  - Example usage: gopher.watch("./data/senate.json", this.loadData);
- Senate board component calls loadData(), which fetches build/senate.json data
- Senate board component then calls its render() function, which starts to build out its html 
- Once render() is called, all of the nested components inside of <board-senate></board-senate> activate. Those components then call their respective loadData() and render() functions


—-----—-----—-----—-----—-----—-----—-----
House Results Page
Link: <a href="https://github.com/nprapps/elections24-general/blob/main/src/house.html" target="_blank">https://github.com/nprapps/elections24-general/blob/main/src/house.html</a> 
List of Components: 
<a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/board-house" target="_blank"><board-house></board-house></a> - the container for everything
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/electoral-bars" target="_blank"><balance-of-power-combined></balance-of-power-combined></a> -  builds balance of power bar for the page once an office (senate, house, etc) is passed as a data attribute
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-display" target="_blank"><results-board-display></results-board-display></a> - loads up each individual race for an office (senate, house, president) and waits for a <results-board></results-board> component to finish populating before setting furniture 
  - <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board" target="_blank"><results-board></results-board></a> - loads up each individual race for an office (senate, house, president) and builds a table 
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-key" target="_blank"><results-board-key></results-board-key></a> - adds in the key and sets appropriate key items via data attributes
How it works:
- Loads in <board-house></board-house> custom component
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/removeLoadingScreen.js" target="_blank">Loading screen code</a> runs and continually checks the page to see if a list of named components are present on the page and are non-null
- When page loads, it activates <a href="https://github.com/nprapps/elections24-general/blob/45-balance-of-power-bar/src/js/components/gopher.js" target="_blank">Gopher.js</a> and attaches a watcher (which should be pointing at /data/house.json) 
  - Example usage: gopher.watch("./data/house.json", this.loadData);
- House board component calls loadData(), which fetches build/house.json data
- House board component then calls its render() function, which starts to build out its html 
- Once render() is called, all of the nested components inside of <board-house></board-house> activate. Those components then call their respective loadData() and render() functions

—-----—-----—-----—-----—-----—-----—-----
Governors Results Page
List of Components: 
<a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/board-house" target="_blank"><board-governor></board-governor></a> - the container for everything
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-display" target="_blank"><results-board-display></results-board-display></a> - loads up each individual race for an office (senate, house, president) and waits for a <results-board></results-board> component to finish populating before setting furniture 
  - <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board" target="_blank"><results-board></results-board></a> - loads up each individual race for an office (senate, house, president) and builds a table 
- <a href="https://github.com/nprapps/elections24-general/tree/main/src/js/components/results-board-key" target="_blank"><results-board-key></results-board-key></a> - adds in the key and sets appropriate key items via data attributes
How it works:
- Loads in <board-house></board-house> custom component
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/removeLoadingScreen.js" target="_blank">Loading screen code</a> runs and continually checks the page to see if a list of named components are present on the page and are non-null
- When page loads, it activates <a href="https://github.com/nprapps/elections24-general/blob/45-balance-of-power-bar/src/js/components/gopher.js" target="_blank">Gopher.js</a> and attaches a watcher (which should be pointing at /data/gov.json) 
  - Example usage: gopher.watch("./data/gov.json", this.loadData);
- Governor board component calls loadData(), which fetches build/gov.json data
- Governor board component then calls its render() function, which starts to build out its html 
- Once render() is called, all of the nested components inside of <board-governor></board-governor> activate. Those components then call their respective loadData() and render() functions


—-----—-----—-----—-----—-----—-----—-----
# State Results Pages

<a href="https://github.com/nprapps/elections24-general/blob/main/src/_state.html" target="_blank">HTML template link</a> | <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/components/state-page-results/index.js" target="_blank">Shared javascript link</a> 

## On the state page template (src/_state.html)
- In EJS, we figure out what “sections” this state page should have
  - Every page has Key races and President
  - Every page other than DC has House (sorry, DC)
  - Some states have Senate, Governor, and Ballot measures
- The _statePageHeader partial contains the headline, section navigation, intro text (if it exists in the Google doc) and links to resources (like voter guides) from local stations
  - Functionality for section navigation happens in src/state.js. Be mindful that this script runs on standalone state pages <i>and</i> state page embeds.
  - Intro text was primarily used for swing states; it was also written for states that use ranked choice voting or award electoral votes by congressional district

## Components: 
- `<state-page-results>`
  - Loads/watches data and contains the entire dynamic portion of the page
- Each section has a `<results-collection>` or `<tabbed-results-collection>`
  - `<tabbed-results-collection>` is used in the President section of the <a href="https://apps.npr.org/2024-election-results/maine.html?section=P" target="_blank">Maine</a> and <a href="https://apps.npr.org/2024-election-results/nebraska.html?section=P" target="_blank">Nebraska</a> pages to show district-level results. In theory this component could be used in other places, like in an embed?!
- The results collection loads a series of `<results-table>`s

## How it works:
- One thing that might not be obvious at first glance is how the data is passed through components
  - `<state-page-results>` loads the state-level data file (e.g. data/states/CA.json). If results have not been certified, then gopher watches for updates
  - In each section, state-level data is filtered, stringified and passed into a `<results-collection>` through the `races` attribute
  - 
- The `<results-table>` component makes liberal use of the “illuminate” feature - as I was trying to make it so that only the parts that really need to be updated live get updated live


—-----—-----—-----—-----—-----—-----—-----

# Customizer pages
<a href="https://github.com/nprapps/elections24-general/blob/main/src/_state.html" target="_blank">HTML template link</a> | <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/components/state-page-results/index.js" target="_blank">Shared javascript link</a> 
List of Components: 
- WIP
How it works:
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/customizer.html" target="_blank">Customizer.html</a> has a list of all the components, including nested components to allow for more customization 
- <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/customizer.js" target="_blank">Customizer.js</a> fetches each of the components and <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/customizer.js#L333-L373" target="_blank">attaches event handlers</a> that show and hide the <a href="https://github.com/nprapps/elections24-general/blob/main/src/js/customizer.js#L274C1-L315C3" target="_blank">sub-options</a>


