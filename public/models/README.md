# Local model artifacts

No PESO SCAN ONNX model is shipped in this directory. Do not add placeholder or randomly initialized weights here.

## Release checklist

1. Train on rights-cleared genuine-note photos and keep the physical-note-grouped manifest, training history, held-out metrics, and data provenance record with the release materials.
2. Review `test_metrics.json`, including each denomination's support, precision, recall, F1, confusion matrix, and the manifest/checkpoint hashes. Do not repeatedly tune against the test split.
3. Review the dependency and pretrained-weight terms in [`ai-training/LICENSES.md`](../../ai-training/LICENSES.md), plus the rights for every contributed photo and the resulting model artifact.
4. Export ONNX and confirm the exporter completed its ONNX checker and PyTorch/ONNX Runtime parity check.
5. Copy the ONNX file and `model_metadata.json` into a versioned subdirectory. Recheck all metadata against those exact files and preserve the review evidence.
6. Only after the review, set `deployment_approved` to `true` in the release metadata and explicitly configure same-origin URLs for `LocalDenominationClassifier.load`.

The adapter requires matching class order, input shape/preprocessing and normalization, held-out test metrics linked to SHA-256 fingerprints of the split manifest and checkpoint, ONNX Runtime parity-check result, and matching ONNX SHA-256. The Colab workflow emits `deployment_approved: false` so a human must review the artifacts before enabling predictions. A denomination classifier is not an authenticity model and must not be used to produce “Likely genuine” or “Suspicious” results.

The app registry remains empty until a reviewed artifact is deliberately configured. No model, training photograph, or approval claim is included here.
