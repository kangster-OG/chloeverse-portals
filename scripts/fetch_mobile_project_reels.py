#!/usr/bin/env python3

import html
import re
import subprocess
import sys
from pathlib import Path
from typing import Optional
from urllib.parse import urlsplit

import requests

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "projects" / "reels"
HEADERS = {"User-Agent": "Mozilla/5.0"}

REELS = [
    {"id": "r3", "url": "https://www.instagram.com/reel/DTZ2XtNkeNC/"},
    {"id": "r4", "url": "https://www.instagram.com/reel/DR_GW1BkQci/"},
    {"id": "r5", "url": "https://www.instagram.com/reel/DSitVRLkjEf/"},
    {"id": "r6", "url": "https://www.instagram.com/reel/DOH8x_gk2Ew/"},
    {"id": "r7", "url": "https://www.instagram.com/reel/DOQ-ZxuEzan/"},
    {"id": "r8", "url": "https://www.instagram.com/reel/DObX6ceE-di/"},
    {"id": "r9", "url": "https://www.instagram.com/reel/DOsvvxCkUxJ/"},
    {"id": "r10", "url": "https://www.instagram.com/reel/DMLYWLOhTfg/"},
    {"id": "r11", "url": "https://www.instagram.com/reel/DMxxlTEp98D/"},
]


def fetch(url: str) -> str:
    response = requests.get(url, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.text


def get_url_with_ytdlp(flag: str, url: str) -> Optional[str]:
    try:
        output = subprocess.check_output(
            [sys.executable, "-m", "yt_dlp", "--no-playlist", flag, url],
            stderr=subprocess.DEVNULL,
            text=True,
        )
    except Exception:
        return None

    value = output.strip()
    return value or None


def extract_cover_url(page_html: str) -> str:
    match = re.search(r'property="og:image" content="([^"]+)"', page_html)
    if not match:
        raise RuntimeError("Unable to locate og:image cover URL.")
    return html.unescape(match.group(1))


def extract_video_url(embed_html: str) -> str:
    match = re.search(r'\\"video_url\\":\\"(.*?)\\"', embed_html)
    if not match:
        raise RuntimeError("Unable to locate embedded video URL.")

    raw = match.group(1)
    decoded = bytes(raw, "utf-8").decode("unicode_escape")
    decoded = decoded.replace("\\/", "/").replace("\\", "")
    decoded = decoded.replace("\\u0026", "&").replace("\\u003d", "=").replace("\\u00253D", "%3D")
    return decoded


def download_file(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    with requests.get(url, headers=HEADERS, timeout=60, stream=True) as response:
        response.raise_for_status()
        with destination.open("wb") as output_file:
            for chunk in response.iter_content(chunk_size=1024 * 256):
                if chunk:
                    output_file.write(chunk)


def main() -> None:
    for reel in REELS:
        reel_dir = OUT_DIR / reel["id"]
        page_html = fetch(reel["url"])
        cover_url = get_url_with_ytdlp("--get-thumbnail", reel["url"]) or extract_cover_url(page_html)
        video_url = get_url_with_ytdlp("--get-url", reel["url"])

        if video_url is None:
            split_url = urlsplit(reel["url"])
            embed_html = fetch(split_url._replace(path=split_url.path.rstrip("/") + "/embed/").geturl())
            video_url = extract_video_url(embed_html)

        cover_path = reel_dir / "cover.jpg"
        video_path = reel_dir / "video.mp4"

        print(f"Downloading {reel['id']} cover -> {cover_path.relative_to(ROOT)}")
        download_file(cover_url, cover_path)
        print(f"Downloading {reel['id']} video -> {video_path.relative_to(ROOT)}")
        download_file(video_url, video_path)


if __name__ == "__main__":
    main()
