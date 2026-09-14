"""Measure visible bounds without changing artwork; requires Pillow."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
bounds = {}
for path in sorted((root / "public/pokemon").glob("*.png")):
    if not path.stem.isdigit():
        continue
    image = Image.open(path).convert("RGBA")
    box = image.getchannel("A").point(lambda alpha: 255 if alpha > 20 else 0).getbbox()
    if box:
        x, y, right, bottom = box
        bounds[path.stem] = [x, y, right - x, bottom - y, image.width, image.height]
(root / "src/data/artwork-bounds.json").write_text(json.dumps(bounds, separators=(",", ":")) + "\n")
