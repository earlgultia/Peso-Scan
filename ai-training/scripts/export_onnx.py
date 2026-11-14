"""Export a trained checkpoint to ONNX and compare it with PyTorch."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import torch

from model import build_model
from training_data import CLASS_IDS, IMAGE_SIZE


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--metadata", type=Path, help="Optional model_metadata.json path to update with ONNX filename")
    args = parser.parse_args()
    if not args.checkpoint.is_file():
        parser.error(f"Checkpoint not found: {args.checkpoint}; train a real model first")
    checkpoint = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    if checkpoint.get("class_ids") != list(CLASS_IDS):
        parser.error("Checkpoint class ordering does not match this project's class IDs")
    model = build_model().cpu().eval()
    model.load_state_dict(checkpoint["state_dict"])
    dummy = torch.zeros(1, 3, IMAGE_SIZE, IMAGE_SIZE)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        model, (dummy,), str(args.output), input_names=["images"], output_names=["logits"],
        dynamic_axes={"images": {0: "batch"}, "logits": {0: "batch"}}, opset_version=17,
        dynamo=False,
    )
    try:
        import onnx
        onnx.checker.check_model(onnx.load(str(args.output)))
        import onnxruntime as ort
        session = ort.InferenceSession(str(args.output), providers=["CPUExecutionProvider"])
        sample = np.random.default_rng(0).standard_normal((2, 3, IMAGE_SIZE, IMAGE_SIZE), dtype=np.float32)
        with torch.inference_mode():
            torch_logits = model(torch.from_numpy(sample)).numpy()
        onnx_logits = session.run(["logits"], {"images": sample})[0]
        max_error = float(np.max(np.abs(torch_logits - onnx_logits)))
        if not np.allclose(torch_logits, onnx_logits, rtol=1e-3, atol=1e-4):
            raise RuntimeError(f"ONNX output differs from PyTorch (max absolute error {max_error})")
    except ImportError as exc:
        raise RuntimeError("Install requirements-colab.txt (onnx and onnxruntime) to validate the exported model") from exc
    if args.metadata and args.metadata.is_file():
        metadata = json.loads(args.metadata.read_text(encoding="utf-8"))
        metadata["onnx_file"] = args.output.name
        metadata["onnx_opset"] = 17
        metadata["onnx_sha256"] = hashlib.sha256(args.output.read_bytes()).hexdigest()
        metadata["input_name"] = "images"
        metadata["output_name"] = "logits"
        metadata["onnxruntime_cpu_parity_max_abs_error"] = max_error
        args.metadata.write_text(json.dumps(metadata, indent=2) + "\n", encoding="utf-8")
    print(f"Exported and parity-checked {args.output}; max abs error={max_error:.8g}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
