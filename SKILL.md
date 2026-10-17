---
name: cancer-atlas
description: Answer cancer-related questions using only retrieved passages from trusted medical sources (NCI, WHO, IARC, American Cancer Society) via the CancerAtlas retrieval-augmented pipeline. Use this skill whenever the user asks about cancer types, symptoms, risk factors, screening, staging, treatment options, or terminology and wants an evidence-grounded answer with sources, rather than a general-knowledge reply.
license: MIT
---

# CancerAtlas

CancerAtlas is a retrieval-augmented generation (RAG) system over a curated cancer corpus. This skill tells an agent how to answer cancer questions through it without inventing facts.

## When to use

- The user asks an educational question about cancer (symptoms, risk factors, screening, staging, treatments, definitions).
- The user wants the answer tied to a named source.

Do not use for personal diagnosis, treatment decisions, prognosis for a specific person, or medication dosing. Redirect those to a qualified physician.

## Knowledge base

- Sources: NCI (PDQ), WHO, IARC, American Cancer Society
- Chunking: documents split into roughly 1,000-character overlapping chunks
- Index: 3,448 chunks embedded with MiniLM (384 dimensions) and stored in a persistent Chroma database, with source metadata per chunk

## Workflow

1. **Embed the question** with the same MiniLM model used for the corpus.
2. **Retrieve** the five most relevant chunks from Chroma using maximal marginal relevance (MMR), which balances relevance and diversity.
3. **Generate** the answer with an open-weight model (GPT OSS 120B, served through Groq). The prompt contains only the user question and the five retrieved chunks.
4. **Answer from the chunks only.** Every claim must be supported by a retrieved passage.
5. **Name the source** (NCI, WHO, IARC, or ACS) for the information used.

## Rules

- If the retrieved chunks do not cover the question, say the sources provided do not answer it. Do not fill the gap from general knowledge.
- Never present a retrieved statement as stronger or broader than the source states it.
- Do not give a diagnosis, a treatment recommendation for an individual, or a survival estimate for an individual.
- End every answer with a short note that the information is educational and not a substitute for professional medical advice.

## Example

**User:** What are common symptoms of lung cancer?

**Expected behavior:** Retrieve five chunks, summarize the symptoms those chunks list, name the source(s), and add the educational-use note. If the chunks mention only some symptoms, report only those.

## Limitations

- Coverage is limited to the indexed documents; absence of an answer does not mean the information does not exist.
- The corpus is a snapshot and is not updated automatically.
