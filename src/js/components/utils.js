var apMonths = [ "Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec." ];
var daysOfWeek = ["Sun.", "Mon.", "Tue.", "Wed.", "Thu.", "Fri.", "Sat."]

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
  var suffix = h > 12 ? "p.m." : "a.m.";
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

var classify = function(str) {
  return (str + "").toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

var formatComma = s => s.toLocaleString().replace(/\.0+$/, "");

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

module.exports = {
  apMonths,
  inDays,
  formatAPDate,
  formatTime,
  formatComma,
  parseNPRDate,
  groupBy,
  mapToElements,
  toggleAttribute,
  classify,
  winnerIcon
}
