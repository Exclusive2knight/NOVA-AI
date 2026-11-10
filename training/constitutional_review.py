"""NOVA principle-guided response review, without pretending a model self-criticized.

This is a transparent rule-based audit prototype. A capable trained reviewer model,
human oversight, and further evaluation are needed for full Constitutional AI.
python training/constitutional_review.py --input training/review_examples.jsonl --output /tmp/nova-review.jsonl
"""
import argparse
import json
import re
from pathlib import Path

PATTERNS = (
    ("transparency", r"\b(?:I (?:ran|executed) (?:the|your) code|I deployed your app|I verified every source)\b",
     "Verify the claimed action against real tool results before stating it."),
    ("accuracy", r"\b(?:guaranteed to be correct|100% accurate|never makes mistakes)\b",
     "Replace an unsupported guarantee with a calibrated statement."),
    ("privacy", r"(?i)\b(?:api[_ -]?key|password|secret)\s*[:=]\s*[^\s]{8,}",
     "Do not expose access credentials in the answer or training record."),
    ("respect", r"(?i)\b(?:you are stupid|shut up idiot)\b",
     "Rephrase in respectful, non-harassing language."),
)
EMAIL = re.compile(r"(?<!\w)[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")

def critique(prompt, answer, constitution):
    flags = []
    for principle, pattern, suggestion in PATTERNS:
        if re.search(pattern, answer, flags=re.IGNORECASE):
            flags.append({"principle": principle, "suggestion": suggestion})
    if EMAIL.search(answer):
        flags.append({"principle": "privacy", "suggestion": "Check whether the email belongs to a private person; do not expose personal identifiers."})
    if not answer.strip():
        flags.append({"principle": "helpfulness", "suggestion": "The answer is empty; provide an appropriate response or explain the limitation."})
    principles = {p["id"] for p in constitution["principles"]}
    assert all(flag["principle"] in principles for flag in flags)
    return {"accepted_for_training": not flags, "flags": flags,
            "reviewer": "local-rule-audit-v1",
            "limitation": "This static audit cannot determine full factual truth, safety, or quality."}

def review_file(input_file, output_file, constitution_file):
    constitution = json.loads(Path(constitution_file).read_text(encoding="utf-8"))
    if len(constitution.get("principles", [])) < 5:
        raise ValueError("NOVA constitution is not configured")
    total, flagged = 0, 0
    with Path(output_file).open("w", encoding="utf-8") as out:
        for line in Path(input_file).read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            item = json.loads(line)
            prompt, answer = item.get("prompt"), item.get("answer")
            if not isinstance(prompt, str) or not isinstance(answer, str):
                raise ValueError("Each item needs prompt and answer strings")
            result = critique(prompt, answer, constitution)
            # Do not echo message text to public logs; export is private and local.
            out.write(json.dumps({"id":item.get("id"),"review":result},ensure_ascii=False)+"\n")
            total += 1
            flagged += int(not result["accepted_for_training"])
    return {"reviewed":total, "flagged_for_human_review":flagged,
            "automatically_retrained":False}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True)
    p.add_argument("--output", required=True)
    p.add_argument("--constitution", default=str(Path(__file__).with_name("nova_constitution.json")))
    args = p.parse_args()
    print(json.dumps(review_file(args.input, args.output, args.constitution), indent=2))

if __name__ == "__main__":
    main()
