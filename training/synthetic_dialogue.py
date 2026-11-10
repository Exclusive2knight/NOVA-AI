"""NOVA synthetic dialogue augmentation. Original seeds, conservative rewrites.

No remote model or unauthorized user data. Generates small controlled variations
that preserve the original answer; no claim of billions of examples.
python training/synthetic_dialogue.py --input training/examples.jsonl --output /tmp/nova-synthetic.jsonl --per-seed 6
"""
import argparse
import hashlib
import json
import random
import re
from pathlib import Path

PREFIXES = (
    "{q}",
    "Please help me with this: {q}",
    "Hey NOVA, {q}",
    "Could you answer this question? {q}",
    "I am learning. {q}",
    "Can you explain simply? {q}",
    "In one clear response: {q}",
    "NOVA, I have a question. {q}",
    "Please keep it straightforward. {q}",
    "Can you help me out? {q}",
)
SYNONYMS = {
    "How do I": ["How can I", "What is a good way to"],
    "What is": ["Could you define", "Explain"],
    "Explain": ["Please explain", "Help me understand"],
    "Hi NOVA": ["Hey NOVA", "Hello NOVA"],
}
def variations(question):
    yield question
    for original, replacements in SYNONYMS.items():
        if question.startswith(original):
            for variant in replacements:
                yield variant + question[len(original):]
    for pattern in PREFIXES[1:]:
        yield pattern.format(q=question[0].lower()+question[1:] if question else question)

def generate(input_path, output_path, per_seed=6, seed=2026):
    if per_seed < 1 or per_seed > 25:
        raise ValueError("per_seed must be in 1..25")
    rng = random.Random(seed)
    seen = set()
    count, rejected = 0, 0
    with Path(output_path).open("w", encoding="utf-8") as target:
        for line in Path(input_path).read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            obj = json.loads(line)
            if obj.get("training_allowed") is False:
                rejected += 1
                continue
            turns = obj.get("messages", [])
            user = next((x["content"] for x in turns if x.get("role")=="user" and isinstance(x.get("content"), str)), None)
            answer = next((x["content"] for x in turns if x.get("role")=="assistant" and isinstance(x.get("content"), str)), None)
            if not user or not answer:
                rejected += 1
                continue
            options = list(dict.fromkeys(variations(user)))
            rng.shuffle(options)
            made = 0
            for question in options:
                if made >= per_seed:
                    break
                fingerprint = hashlib.sha256((question.lower()+"\n"+answer.lower()).encode()).hexdigest()
                if fingerprint in seen:
                    continue
                seen.add(fingerprint)
                record = {"id":"synthetic-"+fingerprint[:16], "origin_id":obj.get("id","unlabeled"),
                          "synthetic":True,"method":"constrained-prompt-variation",
                          "split":"train","messages":[{"role":"user","content":question},
                                                      {"role":"assistant","content":answer}]}
                target.write(json.dumps(record, ensure_ascii=False)+"\n")
                made += 1
                count += 1
    return {"generated":count,"skipped_seeds":rejected,"distinct_hashes":len(seen)}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--input",required=True)
    p.add_argument("--output",required=True)
    p.add_argument("--per-seed",type=int,default=6)
    p.add_argument("--seed",type=int,default=2026)
    args=p.parse_args()
    print(json.dumps(generate(args.input,args.output,args.per_seed,args.seed),indent=2))

if __name__=="__main__":
    main()
