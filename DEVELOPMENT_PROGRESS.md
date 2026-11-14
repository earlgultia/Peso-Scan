# PESO SCAN development progress

## Current status

PESO SCAN is a local-first React application and an AI training scaffold for genuine Philippine peso denomination recognition. It does not include a dataset, trained weights, a deployed ONNX model, or counterfeit classification. Until reviewed model artifacts exist, scans remain `Unable to verify`.

## AI development

- Dataset tooling supports annotation validation, duplicate detection, physical-note-grouped train/validation/test splits, and SHA-256 integrity checks.
- The Colab workflow trains Torchvision MobileNetV3 Small, selects checkpoints using validation data, evaluates the held-out test split, and exports ONNX with parity checks.
- The React ONNX Runtime Web adapter checks local model metadata, checksum, class order, preprocessing, and evaluation evidence. No local PESO SCAN model is installed.
- An optional experimental Roboflow PCB hosted denomination guess is wired through a Vite local development proxy. Photos are sent only after the user selects Analyze; results do not verify genuineness. It requires a private `ROBOFLOW_API_KEY` in ignored `.env.local`, which is not configured in this workspace. The public model listing reports 100% accuracy but has no independently verifiable test protocol.
- Scanner reports clearly distinguish manual denomination labels from model results. Older records without provenance display `Source not recorded`.
- No genuine note photographs, prepared dataset, checkpoint, ONNX model, or fake model weights are in the repository.
- Dataset collection and labeling are the next AI work. After collection, train and evaluate in Colab, review the artifacts, then decide whether to enable local inference. Do not start counterfeit classification in this phase.

## Application features

- React, TypeScript, Vite routes, responsive layout, theme settings, PWA shell, and user-triggered service-worker updates.
- Camera capture for front and back sides, quality guidance, and camera controls. Captures remain temporary and are discarded after saving.
- Local IndexedDB scan history with search, filters, report details, and deletion. Batch cash-count reports use a separate store.
- Manual inspection guide with locally saved checklist progress.
- Currency reference cards identify source and known gaps; they do not include verified local reference imagery or complete feature checklists.
- Settings expose browser storage estimates and local data/cache controls.
- Persistent disclaimer explains that the app is not an official authentication service.

## Known limitations and follow-up

- No model is available, so automatic denomination recognition and authenticity assessment are disabled.
- Image quality checks are basic heuristics and are not calibrated on a representative banknote dataset.
- Reference cards are informational placeholders; BSP imagery and denomination-specific inspection details remain incomplete.
- Exercise IndexedDB migrations, camera behavior, offline/update flows, storage controls, and responsive/accessibility behavior in target browsers and devices.
- Review dependency and model licenses before any commercial distribution of resulting artifacts.

## Verification

Latest local verification: `npm run check`, `npm test` (4 files, 10 tests), and `npm run build` all pass. Python is unavailable in this Windows environment, so AI training and Python tooling have not been executed locally; the workflow is intended for Google Colab.
