import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

from langchain_community.document_loaders import PyMuPDFLoader

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def main():
    pdf_paths = sorted(DATA_DIR.rglob("*.pdf"))

    if not pdf_paths:
        print("No PDF files found under ./data/")
        return

    total_files = 0
    total_pages = 0
    total_chars = 0
    suspect = []
    failed = []

    for pdf_path in pdf_paths:
        total_files += 1
        rel_path = pdf_path.as_posix()
        try:
            loader = PyMuPDFLoader(str(pdf_path))
            docs = loader.load()
            pages = len(docs)
            chars = sum(len(doc.page_content) for doc in docs)
            total_pages += pages
            total_chars += chars

            if chars < 500:
                status = "SUSPECT"
                suspect.append(rel_path)
            else:
                status = "OK"

            print(f"[{status}] {rel_path}: {pages} pages, {chars} chars")

        except Exception as e:
            failed.append(rel_path)
            print(f"[FAIL] {rel_path}: {e}")

    print()
    print(f"Total files: {total_files}")
    print(f"Total pages: {total_pages}")
    print(f"Total chars: {total_chars}")

    if suspect:
        print(f"\nSUSPECT files ({len(suspect)}):")
        for s in suspect:
            print(f"  - {s}")

    if failed:
        print(f"\nFAILED files ({len(failed)}):")
        for f in failed:
            print(f"  - {f}")

    if not suspect and not failed:
        print("\nAll files OK.")


if __name__ == "__main__":
    main()
