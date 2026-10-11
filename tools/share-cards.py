#!/usr/bin/env python3
"""
Make the share cards (the image shown when a link is posted on LinkedIn, Slack and so on).

    python3 tools/share-cards.py                 # every post, plus the site card
    python3 tools/share-cards.py ai-soccer-part-1

Writes static/images/og/<post file name>.png (1200 x 630) and static/images/og/site.png.
The theme picks a post's card up by its file name, so nothing needs adding to front matter.
Needs Chromium or Chrome; pass --browser if it is not found, and --workdir if the browser
cannot read the system temp folder (snap-packaged Chromium can only read inside your home).
"""

import argparse
import html
import re
import shutil
import subprocess
import tempfile
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "themes/blueprint/static/fonts"
OUT = ROOT / "static/images/og"

PAGE = """<!doctype html><meta charset="utf-8"><style>
@font-face {{ font-family: Archivo; font-weight: 400 800; src: url(archivo-latin.woff2) format("woff2"); }}
@font-face {{ font-family: Mono; font-weight: 400 500; src: url(jetbrains-mono-latin.woff2) format("woff2"); }}
html, body {{ margin: 0; }}
body {{ width: 1200px; height: 630px; box-sizing: border-box; padding: 64px 72px; background: #1f44c8; color: #fff;
  font-family: Archivo, sans-serif; display: flex; flex-direction: column; justify-content: space-between; }}
.kicker {{ font-family: Mono, monospace; font-size: 24px; letter-spacing: 0.1em; text-transform: uppercase; color: #dbe3ff; }}
h1 {{ margin: 24px 0 0; font-size: {size}px; line-height: 1.04; font-weight: 800; letter-spacing: -0.03em; }}
.sub {{ margin: 20px 0 0; font-size: 36px; color: #e6ebff; }}
.foot {{ display: flex; justify-content: space-between; align-items: flex-end; font-size: 30px; font-weight: 800; letter-spacing: -0.02em; }}
</style>
<div>{top}</div>
<div class="foot"><span>{foot}</span>
<svg width="72" height="72" viewBox="0 0 32 32"><path d="M16 5 22 21" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="5" r="1.6" fill="#fff"/><circle cx="23.2" cy="24" r="4" fill="#fff"/></svg></div>
"""


def front_matter(path):
    """Title and date from a post's TOML front matter."""
    text = path.read_text(encoding="utf-8")
    head = text.split("+++")[1]
    title = re.search(r'^title\s*=\s*"(.*)"\s*$', head, re.M).group(1).replace('\\"', '"')
    date = datetime.fromisoformat(re.search(r'^date\s*=\s*"(.*)"\s*$', head, re.M).group(1))
    return title, date.replace(tzinfo=None) if date.tzinfo is None else date


def site_settings():
    config = (ROOT / "config.toml").read_text(encoding="utf-8")
    title = re.search(r'^title\s*=\s*"(.*)"', config, re.M).group(1)
    tagline = re.search(r'^\s*tagline\s*=\s*"(.*)"', config, re.M)
    return title, tagline.group(1) if tagline else ""


def find_browser():
    for name in ("chromium-browser", "chromium", "google-chrome", "google-chrome-stable"):
        if shutil.which(name):
            return name
    raise SystemExit("No Chromium or Chrome found: pass --browser /path/to/browser")


def shoot(browser, workdir, name, page):
    (workdir / f"{name}.html").write_text(page, encoding="utf-8")
    png = workdir / f"{name}.png"
    subprocess.run(
        [browser, "--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
         "--window-size=1200,630", f"--screenshot={png}", (workdir / f"{name}.html").as_uri()],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    shutil.copy(png, OUT / f"{name}.png")
    print(f"static/images/og/{name}.png")


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("posts", nargs="*", help="post file names without .md (default: all)")
    parser.add_argument("--browser")
    parser.add_argument("--workdir", type=Path)
    args = parser.parse_args()
    browser = args.browser or find_browser()
    workdir = args.workdir or Path(tempfile.mkdtemp(prefix="share-cards-"))
    workdir.mkdir(parents=True, exist_ok=True)
    OUT.mkdir(parents=True, exist_ok=True)
    for font in ("archivo-latin.woff2", "jetbrains-mono-latin.woff2"):
        shutil.copy(FONTS / font, workdir / font)

    site_title, tagline = site_settings()
    posts = sorted(
        ((path.stem,) + front_matter(path) for path in (ROOT / "content/post").glob("*.md")),
        key=lambda post: post[2].timestamp(),
    )
    for number, (name, title, date) in enumerate(posts, start=1):
        if args.posts and name not in args.posts:
            continue
        size = 84 if len(title) <= 34 else 70 if len(title) <= 60 else 58
        top = (f'<div class="kicker">Post {number:02d} · {date.strftime("%-d %b %Y")}</div>'
               f"<h1>{html.escape(title)}</h1>")
        shoot(browser, workdir, name, PAGE.format(size=size, top=top, foot=html.escape(site_title)))
    if not args.posts:
        top = f'<h1 style="margin-top: 64px">{html.escape(site_title)}</h1><p class="sub">{html.escape(tagline)}</p>'
        shoot(browser, workdir, "site", PAGE.format(size=124, top=top, foot=""))


if __name__ == "__main__":
    main()
