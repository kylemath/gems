#!/usr/bin/env python3
"""
Chop gemstonepics.png into individual polished gem images.
Grid: 5 columns × 6 rows (last row has 4 gems).
"""
from pathlib import Path
from PIL import Image

# Gem names in grid order (row by row, left to right)
GEMS = [
    "alexandrite", "amber", "amethyst", "ametrine", "aquamarine",
    "citrine", "diamond", "fancy_color_diamond", "emerald", "garnet",
    "iolite", "jade", "kunzite", "lapis_lazuli", "moonstone",
    "morganite", "opal", "pearl", "peridot", "rose_quartz",
    "ruby", "sapphire", "spinel", "sunstone", "tanzanite",
    "topaz", "tourmaline", "turquoise", "zircon",
]

SRC = Path(__file__).parent / "gemstonepics.png"
OUT = Path(__file__).parent / "gemstone-explorer" / "assets" / "gems"

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    im = Image.open(SRC).convert("RGBA")
    w, h = im.size

    cols, rows = 5, 6
    cell_w = w // cols
    cell_h = h // rows

    for i, name in enumerate(GEMS):
        row = i // cols
        col = i % cols
        left = col * cell_w
        top = row * cell_h
        right = left + cell_w
        bottom = top + cell_h
        # Crop with small padding to avoid grid lines
        pad = 2
        crop = im.crop((left + pad, top + pad, right - pad, bottom - pad))
        out_path = OUT / f"{name}.png"
        crop.save(out_path, "PNG")
        print(f"Saved {out_path.name}")

    print(f"\nExtracted {len(GEMS)} gem images to {OUT}")

if __name__ == "__main__":
    main()
