/*
  Builds an array of normalized races from an array of multiple API responses.
  Also sets overrides for candidate/race metadata, and applies winner overrides.
*/

const ROUNDING = 10000;
const MERGE_THRESHOLD = 0.05;

// presidential candidates to always keep in results
const NEVER_MERGE = new Set(["8639", "64984"]);

const translation = {
  race: {
    test: "test",
    id: "raceID",
    office: "officeID",
    party: "party",
    eevp: "eevp",
    type: "raceType",
    seatNumber: "seatNum",
    seat: "seatName",
    description: "description",
    flippedSeat: "flippedSeat",
    winThreshold: "winThreshold",
    rankedChoice: "rankedChoice",
    raceCallStatus: "raceCallStatus",
    rcvResult: "rcvResult",
  },
  unit: {
    level: "level",
    state: "statePostal",
    fips: "fipsCode",
    electoral: "electTotal",
    updated: "lastUpdated",
    name: "reportingunitName",
    reporting: "precinctsReporting",
    precincts: "precinctsTotal",
    eevp: "eevp",
  },
  candidate: {
    first: "first",
    last: "last",
    party: "party",
    id: "polID",
    votes: "voteCount",
    avotes: "avotes",
    electoral: "electWon",
    winner: "winner",
    winnerDateTime: "winnerDateTime",
    incumbent: "incumbent",
    rankedChoiceVotes: "rankedChoiceVotes",
    eliminated: "eliminated",
  },
  metadata: {
    previousParty: "party",
    keyRace: "key_race",
    rating: "rating",
    seat: "name",
    featured: "featured",
    theme: "theme",
  },
};

const translate = {};

Object.keys(translation).forEach((type) => {
  translate[type] = function (input) {
    const output = {};
    for (let [k, v] of Object.entries(translation[type])) {
      if (v in input) {
        output[k] = input[v];
      }
    }
    return output;
  };
});

const majorParties = new Set(["GOP", "Dem"]);
const sortCandidates = function (votes, candidates) {
  const compare = function (a, b) {
    // if no votes yet
    if (votes == 0) {
      // put major parties first
      if (
        (majorParties.has(a.party) && majorParties.has(b.party)) ||
        a.party == b.party
      ) {
        return a.last < b.last ? -1 : 1;
      } else {
        // one of them is not GOP/Dem
        if (majorParties.has(a.party)) {
          return -1;
        }
        return 1;
      }
    } else {
      // sort strictly on votes
      return b.votes - a.votes;
    }
  };
  candidates.sort(compare);
};

const mergeOthers = function (candidates, raceID, top_n) {
  // always take the top two
  const total = candidates.reduce(
    (total, currentVal) => total + currentVal.votes,
    0
  );
  let merged = candidates.slice(0, top_n);
  const remainingCandidates = candidates.slice(top_n);

  let other = {
    first: "",
    last: "Other",
    party: "Other",
    id: `other-${raceID}`,
    votes: 0,
    avotes: 0,
    electoral: 0,
    count: remainingCandidates.length,
  };

  for (let candidate of remainingCandidates) {
    // preserve candidates with >N% of the vote
    if (
      candidate.votes / total > MERGE_THRESHOLD ||
      NEVER_MERGE.has(candidate.id)
    ) {
      merged.push(candidate);
      continue;
    }

    other.votes += candidate.votes || 0;
    other.avotes += candidate.avotes || 0;
    other.electoral += candidate.electoral || 0;
    if (candidate.winner) {
      other.winner = candidate.winner;
    }
  }
  merged.push(other);
  return merged;
};

