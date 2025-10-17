/*
--test - Ask the AP for test data
--offline - Use cached data if it exists
*/

const { redeemTicket } = require("./lib/apResults");
const normalize = require("./lib/normalizeResults");
const nullify = require("./lib/nullifyResults");
const augment = require("./lib/augmentResults");
const fs = require("fs").promises;

function sortArrayByTotalVotes(arr) {
  // Add a totalVotes property to each object based on the sum of votes in candidates
  arr.forEach((obj) => {
    obj.totalVotes = obj.candidates.reduce(
      (sum, candidate) => sum + candidate.votes,
      0
    );
  });

  // Sort the array based on the totalVotes in descending order
  return arr.sort((a, b) => b.totalVotes - a.totalVotes);
}

module.exports = function (grunt) {
  // Grunt doesn't like top-level async, so define this here and call it immediately
  var task = async function () {
    // These are the options we can give while running grunt (i.e grunt --offline)
    const test = grunt.option("APtest");
    const offline = grunt.option("offline");
    const zero = grunt.option("zero");

    // For 24-general, we pulled county level-data for G,S,P for all non-england states
    // We pulled township level data for G,S,P for all the england states and state level data for H,I.
    const countyLevelDataForStates =
      "AL,AK,AZ,AR,CA,CO,DC,DE, FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,MD,MI,MN,MS,MO,MT,NE,NV,NJ,NM,NY,NC,ND,OH,OK,OR,PA,SC,SD,TN,TX,UT,VA,WA,WV,WI,WY";
    const townshipLevelDataForStates = "CT,ME,MA,NH,RI,VT";

    const tickets = [
      {
        date: "2025-11-04",
        params: {
          officeID: "G",
          level: "FIPSCode",
          statePostal: "NJ,VA",
        },
      },
      {
        date: "2025-11-04",
        params: {
          officeID: "M",
          level: "ru",
          statePostal: "NY",
          seatName: "New York City"
        },
      },
      {
        date: "2025-11-04",
        params: {
          officeID: "I",
          level: "FIPSCode",
          statePostal: "CA,CO"
        },
      },
    ];

    // get results from AP
    const rawResults = [];
    for (let ticket of tickets) {
      const response = await redeemTicket(ticket, { test, offline });
      if (!response) continue;

      //This is a 2024 special CA senate election that we don't want so we are filtering it out
      /*
      const filteredResponse = response.races.filter(
        (race) => race.raceID !== "82961"
      );
      response.races = filteredResponse;
      */

      if (zero) nullify(response);
      rawResults.push(response);
    }

    // turn AP into normalized race objects
    const results = normalize(rawResults, grunt.data.json);
    //AP returns county level data for both AK/DC when they both don't have counties (😕 I know)
    //Here we are filtering out the data if it's not state level for both these states

    // console.log("normalizedResults: ", normalizedResults[0]);

    // let results = normalizedResults.filter(
    //   (result) =>
    //     !(
    //       (result.state == "DC" || result.state == "AK") &&
    //       result.level == "county"
    //     )
    // );
    grunt.log.writeln("Merging in external data...");
    augment(results, grunt.data);

    const { longform } = grunt.data.archieml;

    grunt.log.writeln("Generating data files ");
    // ensure the data folder exists
    await fs.mkdir("build/data", { recursive: true });

    // now create slices of various results
    // separate by geography for easier grouping
    // const geo = {
    //   national: results.filter((r) => r.level == "national"),
    //   state: results.filter((r) => r.level == "state"),
    //   county: results.filter(
    //     (r) => r.level == "county" || r.level == "subunit"
    //   ),
    // };

    const geo = {
      national: [],
      state: [],
      county: [],
    };
    results.map((r) => {
      if (r.level == "national") {
        geo.national.push(r);
      }
      if (r.level == "state") {
        geo.state.push(r);
      }
      if (r.level == "county" || r.level == "subunit") {
        geo.county.push(r);
      }
    });

    // grunt.log.writeln("Geo.national: ");
    // grunt.log.writeflags(geo.national);

    // national results
    console.log("Write national file");
    await fs.writeFile(
      "build/data/national.json",
      serialize({ test, results: geo.national })
    );

    // state-level results
    await fs.mkdir("build/data/states", { recursive: true });
    const states = {};
    // const dashboard = [];

    geo.state.forEach(function (result) {
      // console.log(result);
      console.log(result.state, result.office, result.seat, result.description);
      //internal dashboard to monitor oustanding congressional races / not used in 2025
      /*
      if (
        (result.office === "H" &&
          result.id !== "45888" &&
          result.id !== "50068") ||
        result.office === "S"
      ) {
        dashboard.push({
          state: result.state,
          office: result.office,
          seatNumber: result.seatNumber,
          rating: result.rating,
          called: result.called ? "Called" : "",
          winnerParty: result.winnerParty ? result.winnerParty : "",
        });
      }
      */
      const { state } = result;
      if (!states[state]) states[state] = [];
      states[state].push(result);
    });

    //converts dashboard data into csv to upload to google sheets / not used in 2025
    /*
    if (dashboard.length > 0) {
      const replacer = (key, value) => (value === null ? "" : value); // specify how you want to handle null values here
      const header = Object.keys(dashboard[0]);
      const csv = [
        header.join(","), // header row first
        ...dashboard.map((row) =>
          header
            .map((fieldName) => JSON.stringify(row[fieldName], replacer))
            .join(",")
        ),
      ].join("\r\n");

      fs.writeFile(`build/data/dashboard.csv`, csv);
    }
    */

    for (let state in states) {
      let stateOutput = {
        test,
        results: states[state].sort((a, b) =>
          a.seatNumber - b.seatNumber < 0 ? -1 : 1
        ),
      };

      const stateChatter = longform.statePages[state.toLowerCase()];
      if (stateChatter) {
        stateOutput.chatter = grunt.template.renderMarkdown(stateChatter);
      }
      await fs.writeFile(
        `build/data/states/${state}.json`,
        serialize(stateOutput)
      );
    }

    // county files
    await fs.mkdir("build/data/counties", { recursive: true });
    const countyRaces = {};
    geo.county.forEach(function (result) {
      const { state, id } = result;
      const key = [state, id].join("-");
      if (!countyRaces[key]) countyRaces[key] = [];
      countyRaces[key].push(result);
    });

    for (let key in countyRaces) {
      const sortArray = sortArrayByTotalVotes(countyRaces[key]);

      await fs.writeFile(
        `build/data/counties/${key}.json`,
        serialize({ test, results: sortArray })
      );
    }

    // sliced by office
    // const byOffice = {
    //   president: geo.state.filter((r) => r.office == "P"),
    //   house: geo.state.filter(
    //     (r) => r.office == "H" && r.id !== "45888" && r.id !== "50068"
    //   ),
    //   senate: geo.state.filter((r) => r.office == "S"),
    //   gov: geo.state.filter((r) => r.office == "G"),
    //   //ballots: geo.state.filter((r) => r.office == "I" && r.featured),
    // };

    const byOffice = {
      president: [],
      house: [],
      senate: [],
      gov: [],
    };

    geo.state.map((r) => {
      if (r.office == "P") {
        byOffice.president.push(r);
      }
      if (r.office == "H" && r.id !== "45888" && r.id !== "50068") {
        byOffice.house.push(r);
      }
      if (r.office == "S") {
        byOffice.senate.push(r);
      }
      if (r.office == "G") {
        byOffice.gov.push(r);
      }
    });

    for (let office in byOffice) {
      const officeOutput = {
        test,
        results: byOffice[office],
      };
      if (longform.chamberAlerts && longform.chamberAlerts[office]) {
        officeOutput.alert = grunt.template.renderMarkdown(
          longform.chamberAlerts[office]
        );
      }
      await fs.writeFile(`build/data/${office}.json`, serialize(officeOutput));
    }

    // create BOP widget output
    const mapBOP = function (r) {
      return {
        id: r.id,
        state: r.state,
        district: r.district,
        winner: r.winnerParty,
        electoral: r.electoral,
        previous: r.previousParty,
        caucusWith: r.caucusWith,
      };
    };

    const latest = []
      .concat(geo.national, byOffice.house, byOffice.senate)
      .reduce((t, r) => Math.max(t, r.updated), 0);

    const bop = {
      president: byOffice.president.filter((r) => r.called).map(mapBOP),
      house: byOffice.house
        .filter((r) => r.called && r.id !== "45888" && r.id !== "50068")
        .map(mapBOP),
      senate: byOffice.senate.filter((r) => r.called).map(mapBOP),
      latest,
    };

    await fs.writeFile(`build/data/bop.json`, serialize(bop));
  };

  const serialize = (d) => JSON.stringify(d, null, 2);

  grunt.registerTask("elex", async function () {
    grunt.task.requires("json");
    grunt.task.requires("csv");

    const done = this.async();

    task().then(done);
  });
};
