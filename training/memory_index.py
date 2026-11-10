"""NOVA long-term searchable memory prototype.

The default 1 TB limit is a *target for accumulated source file bytes*, not a
1 TB neural context window, allocated cloud storage, or a performance guarantee.
SQLite FTS5 indexing requires disk space *in addition* to the source files.
Only explicitly selected local text/code files are ingested. No upload occurs.

Examples:
  python training/memory_index.py ingest ./my_notes --db nova-memory.db
  python training/memory_index.py query "car game controls" --db nova-memory.db
  python training/memory_index.py stats --db nova-memory.db

Use encrypted storage and proper access controls for sensitive information.
Do not commit databases or private documents to the public repository.
"""
import argparse
import re
import sqlite3
from pathlib import Path

EXTENSIONS = {".txt", ".md", ".jsonl", ".json", ".html", ".css", ".js", ".py", ".csv"}
DEFAULT_TARGET_BYTES = 1_000_000_000_000  # decimal 1 TB, source data, NOT model context
READ_CHARS = 64 * 1024
STOPWORDS = {"what", "where", "when", "who", "why", "how", "does", "did",
             "the", "this", "that", "and", "for", "are", "was", "were",
             "can", "you", "with", "about", "from", "have", "has", "into"}


def connect(path):
    target = Path(path).expanduser()
    target.parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(str(target))
    try:
        db.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS passages
            USING fts5(source UNINDEXED, section UNINDEXED, body, tokenize='unicode61')
        """)
    except sqlite3.OperationalError as error:
        db.close()
        raise RuntimeError("Your Python SQLite build needs FTS5 support") from error
    db.execute("""
        CREATE TABLE IF NOT EXISTS indexed_files(
            source TEXT PRIMARY KEY,
            size_bytes INTEGER NOT NULL,
            modified_ns INTEGER NOT NULL,
            chunk_count INTEGER NOT NULL
        )
    """)
    db.commit()
    return db


def passages(path, size=3200, overlap=350):
    """Stream large files without loading whole lines or whole files into RAM."""
    if not 0 <= overlap < size:
        raise ValueError("overlap must be nonnegative and smaller than size")
    buffer, number = "", 0
    with path.open("r", encoding="utf-8", errors="replace") as handle:
        while True:
            block = handle.read(READ_CHARS)
            if not block:
                break
            buffer += block
            while len(buffer) >= size:
                yield number, buffer[:size]
                number += 1
                buffer = buffer[size - overlap:]
    if buffer.strip():
        yield number, buffer


def stats(db, target_bytes=DEFAULT_TARGET_BYTES):
    count, total_bytes = db.execute(
        "SELECT COUNT(*), COALESCE(SUM(size_bytes), 0) FROM indexed_files"
    ).fetchone()
    chunks = db.execute("SELECT COUNT(*) FROM passages").fetchone()[0]
    return {
        "indexed_documents": count,
        "indexed_passages": chunks,
        "indexed_source_bytes": total_bytes,
        "target_source_bytes": target_bytes,
        "source_capacity_percent": round(100 * total_bytes / target_bytes, 6)
            if target_bytes > 0 else 0,
    }


def ingest(db, folder, target_bytes=DEFAULT_TARGET_BYTES):
    """Index permitted file types incrementally, atomically one file at a time.

    File size and modification timestamp skip unchanged files. Existing files
    can be reindexed without counting their source bytes twice. The quota
    refers to original source bytes, not actual SQLite disk consumption.
    """
    if target_bytes < 1:
        raise ValueError("Target must be positive")
    root = Path(folder).expanduser().resolve()
    if not root.exists():
        raise FileNotFoundError(root)
    paths = (root,) if root.is_file() else root.rglob("*")
    currently_used = stats(db, target_bytes)["indexed_source_bytes"]
    changed = 0
    for path in paths:
        if path.is_symlink() or not path.is_file() or path.suffix.lower() not in EXTENSIONS:
            continue
        name = str(path.resolve())
        before = path.stat()
        row = db.execute("SELECT size_bytes,modified_ns FROM indexed_files WHERE source=?",
                         (name,)).fetchone()
        if row == (before.st_size, before.st_mtime_ns):
            continue
        previous_bytes = row[0] if row else 0
        if currently_used - previous_bytes + before.st_size > target_bytes:
            print("Skipped file exceeding configured source-data target:", name)
            continue
        num_chunks = [0]
        def rows():
            for index, text in passages(path):
                num_chunks[0] += 1
                yield (name, str(index), text)
        with db:
            db.execute("DELETE FROM passages WHERE source=?", (name,))
            db.executemany(
                "INSERT INTO passages(source,section,body) VALUES(?,?,?)", rows()
            )
            after = path.stat()
            if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns):
                raise RuntimeError("Source file changed during indexing: " + name)
            db.execute("""
                INSERT INTO indexed_files(source,size_bytes,modified_ns,chunk_count)
                VALUES(?,?,?,?)
                ON CONFLICT(source) DO UPDATE SET
                  size_bytes=excluded.size_bytes,
                  modified_ns=excluded.modified_ns,
                  chunk_count=excluded.chunk_count
            """, (name, before.st_size, before.st_mtime_ns, num_chunks[0]))
        currently_used = currently_used - previous_bytes + before.st_size
        changed += 1
    return changed, stats(db, target_bytes)["indexed_passages"]


def search(db, query, limit=7):
    # Strip FTS syntax and common question filler. Never embed untrusted SQL.
    terms = re.findall(r"\w{2,}", query.lower())[:40]
    terms = [term for term in terms if term not in STOPWORDS][:12] or terms[:12]
    if not terms:
        return []
    expression = " OR ".join('"' + term.replace('"', '""') + '"' for term in terms)
    return db.execute(
        """SELECT source, section, snippet(passages, 2, '[', ']', '…', 24), bm25(passages)
           FROM passages WHERE passages MATCH ? ORDER BY bm25(passages) LIMIT ?""",
        (expression, max(1, min(50, limit)))
    ).fetchall()


def main():
    parser = argparse.ArgumentParser(description="NOVA offline searchable long-term memory")
    parser.add_argument("command", choices=["ingest", "query", "stats"])
    parser.add_argument("value", nargs="?", default="")
    parser.add_argument("--db", default="nova-memory.db")
    parser.add_argument("--top", type=int, default=7)
    parser.add_argument("--target-tb", type=float, default=1.0,
                        help="maximum accumulated original source bytes in decimal TB (default: 1)")
    args = parser.parse_args()
    if not 0 < args.target_tb <= 1000:
        parser.error("--target-tb must be greater than zero and <= 1000")
    target_bytes = int(args.target_tb * 1_000_000_000_000)
    db = connect(args.db)
    try:
        if args.command == "ingest":
            if not args.value:
                parser.error("ingest requires a folder or text file")
            files, chunks = ingest(db, args.value, target_bytes)
            print(f"Indexed or updated {files} files; {chunks} total searchable passages")
        elif args.command == "stats":
            data = stats(db, target_bytes)
            print(f"Indexed sources: {data['indexed_documents']}; passages: {data['indexed_passages']}")
            print(f"Original source bytes: {data['indexed_source_bytes']:,} / {data['target_source_bytes']:,}"
                  f" ({data['source_capacity_percent']}% of source-data target)")
            print(f"Local index database: {args.db} (requires additional disk space)")
        else:
            for source, section, snippet, rank in search(db, args.value, args.top):
                print(f"\n{source} (chunk {section}, rank {rank:.3f})\n{snippet}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
