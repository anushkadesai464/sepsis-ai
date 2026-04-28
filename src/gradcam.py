import torch
import torch.nn as nn
import torchvision.transforms as transforms
import numpy as np
import cv2
from PIL import Image


def generate_gradcam(image_path: str, model) -> np.ndarray:
    """Generate Grad-CAM heatmap overlay on X-ray"""

    device = torch.device('cpu')
    model.eval()

    # Preprocess
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.Grayscale(num_output_channels=3),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        )
    ])

    img        = Image.open(image_path).convert('RGB')
    img_resized = img.resize((224, 224))
    tensor     = transform(img).unsqueeze(0).to(device)

    # Hook into last conv layer
    gradients  = []
    activations = []

    def forward_hook(module, input, output):
        activations.append(output)

    def backward_hook(module, grad_in, grad_out):
        gradients.append(grad_out[0])

    # Register hooks on last dense block
    target_layer = model.features.denseblock4
    fh = target_layer.register_forward_hook(forward_hook)
    bh = target_layer.register_full_backward_hook(backward_hook)

    # Forward + backward pass
    output = model(tensor)
    model.zero_grad()
    output.backward()

    # Remove hooks
    fh.remove()
    bh.remove()

    # Compute Grad-CAM
    grads = gradients[0].squeeze().mean(dim=(1, 2))
    acts  = activations[0].squeeze()
    cam   = torch.zeros(acts.shape[1:])

    for i, w in enumerate(grads):
        cam += w * acts[i]

    cam = torch.relu(cam)
    cam = cam.detach().numpy()
    cam = cv2.resize(cam, (224, 224))
    cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

    # Overlay heatmap on image
    heatmap = cv2.applyColorMap(
        np.uint8(255 * cam), cv2.COLORMAP_JET
    )
    img_np  = np.array(img_resized)
    overlay = cv2.addWeighted(img_np, 0.6, heatmap, 0.4, 0)

    return overlay