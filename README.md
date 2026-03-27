# Savr - Lightning Savings Goals

Transparent Bitcoin savings goals on the Lightning Network. Create personal or collaborative goals with daily, weekly, or monthly targets.

## Features

- **Personal & Collaborative Goals** - Save alone or pool funds with others
- **Daily / Weekly / Monthly Targets** - Flexible saving schedules
- **Full Transparency** - All contributions visible with contributor leaderboard
- **Lightning Payments** - Instant Bitcoin deposits via Lightning invoices
- **Real-time Updates** - Payment detection with automatic progress updates

## Prerequisites

- Python 3.8+
- Node.js 18+
- [Polar](https://lightningpolar.com/) (Lightning Network simulator) or a running LND node

## Setup

### 1. Backend

```bash
cd C:\Users\X1\Desktop\project

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run the API server
python app.py
```

The backend runs at `http://127.0.0.1:5001`.

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```

The frontend runs at `http://localhost:3000` and proxies API requests to the backend.

### 3. LND Configuration

**With Polar (recommended):**
1. Install and open Polar
2. Create a network with an LND node named "bob"
3. Start the network
4. Savr auto-detects the node configuration

**Manual configuration:**
```bash
set LND_DIR=C:\path\to\lnd\directory
set REST_HOST=https://localhost:8082
python app.py
```

## Usage

1. **Create a Goal** - Set a name, target amount (in sats), type (personal/collaborative), and saving frequency
2. **Share the Goal** - Others can view progress and contribute to collaborative goals
3. **Contribute** - Enter your name and amount, then pay the Lightning invoice
4. **Track Progress** - Watch the progress bar fill and see the contributor leaderboard

## Project Structure

```
project/
├── app.py              # Flask API server
├── models.py           # SQLite database models
├── lnd_client.py       # LND REST API client
├── polar_detect.py     # Polar auto-detection
├── requirements.txt    # Python dependencies
├── savr.db             # SQLite database (auto-created)
└── frontend/           # React app (Vite)
    ├── src/
    │   ├── api.js          # API client functions
    │   ├── App.jsx         # Root component with routing
    │   ├── App.css         # Application styles
    │   ├── components/
    │   │   ├── Header.jsx          # App header with node status
    │   │   ├── GoalCard.jsx        # Goal summary card
    │   │   ├── PaymentModal.jsx    # Lightning invoice + QR modal
    │   │   ├── ContributorList.jsx # Contributor leaderboard
    │   │   └── ActivityFeed.jsx    # Recent contributions feed
    │   └── pages/
    │       ├── Dashboard.jsx   # Goals listing with filters
    │       ├── CreateGoal.jsx  # New goal form
    │       └── GoalDetail.jsx  # Goal detail + contribute
    └── vite.config.js   # Vite config with API proxy
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | List all active goals |
| POST | `/api/goals` | Create a new goal |
| GET | `/api/goals/:id` | Get goal details + contributions |
| GET | `/api/goals/:id/contributors` | Get contributor leaderboard |
| POST | `/api/goals/:id/contribute` | Create invoice for contribution |
| GET | `/api/check_payment/:r_hash` | Check payment status |
| GET | `/api/node_info` | Get LND node info |
