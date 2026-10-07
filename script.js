const STORAGE_KEY = "driverLeadImporter.leads.v1";

// Google Apps Script Web App URL
const GOOGLE_SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyqxnTMzDuxzIULSNIcWL1Pk5lD5WsXS-lk6Ppqlp0SNiZzo2C4U-CMO2yNJjVBEV6J1g/exec";
const HEADERS = {
  fullName: "Full name",
  phone: "Phone number",
  city: "City",
  experience:
    "How many years of commercial driving experience do you have?",
  licence:
    "Do you have a valid commercial/transport driving licence?",
  joining: "When can you join?",
  jobInterest:
    "Are you currently looking for a commercial vehicle driving job?",
  status: "Status"
};

const sample = `How many years of commercial driving experience do you have?

2–5 years

Do you have a valid commercial/transport driving licence?

Yes

When can you join?

Immediately

Are you currently looking for a commercial vehicle driving job?

I'm interested but need more information

Full name

Manja Manju

Phone number

+918971128308

City

Kannur`;

let currentLead = null;

const $ = (id) => document.getElementById(id);


/* =========================================================
   TEXT HELPERS
========================================================= */

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[“”"]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function findAnswer(text, labels) {
  const raw = text.split(/\r?\n/);
  const normalizedLabels = labels.map(normalize);

  for (let i = 0; i < raw.length; i++) {
    const line = normalize(raw[i]);

    if (!line) continue;

    const match = normalizedLabels.some(
      (label) => line === label || line.startsWith(label + ":")
    );

    if (!match) continue;

    // Example:
    // Full name: Manja Manju
    const colon = raw[i].indexOf(":");

    if (colon >= 0 && raw[i].slice(colon + 1).trim()) {
      return raw[i].slice(colon + 1).trim();
    }

    // Example:
    // Full name
    //
    // Manja Manju
    for (let j = i + 1; j < raw.length; j++) {
      if (raw[j].trim()) {
        return raw[j].trim();
      }
    }
  }

  return "";
}


/* =========================================================
   LEAD PARSER
========================================================= */

function parseLead(text) {
  const lead = {
    experience: findAnswer(text, [
      HEADERS.experience,
      "commercial driving experience",
      "driving experience"
    ]),

    licence: findAnswer(text, [
      HEADERS.licence,
      "valid commercial/transport driving licence",
      "valid commercial licence",
      "transport driving licence"
    ]),

    joining: findAnswer(text, [
      HEADERS.joining,
      "when can you join",
      "when can i join"
    ]),

    jobInterest: findAnswer(text, [
      HEADERS.jobInterest,
      "currently looking for a commercial vehicle driving job",
      "looking for a commercial vehicle driving job",
      "looking for a driving job"
    ]),

    fullName: findAnswer(text, [
      "Full name",
      "Name",
      "Full Name"
    ]),

    phone: findAnswer(text, [
      "Phone number",
      "Phone",
      "Mobile number",
      "Mobile"
    ]),

    city: findAnswer(text, [
      "City",
      "Location",
      "Current city"
    ]),

    status: "New"
  };

  // Clean phone number while keeping +
  lead.phone = lead.phone.replace(/[^\d+]/g, "");

  return lead;
}


/* =========================================================
   VALIDATION
========================================================= */

function validateLead(lead) {
  const missing = [];

  if (!lead.fullName) missing.push("Full name");
  if (!lead.phone) missing.push("Phone number");
  if (!lead.city) missing.push("City");
  if (!lead.experience) missing.push("Experience");
  if (!lead.licence) missing.push("Licence");
  if (!lead.joining) missing.push("Joining");
  if (!lead.jobInterest) missing.push("Job interest");

  return missing;
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getLeads() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    console.error("Could not read saved leads:", error);
    return [];
  }
}

function saveLeads(leads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}


/* =========================================================
   DUPLICATE CHECK
========================================================= */

function phoneKey(phone) {
  return String(phone || "")
    .replace(/\D/g, "")
    .slice(-10);
}

function isDuplicate(phone) {
  const key = phoneKey(phone);

  if (key.length < 10) {
    return false;
  }

  return getLeads().some(
    (lead) => phoneKey(lead.phone) === key
  );
}


/* =========================================================
   MESSAGE
========================================================= */

function showMessage(text, type = "ok") {
  const message = $("message");

  message.textContent = text;
  message.className = `message ${type}`;
}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]
  );
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}


/* =========================================================
   PREVIEW
========================================================= */

