"""Prepare supervised conversation tuning data for NOVA from individually reviewed examples.

No scraping, no account access, no hidden transfer of local chat history.
Splits are explicit and remain isolated; validation/test are never training data.
Usage:
 python training/build_nova_sft.py --input training/nova_sft_examples.jsonl --out-dir nova-data/sft
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

SYSTEM = (
    "You are NOVA, a clear and helpful assistant for coding, game development and research. "
    "Speak conversationally, follow the user's actual request and preserve relevant context. "
    "Do not invent sources, model capabilities, test results, memories, or deployments. "
    "Give useful answers instead of dumping web links. "
    "Protect privacy and acknowledge uncertainty. "
    "The NOVA app can offer hosted tools when connected; your text response alone "
    "does not imply any tool has run."
)
ALLOWED_SPLITS = {"train", "valid", "test"}
ALLOWED_LICENSES = {"project-original", "CC0-1.0", "CC-BY-4.0", "public-domain-US",
                    "explicit-consent", "user-authored"}
EMAIL = re.compile(r"(?<!\w)[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")
PHONE = re.compile(r"(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}")
SECRET = re.compile(r"(?i)\b(?:password|api[_ -]?key|access[_ -]?token|secret|private key)\s*[:=]\s*\S{8,}")
CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f]")

def normalize(text):
    return re.sub(r"\s+", " ", text.strip().lower())

def has_sensitive(text):
    return bool(EMAIL.search(text) or PHONE.search(text) or SECRET.search(text) or CONTROL.search(text))

def convert(rows):
    seen_prompt = {}
    seen_id = set()
    converted = {name: [] for name in ("train", "valid", "test")}
    count_categories = Counter()
    for lineno, data in enumerate(rows, 1):
        if not isinstance(data, dict):
            raise ValueError(f"Line {lineno}: expected a JSON object")
        ident = data.get("id")
        prompt, response = data.get("prompt"), data.get("response")
        split, license_id = data.get("split"), data.get("license")
        if not isinstance(ident, str) or not ident or ident in seen_id:
            raise ValueError(f"Line {lineno}: missing or duplicate ID")
        seen_id.add(ident)
        if split not in ALLOWED_SPLITS:
            raise ValueError(f"Line {lineno}: invalid train/valid/test split")
        if data.get("training_permitted") is not True or license_id not in ALLOWED_LICENSES:
            raise ValueError(f"Line {lineno}: explicit training permission and approved license required")
        if not isinstance(data.get("source"), str) or not data["source"].strip():
            raise ValueError(f"Line {lineno}: provenance/source is required")
        if not isinstance(prompt, str) or not isinstance(response, str) or not prompt.strip() or not response.strip():
            raise ValueError(f"Line {lineno}: prompt and response required")
        if len(prompt) > 1800 or len(response) > 4200:
            raise ValueError(f"Line {lineno}: example exceeds the conservative size limit")
        if has_sensitive(prompt + "\n" + response):
            raise ValueError(f"Line {lineno}: possible private contact or secret information")
        norm = normalize(prompt)
        if norm in seen_prompt:
            raise ValueError(f"Line {lineno}: duplicate training prompt, possible split leakage (first seen at line {seen_prompt[norm]})")
        seen_prompt[norm] = lineno
        converted[split].append({
            "prompt": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": prompt.strip()},
            ],
            "completion": [{"role": "assistant", "content": response.strip()}],
        })
        count_categories[str(data.get("category", "unknown"))] += 1
    if len(converted["train"]) < 20 or len(converted["valid"]) < 3 or len(converted["test"]) < 3:
        raise ValueError("Too few distinct examples; need >=20 train, >=3 valid and >=3 untouched test")
    stats = {"split_counts": {k: len(v) for k, v in converted.items()},
             "categories": dict(sorted(count_categories.items())),
             "format": "conversational-prompt-completion",
             "training_target": "assistant completion only",
             "privacy": "Only explicitly permitted curated example rows, no user chats automatically"}
    return converted, stats

def build(source, out_dir):
    source, out_dir = Path(source), Path(out_dir)
    raw = source.read_bytes()
    rows = [json.loads(line) for line in raw.decode("utf-8").splitlines() if line.strip()]
    splits, report = convert(rows)
    out_dir.mkdir(parents=True, exist_ok=True)
    for split, values in splits.items():
        # `test.jsonl` is held out and never read by training.
        (out_dir / f"{split}.jsonl").write_text(
            "".join(json.dumps(v, ensure_ascii=False) + "\n" for v in values), encoding="utf-8"
        )
    report["source_sha256"] = hashlib.sha256(raw).hexdigest()
    (out_dir / "manifest.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", default="training/nova_sft_examples.jsonl")
    parser.add_argument("--out-dir", default="nova-data/sft")
    args = parser.parse_args()
    print(json.dumps(build(args.input, args.out_dir), indent=2))

if __name__ == "__main__":
    main()
