// Published CSV export of your Google Sheet
// Sheet columns (by header names): NO. | NAME | STATUS | WHAT | CONCEPT | BASICO | EJECUTIVO | CONSTRUCTION | PR | ACTIVE | NOTES
const sheetUrl =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vTnkbiSpCQ3iSJLmYWT9P8qGpiqncZCeJ7OxGs-hBN5DMjy7J5sRmnD1YEIgVz85o1keqanALcPhANC/pub?output=csv";

// ---------- small utils ----------
const norm = h =>
  (h || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z]/g, ""); // e.g. "NO." -> "no", "EJECUTIVO" -> "ejecutivo"

const num = v => {
  const n = Number((v || "").toString().trim());
  return Number.isFinite(n) ? n : 0;
};

// robust CSV line parser (handles quoted commas)
function parseCSVLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (ch === "," && !inQ) {
      out.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

// ---- PROGRESS BAR (cumulative fill) ----
function createBeam(project) {
  // stage scores (0–5 each)
  const stages = [
    num(project.concept),
    num(project.basico),
    num(project.ejecutivo),
    num(project.construction),
    num(project.pr)
  ].map(s => Math.max(0, Math.min(5, s)));

  // cumulative total across all 5 stages (0–25)
  const totalFilled = Math.max(
    0,
    Math.min(25, stages.reduce((a, b) => a + b, 0))
  );

  // build 25 blocks: first N are filled
  const blocks = Array.from({ length: 25 }, (_, i) =>
    i < totalFilled ? "filled" : ""
  );

  const labels = ["Concept", "Basico", "Ejecutivo", "Construction", "PR"];
  return `
    <div class="progress-labels">
      ${labels.map(l => `<div>${l}</div>`).join("")}
    </div>
    <div class="progress-bar">
      ${blocks.map(s => `<div class="block ${s}"></div>`).join("")}
    </div>
  `;
}

function renderTable(rows) {
  const tbody = document.getElementById("project-table");
  tbody.innerHTML = "";
  rows.forEach(r => {
    tbody.innerHTML += `
      <tr>
        <td>${r.no ?? ""}</td>
        <td>
          <strong>${r.name ?? ""}</strong>
          ${r.what ? `<br><small>${r.what}</small>` : ""}
        </td>
        <td>${r.status ?? ""}</td>
        <td>${createBeam(r)}</td>
        <td>${r.active ?? ""}</td>
        <td>${r.notes ?? ""}</td>
      </tr>
    `;
  });
}

fetch(sheetUrl)
  .then(res => res.text())
  .then(text => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return;

    const header = parseCSVLine(lines[0]).map(norm);
    const idx = Object.fromEntries(header.map((h, i) => [h, i]));

    const want = key => idx[key] ?? -1;
    const rows = lines.slice(1).map(line => {
      const cells = parseCSVLine(line);

      const get = key => {
        const i = want(key);
        return i >= 0 ? (cells[i] ?? "").trim() : "";
      };

      return {
        no:           get("no"),
        name:         get("name"),
        status:       get("status"),
        what:         get("what"),
        concept:      get("concept"),
        basico:       get("basico"),
        ejecutivo:    get("ejecutivo"),
        construction: get("construction"),
        pr:           get("pr"),
        active:       get("active"),
        notes:        get("notes")
      };
    });

    renderTable(rows);
  })
  .catch(err => console.error("Error loading data:", err));
