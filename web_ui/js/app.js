const API_BASE = "http://127.0.0.1:8000";

let isRunning = false;
let timer = null;
const history = [];

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
        cardProcessed: document.getElementById("card-processed"),
        cardLatest: document.getElementById("card-latest"),
        cardScore: document.getElementById("card-score"),
        scoreTag: document.getElementById("score-tag"),
        cardAttrition: document.getElementById("card-attrition"),
        alertText: document.getElementById("alert-text"),
        alertMeta: document.getElementById("alert-meta"),
        logBody: document.getElementById("log-body")
    };
}

const elements = getElements();
const DOMAIN_COLORS = {
    'Server Metrics (Predictive)': { line: '#00CCFF', bg: 'rgba(0,204,255,0.15)' }, 
    'IoT Sensors (Anomaly Detection)': { line: '#00FF00', bg: 'rgba(0,255,0,0.15)' }, 
    'Social Media (Text Analysis)': { line: '#FF00FF', bg: 'rgba(255,0,255,0.15)' } 
};

const bgCanvas = document.getElementById('bg-wave-canvas');
const bgCtx = bgCanvas ? bgCanvas.getContext('2d') : null;
let waves = [];

if (bgCanvas && bgCtx) {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    });

    class Particle {
        constructor(x, y, radius, color) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.color = color;
            this.velocity = { x: (Math.random() - 0.5) * 0.4, y: (Math.random() - 0.5) * 0.4 };
        }

        draw() {
            bgCtx.beginPath();
            bgCtx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
            bgCtx.fillStyle = this.color;
            bgCtx.shadowBlur = 5;
            bgCtx.shadowColor = this.color;
            bgCtx.fill();
            bgCtx.closePath();
        }

        update() {
            if (this.x + this.radius > bgCanvas.width || this.x - this.radius < 0) {
                this.velocity.x = -this.velocity.x;
            }
            if (this.y + this.radius > bgCanvas.height || this.y - this.radius < 0) {
                this.velocity.y = -this.velocity.y;
            }

            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.draw();
        }
    }

    const PARTICLE_COUNT = 70;
    const PARTICLE_COLOR = 'rgba(0, 204, 255, 0.52)'; 
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = Math.random() * bgCanvas.width;
        const y = Math.random() * bgCanvas.height;
        const radius = Math.random() * 1.5 + 0.5;
        waves.push(new Particle(x, y, radius, PARTICLE_COLOR));
    }

    function animateBackground() {
        requestAnimationFrame(animateBackground);
        bgCtx.fillStyle = 'rgba(10, 10, 10, 0.12)'; 
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height); 

        waves.forEach(wave => {
            wave.update();
        });
    }

    animateBackground();
}

if (elements.thresholdSlider) {
    elements.thresholdSlider.addEventListener("input", () => {
        if (elements.thresholdValue) {
            elements.thresholdValue.textContent = Number(elements.thresholdSlider.value).toFixed(1);
        }
    });
}

let realtimeChart = null;
const canvas = document.getElementById("realtime-chart");
if (canvas) {
    const ctx = canvas.getContext("2d");
    const chartData = {
        labels: [],
        datasets: [{
            label: "Value",
            data: [],
            borderColor: '#00CCFF', 
            backgroundColor: "rgba(0, 204, 255, 0.15)", 
            tension: 0.4,
            pointRadius: 1,
            borderWidth: 1.5
        }]
    };
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { 
                ticks: { color: "#00FF00", font: { size: 9}
            }, 
                grid: { color: "rgba(0, 255, 0, 0.1)" } 
            },
            y: { 
                ticks: { color: "#00FF00", font: { size: 9}
            }, 
                grid: { color: "rgba(0, 255, 0, 0.1)" } 
            }
        },
        plugins: { 
            legend: { 
                labels: { color: "#00CCFF", font: { size: 10}} 
            } 
        },
        animation: { duration: 500, easing: 'linear' }
    };
    if (typeof Chart !== 'undefined') {
        realtimeChart = new Chart(ctx, { type: "line", data: chartData, options: chartOptions });
    } else {
         console.error("Chart.js library not found. Please ensure the script is linked in index.html.");
    }
}

async function nextPoint() {
    try {
        if (!elements.domainSelect) return;

        const domain = elements.domainSelect.value;
        const threshold = Number(elements.thresholdSlider?.value || 0);

        const url = `${API_BASE}/api/next?domain=${encodeURIComponent(domain)}&threshold=${threshold}`;
        const res = await fetch(url);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const payload = await res.json();
        const { data, result } = payload;
        const now = new Date();
        const timeStr = now.toTimeString().slice(0, 8);

        const value = data.value;
        const score = result.score;
        const anomaly = result.is_anomaly;
        const attrition_flag = data.attrition_flag || 0;
        const insight = result.latest_summary || "No insight";
        const unit = data.unit || "";

        history.push({
            time: timeStr,
            value: typeof value === 'number' ? value : Math.random() * 100,
            score: score || 0,
            anomaly: anomaly || 0,
            attrition: attrition_flag,
            insight,
            unit,
            domain
        });

        if (history.length > 100) history.shift();
        updateUI();

    } catch (error) {
        console.error('API Error:', error);
        if (elements.connStatus) elements.connStatus.textContent = "STATUS: ERROR";
        if (elements.connLight) elements.connLight.style.backgroundColor = "#ef4444";
    }
}

