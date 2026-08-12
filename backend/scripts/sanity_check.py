import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

BACKEND_ROOT = Path(__file__).resolve().parent.parent


def main():
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = Chroma(
        persist_directory=str(BACKEND_ROOT / "chroma_db"),
        embedding_function=embeddings,
    )

    retriever = vectorstore.as_retriever(
        search_type="similarity", search_kwargs={"k": 3}
    )

    queries = [
        "symptoms of lung cancer",
        "chemotherapy side effects",
        "global cancer statistics",
    ]

    for query in queries:
        print(f"Query: {query}")
        print("-" * 60)
        docs = retriever.invoke(query)
        for i, doc in enumerate(docs, 1):
            source = doc.metadata.get("source_file", "")
            category = doc.metadata.get("doc_category", "")
            snippet = doc.page_content[:200]
            print(f"  [{i}] source_file: {source}")
            print(f"      doc_category: {category}")
            print(f"      content: {snippet}")
            print()
        print()


if __name__ == "__main__":
    main()
