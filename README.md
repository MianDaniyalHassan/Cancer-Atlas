# CancerAtlas

A retrieval-augmented cancer information assistant. Every answer is grounded in a curated corpus of medical PDFs (NCI PDQ, WHO, IARC GLOBOCAN, ACS) — nothing invented, nothing generalized beyond what the sources say.

## Live Demo

- Frontend: `<vercel-url>`
- Backend: `<hf-space-url>`

## Architecture

```
  Browser
     |
     v
  Next.js (Vercel)  --- POST /chat (SSE) --->  FastAPI (HuggingFace Spaces)
     ^                                              |
     |                                              +--> Chroma vector store (MMR retrieval)
     +------------- streamed tokens ----------------+--> Groq llama-3.3-70b (generation)
```

The frontend streams tokens from the backend over Server-Sent Events. The backend retrieves the five most relevant chunks from a persistent Chroma index and asks Groq's Llama 3.3 to answer using only those chunks; out-of-corpus questions are declined without an LLM call.

## Stack

| Layer | Stack |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind v4 |
| Backend | FastAPI, Uvicorn, LangChain, Chroma, HuggingFace MiniLM embeddings, Groq LLM |

## Repository Layout

```
CancerAtlas/
├── backend/            FastAPI RAG service (chain, ingest, API, Dockerfile)
│   ├── data/           source PDFs (gitignored)
│   ├── chroma_db/      prebuilt vector store (committed for deploy)
│   └── scripts/        corpus + retrieval utilities
├── frontend/           Next.js app (landing + chat)
└── design-references/  original HTML prototypes (gitignored)
```

## Quick Start

**One click / one command** — from the project root, run the launcher (or double-click `start.bat` on Windows). It installs frontend deps on first run, starts both servers, and opens the browser:

```bash
python main.py
```

It boots the backend on `:8000` and the frontend on `:3000`, waits for both, opens `http://localhost:3000`, and stops both together on `Ctrl+C`. After startup it pre-warms the `/chat` route and the API in the background, so the handoff from the landing page is instant. One-time prerequisite: the backend's Python deps (`pip install -r backend/requirements.txt`) and Node.js 18+.

**Or run the two services manually:**

```bash
# Backend
cd backend && pip install -r requirements.txt && python main.py

# Frontend
cd frontend && npm install && npm run dev
```

Open `http://localhost:3000`. The landing page's "Start Chat" button routes to `/chat`, which connects to the backend on `http://localhost:8000` via `NEXT_PUBLIC_API_URL`.

## Deploy

- Backend → HuggingFace Spaces (Docker). See [backend/README.md](backend/README.md).
- Frontend → Vercel (root directory `frontend/`). See [frontend/README.md](frontend/README.md).

## Design Notes

- **Scoped decline instead of open-ended fallback** — questions outside the corpus return a fixed decline message rather than a guessed answer, so the assistant never speaks beyond its sources.
- **Offline embeddings** — the corpus is embedded once at ingest time and shipped as a Chroma index, so there is no per-query embedding cost or cold-start penalty.
- **SSE streaming** — answers stream token-by-token for a responsive, ChatGPT-style feel.
