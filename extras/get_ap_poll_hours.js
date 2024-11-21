const states = require("../data/states.sheet.json");

/**
 * It returns the AP Closing Poll hours for all the states.
 * @returns Object - State Config with updated timings
 *
 * For now, it doesn't have a way to add the returned data to the google sheet. Something to do in future
 * Run this script using node/extras/get_ap_poll_hours.js
 */
async function getData() {
  const url =
    "https://api.ap.org/v3/reports/PollHours-PollHours2024-Live?format=json";
  const headers = { "x-api-key": process.env.AP_API_KEY };
  try {
    const response = await fetch(url, {
      headers,
    });
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    const pollHours = json["APPollHoursReport"]["StatePollingHours"];

    for (let i = 0; i < pollHours.length; i++) {
      const statePostal = pollHours[i].statePostal;
      const lastPollClosingET = pollHours[i].lastPollClosingET;
      if (statePostal == "NE") {
        states["NE-1"].closingTime = lastPollClosingET;
        states["NE-2"].closingTime = lastPollClosingET;
        states["NE-3"].closingTime = lastPollClosingET;
      }
      if (statePostal == "ME") {
        states["ME-1"].closingTime = lastPollClosingET;
        states["ME-2"].closingTime = lastPollClosingET;
      }
      states[statePostal].notes = pollHours[i].notes ? pollHours[i].notes : "";
      states[statePostal].closingTime = lastPollClosingET;
    }
    return states;
  } catch (error) {
    console.error(error.message);
  }
}

getData();
