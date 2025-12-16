# Modulus – Prism Realtime Insights

> **Unified, real‑time analytics dashboard for modern data streams**

Modulus (Prism Realtime Insights) is a real‑time insight engine designed to solve the problem of **scattered, hard‑to‑understand data** across modern organizations. Instead of checking multiple dashboards, logs, or CSV exports, Modulus provides a **single, continuously updating view** of system health, user behavior, and business KPIs.
---

## Problem Statement
Modern companies generate data from many sources:
* Social media events
* IoT sensors
* Application logs
* Business and growth metrics

These streams:
* Come in **different formats**
* Update at **different speeds**
* Live in **different tools**

As a result, teams detect issues late, make decisions on partial data, and rely on manual reporting.
---

## Solution
Modulus aggregates and standardizes multiple real‑time data streams into a **single unified dashboard**. It transforms raw events into **clear, visual insights** that even non‑technical stakeholders can understand instantly.

### What Modulus Does
* Standardizes incoming real‑time data
* Applies lightweight analytics:
  * Trends
  * Growth metrics
  * Distributions
  * Basic anomaly signals
* Displays KPIs, charts, and segments in one clean UI
* Updates continuously without manual refresh
---

## Why This Matters
Real‑time behavior is critical:
* A spike in errors can break user trust
* Sudden churn can impact revenue
* Campaign performance needs instant feedback
With Modulus, teams can **react while events are happening**, not days later.

### Use Cases
* **Product & Ops**: Detect failures and performance issues early
* **Marketing & Growth**: Track campaign impact and audience segments
* **Leadership**: Get a high‑level visual snapshot without complex tools
---

## Architecture Overview
```
Data Sources → API / Ingestion → Analytics Layer → Modulus Dashboard
```
* Real‑time data ingestion
* Lightweight analytics processing
* Interactive frontend visualization
---

## Tech Stack

### Backend / Data Processing

* Python
* NumPy
* Pandas
* JSON
* OS, Time, Random utilities
* Type hints (`typing`)

### Frontend

* HTML5
* CSS3
* JavaScript (ES6)
* Chart.js

### API
```js
const API_BASE = "http://127.0.0.1:8000";
```
---
## Installation & Setup

### Clone the Repository

```bash
git clone https://github.com/dhakarshailendra829/prism-realtime-insights.git
cd prism-realtime-insights
```
###  Backend Setup
```bash
pip install -r requirements.txt
python -m backend.server
```

### Frontend
* frontend:- cd web_ui
* python -m http.server 3000
* run on browser:- http://localhost:3000/index.html
---

## Dashboard Preview
* Control Panel (Start Analysis, Adjust Parameters, Export Data)
* Domain Selection
* Anomaly Sensitivity (Tuning)
* System logs
* Real-time Data Flow
* KEY METRIC: ALPHA SCORE
* LATEST INSIGHT SUMMARY
* ALGORITHM STATUS
* PROCESSED EVENT LOG
---

## Future Improvements
* Advanced anomaly detection
* User authentication & roles
* Stream processing (Kafka / WebSockets)
* Cloud deployment
* Alerting & notifications
---

## Contributing
Contributions are welcome!
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a Pull Request
---

## 🔗 Repository
GitHub: [https://github.com/dhakarshailendra829/prism-realtime-insights](https://github.com/dhakarshailendra829/prism-realtime-insights)
---

## Acknowledgements
Inspired by modern real‑time analytics platforms and open‑source dashboard projects.
---
