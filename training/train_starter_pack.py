"""NOVA Core: train the original decoder transformer from NOVA_training_data_v1.zip.

This starter pack has 6,078 original train examples, 760 validation examples,
and 760 test examples. The test examples are NOT used to tune the model.

Requirements: pip install torch
Run: python training/train_starter_pack.py --zip NOVA_training_data_v1.zip --steps 1000 --save nova-core.pt
Resume: python training/train_starter_pack.py --zip NOVA_training_data_v1.zip --resume nova-core.pt --steps 500 --save nova-core-v2.pt

This is a small byte-level research model; it will NOT write like a frontier LLM.
"""
import argparse
import hashlib
import json
import math
import random
import zipfile
from pathlib import Path

import torch
from torch import nn
from train_nova import NOVATransformer, PROFILES, encode

def load_split(zfile, split):
    with zipfile.ZipFile(zfile) as z:
        member = f"NOVA_training/{split}.jsonl"
        if member not in z.namelist():
            raise ValueError(f"ZIP is missing {member}")
        documents = []
        for line in z.read(member).decode("utf-8").splitlines():
            if not line.strip():
                continue
            record = json.loads(line)
            messages = record.get("messages", [])
            user = next((m.get("content") for m in messages if m.get("role")=="user" and isinstance(m.get("content"),str)), None)
            answer = next((m.get("content") for m in messages if m.get("role")=="assistant" and isinstance(m.get("content"),str)), None)
            if user is not None and answer is not None:
                documents.append("User: "+user+"\nNOVA: "+answer+"\n")
        if not documents:
            raise ValueError(f"No usable {split} examples found")
        return documents

def tokenize(docs):
    return torch.tensor([v for doc in docs for v in encode(doc)],dtype=torch.long)

def fixed_batch(data,ctx,count,generator,device):
    if len(data) < ctx+2:
        raise ValueError("Not enough corpus bytes for model context")
    indices = torch.randint(0,len(data)-ctx-1,(count,),generator=generator).tolist()
    x = torch.stack([data[i:i+ctx] for i in indices]).to(device)
    y = torch.stack([data[i+1:i+ctx+1] for i in indices]).to(device)
    return x,y

@torch.no_grad()
def evaluate(net,valid,ctx,device):
    net.eval()
    generator = torch.Generator().manual_seed(2206)
    values = []
    for _ in range(16):
        x,y=fixed_batch(valid,ctx,8,generator,device)
        _,loss=net(x,y)
        values.append(float(loss.item()))
    return sum(values)/len(values)

def run(args):
    if args.steps < 1 or args.batch < 1:
        raise ValueError("steps and batch must be positive")
    random.seed(args.seed)
    torch.manual_seed(args.seed)
    torch.set_num_threads(min(4,torch.get_num_threads()))
    data_sha256=hashlib.sha256(Path(args.zip).read_bytes()).hexdigest()
    train_docs=load_split(args.zip,"train")
    valid_docs=load_split(args.zip,"validation")
    test_docs=load_split(args.zip,"test")
    train=tokenize(train_docs)
    valid=tokenize(valid_docs)
    if args.resume:
        checkpoint=torch.load(args.resume,map_location="cpu",weights_only=True)
        if checkpoint.get("source_zip_sha256") not in (None,data_sha256):
            raise ValueError("The starter dataset ZIP differs from the resumed checkpoint")
        config=checkpoint["config"]
        steps_done=int(checkpoint.get("training_steps",0))
    else:
        config=dict(PROFILES[args.profile])
        if args.context is not None:
            if not 16<=args.context<=2048:
                raise ValueError("Context must be 16..2048 bytes")
            config["context"]=args.context
        steps_done=0
    device="cuda" if args.device=="auto" and torch.cuda.is_available() else ("cpu" if args.device=="auto" else args.device)
    net=NOVATransformer(**config).to(device)
    if args.resume:
        net.load_state_dict(checkpoint["model"],strict=True)
    opt=torch.optim.AdamW(net.parameters(),lr=args.lr)
    restored_optimizer=bool(args.resume and "optimizer" in checkpoint)
    if restored_optimizer:
        opt.load_state_dict(checkpoint["optimizer"])
        for group in opt.param_groups:
            group["lr"]=args.lr
    start=evaluate(net,valid,config["context"],device)
    print(json.dumps({"phase":"start","step":steps_done,"validation_cross_entropy":round(start,4),
        "training_examples":len(train_docs),"validation_examples":len(valid_docs),
        "test_examples_not_trained_on":len(test_docs),
        "parameters":sum(p.numel() for p in net.parameters())}))
    history=[]
    generator=torch.Generator().manual_seed(args.seed+steps_done)
    for step in range(1,args.steps+1):
        net.train()
        x,y=fixed_batch(train,config["context"],args.batch,generator,device)
        _,loss=net(x,y)
        opt.zero_grad(set_to_none=True)
        loss.backward()
        nn.utils.clip_grad_norm_(net.parameters(),1.0)
        opt.step()
        if step==1 or step%args.eval_every==0 or step==args.steps:
            val=evaluate(net,valid,config["context"],device)
            report={"step":steps_done+step,"train_loss":round(float(loss.item()),4),
                    "validation_loss":round(val,4)}
            history.append(report)
            print(json.dumps(report),flush=True)
    end=evaluate(net,valid,config["context"],device)
    path=Path(args.save).expanduser()
    path.parent.mkdir(parents=True,exist_ok=True)
    checkpoint={
        "model":net.cpu().state_dict(),"config":config,"profile":args.profile,
        "optimizer":opt.state_dict(),"source_zip_sha256":data_sha256,
        "training_steps":steps_done+args.steps,
        "dataset":"NOVA Starter Training Dataset v1 (original CC0)",
        "examples":{"train":len(train_docs),"validation":len(valid_docs),"test_not_used":len(test_docs)},
        "model_kind":"original byte-level decoder transformer, educational"
    }
    torch.save(checkpoint,path)
    stats={"checkpoint":str(path),"validation_loss_before":round(start,4),
           "validation_loss_after":round(end,4),
           "improvement_percent":round(100*(start-end)/start,2),
           "training_steps_total":steps_done+args.steps,
           "optimizer_restored_from_previous_checkpoint":restored_optimizer,
           "token_predictions_in_this_run":args.steps*args.batch*config["context"],
           "note":"Synthetic held-out validation differs from independent real-world reasoning evaluation. Cannot claim trillions of unique tokens or a capable chatbot."}
    report_file=path.with_suffix(".training-report.json")
    report_file.write_text(json.dumps(stats,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(stats,indent=2))
    return stats

def main():
    p=argparse.ArgumentParser(description="Train the original NOVA model from the authored ZIP starter pack")
    p.add_argument("--zip",required=True)
    p.add_argument("--steps",type=int,default=300)
    p.add_argument("--batch",type=int,default=12)
    p.add_argument("--profile",choices=tuple(PROFILES),default="tiny")
    p.add_argument("--context",type=int,default=None)
    p.add_argument("--resume")
    p.add_argument("--save",default="nova-core-weights.pt")
    p.add_argument("--lr",type=float,default=.0007)
    p.add_argument("--eval-every",type=int,default=50)
    p.add_argument("--device",choices=("auto","cpu","cuda"),default="auto")
    p.add_argument("--seed",type=int,default=2026)
    args=p.parse_args()
    if args.eval_every<1:
        p.error("--eval-every must be positive")
    run(args)

if __name__=="__main__":
    main()
