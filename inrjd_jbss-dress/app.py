import os
import csv
import json
import uuid
import tempfile
import threading
import numpy as np
import torch
import bcrypt
from functools import wraps
from PIL import Image
from flask import Flask, request, jsonify, send_from_directory, session, redirect
from flask_cors import CORS
from transformers import CLIPProcessor, CLIPModel
from werkzeug.utils import secure_filename

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder="static")
CORS(app)

IMAGES_DIR = os.path.join(BASE_DIR, "images")
EMBEDDINGS_CACHE = os.path.join(BASE_DIR, "embeddings_cache.npz")
CROP_EMBEDDINGS_CACHE = os.path.join(BASE_DIR, "crop_embeddings_cache.npz")
TAGS_CACHE = os.path.join(BASE_DIR, "tags_cache_v2.json")

# Data directories
DATA_DIR = os.path.join(BASE_DIR, "data")
LORD_PHOTOS_DIR = os.path.join(BASE_DIR, "lord_photos")
CALENDAR_FILE = os.path.join(DATA_DIR, "calendar.json")
LORD_PHOTOS_MAP_FILE = os.path.join(DATA_DIR, "lord_photos_map.json")
FESTIVALS_FILE = os.path.join(DATA_DIR, "festivals.csv")
CONFIG_FILE = os.path.join(DATA_DIR, "config.json")

# Thread locks for JSON file writes
calendar_lock = threading.Lock()
lord_photos_lock = threading.Lock()

# In-memory festival cache
festivals_cache = []

MODEL_NAME = "openai/clip-vit-base-patch32"

# Vocabulary of design motifs to detect on each image at index time
DESIGN_VOCABULARY = [
    # Animals
    "cow", "elephant", "deer", "lion", "horse", "peacock", "parrot", "bird",
    "swan", "camel", "tiger", "butterfly", "fish", "rabbit", "monkey",
    # Fruits & food
    "mango", "grapes", "banana", "pomegranate", "strawberry", "cherry",
    "apple", "pineapple", "fruit",
    # Patterns & motifs
    "fire", "flame", "flower", "floral", "paisley", "leaf", "tree",
    "vine", "heart", "star", "sun", "moon", "conch", "bell", "temple",
    "palace", "lotus", "rose", "tulip", "kalash", "daisy", "sunflower",
    # Instruments & objects
    "flute", "drum", "sitar", "veena",
    # Misc design styles
    "geometric", "abstract", "striped", "polka dot", "checked", "plain",
    "mirror work", "stone work", "zari", "sequin", "bead",
]

# Global state
model = None
processor = None
image_names = []
image_embeddings = None
image_tags = {}  # {filename: {tag: score, ...}}
crop_embeddings = {}  # {filename: tensor of shape [num_crops, dim]}


def load_model():
    global model, processor
    print(f"Loading CLIP model ({MODEL_NAME})...")
    print("First run downloads ~900MB, subsequent runs use cache.")
    model = CLIPModel.from_pretrained(MODEL_NAME)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    model.eval()
    print("CLIP model loaded.")


def get_image_embedding(img):
    """Get normalized CLIP embedding for a single PIL image."""
    inputs = processor(images=img, return_tensors="pt")
    with torch.no_grad():
        vision_out = model.vision_model(pixel_values=inputs["pixel_values"])
        pooled = vision_out.pooler_output
        emb = model.visual_projection(pooled)
    return emb / emb.norm(dim=-1, keepdim=True)


def encode_text(text_list):
    """Encode a list of text prompts and return normalized embeddings."""
    inputs = processor(text=text_list, return_tensors="pt", padding=True, truncation=True)
    with torch.no_grad():
        text_out = model.text_model(input_ids=inputs["input_ids"], attention_mask=inputs["attention_mask"])
        pooled = text_out.pooler_output
        text_emb = model.text_projection(pooled)
    return text_emb / text_emb.norm(dim=-1, keepdim=True)


