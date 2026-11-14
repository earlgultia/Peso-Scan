# AI training dependencies and commercial-use notes

This is a project-level license inventory, not legal advice. Before redistributing a trained artifact or app, review the exact license texts for the package versions in the actual Colab runtime and preserve required notices. PyTorch wheels include third-party components with their own notices; retain the notices shipped with the installed wheel.

| Component | Purpose | Upstream license / use note |
|---|---|---|
| PyTorch (`torch`) | Training and model execution | BSD-style; the distribution includes third-party components under additional licenses. Review the installed wheel's license notices. |
| TorchVision (`torchvision`) | MobileNetV3 Small architecture and image utilities | BSD 3-Clause. TorchVision warns that pretrained model weights can have separate terms based on their training data. |
| Pillow | Image decoding and letterbox preprocessing | HPND/Pillow license; preserve license and copyright text when redistributing Pillow. |
| NumPy | Numeric runtime and export parity check | BSD 3-Clause. |
| ONNX | Model file format and checker | Apache License 2.0. Preserve the license and any applicable notices. |
| ONNX Runtime | CPU parity check; future browser integration uses a separate JS package | MIT. Review the exact package's bundled notices before redistribution. |
| ONNX Runtime Web (`onnxruntime-web`) | Future in-browser ONNX inference (WASM) | MIT. The web package/runtime may bundle third-party files with their own notices; preserve the package's notices. |
| Google Colab | Hosted notebook execution service | Service terms apply; it is not an open-source dependency. Free compute and GPU availability are not guaranteed. |

The notebook defaults to training from random initialization (`PRETRAINED = False`) to avoid silently incorporating torchvision's ImageNet checkpoint and its separate dataset provenance terms. If you enable pretrained ImageNet weights, record the exact weight enum/checkpoint and independently confirm its use and redistribution terms for your commercial use case. The user-trained weights also inherit no blanket license from these software libraries: decide and document a license for your own data and model artifacts. Ensure every contributed photograph has documented rights for the intended training and commercial use. The CSV `rights_confirmed` field is a contributor attestation, not a legal review.

The MobileNetV3 architecture paper/model implementation and third-party package notices may have attribution obligations beyond the short inventory above. For a release, include the complete notices from the exact dependency artifacts and review all transitive dependencies.

## Primary license and service references

- [PyTorch repository license](https://github.com/pytorch/pytorch) and [TorchVision license](https://github.com/pytorch/vision/blob/main/LICENSE)
- [TorchVision pretrained model terms warning](https://github.com/pytorch/vision#pre-trained-model-license)
- [Pillow license](https://github.com/python-pillow/Pillow/blob/main/LICENSE)
- [NumPy license](https://github.com/numpy/numpy/blob/main/LICENSE.txt)
- [ONNX license](https://github.com/onnx/onnx/blob/main/LICENSE)
- [ONNX Runtime license](https://github.com/microsoft/onnxruntime/blob/main/LICENSE)
- [Google Colab FAQ: dynamic resource limits](https://research.google.com/colaboratory/faq.html#resource-limits)
