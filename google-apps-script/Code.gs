const SPREADSHEET_ID =
  "1VDNPJdYZVfwSxMMgeTx0sfei-gGyJCDlCV_4iTLynzY";

const SHEET_NAME = "Drivers data";


/**
 * Receives lead data from the Driver Lead Importer.
 *
 * The website submits a normal HTML form POST.
 * Therefore Google Apps Script reads the fields from:
 *
 * e.parameter
 */
function doPost(e) {
  try {
    console.log("POST received");

    if (!e || !e.parameter) {
      throw new Error("No form parameters received");
    }

    console.log(
      "Parameters: " + JSON.stringify(e.parameter)
    );

    const data = e.parameter;

    const spreadsheet =
      SpreadsheetApp.openById(SPREADSHEET_ID);

    const sheet =
      spreadsheet.getSheetByName(SHEET_NAME);

    if (!sheet) {
      throw new Error(
        "Sheet not found: " + SHEET_NAME
      );
    }

    const row = [
      data.fullName || "",
      data.phone || "",
      data.city || "",
      data.experience || "",
      data.licence || "",
      data.joining || "",
      data.jobInterest || "",
      data.status || "New"
    ];

    console.log(
      "Row being inserted: " +
      JSON.stringify(row)
    );

    sheet.appendRow(row);

    console.log("Lead inserted successfully");

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: true,
          message: "Lead added successfully"
        })
      )
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error(
      "ERROR: " + error.toString()
    );

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: false,
          error: error.toString()
        })
      )
      .setMimeType(ContentService.MimeType.JSON);
  }
}


/**
 * Simple endpoint health check.
 */
function doGet() {
  return ContentService
    .createTextOutput(
      "Driver Lead Importer is running."
    )
    .setMimeType(ContentService.MimeType.TEXT);
}


/**
 * Manual spreadsheet permission test.
 *
 * Run this once from Apps Script if you want
 * to confirm the script can write to the sheet.
 */
function testAppend() {
  const spreadsheet =
    SpreadsheetApp.openById(SPREADSHEET_ID);

  const sheet =
    spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(
      "Sheet not found: " + SHEET_NAME
    );
  }

  sheet.appendRow([
    "TEST DRIVER",
    "+910000000000",
    "Test City",
    "2–5 years",
    "Yes",
    "Immediately",
    "Test lead",
    "TEST"
  ]);
}
