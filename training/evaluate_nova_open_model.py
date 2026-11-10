"""Evaluate trained NOVA LoRA on held-out test examples once, after tuning.

Compare completion loss on the same untouched test set before/after adapter.
This score is not human preference, reasoning ability or Claude parity.
Do not pick training hyperparameters from test scores.
"""
import argparse
import json
import math
from pathlib import Path


def evaluate(model, tokenizer, records, device):
    import torch
    total_loss = 0.0
    tokens = 0
    model.eval()
    for item in records:
        prompt = tokenizer.apply_chat_template(
            item["prompt"], tokenize=True, add_generation_prompt=True,
            enable_thinking=False
        )
        completion = tokenizer.encode(
            item["completion"][0]["content"] + "<|im_end|>",
            add_special_tokens=False
        )
        if len(prompt) + len(completion) > 1024:
            prompt = prompt[-(1024 - len(completion)):]
        labels = [-100] * len(prompt) + completion
        ids = prompt + completion
        with torch.inference_mode():
            value = model(
                input_ids=torch.tensor([ids], device=device),
                labels=torch.tensor([labels], device=device)
            ).loss.item()
        if not math.isfinite(value):
            raise ValueError("Non-finite evaluation loss")
        total_loss += value * len(completion)
        tokens += len(completion)
    return total_loss / tokens


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", default="nova-data/sft")
    parser.add_argument("--adapter", default="nova-data/nova-qwen-lora/adapter")
    parser.add_argument("--output", default="nova-data/nova-qwen-lora/test_report.json")
    args = parser.parse_args()
    path = Path(args.data_dir) / "test.jsonl"
    examples = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    if len(examples) < 3:
        raise ValueError("Not enough held-out evaluation rows")
    import torch
    from transformers import AutoTokenizer, AutoModelForCausalLM
    from peft import PeftModel
    if not torch.cuda.is_available():
        raise RuntimeError("A GPU is required for this evaluation script")
    model_name = "Qwen/Qwen3-0.6B"
    precision = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=False)
    base = AutoModelForCausalLM.from_pretrained(
        model_name, trust_remote_code=False, dtype=precision,
        attn_implementation="sdpa"
    ).to("cuda")
    before = evaluate(base, tokenizer, examples, "cuda")
    tuned = PeftModel.from_pretrained(base, args.adapter, is_trainable=False)
    after = evaluate(tuned, tokenizer, examples, "cuda")
    report = {
        "test_rows": len(examples),
        "model": model_name,
        "baseline_test_loss": round(before, 6),
        "adapter_test_loss": round(after, 6),
        "adapter_improved_on_test": after < before,
        "warning": "One small synthetic-domain test. Not a measure of general intelligence. Do not tune on this test."
    }
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
