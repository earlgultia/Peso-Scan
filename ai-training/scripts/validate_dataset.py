"""Validate PESO SCAN dataset annotations and referenced images."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from dataset_tools import DENOMINATIONS, read_annotations, validate_rows


def main() -> int:
    project = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--annotations", type=Path, default=project / "data" / "annotations.csv")
    parser.add_argument("--images-dir", type=Path, default=project / "data" / "raw")
    parser.add_argument("--json", action="store_true", help="Print machine-readable report")
    args = parser.parse_args()
    if not args.annotations.is_file():
        print(f"Annotations CSV not found: {args.annotations}")
        print("Copy templates/annotations.example.csv to data/annotations.csv and fill it after collecting images.")
        return 2
    try:
        result = validate_rows(args.images_dir, read_annotations(args.annotations))
    except (OSError, ValueError) as exc:
        print(f"Could not read annotations: {exc}")
        return 2
    if args.json:
        report = {key: value for key, value in result.items() if key != "rows"}
        print(json.dumps(report, indent=2))
    else:
        print("Dataset validation: " + ("PASS" if result["valid"] else "FAIL"))
        print("Denomination | Images | Physical notes")
        for denomination in DENOMINATIONS:
            print(f"₱{denomination:>4,}       | {result['image_counts'][denomination]:>6} | {result['physical_note_counts'][denomination]:>14}")
        for message in result["warnings"]:
            print("WARNING: " + message)
        for message in result["errors"]:
            print("ERROR: " + message)
    return 0 if result["valid"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
