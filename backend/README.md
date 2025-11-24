Run the simple backend that writes `script.txt` and invokes `voice.py`.

Prereqs:
- Python 3.8+
- `edge-tts` (already used by `voice.py`)
- `flask` and `flask-cors`

Quick setup:
```pwsh
python -m pip install flask flask-cors
```

Run server:
```pwsh
cd backend
python server.py
```

Frontend expects the endpoint at `http://127.0.0.1:8000/generate` (the default URL in `frontend/src/App.jsx`). The endpoint accepts POST JSON: `{ "text": "..." }`.

Notes:
- The server writes the provided text into `script.txt` in the repository root, then runs `python voice.py`.
- `voice.py` must be present and working; generation can take time depending on voices.
- This is a simple example for local development only — not hardened for production.