def build_image_embeddings():
    global image_names, image_embeddings

    supported_ext = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}
    all_images = sorted(
        f for f in os.listdir(IMAGES_DIR)
        if os.path.splitext(f)[1].lower() in supported_ext
    )

    # Check cache
    if os.path.exists(EMBEDDINGS_CACHE):
        cache = np.load(EMBEDDINGS_CACHE, allow_pickle=True)
        cached_names = list(cache["names"])
        cached_embeddings = cache["embeddings"]
        if cached_names == all_images:
            print(f"Loaded cached embeddings for {len(cached_names)} images.")
            image_names = cached_names
            image_embeddings = torch.from_numpy(cached_embeddings).float()
            return

    print(f"Building embeddings for {len(all_images)} images...")
    embeddings = []
    valid_names = []

    for i, fname in enumerate(all_images):
        fpath = os.path.join(IMAGES_DIR, fname)
        try:
            img = Image.open(fpath).convert("RGB")
            emb = get_image_embedding(img)
            embeddings.append(emb.squeeze(0))
            valid_names.append(fname)
            if (i + 1) % 10 == 0:
                print(f"  Processed {i + 1}/{len(all_images)} images")
        except Exception as e:
            print(f"  Skipping {fname}: {e}")

    image_names = valid_names
    image_embeddings = torch.stack(embeddings)

    np.savez(
        EMBEDDINGS_CACHE,
        names=np.array(image_names, dtype=object),
        embeddings=image_embeddings.numpy(),
    )
    print(f"Embeddings built and cached for {len(image_names)} images.")


def get_crop_embeddings(img):
    """Get CLIP embeddings for multiple crops of an image to detect fine details."""
    w, h = img.size
    crops = [img]  # Full image
    # 4 quadrants
    mid_w, mid_h = w // 2, h // 2
    overlap_w, overlap_h = w // 8, h // 8  # 12.5% overlap
    crops.append(img.crop((0, 0, mid_w + overlap_w, mid_h + overlap_h)))
    crops.append(img.crop((mid_w - overlap_w, 0, w, mid_h + overlap_h)))
    crops.append(img.crop((0, mid_h - overlap_h, mid_w + overlap_w, h)))
    crops.append(img.crop((mid_w - overlap_w, mid_h - overlap_h, w, h)))
    # Center crop
    qw, qh = w // 4, h // 4
    crops.append(img.crop((qw, qh, w - qw, h - qh)))

    embs = []
    for crop in crops:
        embs.append(get_image_embedding(crop).squeeze(0))
    return torch.stack(embs)  # [num_crops, dim]


def build_crop_embeddings():
    """Build multi-crop embeddings for all images for better detail detection."""
    global crop_embeddings

    if os.path.exists(CROP_EMBEDDINGS_CACHE):
        cache = np.load(CROP_EMBEDDINGS_CACHE, allow_pickle=True)
        cached_names = list(cache["names"])
        if cached_names == image_names:
            print(f"Loaded cached crop embeddings for {len(cached_names)} images.")
            for i, name in enumerate(cached_names):
                crop_embeddings[name] = torch.from_numpy(cache[f"crops_{i}"]).float()
            return

    print(f"Building multi-crop embeddings for {len(image_names)} images...")
    save_dict = {"names": np.array(image_names, dtype=object)}

    for i, fname in enumerate(image_names):
        fpath = os.path.join(IMAGES_DIR, fname)
        try:
            img = Image.open(fpath).convert("RGB")
            cembs = get_crop_embeddings(img)
            crop_embeddings[fname] = cembs
            save_dict[f"crops_{i}"] = cembs.numpy()
            if (i + 1) % 10 == 0:
                print(f"  Processed {i + 1}/{len(image_names)} images")
        except Exception as e:
            print(f"  Skipping crops for {fname}: {e}")

    np.savez(CROP_EMBEDDINGS_CACHE, **save_dict)
    print(f"Crop embeddings built for {len(crop_embeddings)} images.")


