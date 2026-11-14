"""MobileNetV3 Small model definition for PESO SCAN."""
import torch
from torchvision.models import MobileNet_V3_Small_Weights, mobilenet_v3_small

NUM_CLASSES = 6


def build_model(num_classes: int = NUM_CLASSES, pretrained: bool = False):
    weights = MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
    model = mobilenet_v3_small(weights=weights)
    model.classifier[-1] = torch.nn.Linear(model.classifier[-1].in_features, num_classes)
    return model
