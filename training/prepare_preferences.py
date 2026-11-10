"""NOVA consent-gated preference dataset preparation.

Use manually reviewed records only; do not scrape chats or silently collect user data.
Each input line must contain prompt, chosen, rejected, consent_for_training=true.
python training/prepare_preferences.py --input /path/to/consented-feedback.jsonl --output /path/to/preferences.jsonl
"""
import argparse
import hashlib
import json
import re
from pathlib import Path

EMAIL = re.compile(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")
PHONE = re.compile(r"(?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}")
SECRET = re.compile(r"(?i)(?:password|api[_ -]?key|private[_ -]?token|secret)\s*[:=]\s*\S{8,}")

def sensitive(s):
    return bool(EMAIL.search(s) or PHONE.search(s) or SECRET.search(s))

def curate(source, destination):
    seen = set()
    stats = {"accepted":0, "no_consent":0, "private_filtered":0,
             "incomplete":0, "duplicate":0}
    with Path(destination).open("w",encoding="utf-8") as out:
        for line in Path(source).read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            obj = json.loads(line)
            if obj.get("consent_for_training") is not True:
                stats["no_consent"] += 1
                continue
            values = [obj.get(x) for x in ("prompt", "chosen", "rejected")]
            if any(not isinstance(v,str) or not v.strip() for v in values):
                stats["incomplete"] += 1
                continue
            prompt, chosen, rejected = (v.strip() for v in values)
            if chosen == rejected or any(len(x)>5000 for x in values):
                stats["incomplete"] += 1
                continue
            if any(sensitive(x) for x in values):
                stats["private_filtered"] += 1
                continue
            identifier = hashlib.sha256(("\0".join(values)).encode()).hexdigest()[:20]
            if identifier in seen:
                stats["duplicate"] += 1
                continue
            seen.add(identifier)
            row = {"id":identifier, "prompt":prompt, "chosen":chosen,
                   "rejected":rejected, "training_permission":"explicit-consent",
                   "source":"reviewed-pair"}
            out.write(json.dumps(row,ensure_ascii=False)+"\n")
            stats["accepted"] += 1
    return stats

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input",required=True)
    p.add_argument("--output",required=True)
    args = p.parse_args()
    print(json.dumps(curate(args.input,args.output),indent=2))

if __name__=="__main__":
    main()
