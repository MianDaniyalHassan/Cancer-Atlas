import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from chain import build_chain

TEST_CASES = [
    {
        "query": "Who was Sidney Farber?",
        "leak_markers": ["Farber", "pediatric", "chemotherapy", "1948", "leukemia"],
    },
    {
        "query": "What is the capital of France?",
        "leak_markers": ["Paris"],
    },
    {
        "query": "How do I bake sourdough bread?",
        "leak_markers": ["flour", "starter", "yeast", "knead", "ferment"],
    },
    {
        "query": "What is quantum entanglement?",
        "leak_markers": ["particles", "entangled", "correlated", "superposition"],
    },
    {
        "query": "Who won the 2020 US presidential election?",
        "leak_markers": ["Biden", "Trump", "Joe"],
    },
]

COMPLIANCE_MARKERS = [
    "does not contain",
    "not contain",
    "don't have",
    "do not have",
    "no information",
    "cannot answer",
    "unable to answer",
    "not covered",
    "not in the context",
    "no relevant",
    "context provided",
    "based on the context",
    "context doesn't",
]


def classify(response, leak_markers):
    response_lower = response.lower()
    complied = any(marker in response_lower for marker in COMPLIANCE_MARKERS)
    leaks_found = [m for m in leak_markers if m.lower() in response_lower]

    if complied and not leaks_found:
        return "COMPLIED"
    if leaks_found and not complied:
        return f"LEAKED (found: {leaks_found})"
    if complied and leaks_found:
        return f"MIXED (complied but mentioned: {leaks_found})"
    return "UNCLEAR (manual review needed)"


def main():
    chain = build_chain()

    tallies = {"COMPLIED": 0, "LEAKED": 0, "MIXED": 0, "UNCLEAR": 0}

    for i, case in enumerate(TEST_CASES, 1):
        response = chain.invoke({"context": "", "question": case["query"]})

        verdict = classify(response, case["leak_markers"])

        print("=" * 60)
        print(f"TEST {i}: {case['query']}")
        print("=" * 60)
        print(f"RESPONSE ({len(response)} chars):")
        print(response)
        print()
        print(f"VERDICT: {verdict}")
        print()

        for key in tallies:
            if verdict.startswith(key):
                tallies[key] += 1

    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for key, count in tallies.items():
        print(f"  {key}: {count}")


if __name__ == "__main__":
    main()
