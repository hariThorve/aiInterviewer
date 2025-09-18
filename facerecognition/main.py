from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import time
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
PROFILE_DIR = os.path.join(BASE_DIR, "profilePicture")
LIVECAM_DIR = os.path.join(BASE_DIR, "liveCam")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "webp"}
ALLOWED_MIMETYPES = {"image/png", "image/jpg", "image/jpeg", "image/webp"}


def ensure_directories():
    os.makedirs(PROFILE_DIR, exist_ok=True)
    os.makedirs(LIVECAM_DIR, exist_ok=True)


def allowed_file(filename: str) -> bool:
    if not filename or "." not in filename:
        return False
    ext = filename.rsplit(".", 1)[1].lower()
    return ext in ALLOWED_EXTENSIONS


def save_image(file_storage, target_dir: str, prefix: str) -> str:
    filename = secure_filename(file_storage.filename or "")
    ext = "." + filename.rsplit(".", 1)[1].lower() if allowed_file(filename) else ".jpg"
    timestamp = str(int(time.time() * 1000))
    final_name = f"{prefix}-{timestamp}{ext}"
    final_path = os.path.join(target_dir, final_name)
    file_storage.save(final_path)
    return os.path.abspath(final_path)


@app.route("/upload-images", methods=["POST"])
def upload_images():
    ensure_directories()

    profile_file = request.files.get("profilePhoto")
    live_file = request.files.get("livePhoto")

    if not profile_file or not live_file:
        return jsonify({"message": "Both profilePhoto and livePhoto are required"}), 400

    # Validate mimetypes
    if profile_file.mimetype not in ALLOWED_MIMETYPES:
        return jsonify({"message": "Invalid profilePhoto type"}), 400
    if live_file.mimetype not in ALLOWED_MIMETYPES:
        return jsonify({"message": "Invalid livePhoto type"}), 400

    try:
        profile_path = save_image(profile_file, PROFILE_DIR, "profile")
        live_path = save_image(live_file, LIVECAM_DIR, "live")
        return jsonify({
            "message": "Images uploaded successfully",
            "profilePhotoPath": profile_path,
            "livePhotoPath": live_path
        }), 201
    except Exception as e:
        return jsonify({"message": "Failed to save images", "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("FACERECOG_PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=False)
