# Dataset schema

## Input annotation CSV

`data/annotations.csv` contains one row per original image. Paths are relative to `data/raw/` and use `/` separators.

| Field | Required meaning |
|---|---|
| `image_path` | Unique relative path to a JPEG, PNG, or WebP image under `data/raw/`. |
| `denomination` | One of `20`, `50`, `100`, `200`, `500`, `1000`; this is the classification target. |
| `physical_note_id` | Opaque collection ID assigned to one physical note, e.g. `note-0007`. Never use a serial number. |
| `series` | Human-reviewed series label, such as `New Generation Currency` or `First Philippine Polymer Banknote Series`; use `unknown` until verified. |
| `material` | `paper`, `polymer`, or `unknown`; use `unknown` if it cannot be confidently identified. |
| `side` | `front`, `back`, or `detail`. Details stay grouped with their physical note. |
| `capture_session_id` | Opaque ID shared by images captured during one session. |
| `captured_at` | ISO 8601 timestamp, including timezone when known. |
| `genuine_source_confirmed` | `yes` only when the contributor has a reasonable provenance basis for a genuine circulating note; this is not a forensic authentication result. |
| `rights_confirmed` | `yes` only when the contributor owns the photo or has permission to use it for model development. |

Rows must not mix denominations, series, or materials for the same `physical_note_id`. Exact duplicate image bytes are rejected. Validation checks that files decode and are not suspiciously small. No OCR or serial-number processing is performed.

## Output manifest

`data/processed/split_manifest.csv` contains `image_path`, `image_sha256`, `denomination`, `physical_note_id`, `series`, `material`, `side`, `capture_session_id`, `captured_at`, and `split`. Its paths are relative to `data/raw/`; split values are `train`, `validation`, or `test`. The checksum records the exact source image bytes and is verified before training/evaluation so changes after split preparation cannot silently alter the dataset.

`data/processed/split_summary.json` records the seed, ratios, number of physical notes and images per split/class, and the SHA-256 of the generated manifest. Keep the test split untouched until evaluation planning is finalized.
