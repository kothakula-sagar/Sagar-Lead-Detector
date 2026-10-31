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
  "1ESrzl-G6pUz7TIeA1XL3X7I7qK9f0Yur4FNfShSHI1g";

const BIKE_SHEET_NAME =
  "Sheet1";


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

      if (!data.fullName || !data.phone) throw new Error("Name and phone are required");
      const headers = ["Full name", "Phone number", "City", "Available to work in Bengaluru", "Valid two-wheeler licence", "Android smartphone", "Delivery riding experience", "Joining availability", "Priority", "Status", "Age (optional)", "Own bike (optional)", "Imported at"];
      if (sheet.getLastRow() === 0) sheet.appendRow(headers);
      const actual = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
      if (headers.some((h, i) => actual[i] !== h)) throw new Error("Rider sheet headers do not match. Check the configured destination.");
      const safe = value => /^[=+@-]/.test(String(value || "")) ? "'" + value : String(value || "");
      const row = [data.fullName, data.phone, data.city, data.bengaluruAvailable,
        data.licence, data.androidPhone, data.experience, data.joining,
        data.priority || "Low", data.status || "Not Open", data.age, data.bike];
      const importedAt = Utilities.formatDate(new Date(), "Asia/Kolkata", "dd-MMM-yyyy HH:mm:ss") + " IST";
      sheet.appendRow(row.map(safe).concat([importedAt]));

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


