/*
  Sagar Lead Detector
  Routes Driver and Bike Rider leads
  to separate Google Sheets.
*/

/* Existing Driver sheet */
const DRIVER_SPREADSHEET_ID =
  "1VDNPJdYZVfwSxMMgeTx0sfei-gGyJCDlCV_4iTLynzY";

const DRIVER_SHEET_NAME =
  "Drivers data";


/* Bike Rider sheet */
const BIKE_SPREADSHEET_ID =
  "1lMj2VZb4g7-h-ZJ4815PKFJG28joqXtFmX76GOol5e8";

const BIKE_SHEET_NAME =
  "Cleaned Leads";


function doPost(e) {
  try {
    if (!e || !e.parameter) {
      throw new Error(
        "No form parameters received"
      );
    }

    const data = e.parameter;

    const leadType =
      String(data.leadType || "")
        .toLowerCase()
        .trim();

    console.log(
      "Lead type: " + leadType
    );

    console.log(
      "Received data: " +
      JSON.stringify(data)
    );


    /* =====================================================
       DRIVER
    ===================================================== */

    if (leadType === "driver") {

      const spreadsheet =
        SpreadsheetApp.openById(
          DRIVER_SPREADSHEET_ID
        );

      const sheet =
        spreadsheet.getSheetByName(
          DRIVER_SHEET_NAME
        );

      if (!sheet) {
        throw new Error(
          "Driver sheet not found: " +
          DRIVER_SHEET_NAME
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

      sheet.appendRow(row);

      console.log(
        "Driver lead inserted: " +
        JSON.stringify(row)
      );
    }


    /* =====================================================
       BIKE RIDER
    ===================================================== */

    else if (
      leadType === "bike_rider"
    ) {

      const spreadsheet =
        SpreadsheetApp.openById(
          BIKE_SPREADSHEET_ID
        );

      const sheet =
        spreadsheet.getSheetByName(
          BIKE_SHEET_NAME
        );

      if (!sheet) {
        throw new Error(
          "Bike Rider sheet not found: " +
          BIKE_SHEET_NAME
        );
      }

      const row = [
        data.fullName || "",
        data.phone || "",
        data.age || "",
        data.licence || "",
        data.bike || "",
        data.joining || "",
        data.priority || "Low",
        data.status || "Not Open"
      ];

      sheet.appendRow(row);

      console.log(
        "Bike Rider lead inserted: " +
        JSON.stringify(row)
      );
    }


    /* =====================================================
       UNKNOWN
    ===================================================== */

    else {
      throw new Error(
        "Unknown lead type: " +
        leadType
      );
    }


    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: true,
          leadType: leadType,
          message:
            "Lead added successfully"
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  } catch (error) {

    console.error(
      "ERROR: " +
      error.toString()
    );

    return ContentService
      .createTextOutput(
        JSON.stringify({
          success: false,
          error: error.toString()
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );
  }
}


function doGet() {
  return ContentService
    .createTextOutput(
      "Sagar Lead Detector is running."
    )
    .setMimeType(
      ContentService.MimeType.TEXT
    );
}


/*
  Manual Driver test.
*/
function testDriverAppend() {

  const spreadsheet =
    SpreadsheetApp.openById(
      DRIVER_SPREADSHEET_ID
    );

  const sheet =
    spreadsheet.getSheetByName(
      DRIVER_SHEET_NAME
    );

  if (!sheet) {
    throw new Error(
      "Driver sheet not found"
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
    "New"
  ]);
}


/*
  Manual Bike Rider test.
*/
function testBikeRiderAppend() {

  const spreadsheet =
    SpreadsheetApp.openById(
      BIKE_SPREADSHEET_ID
    );

  const sheet =
    spreadsheet.getSheetByName(
      BIKE_SHEET_NAME
    );

  if (!sheet) {
    throw new Error(
      "Bike Rider sheet not found"
    );
  }

  sheet.appendRow([
    "TEST BIKE RIDER",
    "+910000000001",
    "36+",
    "Yes",
    "Yes",
    "Immediately",
    "High",
    "Not Open"
  ]);
}
