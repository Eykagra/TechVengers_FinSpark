# AI Integration Orchestration Engine

This full-stack hackathon project parses requirement docs, ranks adapters, generates config mappings, simulates payload execution, and keeps governance/audit logs.

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- AI: NVIDIA NIM (chat + embeddings)

## Local Development

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
cd backend
npm install
```

3. Configure backend env:

- Copy `backend/.env.example` to `backend/.env`
- Fill values for:
  - `NVIDIA_API_KEY`
  - `NVIDIA_API_KEY_CHAT`
  - `NVIDIA_API_KEY_LLAMA3_2_NEMORETRIEVER_EMBED`

4. Run backend:

```bash
cd backend
npm run dev
```

5. Run frontend:

```bash
npm run dev
```

## Deploy Backend on Render

This repo includes `render.yaml` for Blueprint deployment.

1. In Render, choose `New +` -> `Blueprint`.
2. Connect this GitHub repo.
3. Render reads `render.yaml` and creates service `integration-orchestrator-backend`.
4. Set secret env vars in Render dashboard:
	- `NVIDIA_API_KEY`
	- `NVIDIA_API_KEY_CHAT`
	- `NVIDIA_API_KEY_LLAMA3_2_NEMORETRIEVER_EMBED`
5. Deploy and copy backend URL, for example:
	- `https://integration-orchestrator-backend.onrender.com`

## Deploy Frontend on Vercel

This repo includes `vercel.json` for Vite SPA settings.

1. In Vercel, import this GitHub repo.
2. Build settings:
	- Framework: `Vite`
	- Build command: `npm run build`
	- Output directory: `dist`
3. Set environment variable:
	- `VITE_API_BASE_URL=https://<your-render-backend>/api`
4. Deploy.

## Important Notes

- Never commit `.env` files or API keys.
- Frontend API base URL is read from `VITE_API_BASE_URL` and falls back to `http://localhost:3001/api` for local development.
