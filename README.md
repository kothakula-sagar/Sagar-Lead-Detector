# Driver Lead Importer

This is a plain HTML/CSS/JavaScript lead parser for the Google Sheet:

Spreadsheet ID:
1VDNPJdYZVfwSxMMgeTx0sfei-gGyJCDlCV_4iTLynzY

Tab:
Drivers data

## Local mode

Open `index.html` in a browser.

Leads are saved in browser localStorage. Use Export CSV to create a file that can be opened in Google Sheets.

## Google Sheet mode without end-user login

1. Open Google Apps Script while signed into the Google account that owns/has edit access to the spreadsheet.
2. Create a new Apps Script project.
3. Copy the contents of `google-apps-script/Code.gs` into the project.
4. Deploy > New deployment.
5. Select Web app.
6. Execute as: Me.
7. Who has access: Anyone.
8. Deploy and copy the Web app URL.
9. In `script.js`, set:
   const GOOGLE_SHEET_ENDPOINT = "YOUR_WEB_APP_URL";
10. Open the HTML app again.

The browser submits the lead to Apps Script through a hidden form, so the person using the lead importer does not need a Google login.

## Sheet columns

A Full name
B Phone number
C City
D How many years of commercial driving experience do you have?
E Do you have a valid commercial/transport driving licence?
F When can you join?
G Are you currently looking for a commercial vehicle driving job?
H Status

## Notes

- Duplicate detection is performed against leads stored in this browser.
- Google Sheet insertion uses `appendRow`, so the next available row is used.
- If the Google Sheet is shared publicly, that does NOT by itself give the browser permission to write. The Apps Script Web App is the write bridge.
- Keep the Apps Script Web App URL private enough for your use case. Anyone who obtains it may be able to submit rows to the sheet.
