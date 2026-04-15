from sklearn.ensemble import IsolationForest
import numpy as np

# Train dummy model (later you can replace with real data)
X = np.random.rand(200, 3)

model = IsolationForest(contamination=0.1)
model.fit(X)

def predict_anomaly(data):
    score = model.decision_function([data])[0]
    prediction = model.predict([data])[0]

    confidence = round((1 - score) * 100, 2)

    return {
        "is_anomaly": prediction == -1,
        "confidence": max(0, min(confidence, 100))
    }