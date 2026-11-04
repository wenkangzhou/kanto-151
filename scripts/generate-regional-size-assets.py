"""Add Johto and Hoenn size-comparison bounds and silhouettes without changing Kanto assets."""
import json
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BOUNDS_PATH = ROOT / "src/data/artwork-bounds.json"
OUTPUT = ROOT / "public/illustrations/silhouettes"
bounds = json.loads(BOUNDS_PATH.read_text())

for region in ("johto", "hoenn"):
    records = json.loads((ROOT / f"src/data/{region}-pokemon.json").read_text())
    for pokemon in records:
        key = str(pokemon["id"])
        source = ROOT / "public" / pokemon["artwork"].lstrip("/")
        with Image.open(source) as original:
            image = original.convert("RGBA")
            box = image.getchannel("A").point(lambda alpha: 255 if alpha > 20 else 0).getbbox()
            if not box:
                raise ValueError(f"Artwork has no visible pixels: {source}")
            x, y, right, bottom = box
            bounds[key] = [x, y, right - x, bottom - y, image.width, image.height]
            cropped = image.crop(box)
            silhouette = Image.new("RGBA", cropped.size, (82, 82, 82, 0))
            silhouette.putalpha(cropped.getchannel("A"))
            silhouette.save(OUTPUT / f"{key}.png", optimize=True)

BOUNDS_PATH.write_text(json.dumps(bounds, separators=(",", ":")) + "\n")
print("Generated 235 regional size-comparison silhouettes and bounds.")
