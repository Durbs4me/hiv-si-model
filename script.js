// -------------------------------
// GLOBAL STATE
// -------------------------------
let currentUser = null;
let chart = null;

// Backend API URL (update later)
const apiBase = "http://localhost:8000";

// -------------------------------
// AUTH (Mock for Dev)
// -------------------------------
function mockRegister() {
  const email = document.getElementById("userEmail").value;

  if (!email || !email.includes("@")) {
    document.getElementById("authSass").innerText =
      "Nice try. That’s not an email. Science requires standards.";
    return;
  }

  currentUser = {
    email: email,
    role: "casual", // casual | pending | pro
  };

  document.getElementById("authOverlay").classList.add("hidden");
  document.getElementById("mainApp").classList.remove("hidden");

  initChart();
}

// -------------------------------
// ACCESS CONTROL
// -------------------------------
function requestPro() {
  currentUser.role = "pending";
  const btn = document.getElementById("proBtn");
  btn.innerText = "Pending Review";
  btn.disabled = true;

  alert(
    "Your request has been logged. A human will review it. Science still needs humans."
  );
}

function toggleMode() {
  const isPro = currentUser.role === "pro";
  const toggle = document.getElementById("modeSwitch");
  const panel = document.getElementById("proControls");
  const label = document.getElementById("modeLabel");

  if (toggle.checked && !isPro) {
    alert("Professional mode requires approval. Patience.");
    toggle.checked = false;
    return;
  }

  if (toggle.checked && isPro) {
    panel.classList.add("pro-active");
    label.innerText = "Professional Mode";
  } else {
    panel.classList.remove("pro-active");
    label.innerText = "Casual Mode";
  }
}

// -------------------------------
// SIMULATION
// -------------------------------
async function runSimulation() {
  if (!chart) return;

  const params = {
    t_max: 200,
    therapy_start: 30,
    release_rate: 0.1,
    payload_type: "siRNA",
  };

  if (
    currentUser.role === "pro" &&
    document.getElementById("modeSwitch").checked
  ) {
    params.therapy_start = Number(
      document.getElementById("therapyStart").value
    );
    params.release_rate = Number(
      document.getElementById("releaseRate").value
    );
    params.payload_type = document.getElementById("payloadType").value;
  }

  try {
    const response = await fetch(`${apiBase}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    updateChart(data);
  } catch (err) {
    alert(
      "Backend unreachable. Either the server is down or the universe is testing us."
    );
  }
}

// -------------------------------
// CHARTS
// -------------------------------
function initChart() {
  const ctx = document.getElementById("hivChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Healthy T Cells",
          data: [],
          borderColor: "#0b3c5d",
          fill: false,
        },
        {
          label: "Viral Load",
          data: [],
          borderColor: "#ff0055",
          fill: false,
        },
        {
          label: "Latent Reservoir",
          data: [],
          borderColor: "#f39c12",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function updateChart(data) {
  chart.data.labels = data.time;
  chart.data.datasets[0].data = data.T;
  chart.data.datasets[1].data = data.V;
  chart.data.datasets[2].data = data.L;
  chart.update();
}

// -------------------------------
// ADMIN PANEL (DEV ONLY)
// -------------------------------
function showAdmin() {
  document.getElementById("adminPanel").classList.remove("hidden");
  renderPending();
}

function hideAdmin() {
  document.getElementById("adminPanel").classList.add("hidden");
}

function renderPending() {
  const list = document.getElementById("pendingList");

  if (currentUser && currentUser.role === "pending") {
    list.innerHTML = `
      <div>
        <strong>${currentUser.email}</strong>
        <br><br>
        <button onclick="approveUser()">Approve Researcher</button>
      </div>
    `;
  } else {
    list.innerText = "No pending researchers. Science sleeps… briefly.";
  }
}

function approveUser() {
  currentUser.role = "pro";
  alert("Access granted. Welcome to the serious end of the pool.");
  hideAdmin();
}
