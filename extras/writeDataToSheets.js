require("dotenv").config();
var { google } = require("googleapis");

async function writeDataToSheets(values) {
  const GOOGLE_CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

  const client = new google.auth.GoogleAuth({
    credentials: GOOGLE_CREDENTIALS,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const valueInputOption = "RAW";

  const sheets = google.sheets({ version: "v4", auth: client });

  const spreadsheetId = process.env.SHEETS_ID;
  const range = "Forecast!A3:Z10000";

  try {
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption,
      resource: { values },
    });
    console.log("%d cells updated.", result.data.updates.updatedCells);
    return result;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  writeDataToSheets,
};
