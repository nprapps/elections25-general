/*
--test - Ask the AP for test data
--offline - Use cached data if it exists
*/

const { redeemTicket, apDate } = require("./lib/apResults");
const normalize = require("./lib/normalizeResults");
const nullify = require("./lib/nullifyResults");
const augment = require("./lib/augmentResults");
const fs = require("fs").promises;

module.exports = function (grunt) {
  var elex = {};

  // Grunt doesn't like top-level async, so define this here and call it immediately
  var task = async function () {
    // ranked choice voting for 22.

    const RCV_linkages = grunt.data.json.rcv;
    const test = grunt.option("APtest");

    const offline = grunt.option("offline");
    const zero = grunt.option("zero");

    const tickets = [
      {
        date: "2024-11-05",
        params: {
          officeID: "G,S,P",
          level: "FIPSCode",
        },
      },
      {
        date: "2024-11-05",
        params: {
          officeID: "H,I",
          level: "state",
        },
      },
    ];

    // get results from AP
    const rawResults = [];
    for (let t of tickets) {
      const response = await redeemTicket(t, { test, offline });
      if (!response) continue;
      if (zero) nullify(response);
      rawResults.push(response);
    }

    // turn AP into normalized race objects
    const results = normalize(rawResults, grunt.data.json);

    // Only include general election results if an RCV runoff is not available
    // RCV_linkages.forEach(function (rcv_linkage) {
    //   this_rcv_race = results.filter(
    //     (race) => race.id == rcv_linkage["general_race_id"]
    //   )[0];

    //   if (this_rcv_race && this_rcv_race.called) {
    //     // If the rcv race has been called, use it and filter out the "normal" race
    //     console.log(
    //       `RCV ${this_rcv_race.district} ${this_rcv_race.id} has been called, using it`
    //     );

    //     // Set the new race to have the same status as the old race before filtering it out
    //     var thisGeneralRaceIsKey = results.find(
    //       (race) => race.id == rcv_linkage["general_race_id"]
    //     ).keyRace;
    //     var thisGeneralRaceRating = results.find(
    //       (race) => race.id == rcv_linkage["general_race_id"]
    //     ).rating;

    //     if (typeof thisGeneralRaceIsKey !== "undefined") {
    //       results.find(
    //         (race) => race.id == rcv_linkage["rcv_race_id"]
    //       ).keyRace = thisGeneralRaceIsKey;
    //       results.find((race) => race.id == rcv_linkage["rcv_race_id"]).rating =
    //         thisGeneralRaceRating;
    //     }

    //     // Ignore the general election race details
    //     results = results.filter(
    //       (race) => race.id != rcv_linkage["general_race_id"]
    //     );
    //   } else {
    //     console.log(
    //       `RCV race ${this_rcv_race.id} has NOT been called yet, NOT using the RCV result`
    //     );
    //     results = results.filter(
    //       (race) => race.id != rcv_linkage["general_race_id"]
    //     );
    //   }
    // });

    // Ignore contest for end of 2016 CA term held during 2022
    // https://www.capradio.org/articles/2022/10/17/us-sen-alex-padilla-will-appear-on-californias-june-primary-ballot-twice-heres-why/
    // And ignore contest for unexpired term in Indiana, House seat 2
    //! results = results.filter((race) => race.id != 8964 && race.id != 15766);

    //! We don't need this anymore because electoral data for ME/NE aren't district level
    // filter generator for ME/NE states as they split their electoral college votes as of 2024.
    var stateOrDistrictFilter = function (level) {
      return function (result) {
        if (result.id != "0") return true;
        if (result.state == "ME" || result.state == "NE") {
          return result.level == level;
        }
        return true;
      };
    };

    grunt.log.writeln("Merging in external data...");

    //grunt.data is json + csv + markdown + archieml
    augment(results, grunt.data);

    const { longform } = grunt.data.archieml;

    grunt.log.writeln("Generating data files ");

    // ensure the data folder exists
    await fs.mkdir("build/data", { recursive: true });

    // now create slices of various results
    // separate by geography for easier grouping
    const geo = {
      national: results.filter((r) => r.level == "national"),
      state: results.filter((r) => r.level == "state"),
      county: results.filter((r) => r.level == "county"),
    };

    grunt.log.writeln("Geo.national: ");
    grunt.log.writeflags(geo.national);

    // national results
    await fs.writeFile(
      "build/data/national.json",
      serialize({ test, results: geo.national })
    );

    // state-level results
    await fs.mkdir("build/data/states", { recursive: true });
    const states = {};
    geo.state.forEach(function (result) {
      const { state } = result;
      if (!states[state]) states[state] = [];
      states[state].push(result);
    });
    for (let state in states) {
      let stateOutput = {
        test,
        results: states[state],
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
      await fs.writeFile(
        `build/data/counties/${key}.json`,
        serialize({ test, results: countyRaces[key] })
      );
    }

    // sliced by office
    const byOffice = {
      president: geo.state.filter((r) => r.office == "P"),
      house: geo.state.filter((r) => r.office == "H"),
      senate: geo.state.filter((r) => r.office == "S"),
      gov: geo.state.filter((r) => r.office == "G"),
      ballots: geo.state.filter((r) => r.office == "I" && r.featured),
    };

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
      };
    };

    const latest = []
      .concat(geo.national, byOffice.house, byOffice.senate)
      .reduce((t, r) => Math.max(t, r.updated), 0);

    const bop = {
      president: byOffice.president.filter((r) => r.called).map(mapBOP),
      house: byOffice.house.filter((r) => r.called).map(mapBOP),
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
