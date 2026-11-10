"""Standard-library tests for NOVA training pipeline, permissions and review."""
import json
import tempfile
import unittest
from pathlib import Path

from prepare_corpus import prepare
from synthetic_dialogue import generate
from prepare_preferences import curate
from constitutional_review import review_file

ROOT = Path(__file__).parent

class TrainingPipelineTests(unittest.TestCase):
    def test_demo_corpus_splits_and_audit(self):
        with tempfile.TemporaryDirectory() as td:
            report = prepare(ROOT / "sources.example.json", td)
            self.assertGreater(report["records"].get("train",0), 1)
            self.assertGreater(report["records"].get("valid",0), 0)
            self.assertGreater(report["records"].get("test",0), 0)
            seen = set()
            for split in ("train","valid","test"):
                for line in (Path(td)/(split+".jsonl")).read_text().splitlines():
                    row = json.loads(line)
                    self.assertEqual(row["split"],split)
                    self.assertEqual(row["license"],"user-authored")
                    self.assertNotIn(row["id"],seen)
                    seen.add(row["id"])
            self.assertTrue((Path(td)/"audit.json").is_file())

    def test_reject_unapproved_sources(self):
        with tempfile.TemporaryDirectory() as td:
            path=Path(td)/"sources.json"
            path.write_text(json.dumps({"sources":[{
                "id":"unapproved","path":"unused.txt","license":"unknown",
                "source_url":"example.invalid","training_allowed":True
            }]}))
            with self.assertRaises(ValueError):
                prepare(path,Path(td)/"out")

    def test_synthetic_examples_are_labeled_and_train_only(self):
        with tempfile.TemporaryDirectory() as td:
            dest=Path(td)/"synthetic.jsonl"
            report=generate(ROOT/"examples.jsonl",dest,per_seed=5)
            self.assertGreater(report["generated"],20)
            ids=set()
            for line in dest.read_text().splitlines():
                item=json.loads(line)
                self.assertTrue(item["synthetic"])
                self.assertEqual(item["split"],"train")
                self.assertNotIn(item["id"],ids)
                ids.add(item["id"])

    def test_feedback_consent_and_privacy(self):
        with tempfile.TemporaryDirectory() as td:
            src=Path(td)/"feedback.jsonl"
            examples=[
                {"prompt":"Hi","chosen":"Hello","rejected":"No","consent_for_training":True},
                {"prompt":"Hi","chosen":"Hello","rejected":"No","consent_for_training":True},
                {"prompt":"Not approved","chosen":"Yes","rejected":"No","consent_for_training":False},
                {"prompt":"My contact is test@example.com","chosen":"Yes","rejected":"No","consent_for_training":True},
            ]
            src.write_text("".join(json.dumps(x)+"\n" for x in examples))
            dest=Path(td)/"pairs.jsonl"
            stats=curate(src,dest)
            self.assertEqual(stats["accepted"],1)
            self.assertEqual(stats["duplicate"],1)
            self.assertEqual(stats["no_consent"],1)
            self.assertEqual(stats["private_filtered"],1)
            row=json.loads(dest.read_text().strip())
            self.assertEqual(row["training_permission"],"explicit-consent")

    def test_constitutional_audit_does_not_pretend_to_train(self):
        with tempfile.TemporaryDirectory() as td:
            dest=Path(td)/"reviews.jsonl"
            report=review_file(ROOT/"review_examples.jsonl",dest,ROOT/"nova_constitution.json")
            self.assertEqual(report["reviewed"],2)
            self.assertEqual(report["flagged_for_human_review"],1)
            self.assertFalse(report["automatically_retrained"])

if __name__=="__main__":
    unittest.main()
