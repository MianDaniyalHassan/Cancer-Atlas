# CancerAtlas Backend

A retrieval-augmented generation (RAG) service that answers cancer questions using only a curated corpus of medical PDFs (NCI PDQ, WHO, IARC GLOBOCAN, ACS Cancer Facts & Figures). It streams answers over Server-Sent Events and short-circuits to a scoped decline message when a question falls outside the corpus, so it never invents medical information.

## Architecture

```
OFFLINE INGEST (run once)

  data/**/*.pdf
      |
      v
  PyMuPDFLoader  ->  RecursiveCharacterTextSplitter  ->  HuggingFace MiniLM
      |                (1000 chars / 150 overlap)          (all-MiniLM-L6-v2)
      |                                                          |
      +----------------------------------------------------------+
                                   |
                                   v
                          Chroma (./chroma_db)


ONLINE QUERY (per request)

  POST /chat {"message": "..."}
      |
      v
  route_query  --  similarity_search_with_score (k=1)
      |
      |-- distance <= FALLBACK_THRESHOLD --> MMR retriever (k=5) --> source "local"
      |                                              |
      |                                              v
      |                                   Groq llama-3.3-70b (streaming)
      |                                              |
      |                                              v
      |                                   SSE: source -> token... -> done
      |
      +-- distance > FALLBACK_THRESHOLD --> static reply (no LLM call)  --> source "out_of_scope"

  (conversational inputs — greetings, "who are you", "what day is it",
   personal-advice / clarify / out-of-scope — are pre-classified before
   retrieval and answered with a fixed reply, no LLM call)
```

## Stack

| Layer | Choice |
|---|---|
| PDF loader | PyMuPDFLoader (`langchain-community`) |
| Chunker | RecursiveCharacterTextSplitter (1000 chars, 150 overlap) |
| Embeddings | HuggingFace `sentence-transformers/all-MiniLM-L6-v2` (CPU, 384-dim) |
| Vector store | Chroma (persistent, `./chroma_db`) |
| Retriever | Chroma MMR (`k=5`, `fetch_k=20`) |
| LLM | Groq `llama-3.3-70b-versatile` (temperature 0.2, streaming) |
| Framework | FastAPI + Uvicorn |

## Endpoints

### `GET /health`

Response:

```json
{"status": "ok"}
```

### `POST /chat`

Request body:

```json
{"message": "What is metastasis?"}
```

Response: `text/event-stream` (Server-Sent Events). Events are bare `data:` lines separated by `\n\n`:

```
data: {"type": "source", "value": "local", "sources": ["file.pdf", ...]}

data: {"type": "token", "value": "Metastasis"}

data: {"type": "token", "value": " is"}

data: {"type": "done"}
```

- `source` is always emitted first. `value` is one of `"local"`, `"greeting"`, `"identity"`, `"datetime"`, `"clarify"`, `"personal_advice"`, or `"out_of_scope"`. Only `"local"` carries a non-empty `sources` array (the contributing files); the rest have `sources` empty.
- `token` events carry answer chunks. For every non-`local` route, a single `token` event carries the full static reply; for `local`, tokens stream from the LLM.
- `done` is always emitted last.
- On failure mid-stream, an `error` event is emitted (`{"type": "error", "value": "..."}`) followed by `done`.

Empty or whitespace-only messages return HTTP 422.

## Environment Variables

| Name | Default | Purpose |
|---|---|---|
| `GROQ_API_KEY` | — | Groq API key for LLM inference (required) |
| `FALLBACK_THRESHOLD` | `1.0` | Max Chroma distance for a question to count as in-corpus; above it, the request declines |
| `ALLOWED_ORIGINS` | `*` | Comma-separated CORS origins |
| `PORT` | `8000` | Port the server binds to |

## Local Development

```bash
python -m venv .venv && source .venv/bin/activate   # optional
pip install -r requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY
python ingest.py       # only if chroma_db/ not present
python main.py
```

The server listens on `http://localhost:8000` by default. Utility scripts in `scripts/` (corpus verification, retrieval sanity checks) are run from the backend root, e.g. `python scripts/sanity_check.py`.

## Deploy to HuggingFace Spaces (Docker)

1. Create a new Space with SDK: **Docker**.
2. Add `GROQ_API_KEY` and `ALLOWED_ORIGINS` as Space **Secrets**.
3. Push this `backend/` subtree to the Space's git remote:

   ```bash
   git subtree push --prefix backend/ hf main
   ```

   (or clone the Space repo and copy the contents of `backend/` into it).
4. The Space builds the `Dockerfile` automatically and serves on port 7860. Verify `/health` at the Space URL once the build finishes.

The container ships the prebuilt `chroma_db/` and does not run ingestion at startup.

## Routing

`route_query` returns a `(Route, docs)` pair. It first pre-classifies the message: greetings, identity/capability questions, date/time questions, personal-medical-advice requests, and too-short/noise inputs each get their own `Route` and a fixed `static_response` — no retrieval, no LLM call. Otherwise it runs a single nearest-neighbor lookup and compares the top distance to `FALLBACK_THRESHOLD`: within the threshold it retrieves and streams an LLM answer (`Route.LOCAL`); beyond it, the message is treated as `Route.OUT_OF_SCOPE` and answered with a fixed reply. Only `Route.LOCAL` invokes the LLM, so answers stay grounded in the curated corpus.
