# PESO SCAN

PESO SCAN is a privacy-first Philippine peso visual inspection assistant. It has no accounts or backend. This starter implementation does not ship a validated AI model or official banknote reference images, so it does not authenticate notes or automatically identify denominations.

## Development

Install dependencies with `npm install`, then run `npm run dev`. Run `npm run check` for TypeScript validation and `npm run build` for a production bundle.

Camera capture requires HTTPS or localhost. Scan reports are kept in browser IndexedDB. Captured photographs are temporary and are not saved with reports.

See [DEVELOPMENT_PROGRESS.md](DEVELOPMENT_PROGRESS.md) for current coverage and [MODEL_INTEGRATION.md](MODEL_INTEGRATION.md) for model requirements.
