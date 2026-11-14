"""Synthetic metadata/image tests; these fixtures are not banknote data."""
import sys
import tempfile
import unittest
import hashlib
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from dataset_tools import allocate_group_counts, validate_rows, verify_image_checksum  # noqa: E402
from prepare_dataset import build_splits  # noqa: E402


def make_row(path: str, note: str, denomination: int = 20) -> dict[str, str]:
    return {
        "image_path": path,
        "denomination": str(denomination),
        "physical_note_id": note,
        "series": "fixture-series",
        "material": "paper",
        "side": "front",
        "capture_session_id": "session_001",
        "captured_at": "2026-01-01T12:00:00Z",
        "genuine_source_confirmed": "yes",
        "rights_confirmed": "yes",
    }


class DatasetToolsTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def image(self, name: str, color: str) -> str:
        path = self.root / name
        Image.new("RGB", (80, 80), color).save(path, format="PNG")
        return name

    def test_valid_metadata_and_image(self):
        row = make_row(self.image("one.png", "red"), "note_001")
        report = validate_rows(self.root, [row])
        self.assertTrue(report["valid"], report["errors"])
        self.assertEqual(report["image_counts"][20], 1)

    def test_duplicate_image_bytes_are_rejected(self):
        image = self.image("one.png", "red")
        second = self.root / "copy.png"
        second.write_bytes((self.root / image).read_bytes())
        report = validate_rows(self.root, [make_row(image, "note_001"), make_row("copy.png", "note_002")])
        self.assertTrue(any("duplicate image content" in error for error in report["errors"]))

    def test_note_cannot_have_conflicting_denomination(self):
        first = self.image("one.png", "red")
        second = self.image("two.png", "blue")
        report = validate_rows(self.root, [make_row(first, "note_001", 20), make_row(second, "note_001", 50)])
        self.assertTrue(any("conflicting denomination" in error for error in report["errors"]))

    def test_paths_cannot_escape_image_root(self):
        row = make_row("../outside.png", "note_001")
        report = validate_rows(self.root, [row])
        self.assertTrue(any("must stay inside" in error for error in report["errors"]))

    def test_image_checksum_detects_changes_after_preparation(self):
        relative = self.image("one.png", "red")
        image_path = self.root / relative
        digest = hashlib.sha256(image_path.read_bytes()).hexdigest()
        verify_image_checksum(self.root, relative, digest)
        image_path.write_bytes(image_path.read_bytes() + b"changed")
        with self.assertRaisesRegex(ValueError, "checksum mismatch"):
            verify_image_checksum(self.root, relative, digest)

    def test_split_assigns_a_note_to_only_one_split(self):
        rows = []
        for i in range(10):
            rows.append({**make_row(f"{i}.png", f"note_{i:03d}"), "denomination": 20})
        split_rows = build_splits(rows, seed=42)
        assignments = {}
        for row in split_rows:
            assignments.setdefault(row["physical_note_id"], set()).add(row["split"])
        self.assertTrue(all(len(splits) == 1 for splits in assignments.values()))
        self.assertEqual(len(assignments), 10)

    def test_minimum_split_group_count(self):
        with self.assertRaises(ValueError):
            allocate_group_counts(2)


if __name__ == "__main__":
    unittest.main()
