"""NOVA preference optimization (DPO-style) for the original tiny transformer.

This is genuine gradient-based post-training on explicit, reviewed *pairs*.
It is NOT online reinforcement learning, full RLHF, or human-quality alignment.
Requires an original NOVA checkpoint from training/pretrain.py or train_nova.py.

python training/prepare_preferences.py --input training/preference_examples.jsonl --output /tmp/nova-pairs.jsonl
python training/train_preferences.py --checkpoint /tmp/nova-pretrained.pt --pairs /tmp/nova-pairs.jsonl --out /tmp/nova-preferred.pt --epochs 1
"""
import argparse
import copy
import json
import random
from pathlib import Path

import torch
import torch.nn.functional as F
from torch import nn
from train_nova import NOVATransformer, BOS, EOS

def examples(path):
    rows = []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        obj = json.loads(line)
        if obj.get("training_permission") != "explicit-consent":
            raise ValueError("All preference pairs must have explicit training permission")
        if any(not isinstance(obj.get(k),str) for k in ("prompt","chosen","rejected")):
            raise ValueError("Incomplete pair")
        rows.append(obj)
    if not rows:
        raise ValueError("No explicitly approved preference examples")
    return rows

def prepared_tokens(prompt, completion, context, device):
    prefix = ("User: " + prompt.strip() + "\nNOVA: ").encode("utf-8",errors="replace")
    answer = completion.strip().encode("utf-8",errors="replace")
    # Keep some prompt, and leave adequate room for the preferred response.
    prompt_budget = max(8, min(len(prefix), max(12,context//3)))
    prefix = prefix[-prompt_budget:]
    max_answer = context - len(prefix) - 1
    if max_answer < 4:
        raise ValueError("Context too small to hold both prompt and response")
    tokens = [BOS] + list(prefix) + list(answer[:max_answer]) + [EOS]
    tokens = tokens[:context+1]
    x=torch.tensor([tokens[:-1]],device=device,dtype=torch.long)
    targets=torch.tensor(tokens[1:],device=device,dtype=torch.long)
    # target index t predicts tokens[t+1]: only completion targets contribute.
    mask=torch.tensor([int(t>=len(prefix)) for t in range(len(tokens)-1)],
                      device=device,dtype=torch.float32)
    if mask.sum().item() < 1:
        raise ValueError("No response tokens")
    return x,targets,mask

def log_probability(model,prompt,answer,device):
    x,targets,mask=prepared_tokens(prompt,answer,model.context,device)
    logits,_=model(x)
    logp=F.log_softmax(logits,dim=-1).gather(-1,targets.unsqueeze(-1)).squeeze(-1)
    # Normalizing over selected completion bytes keeps the scale stable for tiny contexts.
    return (logp * mask).sum() / mask.sum()

def train(args):
    torch.manual_seed(args.seed)
    rng=random.Random(args.seed)
    device="cuda" if args.device=="auto" and torch.cuda.is_available() else ("cpu" if args.device=="auto" else args.device)
    state=torch.load(args.checkpoint,map_location="cpu",weights_only=True)
    model=NOVATransformer(**state["config"]).to(device)
    model.load_state_dict(state["model"],strict=True)
    reference=copy.deepcopy(model).eval()
    for param in reference.parameters():
        param.requires_grad_(False)
    optimizer=torch.optim.AdamW(model.parameters(),lr=args.lr)
    pairs=examples(args.pairs)
    history=[]
    for epoch in range(args.epochs):
        rng.shuffle(pairs)
        losses=[]
        for item in pairs:
            model.train()
            pos=log_probability(model,item["prompt"],item["chosen"],device)
            neg=log_probability(model,item["prompt"],item["rejected"],device)
            with torch.no_grad():
                refpos=log_probability(reference,item["prompt"],item["chosen"],device)
                refneg=log_probability(reference,item["prompt"],item["rejected"],device)
            advantage=(pos-neg)-(refpos-refneg)
            dpo=F.softplus(-args.beta*advantage)
            loss=dpo + args.sft_weight * (-pos)
            optimizer.zero_grad(set_to_none=True)
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(),1.0)
            optimizer.step()
            losses.append(loss.item())
        value=sum(losses)/len(losses)
        history.append(round(value,4))
        print(f"epoch={epoch+1} avg_preference_loss={value:.4f} pairs={len(pairs)}")
    state.update({"model":model.cpu().state_dict(),
                  "preference_training":{"algorithm":"DPO-style offline optimization + positive SFT loss",
                                         "pairs":len(pairs),"epochs":args.epochs,
                                         "beta":args.beta,"loss_history":history,
                                         "no_online_rl":True}})
    dest=Path(args.out)
    dest.parent.mkdir(parents=True,exist_ok=True)
    torch.save(state,dest)
    return {"saved":str(dest),"trained_pairs":len(pairs),"epochs":args.epochs,
            "loss":history[-1],"note":"Experimental preference optimization; do not infer general safety or intelligence from training loss."}

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--checkpoint",required=True)
    p.add_argument("--pairs",required=True)
    p.add_argument("--out",required=True)
    p.add_argument("--epochs",type=int,default=1)
    p.add_argument("--beta",type=float,default=.1)
    p.add_argument("--sft-weight",type=float,default=.05)
    p.add_argument("--lr",type=float,default=0.00002)
    p.add_argument("--device",choices=("cpu","cuda","auto"),default="auto")
    p.add_argument("--seed",type=int,default=2026)
    args=p.parse_args()
    if args.epochs<1 or not 0<args.beta<=1 or args.sft_weight<0:
        p.error("epochs must be positive, beta in (0,1], sft-weight nonnegative")
    print(json.dumps(train(args),indent=2))

if __name__=="__main__":
    main()