def build_design_tags():
    """Pre-compute design tags for each image using relative scoring."""
    global image_tags

    if os.path.exists(TAGS_CACHE):
        with open(TAGS_CACHE, "r") as f:
            cached = json.load(f)
        if set(cached.get("_names", [])) == set(image_names):
            image_tags = {k: v for k, v in cached.items() if k != "_names"}
            print(f"Loaded cached design tags for {len(image_tags)} images.")
            return

    print(f"Building design tags ({len(DESIGN_VOCABULARY)} motifs x {len(image_names)} images with multi-crop)...")

    # Encode all vocabulary prompts at once
    prompts = [f"embroidered {motif} on a dress" for motif in DESIGN_VOCABULARY]
    batch_size = 20
    vocab_embs = []
    for i in range(0, len(prompts), batch_size):
        batch = prompts[i:i + batch_size]
        vocab_embs.append(encode_text(batch))
    vocab_embeddings = torch.cat(vocab_embs, dim=0)  # [num_vocab, dim]

    # For each image, compute max similarity across all crops for each motif
    # This catches small details that the full-image embedding misses
    all_scores = torch.zeros(len(image_names), len(DESIGN_VOCABULARY))
    for i, fname in enumerate(image_names):
        if fname in crop_embeddings:
            # crop_embeddings[fname]: [num_crops, dim], vocab_embeddings: [num_vocab, dim]
            crop_scores = crop_embeddings[fname] @ vocab_embeddings.T  # [num_crops, num_vocab]
            all_scores[i] = crop_scores.max(dim=0).values  # max across crops
        else:
            # Fallback to full-image embedding
            all_scores[i] = (image_embeddings[i:i+1] @ vocab_embeddings.T).squeeze(0)

    # For each motif, find images that score significantly above the mean
    # This handles the clustering issue with ViT-B/32
    for i_name, fname in enumerate(image_names):
        image_tags[fname] = {}

    for j, motif in enumerate(DESIGN_VOCABULARY):
        col = all_scores[:, j]
        mean_score = col.mean().item()
        std_score = col.std().item()
        # Tag images that are >1 std above mean for this motif
        threshold = mean_score + std_score
        for i, fname in enumerate(image_names):
            score = col[i].item()
            if score >= threshold:
                # Store how many stds above mean (normalized relevance)
                z_score = (score - mean_score) / max(std_score, 1e-6)
                image_tags[fname][motif] = round(z_score, 3)

    # Cache
    cache_data = dict(image_tags)
    cache_data["_names"] = image_names
    with open(TAGS_CACHE, "w") as f:
        json.dump(cache_data, f)

    tagged_count = sum(1 for t in image_tags.values() if t)
    print(f"Design tags built for {tagged_count}/{len(image_names)} images.")


# ── JSON I/O helpers ──────────────────────────────────────────────

def load_json(filepath, default=None):
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            return json.load(f)
    return default if default is not None else {}


def save_json(filepath, data):
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(dir=os.path.dirname(filepath), suffix=".tmp")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(data, f, indent=2)
        os.replace(tmp_path, filepath)
    except Exception:
        os.unlink(tmp_path)
        raise


# ── Config & Auth initialization ─────────────────────────────────

def init_config():
    os.makedirs(DATA_DIR, exist_ok=True)
    os.makedirs(LORD_PHOTOS_DIR, exist_ok=True)

    if os.path.exists(CONFIG_FILE):
        config = load_json(CONFIG_FILE)
    else:
        default_password = "admin123"
        hashed = bcrypt.hashpw(default_password.encode(), bcrypt.gensalt()).decode()
        config = {
            "admin_username": "admin",
            "admin_password_hash": hashed,
            "shared_view_token": str(uuid.uuid4()),
            "secret_key": str(uuid.uuid4()),
        }
        save_json(CONFIG_FILE, config)
        print(f"\n{'='*50}")
        print(f"  First run - admin account created!")
        print(f"  Username: admin")
        print(f"  Password: {default_password}")
        print(f"  Shared view link: /view/{config['shared_view_token']}")
        print(f"  CHANGE THE PASSWORD after first login!")
        print(f"{'='*50}\n")

    app.secret_key = config["secret_key"]

    # Initialize calendar.json if missing
    if not os.path.exists(CALENDAR_FILE):
        save_json(CALENDAR_FILE, {})

    # Initialize lord_photos_map.json if missing
    if not os.path.exists(LORD_PHOTOS_MAP_FILE):
        save_json(LORD_PHOTOS_MAP_FILE, {})

    return config


def detect_festival_type(name):
    """Auto-detect type from festival name: amavasya, purnima, or festival."""
    lower = name.lower()
    if "amavasya" in lower or "amavasy" in lower or "amavas" in lower:
        return "amavasya"
    if "purnima" in lower or "poornima" in lower:
        return "purnima"
    return "festival"


