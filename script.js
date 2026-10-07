const STORAGE_KEY = "driverLeadImporter.leads.v2";

/*
  Google Apps Script Web App endpoint.
  The Apps Script routes Driver and Bike Rider leads
  to their respective spreadsheets.
*/
const GOOGLE_SHEET_ENDPOINT =
  "https://script.google.com/macros/s/AKfycbyHnVPsx-jXiX7IIma1-0HQ9J3Rha9-0RFzAPTI4q_wWrRWpidT0OYFO_QQyrQgAn-BdA/exec";

const sampleDriver = `How many years of commercial driving experience do you have?

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

const sampleBikeRider = `Age

36+

Do you have a valid driving licence?

Yess

Do you have your own bike/motorcycle?

Yes

When can you join?

Immediately

Full name

Mohd Shahid

Phone number

+917905830575`;

let currentLead = null;
let activeFilter = "all";

const $ = (id) => document.getElementById(id);


/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[“”"]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function findAnswer(text, labels) {
  const lines = text.split(/\r?\n/);
  const normalizedLabels = labels.map(normalize);

  for (let i = 0; i < lines.length; i++) {
    const line = normalize(lines[i]);

    if (!line) continue;

    const match = normalizedLabels.some(
      (label) => line === label || line.startsWith(label + ":")
    );

    if (!match) continue;

    const colonIndex = lines[i].indexOf(":");

    if (colonIndex >= 0 && lines[i].slice(colonIndex + 1).trim()) {
      return lines[i].slice(colonIndex + 1).trim();
    }

    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].trim()) {
        return lines[j].trim();
      }
    }
  }

  return "";
}

function normalizeYesNo(value) {
  const text = normalize(value);

  if (
    text === "yes" ||
    text === "yess" ||
    text === "y" ||
    text.startsWith("yes ")
  ) {
    return "Yes";
  }

  if (
    text === "no" ||
    text === "n" ||
    text.startsWith("no ")
  ) {
    return "No";
  }

  return String(value || "").trim();
}

function isImmediately(value) {
  return normalize(value).includes("immediately");
}

function getPriority(licence, bike, joining) {
  const licenceYes = normalizeYesNo(licence) === "Yes";
  const bikeYes = normalizeYesNo(bike) === "Yes";
  const immediate = isImmediately(joining);

  if (licenceYes && bikeYes && immediate) {
    return "High";
  }

  if (immediate) {
    return "Medium";
  }

  if (licenceYes && bikeYes) {
    return "Medium";
  }

  return "Low";
}


/* =========================================================
   LEAD TYPE DETECTION
========================================================= */

function detectLeadType(text) {
  const normalizedText = normalize(text);

  const isDriver =
    normalizedText.includes(
      normalize(
        "How many years of commercial driving experience do you have?"
      )
    );

  const isBikeRider =
    normalizedText.includes(
      normalize("Do you have your own bike/motorcycle?")
    ) ||
    (
      normalizedText.includes(normalize("Age")) &&
      normalizedText.includes(
        normalize("Do you have a valid driving licence?")
      )
    );

  if (isDriver && !isBikeRider) {
    return "driver";
  }

  if (isBikeRider && !isDriver) {
    return "bike_rider";
  }

  if (isDriver && isBikeRider) {
    return "unknown";
  }

  return "unknown";
}


/* =========================================================
   PARSERS
========================================================= */

function parseDriverLead(text) {
  return {
    leadType: "driver",
    fullName: findAnswer(text, ["Full name", "Name", "Full Name"]),
    phone: findAnswer(text, ["Phone number", "Phone", "Mobile number", "Mobile"]),
    city: findAnswer(text, ["City", "Location", "Current city"]),
    experience: findAnswer(text, [
      "How many years of commercial driving experience do you have?",
      "commercial driving experience",
      "driving experience"
    ]),
    licence: findAnswer(text, [
      "Do you have a valid commercial/transport driving licence?",
      "valid commercial/transport driving licence",
      "valid commercial licence",
      "transport driving licence"
    ]),
    joining: findAnswer(text, [
      "When can you join?",
      "when can you join",
      "when can i join"
    ]),
    jobInterest: findAnswer(text, [
      "Are you currently looking for a commercial vehicle driving job?",
      "currently looking for a commercial vehicle driving job",
      "looking for a commercial vehicle driving job",
      "looking for a driving job"
    ]),
    status: "New",
    priority: ""
  };
}

function parseBikeRiderLead(text) {
  const licence = findAnswer(text, [
    "Do you have a valid driving licence?",
    "valid driving licence",
    "driving licence"
  ]);

  const bike = findAnswer(text, [
    "Do you have your own bike/motorcycle?",
    "own bike/motorcycle",
    "own bike",
    "own motorcycle"
  ]);

  const joining = findAnswer(text, [
    "When can you join?",
    "when can you join",
    "when can i join"
  ]);

  return {
    leadType: "bike_rider",
    fullName: findAnswer(text, ["Full name", "Name", "Full Name"]),
    phone: findAnswer(text, ["Phone number", "Phone", "Mobile number", "Mobile"]),
    age: findAnswer(text, ["Age", "Your age"]),
    licence,
    bike,
    joining,
    priority: getPriority(licence, bike, joining),
    status: "Not Open"
  };
}


/* =========================================================
   VALIDATION
========================================================= */

function validateLead(lead) {
  const missing = [];

  if (!lead.fullName) missing.push("Full name");
  if (!lead.phone) missing.push("Phone number");

  if (lead.leadType === "driver") {
    if (!lead.city) missing.push("City");
    if (!lead.experience) missing.push("Experience");
    if (!lead.licence) missing.push("Licence");
    if (!lead.joining) missing.push("Joining");
    if (!lead.jobInterest) missing.push("Job interest");
  }

  if (lead.leadType === "bike_rider") {
    if (!lead.age) missing.push("Age");
    if (!lead.licence) missing.push("Licence");
    if (!lead.bike) missing.push("Bike");
    if (!lead.joining) missing.push("Joining");
  }

  return missing;
}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function getLeads() {
  try {
    const current =
      JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    /*
      Recover old leads saved under the previous storage key.
      Old leads were Drivers, so classify them as Driver.
    */
    const old =
      JSON.parse(
        localStorage.getItem(
          "driverLeadImporter.leads.v1"
        )
      ) || [];

    const migratedOld = old.map((lead) => ({
      ...lead,
      leadType: lead.leadType || "driver",
      priority: lead.priority || "",
      status: lead.status || "New"
    }));

    const existingIds = new Set(
      current.map((lead) => lead.id)
    );

    const merged = [
      ...current,
      ...migratedOld.filter(
        (lead) => !existingIds.has(lead.id)
      )
    ];

    return merged;
  } catch (error) {
    console.error("Could not read saved leads:", error);
    return [];
  }
}

function saveLeads(leads) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(leads)
  );
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
   UI
========================================================= */

function showMessage(text, type = "ok") {
  const message = $("message");

  message.textContent = text;
  message.className = `message ${type}`;
}

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

function leadTypeLabel(type) {
  return type === "bike_rider"
    ? "🏍️ Bike Rider"
    : "🚛 Driver";
}

function renderPreview(lead) {
  let fields = [];

  if (lead.leadType === "driver") {
    fields = [
      ["Lead Type", "🚛 Driver"],
      ["Full name", lead.fullName],
      ["Phone number", lead.phone],
      ["City", lead.city],
      ["Experience", lead.experience],
      ["Commercial licence", lead.licence],
      ["When can join", lead.joining],
      ["Job interest", lead.jobInterest],
      ["Status", lead.status]
    ];
  } else {
    fields = [
      ["Lead Type", "🏍️ Bike Rider"],
      ["Full name", lead.fullName],
      ["Phone number", lead.phone],
      ["Age", lead.age],
      ["Licence", lead.licence],
      ["Own bike", lead.bike],
      ["Joining time", lead.joining],
      ["Priority", lead.priority],
      ["Status", lead.status]
    ];
  }

  $("leadTypeBadge").textContent =
    leadTypeLabel(lead.leadType);

  $("previewTitle").textContent =
    `${leadTypeLabel(lead.leadType)} Lead Detected`;

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

  $("previewStatus").textContent =
    lead.status || "New";
}


/* =========================================================
   SAVED LEADS TABLE
========================================================= */

function renderLeads() {
  const searchValue = $("searchInput").value;
  const query = normalize(searchValue);

  const allLeads = getLeads();

  const filtered = allLeads.filter((lead) => {
    const typeMatches =
      activeFilter === "all" ||
      (lead.leadType || "driver") === activeFilter;

    if (!typeMatches) return false;

    if (!query) return true;

    return [
      lead.fullName,
      lead.phone,
      lead.city,
      lead.age,
      lead.experience,
      lead.status,
      lead.priority,
      lead.leadType
    ].some((value) =>
      normalize(value).includes(query)
    );
  });

  $("leadCount").textContent =
    allLeads.length;

  $("leadsBody").innerHTML =
    filtered
      .map((lead) => {
        const isBike =
          lead.leadType === "bike_rider";

        const typeClass = isBike
          ? "type-bike"
          : "type-driver";

        const ageExperience = isBike
          ? lead.age || ""
          : lead.experience || "";

        const city = isBike
          ? "-"
          : lead.city || "";

        const bike = isBike
          ? lead.bike || ""
          : "-";

        const priority = isBike
          ? lead.priority || ""
          : "-";

        const priorityClass =
          priority === "High"
            ? "priority-high"
            : priority === "Medium"
              ? "priority-medium"
              : priority === "Low"
                ? "priority-low"
                : "";

        return `
          <tr>
            <td class="${typeClass}">
              ${escapeHtml(leadTypeLabel(lead.leadType))}
            </td>

            <td>${escapeHtml(lead.fullName)}</td>

            <td>${escapeHtml(lead.phone)}</td>

            <td>${escapeHtml(ageExperience)}</td>

            <td>${escapeHtml(city)}</td>

            <td>${escapeHtml(lead.licence)}</td>

            <td>${escapeHtml(bike)}</td>

            <td>${escapeHtml(lead.joining)}</td>

            <td class="${priorityClass}">
              ${escapeHtml(priority)}
            </td>

            <td>
              <input
                class="status"
                value="${escapeAttr(lead.status || (isBike ? "Not Open" : "New"))}"
                onchange="updateStatus('${escapeAttr(lead.id)}', this.value)"
              >
            </td>

            <td>
              <button
                class="danger"
                onclick="deleteLead('${escapeAttr(lead.id)}')"
              >
                Delete
              </button>
            </td>
          </tr>
        `;
      })
      .join("");

  $("emptyState").classList.toggle(
    "hidden",
    filtered.length !== 0
  );
}

function setFilter(filter) {
  activeFilter = filter;

  document
    .querySelectorAll(".filter-btn")
    .forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.filter === filter
      );
    });

  renderLeads();
}


/* =========================================================
   UPDATE / DELETE
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

  const leadType = detectLeadType(text);

  if (leadType === "unknown") {
    showMessage(
      "Lead type could not be detected. Make sure the pasted form contains either the commercial driving experience question or the bike rider questions.",
      "error"
    );
    return;
  }

  const lead =
    leadType === "driver"
      ? parseDriverLead(text)
      : parseBikeRiderLead(text);

  const missing = validateLead(lead);

  if (missing.length > 0) {
    showMessage(
      `${leadTypeLabel(leadType)} detected, but missing: ${missing.join(", ")}`,
      "error"
    );
    return;
  }

  lead.phone =
    lead.phone.replace(/[^\d+]/g, "");

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
    `${leadTypeLabel(leadType)} lead detected successfully.`
  );

  $("previewSection").scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}


/* =========================================================
   SEND TO GOOGLE APPS SCRIPT
========================================================= */

function sendToGoogleSheet(lead) {
  return new Promise((resolve) => {
    try {
      const form =
        document.createElement("form");

      form.method = "POST";
      form.action = GOOGLE_SHEET_ENDPOINT;
      form.target = "googleSheetTarget";
      form.style.display = "none";

      /*
        leadType tells Apps Script which spreadsheet
        should receive this lead.
      */

      const fields = {
        leadType: lead.leadType,
        fullName: lead.fullName,
        phone: lead.phone,

        city: lead.city || "",

        experience:
          lead.experience || "",

        age:
          lead.age || "",

        licence:
          lead.licence || "",

        bike:
          lead.bike || "",

        joining:
          lead.joining || "",

        jobInterest:
          lead.jobInterest || "",

        priority:
          lead.priority || "",

        status:
          lead.status ||
          (lead.leadType === "bike_rider"
            ? "Not Open"
            : "New")
      };

      Object.entries(fields).forEach(
        ([name, value]) => {
          const input =
            document.createElement("input");

          input.type = "hidden";
          input.name = name;
          input.value = value || "";

          form.appendChild(input);
        }
      );

      document.body.appendChild(form);
      form.submit();

      setTimeout(() => {
        form.remove();

        showMessage(
          `✅ ${leadTypeLabel(lead.leadType)} lead sent to Google Sheets successfully.`
        );

        resolve(true);
      }, 1200);

    } catch (error) {
      console.error(
        "Google Sheets submission error:",
        error
      );

      showMessage(
        "⚠ Lead saved locally, but Google Sheets submission failed.",
        "error"
      );

      resolve(false);
    }
  });
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

  if (isDuplicate(currentLead.phone)) {
    const proceed = confirm(
      "This phone number already exists in local storage. Add this lead again?"
    );

    if (!proceed) return;
  }

  const lead = {
    ...currentLead,
    id:
      typeof crypto !== "undefined" &&
      crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now() +
          "-" +
          Math.random()
            .toString(36)
            .substring(2),
    createdAt:
      new Date().toISOString()
  };

  leads.push(lead);

  saveLeads(leads);
  renderLeads();

  await sendToGoogleSheet(lead);

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
    [
      "Lead Type",
      "Name",
      "Phone",
      "Age",
      "Experience",
      "City",
      "Licence",
      "Bike",
      "Joining",
      "Job Interest",
      "Priority",
      "Status"
    ],

    ...leads.map((lead) => [
      lead.leadType === "bike_rider"
        ? "Bike Rider"
        : "Driver",
      lead.fullName,
      lead.phone,
      lead.age || "",
      lead.experience || "",
      lead.city || "",
      lead.licence || "",
      lead.bike || "",
      lead.joining || "",
      lead.jobInterest || "",
      lead.priority || "",
      lead.status || ""
    ])
  ];

  const csv = rows
    .map((row) =>
      row
        .map(
          (value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
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
  link.download = "all-driver-bike-rider-leads.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}


/* =========================================================
   EVENTS
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
    /*
      Toggle sample type so you can quickly test both.
    */
    const current =
      $("rawInput").value.trim();

    $("rawInput").value =
      current === sampleDriver
        ? sampleBikeRider
        : sampleDriver;

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

    if (!leads.length) return;

    if (
      confirm(
        "Delete all locally saved leads? This cannot be undone."
      )
    ) {
      localStorage.removeItem(
        STORAGE_KEY
      );

      localStorage.removeItem(
        "driverLeadImporter.leads.v1"
      );

      renderLeads();

      showMessage(
        "All locally saved leads were deleted."
      );
    }
  }
);

document
  .querySelectorAll(".filter-btn")
  .forEach((button) => {
    button.addEventListener(
      "click",
      () => setFilter(
        button.dataset.filter
      )
    );
  });


/* =========================================================
   INITIAL LOAD
========================================================= */

renderLeads();
