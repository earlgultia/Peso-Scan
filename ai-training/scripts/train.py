"""Train a six-class MobileNetV3 Small denomination model."""
from __future__ import annotations

import argparse
import csv
import json
import random
from pathlib import Path

import numpy as np
import torch
from torch import nn
from torch.utils.data import DataLoader

from model import build_model
from training_data import CLASS_IDS, IMAGE_SIZE, PesoImageDataset, read_manifest, validate_split_manifest


def seed_everything(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def epoch(model, loader, loss_fn, device, optimizer=None, scaler=None):
    training = optimizer is not None
    model.train(training)
    total_loss, correct, seen = 0.0, 0, 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        if training:
            optimizer.zero_grad(set_to_none=True)
        with torch.set_grad_enabled(training):
            with torch.autocast(device_type=device.type, enabled=(device.type == "cuda")):
                logits = model(images)
                loss = loss_fn(logits, labels)
            if training:
                if scaler is not None and scaler.is_enabled():
                    scaler.scale(loss).backward()
                    scaler.step(optimizer)
                    scaler.update()
                else:
                    loss.backward()
                    optimizer.step()
        batch = labels.size(0)
        total_loss += loss.item() * batch
        correct += (logits.argmax(1) == labels).sum().item()
        seen += batch
    return total_loss / max(seen, 1), correct / max(seen, 1)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--images-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--epochs", type=int, default=20)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--learning-rate", type=float, default=0.0003)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--num-workers", type=int, default=2)
    parser.add_argument("--pretrained", action="store_true", help="Initialize from torchvision ImageNet weights; review weight provenance/terms for commercial use")
    args = parser.parse_args()
    if args.epochs < 1 or args.batch_size < 1:
        parser.error("epochs and batch-size must be positive")
    seed_everything(args.seed)
    rows = read_manifest(args.manifest)
    validate_split_manifest(rows, args.images_dir)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    train_ds = PesoImageDataset(rows, args.images_dir, "train", training=True)
    val_ds = PesoImageDataset(rows, args.images_dir, "validation")
    workers = max(0, args.num_workers)
    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, num_workers=workers, pin_memory=device.type == "cuda")
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, num_workers=workers, pin_memory=device.type == "cuda")
    model = build_model(pretrained=args.pretrained).to(device)
    loss_fn = nn.CrossEntropyLoss()
    optimizer = torch.optim.AdamW(model.parameters(), lr=args.learning_rate, weight_decay=0.01)
    scaler = torch.amp.GradScaler("cuda", enabled=device.type == "cuda")
    best_accuracy = -1.0
    history_path = args.output_dir / "training_history.csv"
    with history_path.open("w", newline="", encoding="utf-8") as stream:
        writer = csv.writer(stream)
        writer.writerow(("epoch", "train_loss", "train_accuracy", "validation_loss", "validation_accuracy"))
        for current_epoch in range(1, args.epochs + 1):
            train_loss, train_acc = epoch(model, train_loader, loss_fn, device, optimizer, scaler)
            val_loss, val_acc = epoch(model, val_loader, loss_fn, device)
            writer.writerow((current_epoch, train_loss, train_acc, val_loss, val_acc))
            stream.flush()
            print(f"Epoch {current_epoch:02d}/{args.epochs} train loss={train_loss:.4f} acc={train_acc:.3f} | val loss={val_loss:.4f} acc={val_acc:.3f}")
            if val_acc > best_accuracy:
                best_accuracy = val_acc
                checkpoint = {
                    "state_dict": {key: value.detach().cpu() for key, value in model.state_dict().items()},
                    "class_ids": list(CLASS_IDS),
                    "input_size": IMAGE_SIZE,
                    "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
                    "pretrained_imagenet": args.pretrained,
                    "seed": args.seed,
                    "best_validation_accuracy": best_accuracy,
                    "architecture": "torchvision.mobilenet_v3_small",
                }
                torch.save(checkpoint, args.output_dir / "best_model.pt")
    metadata = {
        "model_present": True,
        "model_file": "best_model.pt",
        "architecture": "torchvision.mobilenet_v3_small",
        "task": "genuine-source denomination classification; not counterfeit detection or authentication",
        "class_ids": list(CLASS_IDS),
        "input": {"name": "images", "shape": ["batch", 3, IMAGE_SIZE, IMAGE_SIZE], "layout": "NCHW", "color": "RGB", "preprocessing": "fit within 224x224 using Pillow ImageOps.pad, then ImageNet mean/std normalization"},
        "normalization": {"mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]},
        "deployment_approved": False,
        "pretrained_imagenet": args.pretrained,
        "best_validation_accuracy": best_accuracy,
        "seed": args.seed,
    }
    (args.output_dir / "model_metadata.json").write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(f"Best validation accuracy: {best_accuracy:.4f}. Checkpoint: {args.output_dir / 'best_model.pt'}")
    print("This is a training result, not a banknote authentication decision. Evaluate on held-out test notes before use.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
