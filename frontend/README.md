# Text Speech Frontend

This is a minimal React + Vite frontend scaffold. It intentionally contains an empty/placeholder page ready for you to integrate the existing `voice.py` backend.

Quick start (PowerShell):

```powershell
cd frontend
npm install
npm run dev
```

Then open the printed `http://localhost:5173` address in your browser.

Integration notes:
- Your TTS code is in `../voice.py` at the repository root. To integrate, expose a small HTTP endpoint (e.g., using Flask or FastAPI) that accepts text and returns audio (or a URL).
- Run the Python server on a different port (e.g., `5000`) and call it from the React app with `fetch`.
- Remember to enable CORS on the Python side or proxy requests in development.

If you want, I can:
- Scaffold a minimal Python API wrapper around `voice.py` (Flask or FastAPI) and add sample fetch code in `src/App.jsx`.
- Add a small UI to send text and play returned audio.
