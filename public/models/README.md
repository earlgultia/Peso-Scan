# Local denomination model

`experimental-candidate/` contains the MobileNetV3 Small ONNX model trained from the Roboflow Philippine Banknotes v8 dataset. PESO SCAN loads it only for an explicitly requested **experimental denomination guess** in the scanner. Image inference runs in the browser through ONNX Runtime Web; the captured image is not sent to a server for this local path.

The candidate metadata keeps `deployment_approved: false`. The source export has no physical-banknote IDs, so filename-group checks cannot establish note-level separation. Its dataset test score is an experimental result and may overstate performance on new physical notes. The model does not detect counterfeits, verify genuineness, or assess security features. The app must continue saving reports as `unable-to-verify`.

Dataset attribution: [Roboflow Philippine Banknotes v8](https://universe.roboflow.com/philippine-banknotes/philippine-banknotes/dataset/8), CC BY 4.0 as stated by the dataset. Preserve attribution and review image rights before redistribution.

Files:

- `experimental-candidate/peso_denomination_candidate.onnx` — ONNX inference model.
- `experimental-candidate/model_metadata.json` — input contract, checksum, evaluation, and approval status.
- `experimental-candidate/candidate_metrics.json` — held-out metrics and data limitations.
- `experimental-candidate/candidate_manifest.csv` — crop manifest and source filename groups.

The validated production model registry remains empty. This candidate is loaded through a separate opt-in experimental path and is not eligible for authenticity decisions.
