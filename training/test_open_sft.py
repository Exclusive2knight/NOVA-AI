"""Checks NOVA curated SFT data and model training configuration without GPU/network."""
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("nova_sft_builder", ROOT / "build_nova_sft.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class OpenModelTrainingTests(unittest.TestCase):
    def sample(self, id_, split, prompt="Hello", response="Hello!"):
        return dict(id=id_, split=split, prompt=prompt, response=response,
                    category="test", source="original-demo",
                    license="project-original", training_permitted=True)

    def test_real_dataset_build_and_split_audit(self):
        with tempfile.TemporaryDirectory() as d:
            report = mod.build(ROOT / "nova_sft_examples.jsonl", d)
            self.assertGreaterEqual(report["split_counts"]["train"], 40)
            self.assertGreaterEqual(report["split_counts"]["valid"], 5)
            self.assertGreaterEqual(report["split_counts"]["test"], 5)
            self.assertIn("chat", report["categories"])
            self.assertIn("coding", report["categories"])
            self.assertIn("memory", report["categories"])
            prompts = set()
            for split in ("train", "valid", "test"):
                path = Path(d) / (split + ".jsonl")
                lines = path.read_text(encoding="utf-8").splitlines()
                self.assertEqual(len(lines), report["split_counts"][split])
                for line in lines:
                    data = json.loads(line)
                    self.assertEqual([x["role"] for x in data["prompt"]], ["system", "user"])
                    self.assertEqual(data["completion"][0]["role"], "assistant")
                    question = data["prompt"][-1]["content"].casefold().strip()
                    self.assertNotIn(question, prompts, "Data leakage across splits")
                    prompts.add(question)
            self.assertFalse((Path(d) / "training_messages.jsonl").exists())
            self.assertTrue((Path(d) / "manifest.json").exists())

    def test_refuse_missing_consent(self):
        rows = [self.sample("n", "train")]
        rows[0]["training_permitted"] = False
        with self.assertRaisesRegex(ValueError, "permission"):
            mod.convert(rows)

    def test_refuse_duplicate_prompts_in_different_splits(self):
        rows = [self.sample("one", "train", "Same question"),
                self.sample("two", "test", "same   QUESTION")]
        with self.assertRaisesRegex(ValueError, "duplicate training prompt"):
            mod.convert(rows)

    def test_refuse_private_information(self):
        for payload in ("My email is employee@example.com",
                        "The API key = PRIVATE_EXAMPLE_SECRET",
                        "Call me at 555-222-3434"):
            with self.subTest(payload=payload):
                rows = [self.sample("a", "train", "Question", payload)]
                with self.assertRaisesRegex(ValueError, "private"):
                    mod.convert(rows)

    def test_training_only_reads_train_and_valid(self):
        content = (ROOT / "finetune_open_model.py").read_text(encoding="utf-8")
        self.assertIn("completion_only_loss=True", content)
        self.assertIn("load_best_model_at_end=True", content)
        self.assertIn("report_to=\"none\"", content)
        self.assertIn("push_to_hub=False", content)
        self.assertIn("Qwen/Qwen3-0.6B", content)
        self.assertIn("LoRA", content)
        self.assertIn("valid.jsonl", content)
        self.assertNotIn("data_files=str(Path(data_dir) / \"test.jsonl\")", content)
        self.assertIn("No CUDA GPU detected", content)


if __name__ == "__main__":
    unittest.main(verbosity=2)
