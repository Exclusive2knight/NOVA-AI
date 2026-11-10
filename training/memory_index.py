"""NOVA Memory Index: local, searchable long-term document storage.

This is retrieval across many files, NOT a billion-token model context window.
Uses only Python's standard library and SQLite FTS5.
Examples:
  python training/memory_index.py ingest ./my_notes --db nova-memory.db
  python training/memory_index.py query "What did I design for the dashboard?" --db nova-memory.db
Do not add the database or private texts to a public repository.
"""
import argparse
import re
import sqlite3
from pathlib import Path

EXTENSIONS = {".txt", ".md", ".jsonl", ".json", ".html", ".css", ".js", ".py", ".csv"}
MAX_FILE_BYTES = 10_000_000

def connect(path):
    db = sqlite3.connect(str(path))
    try:
        db.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS passages
            USING fts5(source UNINDEXED, section UNINDEXED, body, tokenize='unicode61')
        """)
    except sqlite3.OperationalError as e:
        raise RuntimeError("Your Python SQLite build needs FTS5 support") from e
    return db

def passages(path, size=3200, overlap=350):
    """Read text incrementally; retain short overlaps for better retrieval."""
    buffer, number = "", 0
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            buffer += line
            while len(buffer) >= size:
                yield number, buffer[:size]
                number += 1
                buffer = buffer[size-overlap:]
    if buffer.strip():
        yield number, buffer

def ingest(db, folder):
    root = Path(folder).expanduser().resolve()
    if not root.exists():
        raise FileNotFoundError(root)
    paths = [root] if root.is_file() else sorted(root.rglob("*"))
    count = 0
    for path in paths:
        if not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue
        if path.stat().st_size > MAX_FILE_BYTES:
            print("Skipped large file:", path)
            continue
        name = str(path.resolve())
        db.execute("DELETE FROM passages WHERE source = ?", (name,))
        db.executemany(
            "INSERT INTO passages(source,section,body) VALUES(?,?,?)",
            ((name, str(i), body) for i, body in passages(path))
        )
        count += 1
        if count % 100 == 0:
            db.commit()
    db.commit()
    total = db.execute("SELECT COUNT(*) FROM passages").fetchone()[0]
    return count, total

def search(db, query, limit=7):
    # Use only search terms: malformed user FTS syntax cannot become SQL.
    terms = re.findall(r"[\w]{2,}", query.lower())[:12]
    if not terms:
        return []
    expression = " OR ".join('"' + word.replace('"', '""') + '"' for word in terms)
    return db.execute(
        """SELECT source, section, snippet(passages, 2, '[', ']', '…', 24), bm25(passages)
           FROM passages WHERE passages MATCH ? ORDER BY bm25(passages) LIMIT ?""",
        (expression, max(1, min(50, limit)))
    ).fetchall()

def main():
    p = argparse.ArgumentParser(description="NOVA offline memory retrieval")
    p.add_argument("command", choices=["ingest", "query", "stats"])
    p.add_argument("value", nargs="?", default="")
    p.add_argument("--db", default="nova-memory.db")
    p.add_argument("--top", type=int, default=7)
    args = p.parse_args()
    db = connect(args.db)
    if args.command == "ingest":
        if not args.value:
            p.error("ingest requires a folder or text file")
        files, chunks = ingest(db, args.value)
        print(f"Indexed {files} files and {chunks} searchable passages")
    elif args.command == "stats":
        count = db.execute("SELECT COUNT(*) FROM passages").fetchone()[0]
        files = db.execute("SELECT COUNT(DISTINCT source) FROM passages").fetchone()[0]
        print(f"Documents: {files}; passages: {count}; local database: {args.db}")
    else:
        for source, section, snippet, rank in search(db, args.value, args.top):
            print(f"\n{source} (chunk {section}, rank {rank:.3f})\n{snippet}")
    db.close()

if __name__ == "__main__":
    main()