function renderPreview(lead) {
  const fields = [
    ["Full name", lead.fullName],
    ["Phone number", lead.phone],
    ["City", lead.city],
    ["Experience", lead.experience],
    ["Commercial licence", lead.licence],
    ["When can join", lead.joining],
    ["Job interest", lead.jobInterest],
    ["Status", lead.status]
  ];

  $("previewGrid").innerHTML = fields
    .map(
      ([label, value]) => `
        <div class="field">
          <label>${escapeHtml(label)}</label>
          <div>${escapeHtml(value)}</div>
        </div>
      `
    )
    .join("");

  $("previewStatus").textContent = lead.status || "New";
}


/* =========================================================
   SAVED LEADS TABLE
========================================================= */

function renderLeads() {
  const searchValue = $("searchInput").value;
  const query = normalize(searchValue);

  const allLeads = getLeads();

  const leads = allLeads.filter((lead) => {
    if (!query) return true;

    return [
      lead.fullName,
      lead.phone,
      lead.city,
      lead.status
    ].some((value) =>
      normalize(value).includes(query)
    );
  });

  $("leadCount").textContent = allLeads.length;

  $("leadsBody").innerHTML = leads
    .map(
      (lead) => `
        <tr>
          <td>${escapeHtml(lead.fullName)}</td>

          <td>${escapeHtml(lead.phone)}</td>

          <td>${escapeHtml(lead.city)}</td>

          <td>${escapeHtml(lead.experience)}</td>

          <td>${escapeHtml(lead.licence)}</td>

          <td>${escapeHtml(lead.joining)}</td>

          <td>${escapeHtml(lead.jobInterest)}</td>

          <td>
            <input
              class="status"
              value="${escapeAttr(lead.status || "New")}"
              onchange="updateStatus('${escapeAttr(
                lead.id
              )}', this.value)"
            >
          </td>

          <td>
            <button
              class="danger"
              onclick="deleteLead('${escapeAttr(
                lead.id
              )}')"
            >
              Delete
            </button>
          </td>
        </tr>
      `
    )
    .join("");

  $("emptyState").classList.toggle(
    "hidden",
    leads.length !== 0
  );
}


/* =========================================================
   UPDATE STATUS
========================================================= */

function updateStatus(id, status) {
  const leads = getLeads();

  const lead = leads.find(
    (item) => item.id === id
  );

  if (!lead) return;

  lead.status = status;

  saveLeads(leads);
  renderLeads();
}


/* =========================================================
   DELETE LEAD
========================================================= */

function deleteLead(id) {
  if (!confirm("Delete this saved lead?")) {
    return;
  }

  const leads = getLeads().filter(
    (lead) => lead.id !== id
  );

  saveLeads(leads);
  renderLeads();
}


/* =========================================================
   PROCESS LEAD
========================================================= */

