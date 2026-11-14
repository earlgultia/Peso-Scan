"""Create deterministic, physical-note-grouped train/validation/test manifests."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
import random
from collections import defaultdict
from pathlib import Path

from dataset_tools import DENOMINATIONS, allocate_group_counts, read_annotations, validate_rows


def build_splits(rows: list[dict], seed: int) -> list[dict]:
    grouped: dict[int, dict[str, list[dict]]] = defaultdict(lambda: defaultdict(list))
    for row in rows:
        grouped[row["denomination"]][row["physical_note_id"]].append(row)
    assignments: dict[tuple[int, str], str] = {}
    names = ("train", "validation", "test")
    for denomination in DENOMINATIONS:
        groups = sorted(grouped[denomination])
        if len(groups) < 3:
            raise ValueError(f"₱{denomination:,} has {len(groups)} distinct physical notes; at least 3 are needed for leakage-safe train/validation/test splits.")
        random.Random(seed + denomination).shuffle(groups)
        counts = allocate_group_counts(len(groups))
        offset = 0
        for name, count in zip(names, counts):
            for note_id in groups[offset:offset + count]:
                assignments[(denomination, note_id)] = name
            offset += count
    return [{**row, "split": assignments[(row["denomination"], row["physical_note_id"])]} for row in rows]


def main() -> int:
    project = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--annotations", type=Path, default=project / "data" / "annotations.csv")
    parser.add_argument("--images-dir", type=Path, default=project / "data" / "raw")
    parser.add_argument("--output-dir", type=Path, default=project / "data" / "processed")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    if not args.annotations.is_file():
        print(f"Annotations CSV not found: {args.annotations}. Add labeled data before preparing splits.")
        return 2
    try:
        result = validate_rows(args.images_dir, read_annotations(args.annotations))
        if not result["valid"]:
            print("Dataset validation failed; no split manifest was written.")
            for error in result["errors"]:
                print("ERROR: " + error)
            return 1
        rows = build_splits(result["rows"], args.seed)
    except (OSError, ValueError) as exc:
        print(f"Cannot prepare dataset: {exc}")
        return 1

    args.output_dir.mkdir(parents=True, exist_ok=True)
    manifest = args.output_dir / "split_manifest.csv"
    fields = ("image_path", "image_sha256", "denomination", "physical_note_id", "series", "material", "side", "capture_session_id", "captured_at", "split")
    with manifest.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row[key] for key in fields})
    summary_counts: dict[str, dict[str, dict[str, int]]] = {}
    for denomination in DENOMINATIONS:
        summary_counts[str(denomination)] = {}
        for split in ("train", "validation", "test"):
            selected = [row for row in rows if row["denomination"] == denomination and row["split"] == split]
            summary_counts[str(denomination)][split] = {
                "images": len(selected), "physical_notes": len({row["physical_note_id"] for row in selected})
            }
    summary = {
        "seed": args.seed,
        "split_ratios": {"train": 0.70, "validation": 0.15, "test": 0.15},
        "grouped_by": "physical_note_id",
        "manifest_sha256": hashlib.sha256(manifest.read_bytes()).hexdigest(),
        "counts": summary_counts,
    }
    (args.output_dir / "split_summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {manifest} and split_summary.json ({len(rows)} images, seed {args.seed}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
