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

Spreadsheet ID:
1lMj2VZb4g7-h-ZJ4815PKFJG28joqXtFmX76GOol5e8

Tab:
Cleaned Leads

Columns:
A Name
B Phone
C Age
D Licence
E Bike
F Joining Time
G Priority
H Status

## Bike Rider priority rules

1. Licence Yes + Bike Yes + Immediately = High
2. Any No + Immediately = Medium
3. Licence Yes + Bike Yes + not Immediately = Medium
4. Any No + not Immediately = Low

The parser normalizes answers such as Yes, yes, YES and Yess to Yes.

## Default status

Driver:
New

Bike Rider:
Not Open

## Deployment

The existing Google Apps Script Web App endpoint is already configured in script.js.

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
