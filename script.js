const STORAGE_KEY = "driverLeadImporter.leads.v1";
const GOOGLE_SHEET_ENDPOINT = ""; // Paste your deployed Google Apps Script Web App URL here.

const HEADERS = {
  fullName: "Full name",
  phone: "Phone number",
  city: "City",
  experience: "How many years of commercial driving experience do you have?",
  licence: "Do you have a valid commercial/transport driving licence?",
  joining: "When can you join?",
  jobInterest: "Are you currently looking for a commercial vehicle driving job?",
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

const $ = id => document.getElementById(id);

function normalize(s) {
  return String(s || "").toLowerCase().replace(/[“”"]/g, '"').replace(/\s+/g, " ").trim();
}

function lines(text) {
  return text.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
}

function findAnswer(text, labels) {
  const raw = text.split(/\r?\n/);
  const normalizedLabels = labels.map(normalize);

  for (let i = 0; i < raw.length; i++) {
    const line = normalize(raw[i]);
    if (!line) continue;

    const match = normalizedLabels.some(label => line === label || line.startsWith(label + ":"));
    if (!match) continue;

    const colon = raw[i].indexOf(":");
    if (colon >= 0 && raw[i].slice(colon + 1).trim()) return raw[i].slice(colon + 1).trim();

    for (let j = i + 1; j < raw.length; j++) {
      if (raw[j].trim()) return raw[j].trim();
    }
  }
  return "";
}

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
    fullName: findAnswer(text, ["Full name", "Name", "Full Name"]),
    phone: findAnswer(text, ["Phone number", "Phone", "Mobile number", "Mobile"]),
    city: findAnswer(text, ["City", "Location", "Current city"]),
    status: "New"
  };

  // Clean common copied formatting.
  lead.phone = lead.phone.replace(/[^\d+]/g, "");
  return lead;
}

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

function getLeads() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveLeads(leads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

function phoneKey(phone) {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

function isDuplicate(phone) {
  const key = phoneKey(phone);
  return getLeads().some(x => phoneKey(x.phone) === key && key.length >= 10);
}

function showMessage(text, type = "ok") {
  $("message").textContent = text;
  $("message").className = `message ${type}`;
}

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
  $("previewGrid").innerHTML = fields.map(([label, value]) =>
    `<div class="field"><label>${escapeHtml(label)}</label><div>${escapeHtml(value)}</div></div>`
  ).join("");
}

function renderLeads() {
  const q = normalize($("searchInput").value);
  const leads = getLeads().filter(x => !q || [x.fullName,x.phone,x.city,x.status].some(v => normalize(v).includes(q)));

  $("leadCount").textContent = getLeads().length;
  $("leadsBody").innerHTML = leads.map((x, i) => `
    <tr>
      <td>${escapeHtml(x.fullName)}</td>
      <td>${escapeHtml(x.phone)}</td>
      <td>${escapeHtml(x.city)}</td>
      <td>${escapeHtml(x.experience)}</td>
      <td>${escapeHtml(x.licence)}</td>
      <td>${escapeHtml(x.joining)}</td>
      <td>${escapeHtml(x.jobInterest)}</td>
      <td><input class="status" value="${escapeAttr(x.status || "New")}" onchange="updateStatus('${escapeAttr(x.id)}', this.value)"></td>
      <td><button class="danger" onclick="deleteLead('${escapeAttr(x.id)}')">Delete</button></td>
    </tr>
  `).join("");

  $("emptyState").classList.toggle("hidden", leads.length !== 0);
}

function updateStatus(id, status) {
  const leads = getLeads();
  const lead = leads.find(x => x.id === id);
  if (lead) {
    lead.status = status;
    saveLeads(leads);
    renderLeads();
  }
}

function deleteLead(id) {
  if (!confirm("Delete this saved lead?")) return;
  saveLeads(getLeads().filter(x => x.id !== id));
  renderLeads();
}

function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function escapeAttr(v) { return escapeHtml(v).replace(/`/g, "&#096;"); }

function processLead() {
  const text = $("rawInput").value.trim();
  if (!text) return showMessage("Paste the lead data first.", "error");

  const lead = parseLead(text);
  const missing = validateLead(lead);

  if (missing.length) {
    return showMessage("Could not identify: " + missing.join(", "), "error");
  }

  currentLead = lead;
  renderPreview(lead);
  $("previewSection").classList.remove("hidden");

  if (isDuplicate(lead.phone)) {
    $("duplicateWarning").textContent = "This phone number already exists in your local saved leads. You can still add it if this is intentional.";
    $("duplicateWarning").classList.remove("hidden");
  } else {
    $("duplicateWarning").classList.add("hidden");
  }

  showMessage("Lead processed successfully.");
  $("previewSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function addCurrentLead() {
  if (!currentLead) return;

  const leads = getLeads();
  if (isDuplicate(currentLead.phone)) {
    const proceed = confirm("This phone number already exists in local storage. Add this lead again?");
    if (!proceed) return;
  }

  const lead = {...currentLead, id: crypto.randomUUID(), createdAt: new Date().toISOString()};
  leads.push(lead);
  saveLeads(leads);
  renderLeads();

  if (GOOGLE_SHEET_ENDPOINT) {
    $("sheetPayload").value = JSON.stringify(lead);
    $("sheetForm").action = GOOGLE_SHEET_ENDPOINT;
    $("sheetForm").submit();
    showMessage("Lead saved locally and sent to the Google Sheet endpoint.");
  } else {
    showMessage("Lead saved locally. Google Sheet endpoint is not configured yet.");
  }

  $("rawInput").value = "";
  currentLead = null;
  $("previewSection").classList.add("hidden");
}

function exportCSV() {
  const leads = getLeads();
  if (!leads.length) return alert("There are no saved leads to export.");

  const rows = [Object.values(HEADERS), ...leads.map(x => [
    x.fullName, x.phone, x.city, x.experience, x.licence, x.joining, x.jobInterest, x.status
  ])];

  const csv = rows.map(row => row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], {type: "text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "drivers-leads.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

$("processBtn").addEventListener("click", processLead);
$("addBtn").addEventListener("click", addCurrentLead);
$("editBtn").addEventListener("click", () => {
  $("previewSection").classList.add("hidden");
  $("rawInput").focus();
});
$("clearInputBtn").addEventListener("click", () => {
  $("rawInput").value = "";
  $("message").className = "message hidden";
});
$("sampleBtn").addEventListener("click", () => $("rawInput").value = sample);
$("searchInput").addEventListener("input", renderLeads);
$("exportBtn").addEventListener("click", exportCSV);
$("clearAllBtn").addEventListener("click", () => {
  if (!getLeads().length) return;
  if (confirm("Delete all locally saved leads? This cannot be undone.")) {
    localStorage.removeItem(STORAGE_KEY);
    renderLeads();
  }
});

renderLeads();
