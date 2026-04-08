#!/usr/bin/env python3

from __future__ import annotations

from collections import deque
from pathlib import Path
from typing import Iterable

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "public" / "contact" / "planet-dodge"
DEFAULT_ASSETS = [
    "ship.png",
    "alien-fighter.png",
    "space-station.png",
    "mercury.png",
    "venus.png",
    "earth.png",
    "mars.png",
    "jupiter.png",
    "saturn.png",
    "uranus.png",
    "neptune.png",
    "pluto.png",
]


def color_distance(a: tuple[int, int, int, int], b: tuple[int, int, int, int]) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1]) + abs(a[2] - b[2])


def iter_center_points(width: int, height: int, radius: int = 8) -> Iterable[tuple[int, int]]:
    center_x = width // 2
    center_y = height // 2
    for y in range(max(0, center_y - radius), min(height, center_y + radius + 1)):
        for x in range(max(0, center_x - radius), min(width, center_x + radius + 1)):
            yield (x, y)


def isolate_center_subject(image: Image.Image, tolerance: int = 96) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    visited: set[tuple[int, int]] = set()
    keep: set[tuple[int, int]] = set()
    queue = deque(iter_center_points(width, height))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited:
            continue
        visited.add((x, y))

        current = pixels[x, y]
        if current[3] == 0:
            continue

        keep.add((x, y))

        for nx in range(max(0, x - 1), min(width, x + 2)):
            for ny in range(max(0, y - 1), min(height, y + 2)):
                if (nx, ny) in visited or (nx, ny) == (x, y):
                    continue
                neighbor = pixels[nx, ny]
                if neighbor[3] == 0:
                    continue
                if color_distance(current, neighbor) <= tolerance:
                    queue.append((nx, ny))

    if not keep:
        return rgba

    cleaned = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    cleaned_pixels = cleaned.load()
    for x, y in keep:
        cleaned_pixels[x, y] = pixels[x, y]

    bbox = cleaned.getchannel("A").getbbox()
    if bbox is None:
        return rgba

    cropped = cleaned.crop(bbox)
    canvas = Image.new("RGBA", rgba.size, (0, 0, 0, 0))
    offset = ((width - cropped.width) // 2, (height - cropped.height) // 2)
    canvas.paste(cropped, offset)
    return canvas


def normalize_asset(path: Path) -> None:
    image = Image.open(path).convert("RGBA")
    alpha_bbox = image.getchannel("A").getbbox()
    if alpha_bbox != (0, 0, image.width, image.height):
        return

    normalized = isolate_center_subject(image)
    normalized.save(path)


def main() -> None:
    for name in DEFAULT_ASSETS:
        normalize_asset(ASSET_DIR / name)


if __name__ == "__main__":
    main()
