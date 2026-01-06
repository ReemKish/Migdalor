# Skillx - Node.js + React template

This is a minimal template for a Node.js + React (Vite) website with two pages:

- `/insightx`
- `/verifyx`

Structure:

- `server/` - Express server that serves the built React app
- `client/` - Vite + React app (sources in `client/src`)

Quick start (PowerShell on Windows):

1. Install server dependencies:

```powershell
cd "c:/Users/NADAV_GVILI/Documents/GitHub/Skillx"
npm install
```

2. Install client dependencies and run dev (optional):

```powershell
cd client
npm install
npm run dev
```

3. Build client and start server (production preview):

```powershell
cd client; npm install; npm run build
cd ..
node server/index.js
```

Server listens on port 3000 by default. Open `http://localhost:3000/insightx` or `/verifyx`.

Notes:
- The client uses Vite + React Router for routes. The Express server serves `client/dist` and falls back to `index.html` for client-side routes.
