"""NOVA Memory Index: incremental SQLite full-text retrieval for local collections.

1 TB is the default *source-byte quota target*, NOT allocated disk space or
a model's direct context window. 10 TB is an optional target for appropriately
provisioned local hardware; no throughput or capacity is guaranteed.
This text/code-only prototype has no automatic online sync or web scraping.

Examples:
  python training/memory_index.py ingest ./my_notes --db nova-memory.db
  python training/memory_index.py ingest ./my_notes --db nova-memory.db --target-tb 10
  python training/memory_index.py query "dashboard features" --db nova-memory.db
  python training/memory_index.py stats --db nova-memory.db

Do not add the database or private texts to a public repository.
"""
import argparse
import re
import sqlite3
from pathlib import Path

EXTENSIONS = {".txt", ".md", ".jsonl", ".json", ".html", ".css", ".js", ".py", ".csv"}
MAX_FILE_BYTES = 128_000_000  # Per-file limit, protects RAM from huge one-line records.
TB = 1_000_000_000_000  # Decimal terabyte; indexed SOURCE size, not SQLite file size.

def connect(path):
    db = sqlite3.connect(str(path))
    try:
        db.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS passages
            USING fts5(source UNINDEXED, section UNINDEXED, body, tokenize='unicode61')
        """)
    except sqlite3.OperationalError as e:
        raise RuntimeError("Your Python SQLite build needs FTS5 support") from e
    db.execute("""CREATE TABLE IF NOT EXISTS indexed_files(
        source TEXT PRIMARY KEY, source_bytes INTEGER NOT NULL,
        mtime_ns INTEGER NOT NULL
    )""")
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

def ingest(db, folder, target_bytes=TB):
    """Stream files one by one and skip already-indexed, unchanged sources.

    The quota counts original text/code source bytes, NOT on-disk FTS index size.
    It does not reserve or supply disk space and cannot guarantee 1/10 TB.
    """
    root = Path(folder).expanduser().resolve()
    if not root.exists():
        raise FileNotFoundError(root)
    if target_bytes < 1:
        raise ValueError("target_bytes must be positive")
    # rglob is lazy: never build a giant in-memory list for large collections.
    paths = (root,) if root.is_file() else root.rglob("*")
    count = 0
    skipped_quota = 0
    unchanged = 0
    used_bytes = db.execute("SELECT COALESCE(SUM(source_bytes),0) FROM indexed_files").fetchone()[0]
    for path in paths:
        if not path.is_file() or path.is_symlink() or path.suffix.lower() not in EXTENSIONS:
            continue
        stat = path.stat()
        if stat.st_size > MAX_FILE_BYTES:
            print("Skipped large file:", path)
            continue
        name = str(path.resolve())
        old = db.execute(
            "SELECT source_bytes,mtime_ns FROM indexed_files WHERE source=?", (name,)
        ).fetchone()
        if old and old == (stat.st_size, stat.st_mtime_ns):
            unchanged += 1
            continue
        updated_bytes = used_bytes - (old[0] if old else 0) + stat.st_size
        if updated_bytes > target_bytes:
            skipped_quota += 1
            continue
        # Commit each file independently so an interrupted large import can resume.
        with db:
            db.execute("DELETE FROM passages WHERE source = ?", (name,))
            db.executemany(
                "INSERT INTO passages(source,section,body) VALUES(?,?,?)",
                ((name, str(i), body) for i, body in passages(path))
            )
            db.execute(
                """INSERT INTO indexed_files(source,source_bytes,mtime_ns)
                   VALUES(?,?,?)
                   ON CONFLICT(source) DO UPDATE SET
                   source_bytes=excluded.source_bytes, mtime_ns=excluded.mtime_ns""",
                (name, stat.st_size, stat.st_mtime_ns)
            )
        used_bytes = updated_bytes
        count += 1
    total = db.execute("SELECT COUNT(*) FROM passages").fetchone()[0]
    return count, total, used_bytes, skipped_quota, unchanged

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
    p.add_argument("--target-tb", type=int, choices=[1, 10], default=1,
                   help="1 or 10 TB of source bytes; this is a quota, not an allocation")
    args = p.parse_args()
    db = connect(args.db)
    if args.command == "ingest":
        if not args.value:
            p.error("ingest requires a folder or text file")
        files, chunks, size, skipped, unchanged = ingest(db, args.value, args.target_tb * TB)
        print(f"Updated {files} files; {unchanged} unchanged; {skipped} over quota; "
              f"{chunks} searchable passages; {size:,} indexed source bytes")
    elif args.command == "stats":
        count = db.execute("SELECT COUNT(*) FROM passages").fetchone()[0]
        files = db.execute("SELECT COUNT(DISTINCT source) FROM passages").fetchone()[0]
        indexed = db.execute("SELECT COUNT(*), COALESCE(SUM(source_bytes),0) FROM indexed_files").fetchone()
        print(f"Documents: {files}; passages: {count}; tracked files: {indexed[0]}; "
              f"source bytes: {indexed[1]:,}; target: {args.target_tb} TB; "
              f"local database: {args.db}; disk capacity is NOT preallocated")
    else:
        for source, section, snippet, rank in search(db, args.value, args.top):
            print(f"\n{source} (chunk {section}, rank {rank:.3f})\n{snippet}")
    db.close()

if __name__ == "__main__":
    main()
