# CancerAtlas Frontend

Next.js 15 (App Router) frontend for CancerAtlas — a landing page that explains the RAG pipeline and a streaming chat interface. It talks to the [CancerAtlas backend](../backend/README.md) over Server-Sent Events.

## Local Development

```bash
cd frontend
cp .env.example .env.local   # edit if the backend is not on localhost:8000
npm install
npm run dev
```

The app runs on `http://localhost:3000`. Start the backend separately (`cd backend && python main.py`) so the chat page has an API to call.

## Environment Variables

| Name | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the backend (e.g. `http://localhost:8000` locally, or the HuggingFace Space URL in production) |

## Routes

| Route | Description |
|---|---|
| `/` | Landing page — hero, the animated pipeline journey, and the corpus finale |
| `/chat` | Chat interface — streaming answers, session list, source pills, health indicator |

## Deploy to Vercel

1. Import the repository into Vercel.
2. Set **Root Directory** to `frontend/`.
3. Add the environment variable `NEXT_PUBLIC_API_URL` pointing to the deployed backend (the HuggingFace Space URL).
4. Deploy.
