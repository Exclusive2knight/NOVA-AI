"""NOVA dataset preparation: auditable, permission-aware, offline, standard library only.

Run:
 python training/prepare_corpus.py --manifest training/sources.example.json --out-dir ./nova-data/demo
Only use material with documented rights. Does not scrape any website.
"""
import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

SUPPORTED = {"public-domain-US", "CC0-1.0", "CC-BY-4.0", "MIT", "user-authored", "explicit-consent"}
EMAIL = re.compile(r"(?<!\w)[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}(?!\w)")
PHONE = re.compile(r"(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}")
SECRET = re.compile(r"(?i)(?:password|api[_ -]?key|access[_ -]?token|secret)\s*[:=]\s*\S{8,}")
CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")
MAX_BYTES = 12_000_000

def digest(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()

def clean_text(text):
    text = CONTROL.sub("", str(text)).replace("\r\n", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{4,}", "\n\n", text)
    return text.strip()

def private(text):
    return bool(EMAIL.search(text) or PHONE.search(text) or SECRET.search(text))

def read_documents(path):
    if path.suffix.lower() in {".txt", ".md"}:
        text = path.read_text(encoding="utf-8", errors="replace")
        # Chunk at paragraph boundaries, but never spill a document into another split.
        paragraphs = re.split(r"\n\s*\n", text)
        buf = ""
        for paragraph in paragraphs:
            paragraph = clean_text(paragraph)
            if not paragraph:
                continue
            while len(paragraph) > 4000:
                yield paragraph[:4000]
                paragraph = paragraph[4000:]
            if len(buf) + len(paragraph) > 4000 and buf:
                yield buf
                buf = ""
            buf += ("\n\n" if buf else "") + paragraph
        if buf:
            yield buf
    elif path.suffix.lower() == ".jsonl":
        for line in path.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            record = json.loads(line)
            if isinstance(record.get("text"), str):
                yield record["text"]
            elif isinstance(record.get("messages"), list):
                turns = []
                for msg in record["messages"]:
                    if msg.get("role") in {"user", "assistant"} and isinstance(msg.get("content"), str):
                        prefix = "User" if msg["role"] == "user" else "NOVA"
                        turns.append(f"{prefix}: {msg['content']}")
                if turns:
                    yield "\n".join(turns) + "\n"
    else:
        raise ValueError(f"Unsupported file format: {path.suffix}")

def prepare(manifest_file, out_dir, min_chars=35):
    manifest_file = Path(manifest_file).expanduser().resolve()
    out_dir = Path(out_dir).expanduser().resolve()
    raw = json.loads(manifest_file.read_text(encoding="utf-8"))
    sources = raw.get("sources", [])
    if not sources:
        raise ValueError("No approved sources in manifest")
    out_dir.mkdir(parents=True, exist_ok=True)
    output = {name: (out_dir / f"{name}.jsonl").open("w", encoding="utf-8") for name in ("train", "valid", "test")}
    counts = Counter()
    licenses = Counter()
    used_hashes = set()
    audits = []
    try:
        for source in sources:
            required = ("path", "id", "license", "source_url", "training_allowed")
            if any(field not in source for field in required):
                raise ValueError(f"Missing source metadata: {required}")
            if source["license"] not in SUPPORTED or source["training_allowed"] is not True:
                raise ValueError("Source not authorized for NOVA training: " + source["id"])
            if source["license"] == "explicit-consent" and not source.get("consent_record"):
                raise ValueError("Consent record required for " + source["id"])
            path = (manifest_file.parent / source["path"]).resolve()
            if not path.is_file() or path.stat().st_size > MAX_BYTES:
                raise ValueError("Source missing or too large: " + str(path))
            # Split by source ID, not chunk, to prevent near-duplicate source leakage.
            split_index = int(digest("nova-split-2026:" + source["id"])[:8], 16) % 100
            split = "test" if split_index < 10 else "valid" if split_index < 20 else "train"
            taken = 0
            for part in read_documents(path):
                text = clean_text(part)
                if len(text) < min_chars or not text.strip():
                    counts["short_filtered"] += 1
                    continue
                if private(text):
                    counts["private_filtered"] += 1
                    continue
                fingerprint = digest(re.sub(r"\s+", " ", text.lower()))
                if fingerprint in used_hashes:
                    counts["duplicate_filtered"] += 1
                    continue
                used_hashes.add(fingerprint)
                record = {"id": fingerprint[:20], "text": text, "source_id": source["id"],
                          "license": source["license"], "split": split}
                output[split].write(json.dumps(record, ensure_ascii=False) + "\n")
                counts[split] += 1
                taken += 1
            licenses[source["license"]] += taken
            audits.append({"id": source["id"], "license": source["license"],
                           "source_url": source["source_url"], "split": split, "accepted": taken})
    finally:
        for handle in output.values():
            handle.close()
    report = {"version": 1, "records": dict(counts), "licenses": dict(licenses),
              "audited_sources": audits, "notes": [
                  "No automated web scraping or implicit user-chat collection.",
                  "Basic PII screening is incomplete; human review remains necessary.",
                  "Train/valid/test splits are by source ID to reduce leakage.",
                  "Small demonstration sets may have empty validation/test splits."
              ]}
    (out_dir / "audit.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report

def main():
    p = argparse.ArgumentParser(description="NOVA licensed text pretraining ingestion")
    p.add_argument("--manifest", required=True)
    p.add_argument("--out-dir", required=True)
    p.add_argument("--min-chars", type=int, default=35)
    args = p.parse_args()
    print(json.dumps(prepare(args.manifest, args.out_dir, args.min_chars), indent=2))

if __name__ == "__main__":
    main()
