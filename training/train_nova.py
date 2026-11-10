"""NOVA Core: minimal decoder-only transformer trained FROM SCRATCH.
Not a frontier model. CPU-friendly educational prototype, using no pretrained weights.
Usage: pip install torch; python training/train_nova.py --data training/examples.jsonl --steps 40
"""
import argparse
import json
import math
import random
from pathlib import Path
import torch
from torch import nn
from torch.nn import functional as F

VOCAB = 258  # 0-255: UTF-8 byte values; 256: beginning; 257: end
BOS, EOS = 256, 257

def load_corpus(path):
    documents = []
    for line in Path(path).read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        record = json.loads(line)
        msgs = record.get("messages", [])
        if len(msgs) < 2:
            continue
        user = next((m.get("content", "") for m in msgs if m.get("role") == "user"), "")
        answer = next((m.get("content", "") for m in msgs if m.get("role") == "assistant"), "")
        documents.append(f"User: {user}\nNOVA: {answer}\n")
    if not documents:
        raise ValueError("No training conversations found.")
    return documents

def encode(text):
    return [BOS] + list(text.encode("utf-8", errors="replace")) + [EOS]

class Block(nn.Module):
    def __init__(self, dim, heads):
        super().__init__()
        self.ln1 = nn.LayerNorm(dim)
        self.attn = nn.MultiheadAttention(dim, heads, batch_first=True, dropout=0.0)
        self.ln2 = nn.LayerNorm(dim)
        self.mlp = nn.Sequential(nn.Linear(dim, dim*4), nn.GELU(), nn.Linear(dim*4, dim))
    def forward(self, x):
        n, t, d = x.shape
        mask = torch.triu(torch.ones(t, t, dtype=torch.bool, device=x.device), diagonal=1)
        y = self.ln1(x)
        a, _ = self.attn(y, y, y, attn_mask=mask, need_weights=False)
        x = x + a
        return x + self.mlp(self.ln2(x))

class NOVATransformer(nn.Module):
    def __init__(self, context=64, dim=64, heads=4, layers=2):
        super().__init__()
        self.context = context
        self.embed = nn.Embedding(VOCAB, dim)
        self.pos = nn.Embedding(context, dim)
        self.blocks = nn.ModuleList([Block(dim, heads) for _ in range(layers)])
        self.norm = nn.LayerNorm(dim)
        self.head = nn.Linear(dim, VOCAB, bias=False)
    def forward(self, token_ids, targets=None):
        b, t = token_ids.shape
        if t > self.context:
            raise ValueError("Sequence exceeds context length")
        positions = torch.arange(t, device=token_ids.device)
        h = self.embed(token_ids) + self.pos(positions)[None, :, :]
        for block in self.blocks:
            h = block(h)
        logits = self.head(self.norm(h))
        loss = F.cross_entropy(logits.reshape(-1, VOCAB), targets.reshape(-1)) if targets is not None else None
        return logits, loss

def sample_batch(data, context, batch_size, device):
    if len(data) <= context+1:
        raise ValueError("Not enough tokens for requested context.")
    starts = torch.randint(0, len(data)-context-1, (batch_size,))
    inputs = torch.stack([data[i:i+context] for i in starts.tolist()])
    targets = torch.stack([data[i+1:i+context+1] for i in starts.tolist()])
    return inputs.to(device), targets.to(device)

@torch.no_grad()
def generate(model, prompt, n=160, temperature=0.8):
    model.eval()
    device = next(model.parameters()).device
    ids = torch.tensor([encode(prompt)[:-1]], device=device)
    for _ in range(n):
        logits, _ = model(ids[:, -model.context:])
        probabilities = F.softmax(logits[0, -1] / max(temperature, 0.2), dim=-1)
        token = torch.multinomial(probabilities, 1).item()
        if token == EOS:
            break
        ids = torch.cat([ids, torch.tensor([[token]], device=device)], dim=1)
    result = bytes(i for i in ids[0].tolist() if i < 256)
    return result.decode("utf-8", errors="replace")

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--data", default="training/examples.jsonl")
    p.add_argument("--steps", type=int, default=80)
    p.add_argument("--batch", type=int, default=8)
    p.add_argument("--context", type=int, default=64)
    p.add_argument("--save", default="nova-core-tiny.pt")
    args = p.parse_args()
    random.seed(2026)
    torch.manual_seed(2026)
    docs = load_corpus(args.data)
    random.shuffle(docs)
    n_holdout = max(1, len(docs)//10) if len(docs)>1 else 0
    train = docs[n_holdout:]
    valid = docs[:n_holdout] or docs[:1]
    train_tokens = torch.tensor(sum((encode(x) for x in train), []), dtype=torch.long)
    valid_tokens = torch.tensor(sum((encode(x) for x in valid), []), dtype=torch.long)
    if len(valid_tokens) <= args.context+1:
        valid_tokens = train_tokens  # small demo dataset; NOT a valid held-out evaluation
        print("Warning: too little validation data; evaluation reuses train tokens.")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    net = NOVATransformer(context=args.context).to(device)
    optimizer = torch.optim.AdamW(net.parameters(), lr=0.0007)
    for step in range(1, args.steps+1):
        net.train()
        x, y = sample_batch(train_tokens, args.context, args.batch, device)
        _, loss = net(x, y)
        optimizer.zero_grad(set_to_none=True)
        loss.backward()
        nn.utils.clip_grad_norm_(net.parameters(), 1.0)
        optimizer.step()
        if step == 1 or step % 20 == 0 or step == args.steps:
            net.eval()
            with torch.no_grad():
                xv, yv = sample_batch(valid_tokens, args.context, min(args.batch, 4), device)
                _, val = net(xv, yv)
            print(f"step={step:4d} train_loss={loss.item():.3f} validation_loss={val.item():.3f}")
    torch.save({"model": net.cpu().state_dict(), "config": {"context": args.context, "dim":64, "heads":4, "layers":2}, "training_steps":args.steps, "data_file":args.data}, args.save)
    print("Saved original trained neural weights to", args.save)
    print("Unreliable experimental sample:", generate(net, "User: Hello\nNOVA: ", 100))

if __name__ == "__main__":
    main()
