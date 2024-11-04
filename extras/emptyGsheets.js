require("dotenv").config();
var { google } = require("googleapis");

async function emptyGSheets() {
  const GOOGLE_CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

  const client = new google.auth.GoogleAuth({
    credentials: GOOGLE_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  const sheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = process.env.SHEETS_ID;
  const range = "Forecast!A4:Z10000";

  try {
    const result = await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });
    console.log("Data cleared");
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  emptyGSheets,
};
