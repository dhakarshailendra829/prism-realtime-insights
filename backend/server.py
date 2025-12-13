from flask import Flask, request, jsonify
from flask_cors import CORS  # ← YE ADD KARO
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.data_adapters.data_fetcher import fetch_real_or_simulated_data
from core.algorithms.processing_logic import apply_algorithm

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://127.0.0.1:3000"])  # ← YE 2 LINES ADD!

@app.route("/api/next", methods=["GET"])
def api_next():
    domain = request.args.get("domain", "IoT Sensors (Anomaly Detection)")
    threshold = float(request.args.get("threshold", "0.0"))
    data = fetch_real_or_simulated_data(domain)
    result = apply_algorithm(data, domain, threshold)
    payload = {
        "domain": domain,
        "threshold": threshold,
        "data": data,
        "result": result,
    }
    return jsonify(payload)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
