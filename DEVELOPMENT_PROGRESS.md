# PESO SCAN development progress

## Current status

PESO SCAN is a local-first React application and an AI training scaffold for genuine Philippine peso denomination recognition. It includes a Roboflow-derived experimental ONNX candidate, but no privately collected dataset with physical-note IDs and no production-approved model. The candidate can suggest a denomination only; all saved assessments remain `Unable to verify`.

## AI development

- Dataset tooling supports annotation validation, duplicate detection, physical-note-grouped train/validation/test splits, and SHA-256 integrity checks.
- The Colab workflow trains Torchvision MobileNetV3 Small, selects checkpoints using validation data, evaluates the held-out test split, and exports ONNX with parity checks.
- The React ONNX Runtime Web adapter checks local model metadata, checksum, class order, preprocessing, and evaluation evidence. The experimental candidate is available under `public/models/experimental-candidate/`; the production registry remains empty.
- An optional experimental Roboflow PCB hosted denomination guess is wired through a Vite local development proxy. Photos are sent only after the user selects Analyze; results do not verify genuineness. It requires a private `ROBOFLOW_API_KEY` in ignored `.env.local`, which is not configured in this workspace. The public model listing reports 100% accuracy but has no independently verifiable test protocol.
- Scanner reports clearly distinguish manual denomination labels from model results. Older records without provenance display `Source not recorded`.
- No privately collected genuine-note photographs, prepared physical-note-ID dataset, or reviewed production checkpoint is in the repository. The separate Roboflow candidate is real but has note-level split leakage uncertainty; it must remain experimental.
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

- No production-approved model is available. An experimental denomination guess is available after explicit user action; authenticity assessment and counterfeit classification are not implemented.
- Image quality checks are basic heuristics and are not calibrated on a representative banknote dataset.
- Reference cards are informational placeholders; official BSP images and verified denomination-specific inspection details remain incomplete. Separate Roboflow sample images are illustrative and not official references.
- Exercise IndexedDB migrations, camera behavior, offline/update flows, storage controls, and responsive/accessibility behavior in target browsers and devices.
- Review dependency and model licenses before any commercial distribution of resulting artifacts.

## Recommended next work

1. Collect owned or permissioned genuine notes and record one private physical-note ID per banknote. Keep raw photographs private; the current Roboflow candidate cannot substitute for this evaluation set.
2. Build the BSP reference library with approved image rights, source links, and reviewed feature notes. Do not imply that reference images are yet cached or available offline.
3. Validate camera capture, browser storage, service-worker updates, and small-screen controls on actual iOS and Android devices; the recent fixes have only been build-checked locally.
4. Decide whether hosted Roboflow inference is needed in production. The current proxy is development-only; production cloud inference requires a secured backend and an explicit image-upload disclosure.
5. Expand localization beyond Settings. The English, Filipino, and Cebuano selectors currently translate Settings only.
6. Rotate any Roboflow private API keys previously pasted into chat before using hosted inference again.

## Verification

Latest local verification: `npm run check`, `npm test` (4 files, 10 tests), and `npm run build` all pass. Python is unavailable in this Windows environment, so AI training and Python tooling have not been executed locally; the workflow is intended for Google Colab.
