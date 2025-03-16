from flask import Flask, request, jsonify, send_file
from flask_pymongo import PyMongo
from werkzeug.security import generate_password_hash, check_password_hash
import os
import requests
from flask_cors import CORS
import traceback
from dotenv import load_dotenv
import json
import logging
import re

app = Flask(__name__)
load_dotenv()
# ✅ MongoDB Config
app.config["MONGO_URI"] = os.getenv("MONGO_UR", "mongodb://localhost:27017/draginn")
mongo = PyMongo(app)

# ✅ Allow all origins for CORS
CORS(app, resources={r"/*": {"origins": "*"}})

# ✅ Securely fetch the Gemini API key
gemini_api_key = os.getenv("GEMINI_API_KEY")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_api_key}"
TEMP_CV_PATH = os.path.join(os.getcwd(), "temp_cv.json")
# 🔥 Debugging: Ensure API keys and database are set
if not gemini_api_key:
    print("⚠️ WARNING: GEMINI_API_KEY is not set!")
if not app.config["MONGO_URI"]:
    print("⚠️ WARNING: MONGO_URI is not set!")

# ✅ Ensure MongoDB indexes
mongo.db.users.create_index("email", unique=True)
mongo.db.cvs.create_index("user_email", unique=True)

# 🔹 Serve Static Pages
@app.route("/<page>.html")
def serve_html(page):
    return send_file(f"{page}.html")

@app.route("/")
def home():
    return send_file("index.html")

# 🔹 Serve Static Assets
@app.route("/<filename>.<ext>")
def serve_static(filename, ext):
    return send_file(f"{filename}.{ext}")

# 🔹 USER SIGNUP
@app.route("/signupfun", methods=["POST"])
def signup():
    data = request.json
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    email = data["email"]
    hashed_password = generate_password_hash(data["password"])

    if mongo.db.users.find_one({"email": email}):
        return jsonify({"error": "Email already exists"}), 400

    mongo.db.users.insert_one({
        "email": email,
        "password": hashed_password
    })

    return jsonify({"message": "User registered successfully"}), 201

# 🔹 USER LOGIN
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    if not data or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Email and password are required"}), 400

    user = mongo.db.users.find_one({"email": data["email"]})
    if not user or not check_password_hash(user["password"], data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({"message": "Login successful"}), 200

# 🔹 ENHANCE CV

from flask import session

@app.route("/enhance_cv", methods=["POST"])
def enhance_cv():
    try:
        data = request.json
        print("✅ Received CV Data:", json.dumps(data, indent=2))

        if not data:
            return jsonify({"error": "No data received"}), 400

        personal_info = data.get("personalInfo", {})
        name = personal_info.get("fullName", "").strip()
        email = personal_info.get("email", "").strip()
        phone = personal_info.get("phone", "Not Provided").strip()
        location = personal_info.get("location", "Not Provided").strip()
        summary = data.get("summary", "Not Provided").strip()
        experience = data.get("experience", [])
        education = data.get("education", [])
        skills = data.get("skills", [])

        # Validate required fields
        if not name or not email or not summary:
            return jsonify({"error": "Missing required fields (fullName, email, summary)"}), 400

        prompt = f"""
        Enhance the following CV details to make them more professional and refined:
        Name: {name}
        Email: {email}
        Phone: {phone}
        Location: {location}
        Summary: {summary}
        Experience: {json.dumps(experience, indent=2)}
        Education: {json.dumps(education, indent=2)}
        Skills: {', '.join(skills)}
        dont add any placeholders just give me one paragraph with details of the cv also please dont add any other starting text and ending text you shall only return me with one paragraph para shall not be less than 300 words
        """

        print("📩 Sending request to Gemini API...")

        response = requests.post(
            GEMINI_API_URL,
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=10
        )

        if response.status_code != 200:
            print(f"❌ Gemini API Error: {response.text}")
            return jsonify({"error": "Failed to enhance CV", "details": response.text}), 500

        response_json = response.json()
        print("📩 Gemini API Response:", json.dumps(response_json, indent=2))

        # Extract AI-enhanced CV text safely
        enhanced_cv_text = (
            response_json.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "").strip()
        )
        try:
            enhanced_cv_data = json.loads(enhanced_cv_text)  # Parse if JSON string
        except json.JSONDecodeError:
            enhanced_cv_data = {"summary": enhanced_cv_text}  # Treat it as plain text


        if not enhanced_cv_text:
            return jsonify({"error": "AI did not return a valid response"}), 500

        # Store structured CV data in a temporary file
        enhanced_cv_data = {
            "personalInfo": {
                "name": name,
                "email": email,
                "phone": phone,
                "location": location,
            },
            "summary": enhanced_cv_text,  
            "experience": experience,
            "education": education,
            "skills": skills
        }

        with open(TEMP_CV_PATH, "w+", encoding="utf-8") as temp_file:
            json.dump(enhanced_cv_data, temp_file, indent=4)

        return jsonify(enhanced_cv_data), 200

    except requests.exceptions.RequestException as e:
        print("❌ Gemini API Error:", str(e))
        return jsonify({"error": "Failed to connect to AI service", "details": str(e)}), 500

    except Exception as e:
        print("❌ Internal Server Error:", str(e))
        print(traceback.format_exc())
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

