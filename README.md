# 🔐 Tamper-Evident Logging System

> **Cybersecurity Internship — Task 1**  
> A cryptographic hash-chained logging system with an interactive React dashboard to demonstrate, simulate, and detect log tampering in real time.

---

## 📌 Overview

This project implements a **tamper-evident audit log** using a SHA-256 blockchain-style hash chain. Every log entry cryptographically references the one before it — making any alteration, deletion, or reordering of records immediately detectable.

The system includes:
- A **Python/Flask backend** that manages the log chain and exposes a REST API
- A **React (Vite) frontend** dashboard for visualizing logs, simulating tampering, and verifying chain integrity
- A **CLI utility** for direct interaction
- A **static HTML explainer** (`HOW_IT_WORKS.html`) for presentations

---

## ✨ Features

| Feature | Description |
|---|---|
| 🧱 **Genesis Block** | Auto-created anchor entry with a zero-hash foundation |
| 🔗 **Hash Chaining** | Each entry's SHA-256 hash depends on the previous entry |
| ✏️ **Tamper: Alter** | Overwrites an entry's text — stale hash is detected |
| 🗑️ **Tamper: Delete** | Removes a log entry — broken `prev_hash` link is detected |
| 🔀 **Tamper: Reorder** | Swaps two entries — mismatched parent hashes are detected |
| ✅ **Chain Verify** | Full chain walk re-computes all hashes to find any breach |
| 🔄 **Reset** | Wipes the chain for a clean demo start |
| 🔐 **Login Logging** | Logs successful and failed login attempts into the chain |

---

## 🗂️ Project Structure

```
Task1_Logging_System/
├── server.py           # Flask API server (port 5001)
├── log_chain.py        # Core cryptographic chain engine
├── cli.py              # Command-line interface
├── demo.py             # Standalone demo script
├── HOW_IT_WORKS.html   # Visual explainer for presentations
├── requirements.txt    # Python dependencies
├── ui_logs.json        # Live log chain (auto-generated, git-ignored)
├── demo_logs.json      # Demo seed data (git-ignored)
└── frontend/           # React + Vite dashboard
    ├── src/
    │   ├── App.jsx     # Main dashboard component
    │   └── index.css   # Global styles
    ├── index.html
    ├── package.json
    └── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 18+ and npm

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Task1_Logging_System
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment (recommended)
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask backend (runs on http://localhost:5001)
python server.py
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | Attempt login; logs success/failure into chain |
| `GET` | `/api/logs` | Retrieve all log entries |
| `GET` | `/api/verify` | Verify full chain integrity |
| `POST` | `/api/tamper/alter` | Simulate text alteration on an entry |
| `POST` | `/api/tamper/delete` | Simulate deletion of an entry |
| `POST` | `/api/tamper/reorder` | Simulate swapping two consecutive entries |
| `POST` | `/api/reset` | Reset the log chain for a fresh demo |
| `GET` | `/explain` | Serve the `HOW_IT_WORKS.html` explainer |

---

## 🔬 How It Works

Each `LogEntry` stores:
- `timestamp` — Unix epoch float
- `event_type` — e.g. `LOGIN_SUCCESS`, `LOGIN_FAILED`
- `description` — Human-readable event detail
- `prev_hash` — SHA-256 hash of the previous entry
- `hash` — SHA-256 hash of the above four fields combined

```
Genesis [hash=H0] → Entry1 [prev=H0, hash=H1] → Entry2 [prev=H1, hash=H2] ...
```

**Tampering breaks the chain because:**
- **Alter** → `hash` stored in JSON no longer matches recomputed hash from current data
- **Delete** → Next entry's `prev_hash` points to a now-missing entry
- **Reorder** → Swapped entries have each other's `prev_hash`, not their new parent's

---

## 🖥️ CLI Usage

```bash
python cli.py add LOGIN_SUCCESS "Admin logged in from 192.168.1.1"
python cli.py verify
python cli.py show
```

---

## 🛡️ Security Notes

> **Demo Credentials** — `admin` / `admin123`  
> This is intentionally hardcoded for demonstration purposes. Do **not** use in production.

- The chain uses **SHA-256** (collision-resistant) for all hashes
- All tamper simulations are reversible via the `/api/reset` endpoint
- Log files are stored locally in JSON format (not a production-grade solution)

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, Flask, Flask-CORS |
| Frontend | React 18, Vite 5 |
| Hashing | SHA-256 (Python `hashlib`) |
| Data Storage | Local JSON files |

---

## 📄 License

This project was created as part of a **Cybersecurity Internship Assessment**.  
For educational and demonstration purposes only.
