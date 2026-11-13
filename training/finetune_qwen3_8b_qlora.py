"""NOVA Strong Model Lab: real 4-bit QLoRA instruction fine-tuning on Qwen3-8B.

This file prepares a substantially stronger *pretrained* text model than NOVA's
tiny scratch network. Running it requires a compatible NVIDIA GPU (typically
>=16GB VRAM for this very small 512-token demo), CUDA-enabled PyTorch and
Transformers/TRL/PEFT/BitsAndBytes. GPU availability is NOT guaranteed.

The 77-example starter set is inadequate to produce frontier-level behavior;
this is an experimental adaptation of a capable pretrained model, not an
equivalent of ChatGPT/Claude. Never upload personal chats without permission.

Usage:
 python training/build_nova_sft.py --out-dir nova-data/sft
 python training/finetune_qwen3_8b_qlora.py --data-dir nova-data/sft --max-steps 30
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path

MODEL_ID = "Qwen/Qwen3-8B"
MAX_STEPS = 100


def verify_setup(data_dir: str, max_steps: int):
    from build_nova_sft import build
    if not (1 <= max_steps <= MAX_STEPS):
        raise ValueError(f"Use between 1 and {MAX_STEPS} GPU training steps")
    source = Path(data_dir)
    expected = [source / f"{n}.jsonl" for n in ("train", "valid", "test")]
    if not all(p.is_file() for p in expected):
        raise FileNotFoundError("Run build_nova_sft.py first; keep train/valid/test separate")
    manifest = json.loads((source / "manifest.json").read_text(encoding="utf-8"))
    if manifest.get("split_counts", {}).get("train", 0) < 20:
        raise ValueError("Training dataset is too small to run this recipe")
    return manifest


def run(args):
    report = verify_setup(args.data_dir, args.max_steps)

    import torch
    if not torch.cuda.is_available():
        raise RuntimeError("NOVA 8B QLoRA needs an NVIDIA GPU. It has NOT run in this environment.")
    if torch.cuda.mem_get_info()[0] / 2**30 < 10:
        raise RuntimeError("Insufficient available VRAM. Close other GPU jobs or use a larger GPU.")

    from datasets import load_dataset
    from peft import LoraConfig
    from transformers import BitsAndBytesConfig, set_seed
    from trl import SFTConfig, SFTTrainer

    set_seed(41)
    train = load_dataset("json", data_files=str(Path(args.data_dir) / "train.jsonl"), split="train")
    valid = load_dataset("json", data_files=str(Path(args.data_dir) / "valid.jsonl"), split="train")
    # The test split is not read or used for training/early stopping.
    compute_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    quantization = BitsAndBytesConfig(
        load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_use_double_quant=True,
        bnb_4bit_compute_dtype=compute_dtype
    )
    lora = LoraConfig(
        r=8, lora_alpha=16, lora_dropout=0.05, bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"]
    )
    output = Path(args.out_dir)
    output.mkdir(parents=True, exist_ok=True)
    cfg = SFTConfig(
        output_dir=str(output / "checkpoints"),
        max_steps=args.max_steps,
        max_length=512,
        completion_only_loss=True,
        packing=False,
        per_device_train_batch_size=1,
        per_device_eval_batch_size=1,
        gradient_accumulation_steps=8,
        gradient_checkpointing=True,
        gradient_checkpointing_kwargs={"use_reentrant": False},
        learning_rate=0.00008,
        lr_scheduler_type="cosine",
        warmup_ratio=0.06,
        weight_decay=0.01,
        eval_strategy="steps",
        eval_steps=10,
        save_strategy="steps",
        save_steps=10,
        save_total_limit=2,
        load_best_model_at_end=True,
        bf16=(compute_dtype == torch.bfloat16),
        fp16=(compute_dtype == torch.float16),
        optim="adamw_torch",
        logging_steps=5,
        report_to="none",
        push_to_hub=False,
        seed=41,
    )
    trainer = SFTTrainer(
        model=MODEL_ID,
        args=cfg,
        train_dataset=train,
        eval_dataset=valid,
        peft_config=lora,
        quantization_config=quantization,
    )
    before = float(trainer.evaluate()["eval_loss"])
    trainer.train()
    after = float(trainer.evaluate()["eval_loss"])
    if not math.isfinite(before) or not math.isfinite(after):
        raise ValueError("Training produced invalid validation loss")
    adapter_dir = output / "adapter"
    improved = after < before
    # Never publish an adapter whose held-out validation loss worsened.
    if improved:
        trainer.save_model(str(adapter_dir))
        trainer.processing_class.save_pretrained(str(adapter_dir))
    metrics = {
        "base_model": MODEL_ID,
        "license": "Apache-2.0",
        "method": "4-bit NF4 QLoRA completion-only supervised fine-tuning",
        "train_rows": len(train),
        "valid_rows": len(valid),
        "test_split_used": False,
        "steps_requested": args.max_steps,
        "validation_loss_before": before,
        "validation_loss_after": after,
        "validation_improved": improved,
        "adapter_saved": improved,
        "deployment": "not deployed; adapter requires compatible self-hosted inference",
        "important": "Small demo domain validation is not a general intelligence benchmark",
    }
    (output / "training_report.json").write_text(json.dumps(metrics, indent=2) + "\n")
    print(json.dumps(metrics, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", default="nova-data/sft")
    parser.add_argument("--out-dir", default="nova-data/nova-qwen3-8b-qlora")
    parser.add_argument("--max-steps", type=int, default=30)
    options = parser.parse_args()
    run(options)


if __name__ == "__main__":
    main()
