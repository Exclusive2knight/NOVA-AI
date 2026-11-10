"""NOVA Strong Model recipe tests: source model, privacy, dataset boundaries, GPU gate.

These tests run CPU-only and do NOT train Qwen or download model weights.
"""
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
build_spec = importlib.util.spec_from_file_location("build_nova_sft", ROOT / "build_nova_sft.py")
builder = importlib.util.module_from_spec(build_spec)
build_spec.loader.exec_module(builder)
spec = importlib.util.spec_from_file_location("finetune_qwen3_8b_qlora", ROOT / "finetune_qwen3_8b_qlora.py")
trainer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(trainer)


class StrongEightBTests(unittest.TestCase):
    def test_model_choice_and_setup(self):
        self.assertEqual(trainer.MODEL_ID, "Qwen/Qwen3-8B")
        with tempfile.TemporaryDirectory() as d:
            dataset_dir = Path(d) / "sft"
            report = builder.build(ROOT / "nova_sft_examples.jsonl", dataset_dir)
            out = trainer.verify_setup(str(dataset_dir), 30)
            self.assertEqual(out["split_counts"], report["split_counts"])
            self.assertGreater(report["split_counts"]["train"], 20)
            self.assertGreater(report["split_counts"]["test"], 3)
            with self.assertRaisesRegex(ValueError, "between"):
                trainer.verify_setup(str(dataset_dir), 500)
        with self.assertRaises(FileNotFoundError):
            trainer.verify_setup("/tmp/nova-strong-missing-training-data", 30)

    def test_qlora_rules_and_untouched_test(self):
        source = (ROOT / "finetune_qwen3_8b_qlora.py").read_text(encoding="utf-8")
        for needle in [
            "load_in_4bit=True", 'bnb_4bit_quant_type="nf4"', "LoraConfig(",
            "completion_only_loss=True", "load_best_model_at_end=True",
            "push_to_hub=False", 'report_to="none"',
            'train.jsonl', 'valid.jsonl', "No CUDA",
            "test_split_used", "trainer.save_model",
        ]:
            self.assertIn(needle, source)
        self.assertNotIn('data_files=str(Path(args.data_dir) / "test.jsonl")', source)

    def test_notebook_is_safe_and_valid(self):
        notebook = json.loads((ROOT / "NOVA_Strong_8B_QLoRA_Colab.ipynb").read_text())
        self.assertEqual(notebook["nbformat"], 4)
        txt = "\n".join(
            row for cell in notebook["cells"] for row in cell.get("source", [])
        )
        self.assertIn("Runtime", txt)
        self.assertIn("finetune_qwen3_8b_qlora.py", txt)
        self.assertIn("LoRA", txt)
        self.assertNotIn("CLOUDFLARE_API_TOKEN", txt)


if __name__ == "__main__":
    unittest.main(verbosity=2)
