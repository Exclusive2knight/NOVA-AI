"""Regression tests for the NOVA 1 TB long-term memory indexing prototype."""
import tempfile
import unittest
from pathlib import Path
from memory_index import connect, ingest, passages, search, stats, DEFAULT_TARGET_BYTES


class MemoryIndexTests(unittest.TestCase):
    def test_default_target_is_one_terabyte_of_source_data(self):
        self.assertEqual(DEFAULT_TARGET_BYTES, 1_000_000_000_000)

    def test_streaming_long_line_keeps_overlap(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "huge_line.txt"
            path.write_text("ABCDEFGHIJKLMNOPQRSTUVWXYZ" * 9000, encoding="utf-8")
            chunks = list(passages(path, size=1000, overlap=100))
            self.assertGreater(len(chunks), 200)
            self.assertTrue(all(len(text) <= 1000 for _, text in chunks))
            self.assertEqual(chunks[0][1][-100:], chunks[1][1][:100])

    def test_incremental_updates_and_search(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            notes = root / "notes"
            notes.mkdir()
            doc = notes / "project.txt"
            doc.write_text("Electric car crabwalk and four-wheel steering.\n" * 10)
            db = connect(root / "memory.db")
            try:
                changed, chunks = ingest(db, notes)
                self.assertEqual(changed, 1)
                self.assertGreaterEqual(chunks, 1)
                self.assertTrue(search(db, "How does crabwalk steering work?"))
                self.assertEqual(ingest(db, notes), (0, chunks))
                doc.write_text("NOVA supports retrieval from updated document records.\n" * 10)
                changed, new_chunks = ingest(db, notes)
                self.assertEqual(changed, 1)
                self.assertEqual(new_chunks, chunks)
                self.assertTrue(search(db, "retrieval updated"))
                self.assertFalse(search(db, "crabwalk"))
                self.assertEqual(stats(db)["indexed_documents"], 1)
            finally:
                db.close()

    def test_source_quota_is_not_disk_allocation(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            a = root / "a.txt"
            b = root / "b.txt"
            a.write_text("first approved text source", encoding="utf-8")
            b.write_text("second approved text source", encoding="utf-8")
            db = connect(root / "memory.db")
            try:
                quota = a.stat().st_size + 1
                self.assertEqual(ingest(db, a, target_bytes=quota)[0], 1)
                self.assertEqual(ingest(db, a, target_bytes=quota)[0], 0)
                self.assertEqual(ingest(db, b, target_bytes=quota)[0], 0)
                self.assertEqual(stats(db, quota)["indexed_source_bytes"], a.stat().st_size)
                self.assertEqual(stats(db, quota)["indexed_documents"], 1)
            finally:
                db.close()

    def test_fts_query_sanitization(self):
        with tempfile.TemporaryDirectory() as temp:
            db = connect(Path(temp) / "memory.db")
            try:
                self.assertEqual(search(db, 'hi"; DROP TABLE indexed_files; --'), [])
                self.assertEqual(stats(db)["indexed_documents"], 0)
            finally:
                db.close()


if __name__ == "__main__":
    unittest.main()
