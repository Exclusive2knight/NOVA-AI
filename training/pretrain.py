"""Train NOVA's ORIGINAL byte-level decoder transformer on approved text corpora.

Real next-token pretraining. Needs Python + PyTorch and local hardware.
Large-scale training requires distributed infrastructure and many more data sources.

First:
 python training/prepare_corpus.py --manifest training/sources.example.json --out-dir /tmp/nova-corpus
Then:
 python training/pretrain.py --corpus /tmp/nova-corpus --profile tiny --context 32 --steps 4 --batch 2 --out /tmp/nova-pretrained.pt
"""
import argparse
import json
import random
from pathlib import Path

import torch
from torch import nn

from train_nova import PROFILES, NOVATransformer, encode, sample_batch

def read_split(corpus_dir, split):
    filename = Path(corpus_dir) / (split + ".jsonl")
    if not filename.is_file():
        raise FileNotFoundError(filename)
    records = []
    for line in filename.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        obj = json.loads(line)
        if obj.get("split") != split or not isinstance(obj.get("text"), str):
            raise ValueError("Malformed or mislabeled data in " + str(filename))
        records.append(obj["text"])
    return records

def read_synthetic(filename):
    texts = []
    for line in Path(filename).read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        obj = json.loads(line)
        if obj.get("synthetic") is not True or obj.get("split") != "train":
            raise ValueError("Only explicitly labeled training-only synthetic examples are accepted")
        turns = obj.get("messages", [])
        if not isinstance(turns, list) or len(turns) < 2:
            raise ValueError("Malformed synthetic conversation")
        lines = []
        for msg in turns:
            if msg.get("role") in {"user", "assistant"} and isinstance(msg.get("content"), str):
                lines.append(("User" if msg["role"]=="user" else "NOVA")+": "+msg["content"])
        if len(lines) < 2:
            raise ValueError("Synthetic record missing required turns")
        texts.append("\n".join(lines)+"\n")
    return texts

def train(args):
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    train_docs = read_split(args.corpus, "train")
    valid_docs = read_split(args.corpus, "valid")
    for path in args.synthetic:
        train_docs.extend(read_synthetic(path))
    if not train_docs or not valid_docs:
        raise ValueError("Non-empty independent train and valid splits are required")
    config = dict(PROFILES[args.profile])
    if args.context is not None:
        if not 16 <= args.context <= 2048:
            raise ValueError("context must be between 16 and 2048")
        config["context"] = args.context
    data = {
        "train": torch.tensor([token for doc in train_docs for token in encode(doc)], dtype=torch.long),
        "valid": torch.tensor([token for doc in valid_docs for token in encode(doc)], dtype=torch.long)
    }
    if any(len(tokens) <= config["context"]+1 for tokens in data.values()):
        raise ValueError("Each split must exceed context+1 bytes; add approved texts or reduce context")
    device = "cuda" if args.device == "auto" and torch.cuda.is_available() else (
        "cpu" if args.device == "auto" else args.device)
    model = NOVATransformer(**config).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    losses = []
    for step in range(1, args.steps+1):
        model.train()
        x,y = sample_batch(data["train"], config["context"], args.batch, device)
        _,loss = model(x,y)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        nn.utils.clip_grad_norm_(model.parameters(),1.0)
        optimizer.step()
        if step==1 or step%args.eval_every==0 or step==args.steps:
            model.eval()
            with torch.no_grad():
                xx,yy=sample_batch(data["valid"],config["context"],min(4,args.batch),device)
                _,vloss=model(xx,yy)
            entry={"step":step,"train_loss":round(loss.item(),4),"valid_loss":round(vloss.item(),4)}
            losses.append(entry)
            print(json.dumps(entry))
    checkpoint={"model":model.cpu().state_dict(), "config":config,
                "profile":args.profile,"training_steps":args.steps,"split_policy":"by-source-id",
                "training_kind":"next-token pretraining on approved text"}
    dest=Path(args.out).expanduser()
    dest.parent.mkdir(parents=True,exist_ok=True)
    torch.save(checkpoint,dest)
    stats={"model_parameters":sum(p.numel() for p in model.parameters()),
           "training_documents":len(train_docs),"validation_documents":len(valid_docs),
           "training_bytes":len(data["train"]),"validation_bytes":len(data["valid"]),
           "training_steps":args.steps,"device":device,"losses":losses}
    print("Saved local checkpoint:",dest)
    return stats

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--corpus",required=True)
    p.add_argument("--profile",choices=tuple(PROFILES),default="tiny")
    p.add_argument("--context",type=int,default=None)
    p.add_argument("--synthetic",action="append",default=[],help="Training-only synthetic JSONL; can repeat")
    p.add_argument("--steps",type=int,default=10)
    p.add_argument("--batch",type=int,default=4)
    p.add_argument("--eval-every",type=int,default=20)
    p.add_argument("--lr",type=float,default=0.0005)
    p.add_argument("--seed",type=int,default=2026)
    p.add_argument("--device",choices=("cpu","cuda","auto"),default="auto")
    p.add_argument("--out",default="nova-pretrained.pt")
    args=p.parse_args()
    if args.steps<1 or args.batch<1 or args.eval_every<1:
        p.error("steps, batch and eval-every must be positive")
    print(json.dumps(train(args),indent=2))

if __name__=="__main__":
    main()
