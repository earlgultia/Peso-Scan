# PESO SCAN denomination model workspace

This workspace trains a **genuine-source denomination classifier** for ₱20, ₱50, ₱100, ₱200, ₱500, and ₱1,000 banknotes. It does not classify counterfeits or authenticate banknotes. No privately collected, physical-note-ID-labeled dataset is available. The repository contains a separate Roboflow-derived experimental ONNX candidate; it is not a validated production model.

## Phase status

- Phase 1 complete: dataset structure, collection protocol, metadata validation, duplicate checks, and physical-note grouped splitting.
- Phase 2 infrastructure complete: Colab notebook, PyTorch/TorchVision MobileNetV3 Small training, held-out evaluation, ONNX export, and dependency license inventory.
- Experimental candidate available: `public/models/experimental-candidate/` contains the Roboflow v8-derived model and its evaluation artifacts. The source does not identify physical banknotes, so this candidate is explicitly unapproved and must not be treated as validated.
- Phase 3 integration in progress: the React ONNX Runtime Web adapter can run the candidate as an experimental denomination guess. The production model registry remains empty. Local inference does not establish genuineness or detect counterfeits.

## Collect and prepare data

1. Install Phase 1 image tooling: `python -m pip install -r ai-training/requirements.txt`.
2. Follow [`DATA_COLLECTION.md`](DATA_COLLECTION.md) before taking photos. Preserve contributors' rights and never put serial numbers in IDs or metadata.
3. Put original images in `ai-training/data/raw/` and fill `ai-training/data/annotations.csv` using [`templates/annotations.example.csv`](templates/annotations.example.csv).
4. Validate the CSV and images: `python ai-training/scripts/validate_dataset.py`.
5. Create a deterministic split manifest: `python ai-training/scripts/prepare_dataset.py --seed 42`.

The split unit is `physical_note_id`, not image. Each note's views, recaptures, or crops remain in one split. The manifest stores a SHA-256 for every source photograph; training and evaluation verify those hashes before use so replacing a file after preparation fails closed. At least three physical notes per denomination are required to create splits, but that is only a structural minimum and is nowhere near sufficient to establish generalization.

Training-only photometric augmentation varies brightness, contrast, saturation, and occasional autocontrast. This may help with ordinary exposure variation, but does not guarantee performance under glare, shadows, motion blur, or unseen phones. Collect genuine photographs in varied lighting and review held-out performance by condition before making reliability claims. The already bundled Roboflow experimental candidate is unchanged by this augmentation update; it must be retrained from a suitable dataset to benefit.

## Train in Google Colab

1. Copy the complete `ai-training` folder to your private Google Drive at `MyDrive/PESO_SCAN/ai-training`.
2. Put `data/annotations.csv` and your private `data/raw/` photographs in that Drive copy. Keep access restricted; the notebook copies them into its temporary Colab runtime for processing.
3. Open [`notebooks/peso_denomination_colab.ipynb`](notebooks/peso_denomination_colab.ipynb) in Colab and run the cells in order. It validates, prepares the grouped split, trains, evaluates, exports, and copies artifacts to `artifacts/<run-id>/` in Drive.

Free Colab GPU and runtime resources vary and are not guaranteed. The notebook leaves Colab's installed Torch/TorchVision pair intact, defaults to 20 epochs and batch size 16, and falls back to CPU if no GPU is assigned. Decrease batch size or epochs if memory/runtime is insufficient. Use consistent Torch and TorchVision versions; do not upgrade one independently.

### Existing Roboflow v8 YOLO export (experimental candidate only)

For the downloaded `Philippine Banknotes.v8i.yolov8.zip`, use [`roboflow_denomination_candidate_colab.ipynb`](notebooks/roboflow_denomination_candidate_colab.ipynb), not the physical-note-ID workflow above. Since Colab Drive mounting and large browser uploads can fail, the notebook accepts a Google Drive viewer link. For this already-public Roboflow dataset only, set the ZIP's Drive sharing to **Anyone with the link — Viewer**, then paste the link into the first cell. It downloads the ZIP directly, converts labeled banknote boxes into crops, excludes coin classes, combines the polymer and paper ₱1,000 labels, preserves the provided train/valid/test splits, trains MobileNetV3 Small, evaluates once on the supplied test split, and downloads an ONNX candidate archive to your computer. Do not use this sharing method for private datasets.

This Roboflow export has no physical-banknote IDs. The candidate notebook checks augmentation source-image groups across splits, but cannot prove that different photos of the same physical note are separated. Its metadata therefore sets `deployment_approved` to `false`; the candidate is not accepted by the production local-model loader. Review its data provenance and obtain note-level grouping/evaluation before approving or describing the model as validated. It remains denomination recognition only, never authenticity or counterfeit classification. The dataset states CC BY 4.0; preserve attribution and review the license before commercial distribution.

## Run from a configured Python environment

Install a compatible PyTorch and TorchVision pair following the official PyTorch instructions for the chosen CPU/CUDA platform. Then install the additional packages:

```sh
python -m pip install -r ai-training/requirements.txt -r ai-training/requirements-colab.txt
```

With annotations and images in the default paths, run:

```sh
python ai-training/scripts/prepare_dataset.py --seed 42
python ai-training/scripts/train.py --manifest ai-training/data/processed/split_manifest.csv --images-dir ai-training/data/raw --output-dir ai-training/runs/local
python ai-training/scripts/evaluate.py --manifest ai-training/data/processed/split_manifest.csv --images-dir ai-training/data/raw --checkpoint ai-training/runs/local/best_model.pt --output-dir ai-training/runs/local
python ai-training/scripts/export_onnx.py --checkpoint ai-training/runs/local/best_model.pt --output ai-training/runs/local/peso_denomination.onnx --metadata ai-training/runs/local/model_metadata.json
```

Training is from random initialization by default. Add `--pretrained` only after reviewing ImageNet weight terms in [`LICENSES.md`](LICENSES.md). The test split is used only by the evaluation script; do not tune training decisions against test results.

## Outputs and limitations

- `best_model.pt`: best checkpoint selected by validation accuracy.
- `model_metadata.json`: class order, input preprocessing contract, task and validation statistic.
- `training_history.csv`: per-epoch train and validation metrics.
- `test_metrics.json` and `confusion_matrix.csv`: held-out test metrics.
- `peso_denomination.onnx`: exported model after checker and ONNX Runtime numerical parity verification.

These outputs are created only by real training. Training accuracy is not a counterfeit assessment. Even a good held-out score is not proof that phone-camera predictions generalize to Philippine circulation. Review per-class metrics, dataset coverage, and independent evaluation before any product use. Never display this model as official BSP authentication.

All image data and generated artifacts are git-ignored. See [`SCHEMA.md`](SCHEMA.md) for fields and [`LICENSES.md`](LICENSES.md) for dependency and pretrained-weight license considerations.
