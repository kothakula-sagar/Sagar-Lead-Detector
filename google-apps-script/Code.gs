/**
 * Driver Lead Importer -> Google Sheets
 *
 * Spreadsheet:
 * 1VDNPJdYZVfwSxMMgeTx0sfei-gGyJCDlCV_4iTLynzY
 *
 * Tab:
 * Drivers data
 *
 * Deploy this Apps Script as a Web App:
 * Execute as: Me
 * Who has access: Anyone
 *
 * The HTML app submits to this URL through a hidden form, so end users
 * do not need to sign into Google.
 */

const SPREADSHEET_ID = "1VDNPJdYZVfwSxMMgeTx0sfei-gGyJCDlCV_4iTLynzY";
const SHEET_NAME = "Drivers data";

function doPost(e) {
  try {
    const payload = JSON.parse(e.parameter.payload || "{}");
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);

    if (!sheet) throw new Error("Sheet tab not found: " + SHEET_NAME);

    sheet.appendRow([
      payload.fullName || "",
      payload.phone || "",
      payload.city || "",
      payload.experience || "",
      payload.licence || "",
      payload.joining || "",
      payload.jobInterest || "",
      payload.status || "New"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, error: String(err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput("Driver Lead Importer endpoint is running.")
    .setMimeType(ContentService.MimeType.TEXT);
}
