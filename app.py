from flask import Flask, render_template, request, jsonify, session
import tensorflow as tf
import numpy as np
import json
import os
from PIL import Image
from datetime import datetime

app = Flask(__name__)
app.secret_key = "plant-disease-secret-key"

MODEL_PATH = "plant_disease_model.keras"
CLASS_NAMES_PATH = "class_names.json"

IMG_SIZE = 224

# Load model
model = tf.keras.models.load_model(MODEL_PATH)

# Load class names
with open(CLASS_NAMES_PATH, "r") as f:
    class_names = json.load(f)

print("Model loaded successfully")
print("Classes:", len(class_names))


def clean_name(name):
    return name.replace("___", " - ").replace("_", " ")


def is_healthy(name):
    return "healthy" in name.lower()


def get_disease_info(name):
    name_lower = name.lower()

    if "healthy" in name_lower:
        return {
            "status": "Healthy",
            "message": "No major disease detected in the uploaded image.",
            "care": "Continue regular watering, sunlight and plant monitoring."
        }

    if "early_blight" in name_lower:
        return {
            "status": "Disease Detected",
            "message": "Early blight symptoms are detected.",
            "care": "Remove affected leaves and avoid excessive moisture on leaves."
        }

    if "late_blight" in name_lower:
        return {
            "status": "Disease Detected",
            "message": "Late blight symptoms are detected.",
            "care": "Remove infected plant parts and maintain good air circulation."
        }

    if "bacterial_spot" in name_lower:
        return {
            "status": "Disease Detected",
            "message": "Bacterial spot symptoms are detected.",
            "care": "Remove infected leaves and avoid overhead watering."
        }

    if "spider_mites" in name_lower:
        return {
            "status": "Disease Detected",
            "message": "Spider mite damage is detected.",
            "care": "Check the underside of leaves and maintain suitable plant moisture."
        }

    return {
        "status": "Disease Detected",
        "message": "A possible plant disease was detected.",
        "care": "Remove severely affected leaves and monitor the plant regularly."
    }


@app.route("/")
def home():
    history = session.get("history", [])

    return render_template(
        "index.html",
        class_count=len(class_names),
        history_count=len(history)
    )


@app.route("/predict", methods=["POST"])
def predict():

    if "image" not in request.files:
        return jsonify({
            "success": False,
            "message": "Please select an image."
        })

    file = request.files["image"]

    if file.filename == "":
        return jsonify({
            "success": False,
            "message": "Please select an image."
        })

    try:
        image = Image.open(file).convert("RGB")
        image = image.resize((IMG_SIZE, IMG_SIZE))

        image_array = np.array(image)
        image_array = image_array / 255.0
        image_array = np.expand_dims(image_array, axis=0)

        predictions = model.predict(image_array, verbose=0)[0]

        top_indices = np.argsort(predictions)[::-1][:3]

        predicted_index = top_indices[0]
        predicted_class = class_names[predicted_index]
        confidence = float(predictions[predicted_index] * 100)

        info = get_disease_info(predicted_class)

        top_predictions = []

        for index in top_indices:
            top_predictions.append({
                "name": clean_name(class_names[index]),
                "confidence": round(float(predictions[index] * 100), 2)
            })

        result = {
            "success": True,
            "disease": clean_name(predicted_class),
            "confidence": round(confidence, 2),
            "status": info["status"],
            "message": info["message"],
            "care": info["care"],
            "top_predictions": top_predictions
        }

        # Save history in session
        history = session.get("history", [])

        history.insert(0, {
            "disease": clean_name(predicted_class),
            "confidence": round(confidence, 2),
            "status": info["status"],
            "time": datetime.now().strftime("%d %b %Y, %I:%M %p")
        })

        session["history"] = history[:10]

        return jsonify(result)

    except Exception as e:
        print("Prediction Error:", e)

        return jsonify({
            "success": False,
            "message": "Unable to process the image."
        })


@app.route("/history")
def history():
    return jsonify(session.get("history", []))


@app.route("/clear-history", methods=["POST"])
def clear_history():
    session["history"] = []

    return jsonify({
        "success": True
    })


if __name__ == "__main__":
    app.run(debug=True)