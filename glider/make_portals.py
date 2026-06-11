#!/usr/bin/env python3
"""make_portals.py — emit per-portal deploy folders from the web build.

Usage:  python3 make_portals.py [source_dir]   (default: current directory)

Reads source_dir/index.html plus every sibling asset (three.module.min.js,
images) and writes dist/web, dist/poki, dist/crazygames. The portal variants
get the portal's SDK script tag in <head> and the PORTAL constant rewritten,
which strips external share links (portal policy) and arms the Phase-2 SDK
hooks. The web variant is byte-identical to the source.
"""
import pathlib, shutil, sys

SDK_TAGS = {
    'poki': '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
    'crazygames': '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>',
}
PORTAL_LINE = "const PORTAL = 'web';"

def build(src: pathlib.Path):
    html = (src / 'index.html').read_text(encoding='utf-8')
    if PORTAL_LINE not in html:
        sys.exit('PORTAL constant not found — is this the right index.html?')
    dist = src / 'dist'
    if dist.exists():
        shutil.rmtree(dist)
    assets = [p for p in src.iterdir()
              if p.is_file() and p.name not in ('index.html', 'make_portals.py')]
    for target in ('web', 'poki', 'crazygames'):
        out = dist / target
        out.mkdir(parents=True)
        text = html
        if target != 'web':
            text = text.replace(PORTAL_LINE, f"const PORTAL = '{target}';")
            text = text.replace('</head>', SDK_TAGS[target] + '\n</head>')
            # structural guard: exactly one PORTAL line, one SDK tag
            assert text.count(f"const PORTAL = '{target}';") == 1
            assert text.count(SDK_TAGS[target]) == 1
        (out / 'index.html').write_text(text, encoding='utf-8')
        for a in assets:
            shutil.copy2(a, out / a.name)
        print(f'  dist/{target}: index.html + {len(assets)} assets')

if __name__ == '__main__':
    build(pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.'))
