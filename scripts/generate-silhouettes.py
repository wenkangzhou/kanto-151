"""Bake cropped size-comparison silhouettes; run after measure-artwork.py (Pillow)."""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
bounds = json.loads((root / 'src/data/artwork-bounds.json').read_text())
output = root / 'public/illustrations/silhouettes'
output.mkdir(parents=True, exist_ok=True)

def bake(source, destination, box):
    with Image.open(source) as original:
        cropped = original.convert('RGBA').crop(box)
        silhouette = Image.new('RGBA', cropped.size, (82, 82, 82, 0))
        silhouette.putalpha(cropped.getchannel('A'))
        silhouette.save(destination, optimize=True)

for pokemon in json.loads((root / 'src/data/pokemon.json').read_text()):
    key = str(pokemon['id'])
    x, y, width, height, *_ = bounds[key]
    bake(root / 'public' / pokemon['artwork'].lstrip('/'), output / f'{key}.png', (x, y, x + width, y + height))
bake(root / 'public/illustrations/trainer-red.png', output / 'trainer.png', (10, 8, 50, 63))
print('Generated 151 Pokémon silhouettes and trainer silhouette.')
