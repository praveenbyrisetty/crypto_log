from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from log_chain import LogChain
import json
import os

app = Flask(__name__)
CORS(app)

@app.route('/explain')
def explain():
    return send_file('HOW_IT_WORKS.html')

CHAIN_FILE = "ui_logs.json"

# ── Hardcoded demo credentials ──────────────────────
FAKE_USERNAME = "admin"
FAKE_PASSWORD = "admin123"

def get_chain():
    return LogChain(CHAIN_FILE)

# ── LOGIN ────────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username', '')
    password = data.get('password', '')
    chain = get_chain()
    if username == FAKE_USERNAME and password == FAKE_PASSWORD:
        chain.add_entry("LOGIN_SUCCESS", f"User '{username}' authenticated from {request.remote_addr}")
        return jsonify({"success": True})
    else:
        chain.add_entry("LOGIN_FAILED", f"Failed attempt: user='{username}' password='{password}' from {request.remote_addr}")
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

# ── LOGS ─────────────────────────────────────────────
@app.route('/api/logs', methods=['GET'])
def get_logs():
    chain = get_chain()
    return jsonify([e.to_dict() for e in chain.chain])

# ── VERIFY ───────────────────────────────────────────
@app.route('/api/verify', methods=['GET'])
def verify():
    chain = get_chain()
    result = chain.verify_chain()
    return jsonify({"result": result, "intact": "CHAIN INTACT" in result})

# ── TAMPER SIMULATIONS ───────────────────────────────
@app.route('/api/tamper/alter', methods=['POST'])
def tamper_alter():
    if not os.path.exists(CHAIN_FILE):
        return jsonify({"error": "No logs yet. Try logging in first."}), 400
    with open(CHAIN_FILE, 'r') as f:
        data = json.load(f)
    body = request.get_json(silent=True) or {}
    idx  = int(body.get('entry_index', 2))
    if idx <= 0 or idx >= len(data):
        return jsonify({"error": f"Pick a non-genesis entry (1 to {len(data)-1})."}), 400
    before = dict(data[idx])
    data[idx]['description'] = "[HACKER] Evidence overwritten — nothing happened here"
    after  = dict(data[idx])
    with open(CHAIN_FILE, 'w') as f:
        json.dump(data, f, indent=4)
    return jsonify({
        "type": "alter", "entry_index": idx, "label": "Text Altered",
        "before": before, "after": after, "what_changed": "description",
        "explanation": f"Entry #{idx}'s text was secretly rewritten. The hash stored in the file is now stale — it was computed from the original text, so verification will catch it."
    })

@app.route('/api/tamper/delete', methods=['POST'])
def tamper_delete():
    if not os.path.exists(CHAIN_FILE):
        return jsonify({"error": "No logs yet. Try logging in first."}), 400
    with open(CHAIN_FILE, 'r') as f:
        data = json.load(f)
    body = request.get_json(silent=True) or {}
    idx  = int(body.get('entry_index', 2))
    if idx <= 0 or idx >= len(data):
        return jsonify({"error": f"Pick a non-genesis entry (1 to {len(data)-1})."}), 400
    deleted    = dict(data[idx])
    next_entry = dict(data[idx + 1]) if idx + 1 < len(data) else None
    del data[idx]
    with open(CHAIN_FILE, 'w') as f:
        json.dump(data, f, indent=4)
    return jsonify({
        "type": "delete", "entry_index": idx, "label": "Entry Deleted",
        "before": deleted, "after": None, "next_entry": next_entry,
        "explanation": f"Entry #{idx} was silently removed. The entry below it still has #{idx}'s old hash as its prev_hash — but that entry no longer exists, breaking the chain."
    })

@app.route('/api/tamper/reorder', methods=['POST'])
def tamper_reorder():
    if not os.path.exists(CHAIN_FILE):
        return jsonify({"error": "No logs yet. Try logging in first."}), 400
    with open(CHAIN_FILE, 'r') as f:
        data = json.load(f)
    body  = request.get_json(silent=True) or {}
    idx   = int(body.get('entry_index', 1))
    idx2  = idx + 1
    if idx <= 0 or idx2 >= len(data):
        return jsonify({"error": f"Pick entry 1 to {len(data)-2} so there is a next entry to swap with."}), 400
    before_a, before_b = dict(data[idx]), dict(data[idx2])
    data[idx], data[idx2] = data[idx2], data[idx]
    after_a,  after_b  = dict(data[idx]), dict(data[idx2])
    with open(CHAIN_FILE, 'w') as f:
        json.dump(data, f, indent=4)
    return jsonify({
        "type": "reorder", "entry_index": idx, "label": "Entries Swapped",
        "before": before_a, "after": after_a,
        "before_b": before_b, "after_b": after_b,
        "explanation": f"Entries #{idx} and #{idx2} were swapped. Their prev_hash values now point to the wrong parents, breaking the mathematical chain at position #{idx}."
    })

# ── RESET ─────────────────────────────────────────────
@app.route('/api/reset', methods=['POST'])
def reset():
    if os.path.exists(CHAIN_FILE):
        os.remove(CHAIN_FILE)
    return jsonify({"message": "Log chain reset for fresh demo."})

if __name__ == '__main__':
    app.run(debug=True, port=5001)
