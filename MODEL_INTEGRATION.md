# Model integration status

## Experimental hosted denomination guess

The scanner can optionally call the Roboflow Universe PCB model (`pcb-llhbp/2`). It lists the six peso denominations and is marked CC BY 4.0. The publisher labels it a Roboflow 2.0 multi-label classifier and reports 100% accuracy, but does not publish an independent evaluation protocol. Treat its output as an experimental guess only. It does not assess genuineness or counterfeit status.

The Vite development server proxies requests to Roboflow so the private API key stays out of browser code. The camera image is sent to Roboflow only when the user explicitly selects **Analyze**. It is not persisted in browser history. This proxy exists only in the local development server; the production build does not have a backend endpoint and cannot use hosted inference.

### Enable local development inference

1. Create a Roboflow API key for an account that can access the model.
2. Copy `.env.example` to `.env.local` and set `ROBOFLOW_API_KEY` there.
3. Restart `npm run dev`.
4. Capture a banknote side and choose **Analyze**. Review the cloud-upload disclosure before doing so.
5. If the result looks useful, choose **Use guess** to add it as a model-sourced denomination label. The saved assessment stays **Unable to verify**.

`.env.local` is excluded from source control. Never place the key in `VITE_*` variables, browser code, or chat. Roboflow API usage, rate limits, and retention are governed by the user's Roboflow account and service terms.

## Local ONNX model

An experimental Roboflow-derived ONNX candidate is present in `public/models/experimental-candidate/` and can be explicitly requested in the scanner. It predicts denomination only. Its dataset has no physical-banknote IDs, so its splits cannot establish note-level leakage safety. Metadata keeps `deployment_approved: false`; the production model registry remains empty. Do not set approval to true without a note-ID-separated dataset, independent evaluation, and artifact provenance review.

The target local model is a six-class Torchvision MobileNetV3 Small classifier trained with physical-note-grouped splits. It must never be represented as an authenticity or counterfeit detector. A denomination ranking score is not a probability of genuineness.
