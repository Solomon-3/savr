"""
Savr - Bitcoin Savings Goals on the Lightning Network
Flask API backend serving the React frontend.
"""

import base64
import io
import os

import qrcode
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from lnd_client import LNDClient
from polar_detect import auto_detect
from models import (
    init_db,
    create_goal,
    get_goal,
    list_goals,
    create_contribution,
    settle_contribution,
    get_goal_contributors,
    verify_invite_code,
    mark_goal_complete_if_reached,
)

app = Flask(__name__, static_folder="../frontend/dist", static_url_path="")
CORS(app)

# Initialize database
init_db()

# Auto-detect LND
lnd_dir, rest_host = auto_detect("bob")
lnd = None
if lnd_dir and rest_host:
    try:
        lnd = LNDClient(lnd_dir, rest_host)
        info = lnd.get_info()
        print(f"[Savr] Connected to LND node: {info['alias']}")
    except Exception as e:
        print(f"[Savr] LND connection failed: {e}")
        lnd = None
else:
    print("[Savr] No LND configuration found. Set LND_DIR and REST_HOST env vars.")


def generate_qr_base64(data):
    qr = qrcode.make(data, box_size=8, border=2)
    buf = io.BytesIO()
    qr.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()


# --- API Routes ---


@app.route("/api/node_info")
def node_info():
    if not lnd:
        return jsonify({"error": "LND not connected"}), 503
    try:
        info = lnd.get_info()
        balance = lnd.channel_balance()
        info["balance"] = balance
        return jsonify(info)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def _strip_invite_code(goal):
    """Remove invite_code before sending to clients — it's only revealed at creation."""
    g = dict(goal)
    g.pop("invite_code", None)
    return g


@app.route("/api/goals", methods=["GET"])
def api_list_goals():
    goals = list_goals(active_only=True)
    return jsonify([_strip_invite_code(g) for g in goals])


@app.route("/api/goals", methods=["POST"])
def api_create_goal():
    data = request.json
    required = ["name", "target_amount", "goal_type", "frequency", "creator_name"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    if data["goal_type"] not in ("personal", "collaborative"):
        return jsonify({"error": "goal_type must be 'personal' or 'collaborative'"}), 400
    if data["frequency"] not in ("daily", "weekly", "monthly"):
        return jsonify({"error": "frequency must be 'daily', 'weekly', or 'monthly'"}), 400

    try:
        target = int(data["target_amount"])
        if target <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "target_amount must be a positive integer (satoshis)"}), 400

    goal = create_goal(
        name=data["name"],
        description=data.get("description", ""),
        target_amount=target,
        goal_type=data["goal_type"],
        frequency=data["frequency"],
        creator_name=data["creator_name"],
        deadline=data.get("deadline"),
    )
    # Return the invite_code only at creation time — never again
    return jsonify(goal), 201


@app.route("/api/goals/<goal_id>")
def api_get_goal(goal_id):
    goal = get_goal(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404
    return jsonify(_strip_invite_code(goal))


@app.route("/api/goals/<goal_id>/verify_code", methods=["POST"])
def api_verify_code(goal_id):
    data = request.json or {}
    code = data.get("invite_code", "")
    if not code:
        return jsonify({"error": "invite_code is required"}), 400
    valid = verify_invite_code(goal_id, code)
    if valid:
        return jsonify({"valid": True})
    return jsonify({"valid": False, "error": "Invalid invite code"}), 403


@app.route("/api/goals/<goal_id>/contributors")
def api_goal_contributors(goal_id):
    contributors = get_goal_contributors(goal_id)
    return jsonify(contributors)


@app.route("/api/goals/<goal_id>/contribute", methods=["POST"])
def api_contribute(goal_id):
    if not lnd:
        return jsonify({"error": "LND not connected"}), 503

    goal = get_goal(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404

    data = request.json

    # Collaborative goals require a valid invite code
    if goal["goal_type"] == "collaborative":
        code = data.get("invite_code", "")
        if not verify_invite_code(goal_id, code):
            return jsonify({"error": "Invalid invite code"}), 403

    contributor = data.get("contributor_name", "Anonymous")

    try:
        amount = int(data.get("amount", 0))
        if amount <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "amount must be a positive integer (satoshis)"}), 400

    try:
        memo = f"Savr: {goal['name']} - from {contributor}"
        invoice = lnd.add_invoice(amount, memo)
        contribution = create_contribution(
            goal_id=goal_id,
            contributor_name=contributor,
            amount=amount,
            r_hash=invoice["r_hash"],
            payment_request=invoice["payment_request"],
        )
        qr_data = generate_qr_base64(invoice["payment_request"].upper())
        return jsonify({
            "contribution": contribution,
            "payment_request": invoice["payment_request"],
            "r_hash": invoice["r_hash"],
            "qr_code": qr_data,
        }), 201
    except Exception as e:
        return jsonify({"error": f"Invoice creation failed: {str(e)}"}), 500


@app.route("/api/check_payment/<r_hash>")
def api_check_payment(r_hash):
    if not lnd:
        return jsonify({"error": "LND not connected"}), 503
    try:
        result = lnd.lookup_invoice(r_hash)
        if result["settled"]:
            updated = settle_contribution(r_hash)
            # Check if the goal is now complete and mark it
            if updated:
                mark_goal_complete_if_reached(updated["goal_id"])
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/goals/<goal_id>/decode_invoice", methods=["POST"])
def api_decode_invoice(goal_id):
    """Decode a BOLT11 invoice so the frontend can preview amount + memo before sending."""
    if not lnd:
        return jsonify({"error": "LND not connected"}), 503
    data = request.json or {}
    pay_req = data.get("payment_request", "").strip()
    if not pay_req:
        return jsonify({"error": "payment_request is required"}), 400
    try:
        decoded = lnd.decode_pay_req(pay_req)
        return jsonify({
            "amount": int(decoded.get("num_satoshis", 0)),
            "memo": decoded.get("description", ""),
            "destination": decoded.get("destination", ""),
        })
    except Exception as e:
        return jsonify({"error": f"Could not decode invoice: {str(e)}"}), 400


@app.route("/api/goals/<goal_id>/send", methods=["POST"])
def api_send_payment(goal_id):
    """Pay an outgoing BOLT11 invoice from the goal's collected funds."""
    if not lnd:
        return jsonify({"error": "LND not connected"}), 503

    goal = get_goal(goal_id)
    if not goal:
        return jsonify({"error": "Goal not found"}), 404

    if goal["current_amount"] < goal["target_amount"]:
        return jsonify({"error": "Goal has not been reached yet"}), 400

    data = request.json or {}
    pay_req = data.get("payment_request", "").strip()
    if not pay_req:
        return jsonify({"error": "payment_request is required"}), 400

    # For collaborative goals require the invite code
    if goal["goal_type"] == "collaborative":
        code = data.get("invite_code", "")
        if not verify_invite_code(goal_id, code):
            return jsonify({"error": "Invalid invite code"}), 403

    try:
        result = lnd.pay_invoice(pay_req)
        return jsonify({"success": True, "payment_preimage": result["payment_preimage"]})
    except Exception as e:
        return jsonify({"error": f"Payment failed: {str(e)}"}), 500


# --- Serve React Frontend ---


@app.route("/")
@app.route("/<path:path>")
def serve_frontend(path=""):
    if path and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    print("\n⚡ Savr - Lightning Savings Goals")
    print("  Backend: http://127.0.0.1:5001")
    print("  Frontend: http://localhost:3000 (dev) or http://127.0.0.1:5001 (production)\n")
    app.run(debug=True, port=5001)