function processLead() {
  const text = $("rawInput").value.trim();

  if (!text) {
    showMessage(
      "Paste the lead data first.",
      "error"
    );

    return;
  }

  const lead = parseLead(text);

  const missing = validateLead(lead);

  if (missing.length > 0) {
    showMessage(
      "Could not identify: " +
        missing.join(", "),
      "error"
    );

    return;
  }

  currentLead = lead;

  renderPreview(lead);

  $("previewSection").classList.remove(
    "hidden"
  );

  if (isDuplicate(lead.phone)) {
    $("duplicateWarning").textContent =
      "This phone number already exists in your local saved leads. You can still add it if this is intentional.";

    $("duplicateWarning").classList.remove(
      "hidden"
    );
  } else {
    $("duplicateWarning").classList.add(
      "hidden"
    );
  }

  showMessage(
    "Lead processed successfully."
  );

  $("previewSection").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================================================
   SEND LEAD TO GOOGLE SHEETS
========================================================= */

async function sendToGoogleSheet(lead) {
  try {
    /*
      We send the payload as text/plain.

      This avoids a browser CORS preflight request.
      Google Apps Script receives the JSON through:

      e.postData.contents
    */

    const response = await fetch(
      GOOGLE_SHEET_ENDPOINT,
      {
        method: "POST",

        mode: "cors",

        redirect: "follow",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body: JSON.stringify({
          fullName: lead.fullName,
          phone: lead.phone,
          city: lead.city,
          experience: lead.experience,
          licence: lead.licence,
          joining: lead.joining,
          jobInterest: lead.jobInterest,
          status: lead.status
        })
      }
    );

    const responseText =
      await response.text();

    console.log(
      "Google Apps Script response:",
      responseText
    );

    let result = null;

    try {
      result = JSON.parse(
        responseText
      );
    } catch (error) {
      console.warn(
        "Response was not JSON:",
        responseText
      );
    }

    if (
      result &&
      result.success === true
    ) {
      showMessage(
        "✅ Lead added successfully to Google Sheets."
      );

      return true;
    }

    showMessage(
      "⚠ Lead saved locally, but Google Sheets did not confirm the upload.",
      "error"
    );

    console.error(
      "Google Apps Script returned:",
      responseText
    );

    return false;

  } catch (error) {
    console.error(
      "Google Sheets connection error:",
      error
    );

    showMessage(
      "⚠ Lead saved locally, but Google Sheets connection failed.",
      "error"
    );

    return false;
  }
}


/* =========================================================
   ADD CURRENT LEAD
========================================================= */

async function addCurrentLead() {
  if (!currentLead) {
    showMessage(
      "Process a lead first.",
      "error"
    );

    return;
  }

  const leads = getLeads();

  // Check duplicate
  if (isDuplicate(currentLead.phone)) {
    const proceed = confirm(
      "This phone number already exists in local storage. Add this lead again?"
    );

    if (!proceed) {
      return;
    }
  }

  /*
    Create unique local ID
  */

  let leadId;

  if (
    typeof crypto !== "undefined" &&
    crypto.randomUUID
  ) {
    leadId = crypto.randomUUID();
  } else {
    leadId =
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2);
  }

  const lead = {
    ...currentLead,

    id: leadId,

    createdAt:
      new Date().toISOString()
  };

  /*
    First save locally.

    This means even if Google Sheets has
    a problem, the lead isn't lost.
  */

  leads.push(lead);

  saveLeads(leads);

  renderLeads();

  /*
    Send to Google Sheets
  */

  if (GOOGLE_SHEET_ENDPOINT) {
    await sendToGoogleSheet(lead);
  } else {
    showMessage(
      "Lead saved locally. Google Sheet endpoint is not configured yet.",
      "error"
    );
  }

  /*
    Clear input after saving
  */

  $("rawInput").value = "";

  currentLead = null;

  $("previewSection").classList.add(
    "hidden"
  );
}


/* =========================================================
   CSV EXPORT
========================================================= */

function exportCSV() {
  const leads = getLeads();

  if (!leads.length) {
    alert(
      "There are no saved leads to export."
    );

    return;
  }

  const rows = [
    Object.values(HEADERS),

    ...leads.map((lead) => [
      lead.fullName,
      lead.phone,
      lead.city,
      lead.experience,
      lead.licence,
      lead.joining,
      lead.jobInterest,
      lead.status
    ])
  ];

  const csv = rows
    .map((row) =>
      row
        .map(
          (value) =>
            `"${String(
              value ?? ""
            ).replace(/"/g, '""')}"`
        )
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(
    ["\ufeff" + csv],
    {
      type: "text/csv;charset=utf-8"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  link.download =
    "drivers-leads.csv";

  document.body.appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(url);
}


/* =========================================================
   BUTTON EVENTS
========================================================= */

$("processBtn").addEventListener(
  "click",
  processLead
);

$("addBtn").addEventListener(
  "click",
  addCurrentLead
);

$("editBtn").addEventListener(
  "click",
  () => {
    $("previewSection").classList.add(
      "hidden"
    );

    $("rawInput").focus();
  }
);

$("clearInputBtn").addEventListener(
  "click",
  () => {
    $("rawInput").value = "";

    $("message").className =
      "message hidden";

    currentLead = null;

    $("previewSection").classList.add(
      "hidden"
    );
  }
);

$("sampleBtn").addEventListener(
  "click",
  () => {
    $("rawInput").value = sample;

    $("message").className =
      "message hidden";
  }
);

$("searchInput").addEventListener(
  "input",
  renderLeads
);

$("exportBtn").addEventListener(
  "click",
  exportCSV
);

$("clearAllBtn").addEventListener(
  "click",
  () => {
    const leads = getLeads();

    if (!leads.length) {
      return;
    }

    if (
      confirm(
        "Delete all locally saved leads? This cannot be undone."
      )
    ) {
      localStorage.removeItem(
        STORAGE_KEY
      );

      renderLeads();

      showMessage(
        "All locally saved leads were deleted."
      );
    }
  }
);


/* =========================================================
   INITIAL LOAD
========================================================= */

renderLeads();
