"""Regression checks for NOVA's disk-backed searchable memory."""
import tempfile
import unittest
from pathlib import Path

from memory_index import connect, ingest, search

class MemoryIndexTests(unittest.TestCase):
    def test_incremental_index_and_quota(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp) / "notes"
            root.mkdir()
            first = root / "one.txt"
            first.write_text("Electric cars use motors and batteries.\n", encoding="utf-8")
            second = root / "two.md"
            second.write_text("Neural models learn from training examples.\n", encoding="utf-8")
            db = connect(Path(temp) / "index.db")
            try:
                files, chunks, size, skipped, unchanged = ingest(db, root, target_bytes=1000)
                self.assertEqual((files, chunks, skipped, unchanged), (2, 2, 0, 0))
                self.assertEqual(size, first.stat().st_size + second.stat().st_size)
                self.assertTrue(search(db, "batteries"))
                files, chunks, size2, skipped, unchanged = ingest(db, root, target_bytes=1000)
                self.assertEqual((files, chunks, size2, skipped, unchanged),
                                 (0, 2, size, 0, 2))
                first.write_text("Electric cars use motors, batteries and regenerative braking.\n", encoding="utf-8")
                files, chunks, size, skipped, unchanged = ingest(db, root, target_bytes=1000)
                self.assertEqual((files, chunks, skipped, unchanged), (1, 2, 0, 1))
                self.assertTrue(search(db, "regenerative"))
                third = root / "three.txt"
                third.write_text("Long article " * 100, encoding="utf-8")
                files, chunks, current, skipped, unchanged = ingest(db, root, target_bytes=1000)
                self.assertEqual(files, 0)
                self.assertEqual(skipped, 1)
                self.assertEqual(current, size)
                self.assertEqual(chunks, 2)
            finally:
                db.close()

    def test_limited_source_bytes_does_not_allocate_storage(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "short.txt"
            path.write_text("One file in the index.", encoding="utf-8")
            db = connect(Path(temp) / "index.db")
            try:
                self.assertEqual(ingest(db, path, target_bytes=1)[3], 1)
                self.assertEqual(db.execute("SELECT COUNT(*) FROM passages").fetchone()[0], 0)
            finally:
                db.close()

if __name__ == "__main__":
    unittest.main()
