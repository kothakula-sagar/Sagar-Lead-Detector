# Sagar Lead Detector

One static website for both Driver and Bike Rider leads.

## Automatic lead detection

Driver:
- Detects the commercial driving experience question.
- Sends the lead to the Driver spreadsheet.

Bike Rider:
- Detects the bike/motorcycle question and driving licence question.
- Sends the lead to the Bike Rider spreadsheet.

## Driver Google Sheet

Spreadsheet ID:
1VDNPJdYZVfwSxMMgeTx0sfei-gGyJCDlCV_4iTLynzY

Tab:
Drivers data

Columns:
A Full name
B Phone number
C City
D Experience
E Licence
F Joining
G Job Interest
H Status

## Bike Rider Google Sheet

Spreadsheet ID: 1ESrzl-G6pUz7TIeA1XL3X7I7qK9f0Yur4FNfShSHI1g
Tab: Sheet1

Columns, in order: Full name, Phone number, City, Available to work in Bengaluru,
Valid two-wheeler licence, Android smartphone, Delivery riding experience,
Joining availability, Priority, Status, Age (optional), Own bike (optional), Imported at.

The current Bengaluru form and legacy rider form are supported. Markdown bold
answers are cleaned. Age and own bike are optional for the current form.
Current-form High priority requires Bengaluru availability, licence and Android
all Yes plus immediate joining; otherwise all Yes is Medium, and any No is Low.
Legacy priority retains licence + bike + joining rules.

## Default status

Driver:
New

Bike Rider:
Not Open

## Deployment

The existing Google Apps Script Web App endpoint is configured in script.js.
Updating GitHub does NOT deploy Apps Script. Copy google-apps-script/Code.gs into
the existing Apps Script project and deploy a new version before importing riders.
The deploying Google account must have edit access to the destination sheet.
The hidden iframe cannot confirm the response; the UI reports submission as
unconfirmed. Check the sheet before retrying. Use Process Lead then Add Lead.
Do not insert the example candidate as a real lead unless intended.

After replacing Code.gs:
Deploy → Manage deployments → Edit → New version → Deploy

Keep:
Execute as: Me
Who has access: Anyone

No end-user Google login is required.

## UI

The Saved Leads table includes:
- All Leads filter
- Drivers filter
- Bike Riders filter
- Search
- CSV export
- Status editing
- Delete

The table has a fixed maximum height with vertical scrolling and a sticky header, so a large number of leads will not make the whole page enormous.

## Testing

Apps Script functions:
- testDriverAppend()
- testBikeRiderAppend()

Run them manually if you want to verify write permissions to each spreadsheet.

