import sys
import os
import json
from contextlib import asynccontextmanager

sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from chain import route_query, format_context, build_chain, static_response, Route

ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",")]
PORT = int(os.getenv("PORT", "8000"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.chain = build_chain()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(req: ChatRequest):
    if req.message.strip() == "":
        raise HTTPException(status_code=422, detail="Message cannot be empty or whitespace")

    async def event_stream():
        try:
            route, docs = route_query(req.message)

            sources = sorted({d.metadata.get("source_file", "") for d in docs}) if route == Route.LOCAL else []

            yield f"data: {json.dumps({'type': 'source', 'value': route.value, 'sources': sources})}\n\n"

            if route != Route.LOCAL:
                yield f"data: {json.dumps({'type': 'token', 'value': static_response(route)})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
                return

            context = format_context(docs)
            chain = app.state.chain

            async for chunk in chain.astream({"context": context, "question": req.message}):
                yield f"data: {json.dumps({'type': 'token', 'value': chunk})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'value': str(e)})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
