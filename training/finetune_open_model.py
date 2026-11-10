"""Real NOVA supervised fine-tuning of a pretrained, Apache-2.0 open-weight model.

Runs on a CUDA GPU, e.g. an available Colab GPU. It downloads Qwen3 model weights
under the model's published license, reads ONLY curated local training examples,
trains a LoRA adapter with completion-only loss, and evaluates on the VALID split.
No training or test text, passwords or checkpoints are uploaded by this script.
It does not automatically deploy a model to NOVA's Cloudflare Worker.

Run after: python training/build_nova_sft.py --out-dir nova-data/sft
 python training/finetune_open_model.py --data-dir nova-data/sft --out-dir nova-data/nova-qwen-lora
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path


DEFAULT_MODEL = "Qwen/Qwen3-0.6B"
# The 0.6B model is practical for free-but-limited GPU allocations. Larger
# open-weight models need proportionally more memory and compute.
APPROVED_MODELS = {DEFAULT_MODEL}


def validate_dataset(data_dir):
    data_dir = Path(data_dir)
    paths = [data_dir / (n + ".jsonl") for n in ("train", "valid", "test")]
    for path in paths:
        if not path.is_file():
            raise FileNotFoundError(f"Missing prepared split: {path}. Run build_nova_sft.py first.")
        if path.stat().st_size < 20:
            raise ValueError(f"Empty split: {path}")
    report = json.loads((data_dir / "manifest.json").read_text(encoding="utf-8"))
    if set(report["split_counts"]) != {"train", "valid", "test"}:
        raise ValueError("Training manifest has wrong splits")
    if report["split_counts"]["train"] < 20 or report["split_counts"]["valid"] < 3:
        raise ValueError("Training examples are insufficient")
    return report


def run_training(data_dir, out_dir, max_steps, learning_rate, model_id):
    if model_id not in APPROVED_MODELS:
        raise ValueError("This starter currently supports only reviewed Apache-2.0 Qwen3-0.6B")
    if not 1 <= max_steps <= 400:
        raise ValueError("Use between 1 and 400 training steps per experimental run.")
    if not 1e-6 <= learning_rate <= 4e-4:
        raise ValueError("Learning rate must be within the supported experimental range.")

    report = validate_dataset(data_dir)

    # Late imports make the dataset audit usable without installing GPU packages.
    import torch
    from datasets import load_dataset
    from peft import LoraConfig
    from transformers import AutoTokenizer, AutoModelForCausalLM, set_seed
    from trl import SFTConfig, SFTTrainer

    if not torch.cuda.is_available():
        raise RuntimeError(
            "No CUDA GPU detected. Prepare your dataset on this computer, then run "
            "fine-tuning in a GPU-enabled environment. Free Colab GPUs are not guaranteed."
        )

    set_seed(41)
    out = Path(out_dir)
    out.mkdir(parents=True, exist_ok=True)
    precision = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    model = AutoModelForCausalLM.from_pretrained(
        model_id, dtype=precision, trust_remote_code=False, attn_implementation="sdpa"
    )
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=False)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    train = load_dataset("json", data_files=str(Path(data_dir) / "train.jsonl"), split="train")
    valid = load_dataset("json", data_files=str(Path(data_dir) / "valid.jsonl"), split="train")
    # Explicitly never open test.jsonl during optimization or hyperparameter selection.
    peft_config = LoraConfig(
        r=8,
        lora_alpha=16,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )
    args = SFTConfig(
        output_dir=str(out / "checkpoints"),
        max_steps=max_steps,
        max_length=768,
        completion_only_loss=True,
        packing=False,
        per_device_train_batch_size=1,
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=4,
        gradient_checkpointing=True,
        gradient_checkpointing_kwargs={"use_reentrant": False},
        learning_rate=learning_rate,
        lr_scheduler_type="cosine",
        warmup_ratio=0.05,
        weight_decay=0.01,
        eval_strategy="steps",
        eval_steps=10,
        save_strategy="steps",
        save_steps=10,
        save_total_limit=2,
        load_best_model_at_end=True,
        bf16=(precision == torch.bfloat16),
        fp16=(precision == torch.float16),
        optim="adamw_torch",
        logging_steps=5,
        report_to="none",
        push_to_hub=False,
        seed=41,
        dataset_num_proc=1,
        eos_token="<|im_end|>",
    )
    trainer = SFTTrainer(
        model=model,
        args=args,
        train_dataset=train,
        eval_dataset=valid,
        peft_config=peft_config,
        processing_class=tokenizer,
    )
    try:
        before = float(trainer.evaluate()["eval_loss"])
        trainer.train()
        after = float(trainer.evaluate()["eval_loss"])
        adapter = out / "adapter"
        trainer.save_model(str(adapter))
        tokenizer.save_pretrained(str(adapter))
        metrics = {
            "model": model_id,
            "training_method": "SFT completion-only LoRA",
            "max_steps": max_steps,
            "learning_rate": learning_rate,
            "validation_loss_before": round(before, 6),
            "validation_loss_after": round(after, 6),
            "validation_loss_improved": after < before,
            "valid_examples": len(valid),
            "train_examples": len(train),
            "held_out_test_was_used": False,
            "license": "Qwen model Apache-2.0; NOVA project-original curated examples",
            "dataset_manifest_sha256": hashlib.sha256(
                (Path(data_dir) / "manifest.json").read_bytes()
            ).hexdigest(),
            "note": (
                "Loss on a tiny in-domain validation set is not a frontier-model "
                "intelligence benchmark; manual evaluation is still required."
            ),
        }
        if not all(math.isfinite(x) for x in (before, after)):
            raise ValueError("Non-finite validation loss")
        (out / "training_report.json").write_text(
            json.dumps(metrics, indent=2) + "\n", encoding="utf-8"
        )
        print(json.dumps(metrics, indent=2))
    finally:
        del trainer, model
        if torch.cuda.is_available():
            torch.cuda.empty_cache()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", default="nova-data/sft")
    parser.add_argument("--out-dir", default="nova-data/nova-qwen-lora")
    parser.add_argument("--max-steps", type=int, default=30)
    parser.add_argument("--learning-rate", type=float, default=0.00007)
    parser.add_argument("--model", default=DEFAULT_MODEL, choices=sorted(APPROVED_MODELS))
    opts = parser.parse_args()
    # Validate data and values before downloading any model weights.
    validate_dataset(opts.data_dir)
    run_training(opts.data_dir, opts.out_dir, opts.max_steps, opts.learning_rate, opts.model)


if __name__ == "__main__":
    main()
