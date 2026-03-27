# Savr - Lightning Savings Goals

Transparent Bitcoin savings goals on the Lightning Network. Create personal or collaborative goals with daily, weekly, or monthly targets. When a goal is reached, spend the collected sats directly from the app by paying any Lightning invoice.

## Features

- **Personal & Collaborative Goals** — Save alone or pool funds with others
- **Invite Codes** — Collaborative goals are protected by a 6-character code shared by the creator
- **Daily / Weekly / Monthly Targets** — Flexible saving schedules
- **Full Transparency** — All contributions and contributor rankings are publicly visible
- **Lightning Payments** — Instant Bitcoin deposits via Lightning invoices + QR codes
- **Real-time Progress** — Payment detection with automatic progress bar updates
- **Celebrate & Spend** — When a goal is reached, pay out to any Lightning invoice directly from the app

## Project Structure

```
project/
├── backend/
│   ├── app.py              # Flask API server (port 5001)
│   ├── models.py           # SQLite database models
│   ├── lnd_client.py       # LND REST API client
│   ├── polar_detect.py     # Polar auto-detection
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api.js                      # API client functions
│   │   ├── App.jsx                     # Root component + routing
│   │   ├── App.css                     # Application styles
│   │   ├── components/
│   │   │   ├── Header.jsx              # App header with node status
│   │   │   ├── GoalCard.jsx            # Goal summary card
│   │   │   ├── PaymentModal.jsx        # Incoming invoice + QR modal
│   │   │   ├── CelebrationCard.jsx     # Shown when goal is reached
│   │   │   ├── SendModal.jsx           # Outgoing payment flow
│   │   │   ├── ContributorList.jsx     # Contributor leaderboard
│   │   │   └── ActivityFeed.jsx        # Recent contributions feed
│   │   └── pages/
│   │       ├── Dashboard.jsx           # Goals listing with filters
│   │       ├── CreateGoal.jsx          # New goal form + invite code reveal
│   │       └── GoalDetail.jsx          # Goal detail, contribute, send
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Prerequisites

- Python 3.8+
- Node.js 18+
- [Polar](https://lightningpolar.com/) (Lightning Network simulator) or a live LND node

## Setup

### 1. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS / Linux

# Install dependencies
pip install -r requirements.txt

# Start the API server
python app.py
```

The backend runs at `http://127.0.0.1:5001`. The SQLite database (`savr.db`) is created automatically on first run inside the `backend/` folder.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend dev server runs at `http://localhost:3000` and proxies API calls to the backend on port 5001.

To build for production:

```bash
npm run build
# Serve via the Flask backend at http://127.0.0.1:5001
```

### 3. LND Configuration

**With Polar (recommended for development):**
1. Install and open [Polar](https://lightningpolar.com/)
2. Create a network with an LND node named `bob`
3. Start the network
4. Savr auto-detects the node — no extra config needed

**Manual configuration:**
```bash
# Windows
set LND_DIR=C:\path\to\lnd\directory
set REST_HOST=https://localhost:8082

# macOS / Linux
export LND_DIR=/path/to/lnd/directory
export REST_HOST=https://localhost:8082

python app.py
```

## Usage

1. **Create a Goal** — Set a name, target (in sats), type (personal/collaborative), and saving frequency
2. **Share the Invite Code** — For collaborative goals, share the generated 6-character code with participants
3. **Contribute** — Enter your name and amount, scan the QR code or copy the invoice, pay from any Lightning wallet
4. **Track Progress** — Watch the progress bar fill and see the live contributor leaderboard
5. **Spend Sats** — Once the goal is reached, a celebration screen appears with a **Send Sats** button — paste any BOLT11 invoice to pay out

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List all active goals |
| POST | `/api/goals` | Create a new goal |
| GET | `/api/goals/:id` | Get goal details + contributions |
| GET | `/api/goals/:id/contributors` | Contributor leaderboard |
| POST | `/api/goals/:id/verify_code` | Validate an invite code |
| POST | `/api/goals/:id/contribute` | Create a Lightning invoice for a contribution |
| POST | `/api/goals/:id/decode_invoice` | Decode a BOLT11 invoice (preview before sending) |
| POST | `/api/goals/:id/send` | Pay a BOLT11 invoice from the goal's funds |
| GET | `/api/check_payment/:r_hash` | Poll payment status |
| GET | `/api/node_info` | LND node info |
