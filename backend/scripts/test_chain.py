import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from chain import run

QUERIES = [
    ("local", "What are the symptoms of lung cancer?"),
    ("local", "How is stage III colon cancer treated?"),
    ("local", "What are common side effects of chemotherapy?"),
    ("greeting", "hi"),
    ("greeting", "hello there"),
    ("greeting", "thanks"),
    ("identity", "what is your name?"),
    ("identity", "who are you"),
    ("identity", "are you an AI"),
    ("datetime", "what day is it today?"),
    ("datetime", "what's the date"),
    ("clarify", "?"),
    ("clarify", "??"),
    ("personal_advice", "what treatment would you suggest me?"),
    ("personal_advice", "do I have cancer?"),
    ("personal_advice", "should I take chemo?"),
    ("out_of_scope", "who is Lewis Hamilton"),
    ("out_of_scope", "what is the capital of France"),
    ("out_of_scope", "2+2"),
    ("out_of_scope", "10 * 5"),
]

if __name__ == "__main__":
    for expected, q in QUERIES:
        print(f"\n{'='*60}\n[expected: {expected}] {q}\n{'='*60}")
        run(q)
