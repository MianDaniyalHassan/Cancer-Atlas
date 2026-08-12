import sys
import os
import time
import shutil
import argparse
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

from dotenv import load_dotenv
load_dotenv()

from langchain_community.document_loaders import PyMuPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--rebuild", action="store_true")
    args = parser.parse_args()

    chroma_path = Path("./chroma_db")

    if chroma_path.exists() and not args.rebuild:
        print("Index already exists at ./chroma_db. Use --rebuild to rebuild.")
        sys.exit(0)

    if args.rebuild and chroma_path.exists():
        shutil.rmtree(chroma_path)
        print("Deleted existing chroma_db.")

    data_dir = Path("./data")
    pdf_paths = sorted(data_dir.rglob("*.pdf"))

    if not pdf_paths:
        print("No PDF files found under ./data/. Add PDFs and run again.")
        sys.exit(0)

    t_load_start = time.perf_counter()

    all_docs = []
    loaded_count = 0
    skipped_count = 0

    for pdf_path in pdf_paths:
        try:
            loader = PyMuPDFLoader(str(pdf_path))
            docs = loader.load()
            loaded_count += 1

            category = pdf_path.parent.name
            for doc in docs:
                doc.metadata["source_file"] = pdf_path.name
                doc.metadata["doc_category"] = category
                for key in list(doc.metadata.keys()):
                    if doc.metadata[key] is None:
                        doc.metadata[key] = ""

            all_docs.extend(docs)
        except Exception as e:
            skipped_count += 1
            print(f"[SKIP] {pdf_path.name}: {e}")

    total_pages = len(all_docs)
    all_docs = [doc for doc in all_docs if doc.page_content.strip()]

    t_load_end = time.perf_counter()

    t_split_start = time.perf_counter()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(all_docs)

    t_split_end = time.perf_counter()

    t_embed_start = time.perf_counter()

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    Chroma.from_documents(chunks, embeddings, persist_directory="./chroma_db")

    t_embed_end = time.perf_counter()

    load_time = t_load_end - t_load_start
    split_time = t_split_end - t_split_start
    embed_time = t_embed_end - t_embed_start
    total_time = t_embed_end - t_load_start

    print(f"PDFs loaded:      {loaded_count}")
    print(f"PDFs skipped:     {skipped_count}")
    print(f"Pages loaded:     {total_pages}")
    print(f"Chunks created:   {len(chunks)}")
    print(f"Load time:        {load_time:.1f}s")
    print(f"Split time:       {split_time:.1f}s")
    print(f"Embed time:       {embed_time:.1f}s")
    print(f"Total time:       {total_time:.1f}s")
    print(f"Index location:   ./chroma_db")


if __name__ == "__main__":
    main()
