import numpy as np
import json
import random

def apply_algorithm(data, domain, threshold=0.0):
    
    if data['type'] == 'text':
        text = str(data['value']).lower()
        positive_words = ['good', 'great', 'excellent', 'positive', 'happy', 'love']
        negative_words = ['bad', 'poor', 'terrible', 'negative', 'sad', 'hate']
        
        text_length = len(text)
        pos_count = sum(1 for word in positive_words if word in text)
        neg_count = sum(1 for word in negative_words if word in text)
        sentiment_score = np.clip((pos_count - neg_count + (text_length % 50)/100 - 0.5) * 0.8, -1, 1)
        
        return {
            "latest_summary": f"Social: {'🟢 POSITIVE' if sentiment_score > 0.3 else '🔴 NEGATIVE' if sentiment_score < -0.3 else '🟡 NEUTRAL'} | Score: {sentiment_score:+.2f}",
            "score": float(sentiment_score),
            "is_anomaly": int(sentiment_score < -0.5 or sentiment_score > 0.8),
            "confidence": float(np.abs(sentiment_score)),
            "recommendation": f"{'Continue monitoring' if sentiment_score > 0 else 'Negative trend detected'}"
        }
    
    elif data['type'] == 'numeric_series':
        value = float(data['value'])
        base_mean = 75.0
        base_std = 15.0
        if domain == "IoT Sensors (Anomaly Detection)":
            attrition_flag = int(data.get('attrition_flag', 0))
            anomaly_score = (value - base_mean) / base_std
            risk_level = "NORMAL"
            if attrition_flag == 1 or value > 120:
                risk_level = "HIGH RISK"
            elif value > 90:
                risk_level = "WARNING"
            
            return {
                "latest_summary": f"HR: {risk_level} | Income: ${value:,.0f} | Attrition: {'YES' if attrition_flag else 'NO'}",
                "score": float(anomaly_score * 1.5),
                "is_anomaly": int(risk_level == "HIGH RISK"),
                "confidence": float(min(abs(anomaly_score), 2.0)),
                "risk_level": risk_level,
                "recommendation": "PROMOTE IMMEDIATELY" if risk_level == "HIGH RISK" else "Employee stable"
            }
        
        elif domain == "Server Metrics (Predictive)":
            load_score = (value - 50) / 50
            is_overload = value > 85
            is_high_load = value > 70
            
            return {
                "latest_summary": f"Server: {value:.1f}% {'OVERLOAD' if is_overload else 'HIGH' if is_high_load else 'OK'}",
                "score": float(load_score),
                "is_anomaly": int(is_overload),
                "confidence": float(value / 100),
                "load_status": "OVERLOAD" if is_overload else "HIGH" if is_high_load else "OK",
                "recommendation": "SCALE SERVERS NOW" if is_overload else "Load balanced"
            }
        
        else:
            z_score = (value - base_mean) / base_std
            is_anomaly = abs(z_score) > 2
            
            return {
                "latest_summary": f"Value: {value:.1f} {'ANOMALY' if is_anomaly else 'NORMAL'}",
                "score": float(z_score),
                "is_anomaly": int(is_anomaly),
                "confidence": float(min(abs(z_score), 1.0)),
                "recommendation": "Investigate anomaly" if is_anomaly else "Normal operation"
            }
    
    return {
        "latest_summary": "No data available",
        "score": 0.0,
        "is_anomaly": 0,
        "confidence": 0.0,
        "recommendation": "Check data source"
    }