logging.basicConfig(level=logging.DEBUG)

def clean_text(text):
    """Remove placeholders in brackets from text."""
    return re.sub(r"\[.*?\]", "", text).strip()

def clean_list(data_list):
    """Remove placeholders from list elements."""
    return [clean_text(item) for item in data_list if isinstance(item, str)]

def clean_dict(data_dict, keys):
    """Clean specific keys in a dictionary."""
    for key in keys:
        if key in data_dict and isinstance(data_dict[key], str):
            data_dict[key] = clean_text(data_dict[key])
        elif key in data_dict and isinstance(data_dict[key], list):
            data_dict[key] = clean_list(data_dict[key])
    return data_dict

@app.route("/get_last_cv", methods=["GET"])
def get_last_cv():
    """Retrieve the last enhanced CV from the temporary file."""
    if not os.path.exists(TEMP_CV_PATH):
        logging.error("temp_cv.json file not found")
        return jsonify({"error": "No CV data found"}), 404
    
    try:
        if os.stat(TEMP_CV_PATH).st_size == 0:
            logging.error("temp_cv.json is empty")
            return jsonify({"error": "CV file is empty"}), 500

        with open(TEMP_CV_PATH, "r", encoding="utf-8") as temp_file:
            cv_data = json.load(temp_file)

        # Clean placeholders from relevant fields
        cv_data = clean_dict(cv_data, ["summary", "name", "email", "phone", "location"])

        if "experience" in cv_data and isinstance(cv_data["experience"], list):
                for exp in cv_data["experience"]:
                    if isinstance(exp, dict):
                        exp["responsibilities"] = exp.get("responsibilities", [])  # Ensure it's an array
                        if not isinstance(exp["responsibilities"], list):
                            exp["responsibilities"] = [exp["responsibilities"]]  # Convert to list if it's not
                    exp = clean_dict(exp, ["company", "position", "responsibilities"])

        if "education" in cv_data and isinstance(cv_data["education"], list):
            cv_data["education"] = [clean_dict(edu, ["institution", "degree"]) for edu in cv_data["education"]]

        if "skills" in cv_data and isinstance(cv_data["skills"], list):
            cv_data["skills"] = clean_list(cv_data["skills"])

        return jsonify(cv_data), 200
    except json.JSONDecodeError:
        logging.error("Invalid JSON format in temp_cv.json")
        return jsonify({"error": "Invalid CV data format"}), 500
    except Exception as e:
        logging.error(f"Unexpected error: {str(e)}")
        return jsonify({"error": str(e)}), 500
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=3000)