function updateUI() {
    const last = history[history.length - 1];
    if (!last) return;

    if (elements.cardProcessed) elements.cardProcessed.textContent = history.length.toString();
    if (elements.cardLatest) {
        elements.cardLatest.textContent = typeof last.value === "number" ?
            `${last.value.toFixed(2)} ${last.unit}` : String(last.value);
    }
    if (elements.cardScore) elements.cardScore.textContent = last.score.toFixed(3); 

    if (elements.scoreTag) {
        let statusText = "OPERATIONAL: STABLE";
        let statusClass = "normal";

        if (last.anomaly) {
            statusText = "CRITICAL: ANOMALY DETECTED";
            statusClass = "anomaly";
        } else if (last.score > 1.0) {
            statusText = "WARNING: HIGH RISK";
            statusClass = "warning";
        }

        elements.scoreTag.textContent = statusText;
        elements.scoreTag.className = `status-tag ${statusClass}`; 
    }

    if (elements.cardAttrition) {
        elements.cardAttrition.innerHTML = last.attrition === 1 ?
            `<span class="text-anomaly">HIGH ATTRITION RISK</span>` : `<span class="text-stable">LOW RISK</span>`;
    }

    if (elements.alertText) elements.alertText.textContent = last.insight;
    if (elements.alertMeta) elements.alertMeta.textContent = `${last.time} | ${last.unit}`;
    if (elements.totalCountEl) elements.totalCountEl.textContent = history.length.toString();

    updateTable();
    if (last && realtimeChart) updateRealtimeGraph(last);
}

function updateTable() {
    if (!elements.logBody) return;

    elements.logBody.innerHTML = "";
    const recent = history.slice(-15).reverse();
    for (const row of recent) {
        const tr = document.createElement("tr");
        if (row.anomaly) tr.classList.add("log-row-anomaly");
        if (row.attrition === 1) tr.classList.add("log-row-attrition");
        tr.innerHTML = `
            <td>${row.time}</td>
            <td class="${row.anomaly ? 'anomaly-value' : ''}">${typeof row.value === "number" ? row.value.toFixed(1) : row.value}</td>
            <td>${row.insight}</td>
            <td>${row.score.toFixed(2)}</td>
            <td>${row.anomaly ? "ANOMALY" : "NORMAL"}</td>
        `;
        elements.logBody.appendChild(tr);
    }
}

function updateRealtimeGraph(last) {
    const colors = DOMAIN_COLORS[last.domain] || DOMAIN_COLORS['Server Metrics (Predictive)'];

    realtimeChart.data.datasets[0].borderColor = colors.line;
    realtimeChart.data.datasets[0].backgroundColor = colors.bg;

    realtimeChart.data.labels.push(last.time);
    realtimeChart.data.datasets[0].data.push(last.value);

    if (realtimeChart.data.labels.length > 50) {
        realtimeChart.data.labels.shift();
        realtimeChart.data.datasets[0].data.shift();
    }

    realtimeChart.update('none');
}

function setLive(on) {
    isRunning = on;
    if (elements.startBtn) elements.startBtn.disabled = on;
    if (elements.stopBtn) elements.stopBtn.disabled = !on;

    if (on) {
        if (elements.connStatus) elements.connStatus.textContent = "STATUS: LIVE";
        if (elements.connLight) elements.connLight.style.backgroundColor = "#00FF00"; 
        if (elements.livePill) {
            elements.livePill.classList.remove("live-pill--off");
            elements.livePill.classList.add("live-pill--on");
            elements.livePill.textContent = "LIVE ANALYSIS";
        }
    } else {
        if (elements.connStatus) elements.connStatus.textContent = "STATUS: OFFLINE";
        if (elements.connLight) elements.connLight.style.backgroundColor = "#FF0000"; 
        if (elements.livePill) {
            elements.livePill.classList.remove("live-pill--on");
            elements.livePill.classList.add("live-pill--off");
            elements.livePill.textContent = "OFFLINE: Ready to analyze";
        }
    }
}

if (elements.startBtn) {
    elements.startBtn.addEventListener("click", () => {
        if (isRunning) return;
        console.log('MODULUS STARTED!');
        history.length = 0;
        if (realtimeChart) {
            realtimeChart.data.labels = [];
            realtimeChart.data.datasets[0].data = [];
            realtimeChart.update();
        }
        setLive(true);
        timer = setInterval(nextPoint, 800); 
    });
}

if (elements.stopBtn) {
    elements.stopBtn.addEventListener("click", () => {
        if (!isRunning) return;
        console.log('MODULUS STOPPED');
        clearInterval(timer);
        setLive(false);
    });
}

window.addEventListener('load', async () => {
    console.log('MODULUS Initializing...');
    setLive(false); 
    try {
        const testRes = await fetch(`${API_BASE}/api/next?domain=IoT%20Sensors%20(Anomaly%20Detection)&threshold=0`);
        if (testRes.ok) {
            console.log('Backend connected!');
            if (elements.connStatus) elements.connStatus.textContent = "STATUS: READY";
            if (elements.connLight) elements.connLight.style.backgroundColor = "#00CCFF"; 
        }
    } catch (e) {
        console.error('Backend error:', e);
    }
});