import sys
import os
import re
from datetime import datetime
from enum import Enum
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
load_dotenv()

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document

FALLBACK_THRESHOLD = float(os.getenv("FALLBACK_THRESHOLD", "1.0"))

class Route(str, Enum):
    LOCAL = "local"
    GREETING = "greeting"
    IDENTITY = "identity"
    DATETIME = "datetime"
    CLARIFY = "clarify"
    PERSONAL_ADVICE = "personal_advice"
    OUT_OF_SCOPE = "out_of_scope"


GREETING_MESSAGE = "Hi! I'm CancerAtlas — I answer cancer questions using curated medical sources: NCI PDQ, WHO, IARC GLOBOCAN, and ACS Cancer Facts & Figures. Ask me about symptoms, staging, treatments, side effects, or global statistics."

IDENTITY_MESSAGE = "I'm CancerAtlas, an AI assistant grounded in a curated set of medical documents — NCI Physician Data Query summaries, WHO reports, IARC GLOBOCAN data, and ACS Cancer Facts & Figures. Every answer I give is drawn from those sources, and I cite them inline. I'm not a doctor and can't give personal medical advice."

CLARIFY_MESSAGE = "Could you rephrase with a bit more detail? For example: 'What are common symptoms of lung cancer?' or 'How is stage III colon cancer treated?'"

PERSONAL_ADVICE_MESSAGE = "I can share general information from medical sources — symptoms, treatments, statistics, side effects — but I can't give personal medical advice or recommend treatments for individuals. For questions about your own care, please consult a qualified physician who can review your specific situation."

OUT_OF_SCOPE_MESSAGE = """That's outside what my sources cover. CancerAtlas answers from curated medical documents (NCI PDQ, WHO, IARC GLOBOCAN, ACS Cancer Facts & Figures). I can help with:

- Symptoms, staging, and treatment of specific cancer types
- Chemotherapy, immunotherapy, and targeted therapy protocols
- Global cancer statistics and incidence rates
- Common side effects of cancer treatments"""

if not Path("./chroma_db").exists():
    raise RuntimeError("Chroma index not found at ./chroma_db. Run 'python ingest.py' first.")

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 5, "fetch_k": 20},
)

# llm = ChatGroq(
#     model="llama-3.3-70b-versatile",
#     temperature=0.2,
#     streaming=True,
# )

llm = ChatGroq(
    model="openai/gpt-oss-120b",
    temperature=0.2,
    streaming=True,
)

prompt = ChatPromptTemplate.from_messages([
    ("system", "You are CancerAtlas, an assistant that answers questions about cancer using ONLY the provided context. If the context does not contain the answer, say so honestly and do not invent information. You are not a doctor. Never diagnose. Never recommend specific treatments for an individual. Encourage the user to consult a qualified physician for medical decisions. Answer clearly and concisely. When the context includes source file names, mention which source the information came from."),
    ("human", "Context:\n{context}\n\nQuestion: {question}"),
])

_GREETING_WORDS = {
    "hi", "hii", "hiii", "hello", "helo", "hey", "heya", "yo", "sup", "hola",
    "namaste", "salaam", "assalam", "assalamualaikum", "aoa",
    "good morning", "good afternoon", "good evening", "good night",
    "gm", "gn", "morning", "evening",
    "thanks", "thank you", "thx", "ty", "cheers",
    "bye", "goodbye", "see ya", "cya", "later",
}

_IDENTITY_PATTERNS = [
    r"\b(what|whats|what's|wut)\s+(your|ur|the)\s+name\b",
    r"\bwho\s+(are|r)\s+(you|u)\b",
    r"\bwhat\s+(are|r)\s+(you|u)\b",
    r"\bwhat\s+(can|do|could)\s+(you|u)\s+do\b",
    r"\bwhat.{0,20}(purpose|about)\b",
    r"\b(are|r)\s+(you|u)\s+(an?\s+)?(ai|bot|chatbot|human|real|robot|llm|model)\b",
    r"\bwho\s+(made|built|created|trained)\s+(you|u)\b",
    r"\bwhat\s+model\b",
    r"\btell\s+me\s+about\s+(yourself|urself|you)\b",
    r"\bintroduce\s+(yourself|urself)\b",
]

_DATETIME_PATTERNS = [
    r"\bwhat.{0,10}(day|date|time|year|month)\s*(is|'?s)?\s*(it|today|now)\b",
    r"\btoday'?s\s+(date|day)\b",
    r"\bwhat'?s\s+the\s+(date|time|day)\b",
    r"\bcurrent\s+(day|date|time|year)\b",
    r"\bwhat\s+time\b",
]

