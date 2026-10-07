# Driver Lead Importer

A simple lead importer for driver recruitment leads.

## What it does

1. Paste a lead response into the website.
2. Extracts:
   - Full name
   - Phone number
   - City
   - Commercial driving experience
   - Commercial/transport licence
   - Joining time
   - Job interest
   - Status
3. Shows a preview.
4. Saves a local browser backup using localStorage.
5. Sends the lead to the configured Google Sheet using a normal HTML form POST.
6. Exports locally saved leads to CSV.

## Google Sheet

Spreadsheet ID:

`1VDNPJdYZVfwSxMMgeTx0sfei-gGyJCDlCV_4iTLynzY`

Sheet tab:

`Drivers data`

Columns:

A. Full name  
B. Phone number  
C. City  
D. How many years of commercial driving experience do you have?  
E. Do you have a valid commercial/transport driving licence?  
F. When can you join?  
G. Are you currently looking for a commercial vehicle driving job?  
H. Status

## Google Apps Script

Use the `google-apps-script/Code.gs` file in this project.

Deploy it as a Web App:

- Execute as: Me
- Who has access: Anyone

The current website endpoint is already configured in `script.js`.

Current endpoint:

https://script.google.com/macros/s/AKfycbyHnVPsx-jXiX7IIma1-0HQ9J3Rha9-0RFzAPTI4q_wWrRWpidT0OYFO_QQyrQgAn-BdA/exec

## Important

After changing `Code.gs`, update the existing Web App deployment:

Deploy → Manage deployments → Edit → New version → Deploy

Do not create a completely separate deployment unless necessary.

## Manual test

In Apps Script, select `testAppend` and click Run.

It should add:

TEST DRIVER | +910000000000 | Test City | 2–5 years | Yes | Immediately | Test lead | TEST

to the `Drivers data` sheet.

## Website deployment

The project can be hosted on GitHub Pages or any static hosting service.

No Google login is required for the end user.

The Google Apps Script Web App handles the spreadsheet write.
