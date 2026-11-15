# PESO SCAN

PESO SCAN is a local-first Philippine peso visual inspection assistant. It includes an unreviewed experimental ONNX denomination candidate that can be explicitly run in the scanner. It is not validated for deployment and does not authenticate notes or detect counterfeits. The app does not include official banknote reference images.

## Development

Install dependencies with `npm install`, then run `npm run dev`. Run `npm run check` for TypeScript validation and `npm run build` for a production bundle.

Camera capture requires HTTPS or localhost. Scan reports are kept in browser IndexedDB. Captured photographs are temporary and are not saved with reports.

See [DEVELOPMENT_PROGRESS.md](DEVELOPMENT_PROGRESS.md) for current coverage and [MODEL_INTEGRATION.md](MODEL_INTEGRATION.md) for model requirements.
