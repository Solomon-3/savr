"""
SQLite database models for Savr savings goals and contributions.
"""

import sqlite3
import os
import random
import string
import uuid
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "savr.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def _generate_invite_code():
    """Generate a random 6-character uppercase alphanumeric invite code."""
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choices(chars, k=6))


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS goals (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            target_amount INTEGER NOT NULL,
            current_amount INTEGER NOT NULL DEFAULT 0,
            goal_type TEXT NOT NULL CHECK(goal_type IN ('personal', 'collaborative')),
            frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'monthly')),
            creator_name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            deadline TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            invite_code TEXT
        );

        CREATE TABLE IF NOT EXISTS contributions (
            id TEXT PRIMARY KEY,
            goal_id TEXT NOT NULL,
            contributor_name TEXT NOT NULL,
            amount INTEGER NOT NULL,
            r_hash TEXT NOT NULL,
            payment_request TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'settled', 'expired')),
            created_at TEXT NOT NULL,
            settled_at TEXT,
            FOREIGN KEY (goal_id) REFERENCES goals(id)
        );

        CREATE INDEX IF NOT EXISTS idx_contributions_goal ON contributions(goal_id);
        CREATE INDEX IF NOT EXISTS idx_contributions_rhash ON contributions(r_hash);
        CREATE INDEX IF NOT EXISTS idx_contributions_status ON contributions(status);
    """)
    # Migrate existing databases that predate the invite_code column
    try:
        conn.execute("ALTER TABLE goals ADD COLUMN invite_code TEXT")
        conn.commit()
    except Exception:
        pass  # Column already exists
    conn.commit()
    conn.close()


def create_goal(name, description, target_amount, goal_type, frequency, creator_name, deadline=None):
    conn = get_db()
    goal_id = str(uuid.uuid4())[:8]
    now = datetime.now(timezone.utc).isoformat()
    invite_code = _generate_invite_code() if goal_type == "collaborative" else None
    conn.execute(
        """INSERT INTO goals (id, name, description, target_amount, goal_type, frequency, creator_name, created_at, deadline, invite_code)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (goal_id, name, description, target_amount, goal_type, frequency, creator_name, now, deadline, invite_code),
    )
    conn.commit()
    goal = dict(conn.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone())
    conn.close()
    return goal


def verify_invite_code(goal_id, code):
    """Returns True if the code matches the goal's invite_code (case-insensitive)."""
    conn = get_db()
    row = conn.execute(
        "SELECT invite_code, goal_type FROM goals WHERE id = ?", (goal_id,)
    ).fetchone()
    conn.close()
    if not row:
        return False
    if row["goal_type"] != "collaborative":
        return True  # Personal goals need no code
    stored = row["invite_code"]
    return stored and stored.upper() == code.strip().upper()


def get_goal(goal_id):
    conn = get_db()
    row = conn.execute("SELECT * FROM goals WHERE id = ?", (goal_id,)).fetchone()
    if not row:
        conn.close()
        return None
    goal = dict(row)
    contributions = conn.execute(
        "SELECT * FROM contributions WHERE goal_id = ? ORDER BY created_at DESC",
        (goal_id,),
    ).fetchall()
    goal["contributions"] = [dict(c) for c in contributions]
    conn.close()
    return goal


def list_goals(active_only=True):
    conn = get_db()
    if active_only:
        rows = conn.execute(
            "SELECT * FROM goals WHERE is_active = 1 ORDER BY created_at DESC"
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM goals ORDER BY created_at DESC").fetchall()
    goals = [dict(r) for r in rows]
    conn.close()
    return goals


def create_contribution(goal_id, contributor_name, amount, r_hash, payment_request):
    conn = get_db()
    contrib_id = str(uuid.uuid4())[:8]
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        """INSERT INTO contributions (id, goal_id, contributor_name, amount, r_hash, payment_request, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (contrib_id, goal_id, contributor_name, amount, r_hash, payment_request, now),
    )
    conn.commit()
    contrib = dict(conn.execute("SELECT * FROM contributions WHERE id = ?", (contrib_id,)).fetchone())
    conn.close()
    return contrib


def settle_contribution(r_hash):
    conn = get_db()
    now = datetime.now(timezone.utc).isoformat()
    contrib = conn.execute(
        "SELECT * FROM contributions WHERE r_hash = ? AND status = 'pending'",
        (r_hash,),
    ).fetchone()
    if not contrib:
        conn.close()
        return None
    contrib = dict(contrib)
    conn.execute(
        "UPDATE contributions SET status = 'settled', settled_at = ? WHERE r_hash = ?",
        (now, r_hash),
    )
    conn.execute(
        "UPDATE goals SET current_amount = current_amount + ? WHERE id = ?",
        (contrib["amount"], contrib["goal_id"]),
    )
    conn.commit()
    updated = dict(conn.execute("SELECT * FROM contributions WHERE r_hash = ?", (r_hash,)).fetchone())
    conn.close()
    return updated


def get_goal_contributors(goal_id):
    conn = get_db()
    rows = conn.execute(
        """SELECT contributor_name, SUM(amount) as total, COUNT(*) as count
           FROM contributions WHERE goal_id = ? AND status = 'settled'
           GROUP BY contributor_name ORDER BY total DESC""",
        (goal_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