def load_festivals():
    """Load festivals CSV. Supports two formats:
    Format 1 (user): date, festival_name, dress_comment
    Format 2 (legacy): date, name, type
    Auto-detects type (amavasya/purnima/festival) from the festival name.
    """
    global festivals_cache
    festivals_cache = []
    if os.path.exists(FESTIVALS_FILE):
        with open(FESTIVALS_FILE, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Support both column naming conventions
                name = (row.get("festival_name") or row.get("name", "")).strip()
                dress_comment = (row.get("dress_comment") or row.get("comment", "")).strip()
                # Auto-detect type from name, or use explicit type column if present
                explicit_type = row.get("type", "").strip().lower()
                entry_type = explicit_type if explicit_type in ("amavasya", "purnima", "festival") else detect_festival_type(name)

                festivals_cache.append({
                    "date": row.get("date", "").strip(),
                    "name": name,
                    "type": entry_type,
                    "dress_comment": dress_comment,
                })
        print(f"Loaded {len(festivals_cache)} festival entries from CSV.")
    else:
        print(f"No festivals.csv found at {FESTIVALS_FILE} — calendar will have no festival data.")


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("is_admin"):
            return jsonify({"error": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated


# ── Page routes ──────────────────────────────────────────────────

@app.route("/")
def index():
    return send_from_directory("static", "index.html")


@app.route("/admin")
def admin_page():
    return send_from_directory("static", "index.html")


@app.route("/login")
def login_page():
    return send_from_directory("static", "index.html")


@app.route("/view/<token>")
def shared_view(token):
    config = load_json(CONFIG_FILE)
    if token != config.get("shared_view_token"):
        return "Invalid link", 404
    return send_from_directory("static", "index.html")


@app.route("/static/<path:path>")
def serve_static(path):
    return send_from_directory("static", path)


@app.route("/images/<path:filename>")
def serve_image(filename):
    return send_from_directory(IMAGES_DIR, filename)


@app.route("/lord_photos/<path:filename>")
def serve_lord_photo(filename):
    return send_from_directory(LORD_PHOTOS_DIR, filename)


# ── Auth API ─────────────────────────────────────────────────────

@app.route("/api/auth/login", methods=["POST"])
def auth_login():
    data = request.get_json()
    username = data.get("username", "")
    password = data.get("password", "")
    config = load_json(CONFIG_FILE)

    if (username == config.get("admin_username") and
            bcrypt.checkpw(password.encode(), config["admin_password_hash"].encode())):
        session["is_admin"] = True
        return jsonify({"success": True, "shared_token": config.get("shared_view_token")})

    return jsonify({"error": "Invalid credentials"}), 401


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    session.clear()
    return jsonify({"success": True})


@app.route("/api/auth/status", methods=["GET"])
def auth_status():
    config = load_json(CONFIG_FILE)
    return jsonify({
        "authenticated": bool(session.get("is_admin")),
        "shared_token": config.get("shared_view_token") if session.get("is_admin") else None,
    })


@app.route("/api/auth/change-password", methods=["POST"])
@admin_required
def change_password():
    data = request.get_json()
    new_password = data.get("new_password", "")
    if len(new_password) < 4:
        return jsonify({"error": "Password too short"}), 400
    config = load_json(CONFIG_FILE)
    config["admin_password_hash"] = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    save_json(CONFIG_FILE, config)
    return jsonify({"success": True})


# ── Calendar API ─────────────────────────────────────────────────

@app.route("/api/calendar", methods=["GET"])
def get_calendar():
    month = request.args.get("month", "")  # YYYY-MM
    calendar_data = load_json(CALENDAR_FILE, {})

    assignments = {}
    for date_str, info in calendar_data.items():
        if month and date_str.startswith(month):
            assignments[date_str] = info
        elif not month:
            assignments[date_str] = info

    # Get festivals for the month
    month_festivals = []
    for f in festivals_cache:
        if month and f["date"].startswith(month):
            month_festivals.append(f)
        elif not month:
            month_festivals.append(f)

    return jsonify({"assignments": assignments, "festivals": month_festivals})


@app.route("/api/calendar/assign", methods=["POST"])
@admin_required
def calendar_assign():
    data = request.get_json()
    date_str = data.get("date", "")
    dress = data.get("dress", "")

    if not date_str or not dress:
        return jsonify({"error": "date and dress required"}), 400

    with calendar_lock:
        calendar_data = load_json(CALENDAR_FILE, {})
        calendar_data[date_str] = {"dress": dress}
        save_json(CALENDAR_FILE, calendar_data)

    return jsonify({"success": True})


@app.route("/api/calendar/assign", methods=["DELETE"])
@admin_required
def calendar_unassign():
    date_str = request.args.get("date", "")
    if not date_str:
        return jsonify({"error": "date required"}), 400

    with calendar_lock:
        calendar_data = load_json(CALENDAR_FILE, {})
        calendar_data.pop(date_str, None)
        save_json(CALENDAR_FILE, calendar_data)

    return jsonify({"success": True})


@app.route("/api/calendar/search", methods=["GET"])
def calendar_search():
    query = request.args.get("q", "").strip().lower()
    month = request.args.get("month", "")

    if not query:
        return jsonify({"results": {}})

    calendar_data = load_json(CALENDAR_FILE, {})
    results = {}

    for date_str, info in calendar_data.items():
        if month and not date_str.startswith(month):
            continue

        dress = info.get("dress", "")
        dress_name = os.path.splitext(dress)[0].lower().replace("-", " ").replace("_", " ").replace("+", " ")

        # Match against dress name/color
        if query in dress_name or query in date_str:
            results[date_str] = info
            continue

        # Match against dress tags
        tags = image_tags.get(dress, {})
        for tag in tags:
            if query in tag or tag in query:
                results[date_str] = info
                break

    # Also check festivals
    for f in festivals_cache:
        if month and not f["date"].startswith(month):
            continue
        if query in f["name"].lower() and f["date"] not in results:
            cal_entry = calendar_data.get(f["date"], {})
            results[f["date"]] = {**cal_entry, "festival_match": f["name"]}

    return jsonify({"results": results})


# ── Festivals API ────────────────────────────────────────────────

@app.route("/api/festivals", methods=["GET"])
def get_festivals():
    year = request.args.get("year", "")
    if year:
        filtered = [f for f in festivals_cache if f["date"].startswith(year)]
    else:
        filtered = festivals_cache
    return jsonify({"festivals": filtered})


@app.route("/api/festivals/upload", methods=["POST"])
@admin_required
def upload_festivals():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    if not file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files accepted"}), 400
    file.save(FESTIVALS_FILE)
    load_festivals()
    return jsonify({"success": True, "count": len(festivals_cache)})


# ── Lord Photos API ──────────────────────────────────────────────

@app.route("/api/lord-photos/<dress>", methods=["GET"])
def get_lord_photos(dress):
    mapping = load_json(LORD_PHOTOS_MAP_FILE, {})
    photos = mapping.get(dress, [])
    return jsonify({
        "dress": dress,
        "photos": [{"filename": p, "url": f"/lord_photos/{p}"} for p in photos],
    })


@app.route("/api/lord-photos/<dress>", methods=["POST"])
@admin_required
def upload_lord_photo(dress):
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    file = request.files["file"]
    filename = secure_filename(file.filename)
    if not filename:
        return jsonify({"error": "Invalid filename"}), 400

    # Prefix with dress name to avoid collisions
    dress_prefix = os.path.splitext(dress)[0]
    save_name = f"{dress_prefix}_{filename}"
    file.save(os.path.join(LORD_PHOTOS_DIR, save_name))

    with lord_photos_lock:
        mapping = load_json(LORD_PHOTOS_MAP_FILE, {})
        if dress not in mapping:
            mapping[dress] = []
        if save_name not in mapping[dress]:
            mapping[dress].append(save_name)
        save_json(LORD_PHOTOS_MAP_FILE, mapping)

    return jsonify({"success": True, "filename": save_name})


@app.route("/api/lord-photos/<dress>/<photo>", methods=["DELETE"])
@admin_required
def delete_lord_photo(dress, photo):
    with lord_photos_lock:
        mapping = load_json(LORD_PHOTOS_MAP_FILE, {})
        if dress in mapping and photo in mapping[dress]:
            mapping[dress].remove(photo)
            save_json(LORD_PHOTOS_MAP_FILE, mapping)
            # Optionally delete the file too
            photo_path = os.path.join(LORD_PHOTOS_DIR, photo)
            if os.path.exists(photo_path):
                os.remove(photo_path)
    return jsonify({"success": True})


# ── Shared view validation ───────────────────────────────────────

@app.route("/api/shared/validate/<token>", methods=["GET"])
def validate_shared_token(token):
    config = load_json(CONFIG_FILE)
    valid = token == config.get("shared_view_token")
    return jsonify({"valid": valid})


def encode_text_averaged(text_list):
    """Encode a list of text prompts, average, and return normalized embedding."""
    emb = encode_text(text_list)
    emb = emb.mean(dim=0, keepdim=True)
    return emb / emb.norm(dim=-1, keepdim=True)


def tag_match_scores(query):
    """Return a tensor of scores based on pre-computed design tag matching.
    Tags store z-scores (stds above mean), so higher = more distinctive."""
    q_lower = query.lower().strip()
    q_words = set(q_lower.replace("-", " ").replace("_", " ").split())

    scores = []
    for name in image_names:
        tags = image_tags.get(name, {})
        best_boost = 0.0
        for tag, z_score in tags.items():
            # Exact match: full query matches a tag
            if q_lower == tag or tag in q_lower or q_lower in tag:
                best_boost = max(best_boost, z_score * 0.08)
            # Word overlap: any query word matches a tag
            elif any(w == tag or w in tag for w in q_words):
                best_boost = max(best_boost, z_score * 0.05)
        scores.append(best_boost)
    return torch.tensor(scores)


def filename_match_scores(query):
    """Return a tensor of scores based on filename matching."""
    q_lower = query.lower().replace(" ", "").replace("-", "").replace("_", "")
    scores = []
    for name in image_names:
        name_clean = os.path.splitext(name)[0].lower().replace("-", "").replace("_", "").replace("+", "")
        if q_lower in name_clean or name_clean in q_lower:
            scores.append(0.12)
        elif any(part in name_clean for part in q_lower.split()):
            scores.append(0.06)
        else:
            scores.append(0.0)
    return torch.tensor(scores)


@app.route("/api/search", methods=["GET"])
def search():
    query = request.args.get("q", "").strip()
    top_k = min(int(request.args.get("top_k", 45)), len(image_names))

    if not query:
        return jsonify({"results": [], "query": query})

    # Generate multiple prompts to cover color, design, and pattern searches
    prompts = [
        f"a dress that is {query}",
        f"a dress with {query} design on it",
        f"a dress with {query} pattern embroidered on it",
        f"a lehenga featuring {query}",
        f"embroidered {query} on fabric",
        f"a traditional Indian dress with {query} motif",
    ]

    # CLIP visual similarity (averaged across prompts)
    text_emb = encode_text_averaged(prompts)
    clip_scores = (image_embeddings @ text_emb.T).squeeze(1)

    # Design tag matching boost
    tag_scores = tag_match_scores(query)

    # Filename match boost
    fn_scores = filename_match_scores(query)

    # Combined score
    combined = clip_scores + tag_scores + fn_scores

    scores, indices = combined.topk(top_k)

    results = []
    for score, idx in zip(scores.tolist(), indices.tolist()):
        results.append({
            "filename": image_names[idx],
            "score": round(score, 4),
            "url": f"/images/{image_names[idx]}",
        })

    return jsonify({"results": results, "query": query})


@app.route("/api/images", methods=["GET"])
def list_images():
    return jsonify({"images": [
        {"filename": name, "url": f"/images/{name}"}
        for name in image_names
    ]})


@app.route("/api/tags", methods=["GET"])
def get_tags():
    """Return detected design tags for all images (for debugging)."""
    return jsonify(image_tags)


def init_app():
    init_config()
    load_festivals()
    load_model()
    build_image_embeddings()
    build_crop_embeddings()
    build_design_tags()


if __name__ == "__main__":
    init_app()
    app.run(host="0.0.0.0", port=5000, debug=False)