_PERSONAL_ADVICE_PATTERNS = [
    r"\bwhat\s+(should|would|shall)\s+i\s+(do|take|try|use|get)\b",
    r"\bwhat\s+(treatment|drug|medication|therapy).{0,40}(suggest|recommend|for\s+me|should\s+i)\b",
    r"\bshould\s+i\s+(get|take|try|do|see|worry)\b",
    r"\bdo\s+i\s+(have|need)\b",
    r"\bam\s+i\s+(going\s+to|likely|at\s+risk|dying)\b",
    r"\bdiagnose\s+me\b",
    r"\bwhat'?s\s+wrong\s+with\s+me\b",
    r"\bmy\s+(symptoms?|prognosis|treatment|cancer|diagnosis|tumor|biopsy)\b",
    r"\bcan\s+(you|u)\s+diagnose\b",
    r"\b(suggest|recommend).{0,20}(for\s+me|me\s+a)\b",
]

_MATH_ONLY = re.compile(r"^[\s\d+\-*/=().?xX×÷^%]+$")
_NOISE = {"?", "??", "???", "!", "!!", "...", "..", ".", "…"}


def _preclassify(query: str) -> Route | None:
    q = query.strip().lower()

    if len(q) < 3:
        return Route.CLARIFY
    if q in _NOISE:
        return Route.CLARIFY
    if _MATH_ONLY.match(q):
        return Route.OUT_OF_SCOPE

    for g in _GREETING_WORDS:
        if q == g or q.startswith(g + " ") or q.startswith(g + ",") or q.startswith(g + "!") or q.startswith(g + "."):
            return Route.GREETING

    for p in _IDENTITY_PATTERNS:
        if re.search(p, q):
            return Route.IDENTITY

    for p in _DATETIME_PATTERNS:
        if re.search(p, q):
            return Route.DATETIME

    for p in _PERSONAL_ADVICE_PATTERNS:
        if re.search(p, q):
            return Route.PERSONAL_ADVICE

    return None


def _datetime_response() -> str:
    now = datetime.now()
    return f"Today is {now.strftime('%A, %B %d, %Y')}. The current time is {now.strftime('%I:%M %p')} (server time)."


def route_query(query: str) -> tuple[Route, list[Document]]:
    pre = _preclassify(query)
    if pre is not None:
        print(f"[debug] route={pre.value} (preclassified)", file=sys.stderr)
        return (pre, [])

    results = vectorstore.similarity_search_with_score(query, k=1)
    top_distance = results[0][1] if results else float("inf")
    print(f"[debug] top_distance={top_distance:.4f}", file=sys.stderr)

    if top_distance <= FALLBACK_THRESHOLD:
        return (Route.LOCAL, retriever.invoke(query))

    return (Route.OUT_OF_SCOPE, [])


def static_response(route: Route) -> str:
    if route == Route.GREETING:
        return GREETING_MESSAGE
    if route == Route.IDENTITY:
        return IDENTITY_MESSAGE
    if route == Route.DATETIME:
        return _datetime_response()
    if route == Route.CLARIFY:
        return CLARIFY_MESSAGE
    if route == Route.PERSONAL_ADVICE:
        return PERSONAL_ADVICE_MESSAGE
    if route == Route.OUT_OF_SCOPE:
        return OUT_OF_SCOPE_MESSAGE
    raise ValueError(f"static_response called with LLM route: {route}")


def format_context(docs: list[Document]) -> str:
    if not docs:
        return ""

    blocks = []
    for doc in docs:
        label = doc.metadata.get("source_file", "unknown")
        blocks.append(f"[{label}]\n{doc.page_content}")

    return "\n\n".join(blocks)


def build_chain():
    return prompt | llm | StrOutputParser()


def run(query: str) -> None:
    try:
        route, docs = route_query(query)

        print(f"[route: {route.value}]")

        if route != Route.LOCAL:
            print(static_response(route))
            print()
            return

        files = list(dict.fromkeys(doc.metadata.get("source_file", "unknown") for doc in docs))
        print(f"[sources: {', '.join(files)}]")

        context = format_context(docs)
        chain = build_chain()

        for chunk in chain.stream({"context": context, "question": query}):
            print(chunk, end="", flush=True)
        print()

    except Exception as e:
        print(f"\n[ERROR] {e}")
