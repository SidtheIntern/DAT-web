// FAA Compliance Dashboard JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  const comboNumber = document.getElementById("combo-test-number")
  const drugNumber = document.getElementById("drug-test-number")
  const runButton = document.getElementById("run-randomizer")
  const resultsContent = document.getElementById("results-content")
  const loadingSpinner = document.getElementById("loading-spinner")
  const quarterSelect = document.getElementById("quarter")
  const yearSelect = document.getElementById("year")
  const navTabs = document.querySelectorAll(".nav-tab")

  // --- Initializations ---

  // Animate KPI values on page load
  const kpiValues = document.querySelectorAll(".kpi-value")
  kpiValues.forEach((value) => {
    const target = +value.dataset.target
    const isFloat = target % 1 !== 0
    const duration = 1500
    const stepTime = 20
    const steps = duration / stepTime
    const increment = target / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= target) {
        clearInterval(timer)
        value.textContent = isFloat ? target.toFixed(1) : target.toLocaleString()
      } else {
        value.textContent = isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString()
      }
    }, stepTime)
  })

  // --- Event Listeners ---

  // Navigation functionality
  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      navTabs.forEach((t) => t.classList.remove("active"))
      tab.classList.add("active")
      const page = tab.dataset.page
      if (page !== "home") {
        showNotification(`Navigating to ${tab.textContent.trim()}...`, "info")
      }
    })
  })

  // Input validation
  function validateInputs(input) {
    input.addEventListener("input", () => {
      const value = Math.max(0, Math.min(100, Number.parseInt(input.value) || 0))
      input.value = value
    })
  }
  validateInputs(comboNumber)
  validateInputs(drugNumber)

  // Run Randomizer button functionality
  runButton.addEventListener("click", () => {
    const comboPercent = comboNumber.value
    const drugPercent = drugNumber.value
    if (Number.parseInt(comboPercent) + Number.parseInt(drugPercent) > 100) {
      showNotification("Combined test percentages cannot exceed 100%", "error")
      return
    }
    if (Number.parseInt(comboPercent) === 0 && Number.parseInt(drugPercent) === 0) {
      showNotification("Please enter at least one test percentage.", "error")
      return
    }

    resultsContent.classList.add("hidden")
    loadingSpinner.classList.remove("hidden")
    runButton.disabled = true

    setTimeout(() => {
      generateResults(comboPercent, drugPercent, quarterSelect.value, yearSelect.value)
    }, 2000)
  })

  // --- Core Functions ---

  function generateResults(comboPercent, drugPercent, quarter, year) {
    const totalEmployees = 1247
    const comboCount = Math.round((totalEmployees * comboPercent) / 100)
    const drugCount = Math.round((totalEmployees * drugPercent) / 100)
    const employees = generateMockEmployees(comboCount, drugCount)

    const resultsHTML = `
      <h2 class="section-title">Random Selection Results</h2>
      <div class="card">
        <div class="results-summary">
          <div class="summary-grid">
            <div class="summary-card">
              <span class="summary-value">${comboCount}</span>
              <span class="summary-label">Combo Tests</span>
            </div>
            <div class="summary-card">
              <span class="summary-value">${drugCount}</span>
              <span class="summary-label">Drug Tests</span>
            </div>
            <div class="summary-card">
              <span class="summary-value">${employees.length}</span>
              <span class="summary-label">Total Selected</span>
            </div>
          </div>
          <div class="employee-table-container">
            <div class="employee-table-wrapper" id="table-wrapper">
              <table class="employee-table">
                <thead>
                  <tr>
                    <th>Employee ID</th><th>Name</th><th>Department</th><th>Position</th><th>Test Type</th><th>Hire Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${employees
                    .map(
                      (emp) => `
                    <tr>
                      <td class="employee-id">${emp.id}</td>
                      <td>${emp.firstName} ${emp.lastName}</td>
                      <td>${emp.department}</td>
                      <td>${emp.position}</td>
                      <td><span class="test-type-badge test-type-${emp.testType.toLowerCase()}">${emp.testType === "Combo" ? "Drug & Alcohol" : emp.testType}</span></td>
                      <td>${emp.hireDate}</td>
                    </tr>`,
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
          <div class="results-actions">
            <button class="action-button save" onclick="saveResults()"><div class="icon-save"></div>Save Results</button>
            <button class="action-button download" id="download-btn" onclick="downloadResults()" disabled><div class="icon-download"></div>Download Results</button>
            <button class="action-button clear" onclick="clearResults()"><div class="icon-clear"></div>Clear Results</button>
          </div>
        </div>
      </div>`

    loadingSpinner.classList.add("hidden")
    resultsContent.innerHTML = resultsHTML
    resultsContent.classList.remove("hidden")
    runButton.disabled = false
    window.resultsSaved = false
  }

  // --- Global Helper Functions ---

  window.saveResults = () => {
    const saveButton = document.querySelector(".action-button.save")
    const downloadButton = document.getElementById("download-btn")
    saveButton.disabled = true
    saveButton.innerHTML =
      '<div class="spinner" style="width:16px;height:16px;border-width:2px;border-top-color:var(--success-text);"></div> Saving...'
    setTimeout(() => {
      saveButton.innerHTML = '<div class="icon-save"></div>Results Saved'
      downloadButton.disabled = false
      window.resultsSaved = true
      showNotification("Results saved successfully!", "success")
    }, 1500)
  }

  window.downloadResults = () => {
    if (!window.resultsSaved) {
      showNotification("Please save results before downloading.", "error")
      return
    }
    showNotification("Generating CSV file for download...", "info")
    const csvContent = generateCSVContent()
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `FAA_Randomization_Results_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  window.clearResults = () => {
    if (confirm("Are you sure you want to clear the current results? This action cannot be undone.")) {
      resultsContent.innerHTML = `
        <h2 class="section-title">Random Selection Results</h2>
        <div class="card">
            <div class="placeholder-content">
                <div class="placeholder-icon"><div class="icon-clipboard"></div></div>
                <h3 class="placeholder-title">Awaiting Configuration</h3>
                <p class="placeholder-text">Configure and run the randomizer to generate employee selection results.</p>
            </div>
        </div>`
      window.resultsSaved = false
    }
  }

  function generateCSVContent() {
    const table = document.querySelector(".employee-table")
    const headers = Array.from(table.querySelectorAll("thead th"))
      .map((th) => `"${th.textContent}"`)
      .join(",")
    const rows = Array.from(table.querySelectorAll("tbody tr")).map((row) =>
      Array.from(row.querySelectorAll("td"))
        .map((td) => `"${td.textContent}"`)
        .join(","),
    )
    return [headers, ...rows].join("\n")
  }

  function showNotification(message, type = "info") {
    const notification = document.createElement("div")
    notification.className = `notification ${type}`
    notification.textContent = message

    const style = document.createElement("style")
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 1001;
        font-weight: 500;
        border-left: 4px solid;
        transform: translateX(calc(100% + 20px));
        transition: transform 0.4s ease-in-out;
      }
      .notification.show { transform: translateX(0); }
      .notification.info { background-color: var(--bg-subtle); color: var(--text-secondary); border-color: var(--atlas-gold); }
      .notification.success { background-color: var(--success-bg); color: var(--success-text); border-color: var(--success-text); }
      .notification.error { background-color: var(--danger-bg); color: var(--danger-text); border-color: var(--danger-text); }
    `
    document.head.appendChild(style)
    document.body.appendChild(notification)

    setTimeout(() => notification.classList.add("show"), 100)
    setTimeout(() => {
      notification.classList.remove("show")
      setTimeout(() => document.body.removeChild(notification), 400)
    }, 4000)
  }

  function generateMockEmployees(comboCount, drugCount) {
    const f = [
      "John",
      "Sarah",
      "Michael",
      "Jennifer",
      "David",
      "Lisa",
      "Robert",
      "Maria",
      "James",
      "Patricia",
      "William",
      "Linda",
      "Richard",
      "Barbara",
      "Joseph",
      "Susan",
    ]
    const l = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
      "Hernandez",
      "Lopez",
      "Gonzalez",
      "Wilson",
      "Anderson",
    ]
    const d = ["Flight Ops", "Maintenance", "Ground Ops", "Cargo", "Admin", "Safety", "Training"]
    const p = ["Pilot", "Mechanic", "Ground Crew", "Supervisor", "Manager", "Technician", "Coordinator"]
    const e = []
    let id = 1001
    for (let i = 0; i < comboCount; i++) {
      e.push({
        id: `AA${id++}`,
        firstName: f[Math.floor(Math.random() * f.length)],
        lastName: l[Math.floor(Math.random() * l.length)],
        department: d[Math.floor(Math.random() * d.length)],
        position: p[Math.floor(Math.random() * p.length)],
        testType: "Combo",
        hireDate: new Date(
          2018 + Math.floor(Math.random() * 6),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1,
        ).toLocaleDateString(),
      })
    }
    for (let i = 0; i < drugCount; i++) {
      e.push({
        id: `AA${id++}`,
        firstName: f[Math.floor(Math.random() * f.length)],
        lastName: l[Math.floor(Math.random() * l.length)],
        department: d[Math.floor(Math.random() * d.length)],
        position: p[Math.floor(Math.random() * p.length)],
        testType: "Drug",
        hireDate: new Date(
          2018 + Math.floor(Math.random() * 6),
          Math.floor(Math.random() * 12),
          Math.floor(Math.random() * 28) + 1,
        ).toLocaleDateString(),
      })
    }
    return e.sort(() => Math.random() - 0.5)
  }
})
