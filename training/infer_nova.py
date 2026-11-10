"""Run original NOVA Tiny/Mini/Core checkpoint on your own laptop (not in browser).
After training, run:
  python training/infer_nova.py --checkpoint nova-tiny.pt --prompt "User: Hello\nNOVA: "
No pretrained model files are downloaded.
"""
import argparse
import torch
from train_nova import NOVATransformer, generate

def main():
    p = argparse.ArgumentParser(description="Original NOVA transformer inference")
    p.add_argument("--checkpoint", required=True)
    p.add_argument("--prompt", default="User: Hello\nNOVA: ")
    p.add_argument("--tokens", type=int, default=160)
    p.add_argument("--temperature", type=float, default=0.75)
    args = p.parse_args()
    if not 1 <= args.tokens <= 1024:
        p.error("--tokens must be in 1..1024")
    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    config = checkpoint["config"]
    model = NOVATransformer(**config)
    model.load_state_dict(checkpoint["model"], strict=True)
    model.eval()
    count = sum(p.numel() for p in model.parameters())
    print("NOVA checkpoint profile:", checkpoint.get("profile", "tiny"))
    print("Parameters:", f"{count:,}")
    print("Context length:", config["context"], "byte tokens")
    print("--- Experimental output (may be incoherent) ---")
    print(generate(model, args.prompt, n=args.tokens, temperature=args.temperature))

if __name__ == "__main__":
    main()
