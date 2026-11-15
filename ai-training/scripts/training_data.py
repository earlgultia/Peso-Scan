"""Manifest-backed image dataset and split integrity checks."""
from __future__ import annotations

import csv
from collections import defaultdict
from pathlib import Path

from PIL import Image, ImageOps
from torch.utils.data import Dataset
from torchvision import transforms
from dataset_tools import verify_image_checksum

CLASS_IDS = (20, 50, 100, 200, 500, 1000)
CLASS_TO_INDEX = {value: index for index, value in enumerate(CLASS_IDS)}
IMAGE_SIZE = 224


def read_manifest(manifest_path: Path) -> list[dict[str, str]]:
    with manifest_path.open("r", newline="", encoding="utf-8-sig") as stream:
        rows = list(csv.DictReader(stream))
    required = {"image_path", "image_sha256", "denomination", "physical_note_id", "split"}
    if not rows or not required.issubset(rows[0]):
        raise ValueError(f"Split manifest must contain rows and columns: {', '.join(sorted(required))}")
    return rows


def validate_split_manifest(rows: list[dict[str, str]], images_root: Path) -> None:
    group_splits: dict[str, set[str]] = defaultdict(set)
    group_classes: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        if row["split"] not in {"train", "validation", "test"}:
            raise ValueError(f"Unsupported split value: {row['split']!r}")
        try:
            denomination = int(row["denomination"])
        except ValueError as exc:
            raise ValueError(f"Invalid denomination: {row['denomination']!r}") from exc
        if denomination not in CLASS_TO_INDEX:
            raise ValueError(f"Unsupported denomination class: {denomination}")
        if not row["physical_note_id"]:
            raise ValueError("Each manifest row must have a physical_note_id")
        verify_image_checksum(images_root, row["image_path"], row["image_sha256"])
        group_splits[row["physical_note_id"]].add(row["split"])
        group_classes[row["physical_note_id"]].add(str(denomination))
    leaking = [note for note, splits in group_splits.items() if len(splits) != 1]
    if leaking:
        raise ValueError(f"physical_note_id leakage across splits: {', '.join(leaking[:10])}")
    conflicts = [note for note, classes in group_classes.items() if len(classes) != 1]
    if conflicts:
        raise ValueError(f"physical_note_id has multiple denominations: {', '.join(conflicts[:10])}")
    for split in ("train", "validation", "test"):
        present = {int(row["denomination"]) for row in rows if row["split"] == split}
        missing = sorted(set(CLASS_IDS) - present)
        if missing:
            raise ValueError(f"Split {split!r} is missing denomination classes: {missing}")


class PesoImageDataset(Dataset):
    def __init__(self, rows: list[dict[str, str]], images_root: Path, split: str, training: bool = False):
        self.rows = [row for row in rows if row["split"] == split]
        self.images_root = Path(images_root).resolve()
        self.split = split
        if not self.rows:
            raise ValueError(f"No records for split {split!r}")
        base = [
            transforms.Lambda(lambda image: ImageOps.pad(image, (IMAGE_SIZE, IMAGE_SIZE), method=Image.Resampling.LANCZOS, color=(0, 0, 0))),
            transforms.ToTensor(),
            transforms.Normalize(mean=(0.485, 0.456, 0.406), std=(0.229, 0.224, 0.225)),
        ]
        # Broader photometric variation helps training tolerate ordinary camera
        # exposure and white-balance changes. It cannot simulate glare, shadows,
        # sensor noise, or replace real photographs from varied lighting.
        lighting_augmentation = [
            transforms.RandomApply(
                [transforms.ColorJitter(brightness=0.35, contrast=0.35, saturation=0.18, hue=0.025)],
                p=0.85,
            ),
            transforms.RandomAutocontrast(p=0.15),
        ]
        self.transform = transforms.Compose(
            ([transforms.RandomHorizontalFlip(p=0.5), *lighting_augmentation] if training else []) + base
        )

    def __len__(self):
        return len(self.rows)

    def __getitem__(self, index: int):
        row = self.rows[index]
        relative = Path(row["image_path"])
        path = (self.images_root / relative).resolve()
        try:
            path.relative_to(self.images_root)
        except ValueError as exc:
            raise ValueError(f"Image path escapes image directory: {row['image_path']}") from exc
        with Image.open(path) as image:
            image = image.convert("RGB")
        target = CLASS_TO_INDEX[int(row["denomination"])]
        return self.transform(image), target
