var apMonths = [ "Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec." ];

var classify = function(str) {
  return (str + "").toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

var daysOfWeek = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."];

var downCaret = `
  <svg style="width: 10px;" viewBox="0 0 3.2 2.7" preserveAspectRatio="none" aria-hidden="true">
    <path fill="currentColor" d="M0.1,0.1h3L1.6,2.6L0.1,0.1z"/>
  </svg>
  `;
var upCaret = `
  <svg style="width: 10px;" viewBox="0 0 3.2 2.7" preserveAspectRatio="none" aria-hidden="true">
    <path fill="currentColor" d="M3.1,2.6h-3l1.5-2.5L3.1,2.6z"/>
  </svg>
  `;

/*
  Display-friendly formatting for reporting numbers (don't round to 0/100%)
*/
function reportingPercentage(pct) {
  let string = "";
  if (pct > 0 && pct < 0.01) {
    string = "<1";
  } else if (pct > 0.99 && pct < 1) {
    string = ">99";
  } else {
    string = (pct * 100).toFixed(0);
  }
  return string;
}
  
/* 
One off to deal with new alaska stuff, 2022. 
raceID's should be listed as string, e.g. "2933"
*/
// function goingToRCVRunOff(raceID) {
//   // 20645  is ME-02, tabulation on 11/15
//   // 2933  AK race, RCV on 11/23
//   // 2015 AK race, RCV on 11/23
//   var RCV_race_list = ["20645", "2933", "2015"];
//   if (RCV_race_list.includes(raceID) ) {
//       return true;
//     }
//   return false;
// }

/*
  Sort a list of candidates by party, with Dems always first and GOP always last
*/
function sortByParty(a, b) {
  var getPartyValue = c =>
    c.party == "GOP" || c.party == "No"
      ? Infinity
      : c.party == "Dem" || c.party == "Yes"
      ? -Infinity
      : c.party
      ? c.party.charCodeAt(0)
      : 0;

  return getPartyValue(a) - getPartyValue(b);
}

function isSameCandidate(c1, c2) {
  return c1.last == c2.last && c1.party == c2.party;
}

/*
  Sort a list of candidates by a predefined order
*/
function sortByOrder(a, b, order) {
  var getPartyValue = c => {
    if (!order.includes(c)) {
      return Infinity;
    }
    return order.indexOf(c);
  };

  return getPartyValue(a) - getPartyValue(b);
}

/*
  Text formatting functions, collected in a single object
  Use `chain(a, b, c)` to combine formatters as `c(b(a(value)))`
*/
var formatters = {
  titleCase: v => v.replace(/(\b\w)/g, s => s.toUpperCase()),
  percent: v => Math.round(v * 100) + "%",
  comma: v => (v * 1).toLocaleString(),
  dollars: v => "$" + v,
  chain: function (formats) {
    return value => formats.reduce((v, fn) => fn(v), value);
  },
  percentDecimal: v => (v * 100).toFixed(1) + "%",
  voteMargin: function (result) {
    var prefix = getPartyPrefix(result.party);

    return prefix + " +" + Math.round(result.margin * 100);
  },
};

function getPartyPrefix(party) {
  let prefix;
  if (party === "Dem") {
    prefix = "D";
  } else if (party === "GOP") {
    prefix = "R";
  } else if (party == "Other") {
    prefix = "O";
  } else {
    prefix = "I";
  }
  return prefix;
}

function getBucket(rating, chamber = null) {
  if (chamber == "house") {
    if (rating == "lean-d" || rating == "solid-d" || rating == "likely-d") {
      return "likelyD";
    } else if (rating == "toss-up") {
      return "tossup";
    } else if (rating == "solid-r" || rating == "likely-r" || rating == "lean-r") {
      return "likelyR";
    } else {
      console.warn("bucket error", rating);
    }
  } else {
    if (rating == "solid-d" || rating == "likely-d") {
      return "likelyD";
    } else if (rating == "lean-d" || rating == "toss-up" || rating == "lean-r") {
      return "tossup";
    } else if (rating == "solid-r" || rating == "likely-r") {
      return "likelyR";
    } else {
      console.warn("bucket error", rating);
    }
  }
}

function getParty(party) {
  if (["Dem", "GOP", "Other", "No", "Yes"].includes(party)) {
    return party;
  }
  return "Ind";
}

const availableMetrics = {
  population: {
    name: "Population",
    format: formatters.comma,
  },
  past_margin: {
    name: "2024 presidential margin",
    format: formatters.voteMargin,
  },
  unemployment: {
    name: "Unemployment",
    format: formatters.percentDecimal,
  },
  percent_white: {
    name: "% White",
    format: formatters.percentDecimal,
  },
  percent_black: {
    name: "% Black",
    format: formatters.percentDecimal,
  },
  percent_hispanic: {
    name: "% Hispanic",
    format: formatters.percentDecimal,
  },
  median_income: {
    name: "Median income",
    format: formatters.chain([formatters.comma, formatters.dollars]),
  },
  percent_bachelors: {
    name: "% College-educated",
    format: formatters.percent,
  },
  countyName: {
    name: "County",
    alpha: true,
    hideFromToggle: true,
  },
};

for (var k in availableMetrics) availableMetrics[k].key = k;

function getAvailableMetrics(state) {
  var metrics = { ...availableMetrics };
  if (state == "UT") {
    delete metrics["covid"];
  }
  return metrics;
}

function getCountyVariable(data, variable) {
  var value = data[variable];
  // Have to special case past margin.
  if (variable == "past_margin") {
    value = value.margin * (value.party == "Dem" ? 1 : -1);
  }
  return value * 1;
}

function groupCalled(results) {
  var called = {
    Dem: [],
    GOP: [],
    Other: [],
    uncalled: [],
  };
  if (results) {
    results.forEach(r => {
      const category = r.called ? (r.winnerParty || 'Other') : 'uncalled';
      if (called[category]) {
        called[category].push(r);
      } else {
        called.Other.push(r);
      }
    });
  }
  return called;
}

var sumElectoral = list => list.reduce((t, r) => t + r.electoral, 0);

function styleJSX(styles) {
  var list = [];
  for (var k in styles) {
    var name = k.replace(/(a-z)(A-Z)/, (_, a, b) => `${a}-${b.toLowerCase()}`);
    var value = styles[k];
    list.push(`${name}: ${value}`);
  }
  return list.join("; ");
}

function getCountyCandidates(overall, counties) {
  var countyWinners = counties
    .filter(c => (c.reportingPercent && c.reportingPercent > 0.5))
    .map(c => c.candidates[0]);
  countyWinners = countyWinners.filter(function (obj, index, self) {
    return (
      index ===
      self.findIndex(function (t) {
        return t.last === obj.last;
      })
    );
  });
  var overallLeaders = overall.slice(0, 2).concat(countyWinners);
  overallLeaders = overallLeaders.filter(function (obj, index, self) {
    return (
      index ===
      self.findIndex(function (t) {
        return t.last === obj.last;
      })
    );
  });
  return overallLeaders;
}

var winnerIcon = `<span class="winner-icon" role="img" aria-label="check mark">
    <svg
      aria-hidden="true"
      focusable="false"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512">
      <path
        fill="#333"
        d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"></path>
    </svg>
  </span>`;

var timezones = [
  { re: /\(eastern/i, zone: "ET" },
  { re: /\(central/i, zone: "CT" },
  { re: /\(mountain/i, zone: "MT" },
  { re: /\(pacific/i, zone: "PT" }
];

var leapLengths = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var monthLengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var inDays = function(dateString) {
  var [m, d, y] = dateString.split("/").map(Number);
  var days = 0;
  var elapsedYears = y - 2024;
  for (var i = 0; i < elapsedYears; i++) {
    days += i % 4 == 0 ? 366 : 365;
  }
  var lengths = (y - 2024) % 4 == 0 ? leapLengths : monthLengths;
  for (var i = 0; i < m - 1; i++) {
    days += lengths[i];
  }
  days += d;
  return days;
}

var formatAPDate = date => `${apMonths[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
var formatTime = function(date) {
  var h = date.getHours()
  var m = date.getMinutes().toString().padStart(2, "0");
  var suffix = h >= 12 ? "p.m." : "a.m.";
  var offset = date.getTimezoneOffset() / 60;
  var zone = "";
  if (offset >= 4 && offset < 9) {
    var ts = date.toTimeString();
    var match = timezones.filter(tz => ts.match(tz.re)).pop();
    if (match) zone = " " + match.zone;
  }
  if (h > 12) {
    h -= 12;
  } else if (h == 0) {
    h = 12;
  }
  return `${h}:${m} ${suffix}${zone}`;
};

var parseNPRDate = function(d) {
  var [m, d, y] = d.split("/");
  return new Date(y, m - 1, d);
};

var groupBy = function(list, key) {
  var grouped = {};
  list.forEach(function(item) {
    var value = item[key];
    if (!grouped[value]) grouped[value] = [];
    grouped[value].push(item);
  });
  return grouped;
};

// sort of like d3.data but for data -> elements
// returns a zipped array of [data, element] pairs
var mapToElements = function(root, array, element = "div", keyField = "id") {
  var children = Array.from(root.children);
  var binding = new Map();

  array.forEach(function(item) {
    var [child] = children.filter(c => c.dataset.key == item[keyField]);
    if (!child) {
      // create a node and append it
      child =
        typeof element == "function"
          ? element(item)
          : document.createElement(element);
      child.dataset.key = item[keyField];
      children.push(child);
      root.appendChild(child);
    }
    binding.set(child, item);
    binding.set(item, child);
  });

  // remove deleted children
  children.forEach(function(child) {
    if (!binding.has(child)) {
      root.removeChild(child);
    }
  });

  // sort children to match array order
  children = Array.from(root.children);
  var pairs = array.map(function(item, i) {
    var child = binding.get(item);
    var childIndex = children.indexOf(child);
    if (childIndex != i) {
      var next = children[i + 1];
      if (next) {
        root.insertBefore(child, next);
      } else {
        root.appendChild(child);
      }
    }
    return [item, child];
  });
  return pairs;
};

var toggleAttribute = function(element, attribute, force) {
  var toggle = !element.hasAttribute(attribute);
  var enable = typeof force == "undefined" ? toggle : force;
  if (enable) {
    element.setAttribute(attribute, "");
  } else {
    element.removeAttribute(attribute);
  }
};

var formatComma = s => s.toLocaleString().replace(/\.0+$/, "");

var formatEEVP = number => {
  let string = "";
  if (number > 0 && number < 0.01) {
    string = "<1% of votes in";
  } else if (number > 0.99 && number < 1) {
    string = ">99% of votes in";
  } else {
    string = (number * 100).toFixed(0).toString() + "% of votes in";
  }
  return string;
}

var stateNames = {
  "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California",
  "CO": "Colorado", "CT": "Connecticut", "DC": "District of Columbia", "DE": "Delaware",
  "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois",
  "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana",
  "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota",
  "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
  "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
  "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
  "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
  "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont",
  "VA": "Virginia", "WA": "Washington", "WV": "West Virginia", "WI": "Wisconsin",
  "WY": "Wyoming"
}
var statePostalToFull = function(statePostal) {
  return stateNames[statePostal];
}

module.exports = {
  apMonths,
  classify,
  daysOfWeek,
  downCaret,
  formatAPDate,
  formatComma,
  formatEEVP,
  formatters,
  formatTime,
  getAvailableMetrics,
  getBucket,
  getCountyCandidates,
  getCountyVariable,
  getParty,
  getPartyPrefix,
  // goingToRCVRunOff,
  groupBy,
  groupCalled,
  inDays,
  isSameCandidate,
  mapToElements,
  parseNPRDate,
  reportingPercentage,
  sortByOrder,
  sortByParty,
  statePostalToFull,
  styleJSX,
  sumElectoral,
  toggleAttribute,
  upCaret,
  winnerIcon
}
