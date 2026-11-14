"""Shared validation and split helpers for PESO SCAN image datasets."""
from __future__ import annotations

import csv
import hashlib
import re
from collections import Counter, defaultdict
from datetime import datetime
from pathlib import Path
from typing import Iterable

from PIL import Image, UnidentifiedImageError

DENOMINATIONS = (20, 50, 100, 200, 500, 1000)
REQUIRED_FIELDS = (
    "image_path", "denomination", "physical_note_id", "series", "material",
    "side", "capture_session_id", "captured_at", "genuine_source_confirmed",
    "rights_confirmed",
)
MATERIALS = {"paper", "polymer", "unknown"}
SIDES = {"front", "back", "detail"}
SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}
OPAQUE_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$")


def read_annotations(path: Path) -> list[dict[str, str]]:
    with path.open("r", newline="", encoding="utf-8-sig") as stream:
        reader = csv.DictReader(stream)
        if reader.fieldnames is None:
            raise ValueError(f"Annotations file has no header: {path}")
        missing = [field for field in REQUIRED_FIELDS if field not in reader.fieldnames]
        if missing:
            raise ValueError("Annotations CSV is missing columns: " + ", ".join(missing))
        return [{key: (value or "").strip() for key, value in row.items()} for row in reader]


def _inside(root: Path, relative: str) -> Path | None:
    candidate = Path(relative)
    if not relative or candidate.is_absolute():
        return None
    root_resolved = root.resolve()
    resolved = (root / candidate).resolve()
    try:
        resolved.relative_to(root_resolved)
    except ValueError:
        return None
    return resolved


def verify_image_checksum(images_root: Path, relative_path: str, expected_sha256: str) -> None:
    """Verify a manifest image is present beneath its root and unchanged."""
    if not re.fullmatch(r"[a-fA-F0-9]{64}", expected_sha256):
        raise ValueError(f"Invalid image_sha256 for {relative_path!r}")
    path = _inside(Path(images_root), relative_path)
    if path is None:
        raise ValueError(f"Image path must stay inside the raw image directory: {relative_path!r}")
    if not path.is_file():
        raise ValueError(f"Image file does not exist: {relative_path!r}")
    digest = hashlib.sha256()
    with path.open("rb") as image_file:
        for chunk in iter(lambda: image_file.read(1024 * 1024), b""):
            digest.update(chunk)
    if digest.hexdigest() != expected_sha256.lower():
        raise ValueError(f"Image checksum mismatch for {relative_path!r}; rerun dataset preparation.")


