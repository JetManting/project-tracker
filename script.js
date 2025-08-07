const sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTnkbiSpCQ3iSJLmYWT9P8qGpiqncZCeJ7OxGs-hBN5DMjy7J5sRmnD1YEIgVz85o1keqanALcPhANC/pub?output=csv";

function createBeam(project) {
  const stages = [
    +project.concept,
    +project.basico,
    +project.ejectivo,
    +project.construction,
    +project.pr
  ];

  const blocks = [];
  stages.forEach(score => {
    for (let i = 0; i < 5; i++) {
      blocks.push(i < score ? 'filled' : '');
    }
  });

  const labels = ['Concept', 'Basico', 'Ejectivo', 'Construction', 'PR'];
  return `
    <div class="progress-labels">
      ${labels.map(label => `<div>${label}</div>`).join('')}
    </div>
    <div class="progress-bar">
      ${blocks.map(state => `<div class="block ${state}"></div>`).join('')}
    </div>
  `;
}

function renderTable(data) {
  const table = document.getElementById("project-table");
  table.innerHTML = "";
  data.forEach((project, index) => {
    table.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${project.name}</strong><br><small>${project.what}</small></td>
        <td>${createBeam(project)}</td>
      </tr>
    `;
  });
}

fetch(sheetUrl)
  .then(response => response.text())
  .then(text => {
    const rows = text.trim().split("\n").slice(1);
    const data = rows.map(row => {
      const [name, what, concept, basico, ejectivo, construction, pr] = row.split(",");
      return {
        name,
        what,
        concept,
        basico,
        ejectivo,
        construction,
        pr
      };
    });
    renderTable(data);
  })
  .catch(error => {
    console.error("Error loading data:", error);
  });
