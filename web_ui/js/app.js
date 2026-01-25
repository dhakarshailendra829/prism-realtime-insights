const API_BASE = "http://127.0.0.1:8000";

let isRunning = false;
let timer = null;
const history = [];

// Industry-grade color palette for the chart
const THEME = {
    primary: '#38bdf8',
    secondary: '#818cf8',
    neon: '#2dd4bf',
    danger: '#f43f5e',
    grid: 'rgba(255, 255, 255, 0.05)',
    text: '#94a3b8'
};

function getElements() {
    return {
        domainSelect: document.getElementById("domain-select"),
        thresholdSlider: document.getElementById("threshold-slider"),
        thresholdValue: document.getElementById("threshold-value"),
        totalCountEl: document.getElementById("total-count"),
        startBtn: document.getElementById("start-btn"),
        stopBtn: document.getElementById("stop-btn"),
        livePill: document.getElementById("live-pill"),
        connStatus: document.getElementById("conn_status"),
        connLight: document.getElementById("conn_light"),
        cardScore: document.getElementById("card-score"),
        scoreTag: document.getElementById("score-tag"),
        alertText: document.getElementById("alert-text"),
        alertMeta: document.getElementById("alert-meta"),
        logBody: document.getElementById("log-body")
    };
}

const elements = getElements();

// --- CHART INITIALIZATION ---
let realtimeChart = null;
const canvas = document.getElementById("realtime-chart");
if (canvas) {
    const ctx = canvas.getContext("2d");
    
    // Create a gradient for the chart area
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
    gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');

    realtimeChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: "Stream Magnitude",
                data: [],
                borderColor: THEME.primary,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4,
                pointRadius: 0, // Hidden for a cleaner look
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: THEME.text }, grid: { color: THEME.grid } },
                y: { ticks: { color: THEME.text }, grid: { color: THEME.grid } }
            },
            plugins: {
                legend: { display: false } // Hide legend for cleaner UI
            },
            animation: { duration: 400, easing: 'easeOutQuart' }
        }
    });
}

// --- DATA LOGIC ---
async function nextPoint() {
    try {
        const domain = elements.domainSelect.value;
        const threshold = Number(elements.thresholdSlider?.value || 0);
        const res = await fetch(`${API_BASE}/api/next?domain=${encodeURIComponent(domain)}&threshold=${threshold}`);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const payload = await res.json();
        const { data, result } = payload;
        const timeStr = new Date().toTimeString().slice(0, 8);

        const point = {
            time: timeStr,
            value: data.value,
            score: result.score || 0,
            anomaly: result.is_anomaly || 0,
            insight: result.latest_summary || "Data syncing...",
            unit: data.unit || ""
        };

        history.push(point);
        if (history.length > 50) history.shift();
        
        updateUI(point);
    } catch (error) {
        console.error('Connection Lost:', error);
        elements.connStatus.textContent = "ENGINE ERROR";
        elements.connLight.style.backgroundColor = THEME.danger;
    }
}

function updateUI(last) {
    // 1. Update Numbers
    elements.cardScore.textContent = last.score.toFixed(3);
    elements.totalCountEl.textContent = history.length;
    
    // 2. Status Indicator
    if (last.anomaly) {
        elements.scoreTag.textContent = "ANOMALY DETECTED";
        elements.scoreTag.className = "status-tag anomaly";
    } else {
        elements.scoreTag.textContent = "STABLE";
        elements.scoreTag.className = "status-tag normal";
    }

    // 3. Insight Text
    elements.alertText.textContent = last.insight;
    elements.alertMeta.textContent = `Timestamp: ${last.time} | Mode: Active Analysis`;

    // 4. Update Table
    updateTable();

    // 5. Update Chart
    if (realtimeChart) {
        realtimeChart.data.labels.push(last.time);
        realtimeChart.data.datasets[0].data.push(last.value);
        if (realtimeChart.data.labels.length > 20) {
            realtimeChart.data.labels.shift();
            realtimeChart.data.datasets[0].data.shift();
        }
        realtimeChart.update('none');
    }
}

function updateTable() {
    const recent = [...history].reverse().slice(0, 10);
    elements.logBody.innerHTML = recent.map(row => `
        <tr>
            <td class="font-mono">${row.time}</td>
            <td class="font-mono">${typeof row.value === 'number' ? row.value.toFixed(2) : row.value}</td>
            <td>${row.insight}</td>
            <td class="font-mono">${row.score.toFixed(2)}</td>
            <td><span class="status-tag ${row.anomaly ? 'anomaly' : 'normal'}">${row.anomaly ? 'CRITICAL' : 'OK'}</span></td>
        </tr>
    `).join('');
}

// --- CONTROLS ---
function setLive(on) {
    isRunning = on;
    elements.startBtn.disabled = on;
    elements.stopBtn.disabled = !on;
    
    if (on) {
        elements.connStatus.textContent = "SYSTEM LIVE";
        elements.connLight.style.backgroundColor = THEME.neon;
        elements.livePill.className = "status-pill";
        elements.livePill.innerHTML = `<span class="pill-text">ANALYSIS ACTIVE</span>`;
    } else {
        elements.connStatus.textContent = "SYSTEM STANDBY";
        elements.connLight.style.backgroundColor = THEME.text;
        elements.livePill.className = "status-pill status-pill--off";
        elements.livePill.innerHTML = `<span class="pill-text">ENGINE STANDBY</span>`;
    }
}

elements.startBtn.addEventListener("click", () => {
    if (isRunning) return;
    setLive(true);
    timer = setInterval(nextPoint, 1000);
});

elements.stopBtn.addEventListener("click", () => {
    clearInterval(timer);
    setLive(false);
});

// Sync Threshold Slider
elements.thresholdSlider.addEventListener("input", (e) => {
    elements.thresholdValue.textContent = Number(e.target.value).toFixed(1);
});