def validate_rows(images_root: Path, rows: Iterable[dict[str, str]]) -> dict:
    """Validate metadata and image files; return errors, warnings and counts."""
    root = Path(images_root)
    errors: list[str] = []
    warnings: list[str] = []
    normalized: list[dict] = []
    seen_paths: set[str] = set()
    seen_hashes: dict[str, str] = {}
    note_traits: dict[str, tuple[str, str, str]] = {}
    image_counts: Counter[int] = Counter()
    notes_by_class: dict[int, set[str]] = defaultdict(set)

    rows = list(rows)
    if not rows:
        errors.append("Annotations contain no image records.")

    for line, raw in enumerate(rows, start=2):
        row = {key: (raw.get(key) or "").strip() for key in REQUIRED_FIELDS}
        prefix = f"CSV row {line}:"
        for field in REQUIRED_FIELDS:
            if not row[field]:
                errors.append(f"{prefix} {field} is required.")
        if any(not row[field] for field in REQUIRED_FIELDS):
            continue

        relative = row["image_path"].replace("\\", "/")
        if relative in seen_paths:
            errors.append(f"{prefix} duplicate image_path {relative!r}.")
        seen_paths.add(relative)
        path = _inside(root, relative)
        if path is None:
            errors.append(f"{prefix} image_path must stay inside the raw image directory.")
            continue
        if path.suffix.lower() not in SUPPORTED_SUFFIXES:
            errors.append(f"{prefix} unsupported image type {path.suffix!r}; use JPG, PNG or WebP.")
            continue
        try:
            digest = hashlib.sha256(path.read_bytes()).hexdigest()
        except OSError:
            errors.append(f"{prefix} image file not found or unreadable: {relative}")
            continue
        if digest in seen_hashes:
            errors.append(f"{prefix} exact duplicate image content matches {seen_hashes[digest]!r}.")
        else:
            seen_hashes[digest] = relative
        try:
            with Image.open(path) as image:
                image.verify()
            with Image.open(path) as image:
                width, height = image.size
            if width < 64 or height < 64:
                errors.append(f"{prefix} image is too small ({width}x{height}); minimum is 64x64.")
        except (UnidentifiedImageError, OSError, ValueError):
            errors.append(f"{prefix} cannot decode image: {relative}")

        try:
            denomination = int(row["denomination"].replace("₱", "").replace(",", ""))
        except ValueError:
            denomination = -1
        if denomination not in DENOMINATIONS:
            errors.append(f"{prefix} denomination must be one of {', '.join(map(str, DENOMINATIONS))}.")
            continue
        if not OPAQUE_ID.fullmatch(row["physical_note_id"]):
            errors.append(f"{prefix} physical_note_id must be an opaque 3–64 character ID using letters, digits, _ or -.")
        if not OPAQUE_ID.fullmatch(row["capture_session_id"]):
            errors.append(f"{prefix} capture_session_id must be an opaque ID using letters, digits, _ or -.")
        if row["material"].lower() not in MATERIALS:
            errors.append(f"{prefix} material must be paper, polymer or unknown.")
        if row["side"].lower() not in SIDES:
            errors.append(f"{prefix} side must be front, back or detail.")
        try:
            datetime.fromisoformat(row["captured_at"].replace("Z", "+00:00"))
        except ValueError:
            errors.append(f"{prefix} captured_at must be an ISO 8601 date/time.")
        for confirmation in ("genuine_source_confirmed", "rights_confirmed"):
            if row[confirmation].lower() != "yes":
                errors.append(f"{prefix} {confirmation} must be yes before the record can be included.")

        traits = (str(denomination), row["series"].casefold(), row["material"].casefold())
        existing = note_traits.get(row["physical_note_id"])
        if existing is not None and existing != traits:
            errors.append(f"{prefix} physical_note_id {row['physical_note_id']!r} has conflicting denomination, series or material metadata.")
        note_traits[row["physical_note_id"]] = traits
        image_counts[denomination] += 1
        notes_by_class[denomination].add(row["physical_note_id"])
        normalized.append({**row, "image_path": relative, "denomination": denomination, "image_sha256": digest})

    for denomination in DENOMINATIONS:
        if not notes_by_class[denomination]:
            warnings.append(f"No images are currently annotated for ₱{denomination:,}.")
    return {
        "valid": not errors,
        "errors": errors,
        "warnings": warnings,
        "rows": normalized,
        "image_counts": {value: image_counts[value] for value in DENOMINATIONS},
        "physical_note_counts": {value: len(notes_by_class[value]) for value in DENOMINATIONS},
    }


def allocate_group_counts(count: int, ratios=(0.70, 0.15, 0.15)) -> tuple[int, int, int]:
    """Largest-remainder allocation, with at least one group in each split."""
    if count < len(ratios):
        raise ValueError(f"At least {len(ratios)} distinct physical notes per denomination are required; found {count}.")
    raw = [count * ratio for ratio in ratios]
    floors = [int(value) for value in raw]
    left = count - sum(floors)
    order = sorted(range(len(ratios)), key=lambda i: (raw[i] - floors[i], ratios[i]), reverse=True)
    for index in order[:left]:
        floors[index] += 1
    for index, value in enumerate(floors):
        if value == 0:
            donor = max(range(len(floors)), key=lambda i: floors[i])
            if floors[donor] <= 1:
                raise ValueError("Could not allocate at least one physical note to each split.")
            floors[donor] -= 1
            floors[index] = 1
    return tuple(floors)