module.exports = function (resultArray, overrides = {}) {
  // AP data is structured as race->reportingunits, where each "race" includes both state and FIPS
  // we will instead restructure into groupings by geography

  var output = [];

  //this the data from the sheets. We will override the data if needed
  let { calls = [], candidates = {}, rosters = {}, states = {} } = overrides;
  let nprMetadata = {
    H: overrides.house,
    S: overrides.senate,
    G: overrides.governors,
    I: overrides.ballot_measures,
  };

  for (let response of resultArray) {
    for (let race of response.races) {
      //basically this is changing the name of the fields and getting only specific data we need from all the result that is returned from AP
      const raceMeta = translate.race(race);
      // early races may not have reporting units yet
      if (!race.reportingUnits) continue;
      for (let unit of race.reportingUnits) {
        let level = unit.level == "FIPSCode" ? "county" : unit.level;

        // do we have this race  at this level already?
        let unitMeta = {
          ...raceMeta,
          ...translate.unit(unit),
          level,
        };

        // normalize reporting data
        if (unitMeta.eevp) {
          unitMeta.eevp /= 100;
        }
        if (unitMeta.precincts) {
          unitMeta.reportingPercent = unitMeta.reporting / unitMeta.precincts;
        }

        // add the state name to states
        const stateKey =
          unitMeta.district && unitMeta.district != "AL"
            ? `${unitMeta.state}-${unitMeta.district}`
            : unitMeta.state;

        const stateMeta = states[stateKey];

        //we get this information from the google sheet config
        if (stateMeta) {
          unitMeta.stateName = stateMeta.name;
          unitMeta.stateAP = stateMeta.ap;
          unitMeta.rating = stateMeta.rating;
        }

        const sheetMetadata = (nprMetadata[raceMeta.office] || {})[raceMeta.id];
        if (sheetMetadata) {
          const meta = translate.metadata(sheetMetadata);
          Object.assign(unitMeta, meta);
          // For now, always override description with ours even if empty.
          unitMeta.description = sheetMetadata.description;
        }

        unitMeta.updated = Date.parse(unitMeta.updated);

        let total = 0;
        let parties = new Set();
        let ballot = unit.candidates.map(function (candidate) {
          const rankedChoiceVoting = candidate.rankedChoiceVoting;
          if (
            !candidate.winner &&
            unitMeta.raceCallStatus === "Awaiting Ranked Choice Results"
          ) {
            unitMeta["rcvResult"] = "pending";
          }

          if (rankedChoiceVoting) {
            candidate["voteCount"] =
              candidate["rankedChoiceVoting"][0]["votes"];
            unitMeta["rcvResult"] = "final";
          }

          normalizedCandidate = translate.candidate(candidate);

          // assign overrides from the sheet by candidate ID
          let override = candidates[normalizedCandidate.id];
          if (override) {
            for (let k in override) {
              if (override[k]) normalizedCandidate[k] = override[k];
            }
          }
          total += normalizedCandidate.votes;
          parties.add(normalizedCandidate.party);
          return normalizedCandidate;
        });

        // override the ballot if necessary
        let roster = rosters[raceMeta.id];
        if (roster) {
          roster = new Set(roster.toString().split(/,\s*/));
          // KEEP THE CANDIDATES SO WE CAN ROLL UP THE REMAINDER !!!
          ballot = ballot.filter((c) => roster.has(c.id));
        }

        sortCandidates(total, ballot);

        // create "other" merged candidate if:
        // - More than two candidates and
        // - Independent candidate(s) exist and
        // If they are an exception in the 'rosters' sheet
        // Be sure to include the right number

        //! Check what does it mean by jungle primary races and do we want to add them here?
        //general election is their primary
        if (ballot.length > 2 && unitMeta.level != "county") {
          if (roster) {
            ballot = mergeOthers(ballot, raceMeta.id, roster.size);
          } else {
            ballot = mergeOthers(ballot, raceMeta.id, 2);
          }
        }

        let [call] = calls.filter(function (row) {
          if (row.raceID != unitMeta.id) return false;
          for (var p of ["state", "fips", "district"]) {
            if (row[p] && row[p] != unitMeta[p]) return false;
          }
          return true;
        });

        if (false && call) {
          console.log(
            `Overriding winner (${call.candidate}) for race #${
              unitMeta.id
            } in ${[call.state, call.fips, call.district]
              .filter((s) => s)
              .join("-")}`
          );
        }

        let winner = null;
        ballot.forEach(function (candidate) {
          // assign percentages
          candidate.percent =
            Math.round((candidate.votes / total) * ROUNDING) / ROUNDING;
          if (call) {
            if (call.candidate == candidate.id) {
              candidate.winner = "X";
            } else {
              delete candidate.winner;
            }
          }
          if (candidate.winner == "X") winner = candidate;
          if (candidate.winner == "R") unitMeta.runoff = true;
        });

        // set the winner and called flags
        if (winner) {
          unitMeta.called = true;
          unitMeta.winnerParty = winner.party;
        }

        unitMeta.candidates = ballot;
        output.push(unitMeta);
      }
    }
  }

  return output;
};
