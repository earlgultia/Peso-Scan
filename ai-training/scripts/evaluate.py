"""Evaluate a trained checkpoint once against the held-out test split."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from pathlib import Path

import torch
from torch.utils.data import DataLoader

from model import build_model
from training_data import CLASS_IDS, PesoImageDataset, read_manifest, validate_split_manifest


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--images-dir", type=Path, required=True)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--num-workers", type=int, default=2)
    args = parser.parse_args()
    if not args.checkpoint.is_file():
        parser.error(f"Checkpoint not found: {args.checkpoint}; train a real model first")
    rows = read_manifest(args.manifest)
    validate_split_manifest(rows, args.images_dir)
    manifest_sha256 = hashlib.sha256(args.manifest.read_bytes()).hexdigest()
    checkpoint_sha256 = hashlib.sha256(args.checkpoint.read_bytes()).hexdigest()
    dataset = PesoImageDataset(rows, args.images_dir, "test")
    loader = DataLoader(dataset, batch_size=args.batch_size, shuffle=False, num_workers=max(args.num_workers, 0))
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    if checkpoint["class_ids"] != list(CLASS_IDS):
        parser.error("Checkpoint class ordering does not match this project's class IDs")
    model = build_model().to(device)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    matrix = [[0 for _ in CLASS_IDS] for _ in CLASS_IDS]
    with torch.inference_mode():
        for images, labels in loader:
            predictions = model(images.to(device)).argmax(1).cpu()
            for actual, predicted in zip(labels.tolist(), predictions.tolist()):
                matrix[actual][predicted] += 1
    metrics = {}
    total, correct = sum(map(sum, matrix)), sum(matrix[i][i] for i in range(len(CLASS_IDS)))
    for index, denomination in enumerate(CLASS_IDS):
        tp = matrix[index][index]
        support = sum(matrix[index])
        predicted = sum(matrix[row][index] for row in range(len(CLASS_IDS)))
        precision = tp / predicted if predicted else 0.0
        recall = tp / support if support else 0.0
        metrics[str(denomination)] = {"precision": precision, "recall": recall, "f1": 2 * precision * recall / (precision + recall) if precision + recall else 0.0, "support_images": support}
    report = {"split": "test", "images": total, "accuracy": correct / total if total else 0.0, "macro_f1": sum(value["f1"] for value in metrics.values()) / len(metrics), "per_class": metrics, "class_ids": list(CLASS_IDS), "confusion_matrix_actual_rows_predicted_columns": matrix, "physical_note_grouped": True, "manifest_sha256": manifest_sha256, "checkpoint_sha256": checkpoint_sha256, "authentication_claim": False}
    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / "test_metrics.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    metadata_path = args.checkpoint.parent / "model_metadata.json"
    if metadata_path.is_file():
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        metadata["test_evaluation"] = {
            "metrics_file": "test_metrics.json",
            "accuracy": report["accuracy"],
            "macro_f1": report["macro_f1"],
            "images": total,
            "split": "test",
            "manifest_sha256": manifest_sha256,
            "checkpoint_sha256": checkpoint_sha256,
        }
        metadata["deployment_approved"] = False
        metadata_path.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    with (args.output_dir / "confusion_matrix.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.writer(stream)
        writer.writerow(["actual\\predicted", *CLASS_IDS])
        for denomination, row in zip(CLASS_IDS, matrix):
            writer.writerow([denomination, *row])
    print(json.dumps({"images": total, "accuracy": report["accuracy"], "macro_f1": report["macro_f1"], "metrics": str(args.output_dir / "test_metrics.json")}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
