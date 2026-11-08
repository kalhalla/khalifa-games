#!/usr/bin/env python3
"""
ingest_dem.py - turn a LOLA south-polar DEM into the terrain lab's heightmap.

Reads either
  * a PDS3 product: .LBL (detached label) + .IMG, or an .IMG with an attached
    label - e.g. LDEM_875S_20M.LBL / LDEM_875S_20M.IMG from LOLA_GDR/POLAR/IMG.
    Everything (size, sample type, SCALING_FACTOR, OFFSET, units, projection
    offsets, map scale, radius) is read from the label, not hard-coded.
  * a GeoTIFF (.tif) in south polar stereographic metres, e.g. a PGDA 20 m/px
    south-pole mosaic. Read with tifffile; pixel scale/tiepoint come from the
    GeoTIFF tags. Projection is assumed polar stereographic centred on the
    south pole, R = 1737.4 km, unless --lon0 / --radius-km say otherwise.

It locates Shackleton from its nominal lat/lon (projected with the file's own
parameters), refines the centre from the floor of the deepest bowl nearby,
fits a circle to the rim crest, crops a square 1.4x the rim diameter centred
on the fit, resamples it to --size x --size and writes into data/:

  shackleton_height.png   16-bit greyscale PNG (normalised min..max)
  shackleton_height.u16   same samples, raw little-endian uint16, row-major
                          (what the page loads: canvas decodes PNGs to 8-bit)
  shackleton_meta.json    source, real-world extents, min/max height (m),
                          rim radius/depth, scale, slope statistics

Usage:
  python3 ingest_dem.py --standin                 # synthesise + ingest stand-in
  python3 ingest_dem.py raw/LDEM_875S_20M.LBL     # real PDS product
  python3 ingest_dem.py raw/some_mosaic.tif       # real GeoTIFF
"""
import argparse
import datetime
import json
import math
import os
import re
import sys

import numpy as np
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.dirname(HERE)
DATA = os.path.join(LAB, 'data')

SHACKLETON_LAT, SHACKLETON_LON = -89.67, 129.8
GAME_RIM_RADIUS_M = 240.0


# --------------------------------------------------------------------------
# PDS3 label parsing
# --------------------------------------------------------------------------
def parse_pds_label(text):
    """Minimal PDS3 ODL parser -> nested dict. Values keep units separate."""
    root = {}
    stack = [root]
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        i += 1
        if not line:
            continue
        if line == 'END':
            break
        if '=' not in line:
            continue
        key, val = [s.strip() for s in line.split('=', 1)]
        # multi-line values: quoted strings or parenthesised lists
        while (val.count('"') % 2 == 1 or val.count('(') > val.count(')')) and i < len(lines):
            val += ' ' + lines[i].strip()
            i += 1
        if key == 'OBJECT' or key == 'GROUP':
            d = {}
            stack[-1].setdefault(val, d)
            stack.append(d)
        elif key in ('END_OBJECT', 'END_GROUP'):
            if len(stack) > 1:
                stack.pop()
        else:
            stack[-1][key] = val
    return root


def odl_value(raw, default=None):
    """'0.5' -> 0.5, '20 <METERS/PIXEL>' -> (20.0, 'METERS/PIXEL'), '"X"' -> 'X'."""
    if raw is None:
        return default
    raw = raw.strip()
    m = re.match(r'^(.*?)\s*<\s*([^>]+)\s*>$', raw)
    unit = None
    if m:
        raw, unit = m.group(1).strip(), m.group(2).strip().upper()
    raw = raw.strip('"').strip("'")
    m16 = re.match(r'^16#([0-9A-Fa-f]+)#$', raw)
    if m16:
        v = int(m16.group(1), 16)
        return (v, unit) if unit else v
    try:
        v = float(raw)
        if v.is_integer() and re.match(r'^-?\d+$', raw):
            v = int(v)
    except ValueError:
        v = raw
    return (v, unit) if unit else v


def num(raw, default=None):
    v = odl_value(raw, default)
    return v[0] if isinstance(v, tuple) else v


def unit_of(raw):
    v = odl_value(raw)
    return v[1] if isinstance(v, tuple) else None


class PolarGrid:
    """Raster in polar stereographic metres; PDS sample/line convention."""

    def __init__(self, arr, scale_m, lpo, spo, lon0, radius_m, south=True,
                 missing=None, dn_scale=1.0, dn_offset=0.0, unit_to_m=1.0, name=''):
        self.arr = arr                    # 2-D array-like (may be a memmap)
        self.scale_m = scale_m
        self.lpo = lpo
        self.spo = spo
        self.lon0 = lon0
        self.radius_m = radius_m
        self.south = south
        self.missing = missing
        self.dn_scale = dn_scale
        self.dn_offset = dn_offset
        self.unit_to_m = unit_to_m
        self.name = name

    # x = (SAMPLE - SPO - 1) * scale ; y = (1 - LINE + LPO) * scale  (1-based)
    def xy_to_colrow(self, x, y):
        col = x / self.scale_m + self.spo          # 0-based column
        row = self.lpo - y / self.scale_m          # 0-based row
        return col, row

    def colrow_to_xy(self, col, row):
        return (col - self.spo) * self.scale_m, (self.lpo - row) * self.scale_m

    def latlon_to_xy(self, lat, lon):
        if self.south:
            rho = 2 * self.radius_m * math.tan(math.radians(90.0 + lat) / 2)
            lam = math.radians(lon - self.lon0)
            return rho * math.sin(lam), rho * math.cos(lam)
        rho = 2 * self.radius_m * math.tan(math.radians(90.0 - lat) / 2)
        lam = math.radians(lon - self.lon0)
        return rho * math.sin(lam), -rho * math.cos(lam)

    def xy_to_latlon(self, x, y):
        rho = math.hypot(x, y)
        c = 2 * math.degrees(math.atan(rho / (2 * self.radius_m)))
        if self.south:
            return -90.0 + c, (self.lon0 + math.degrees(math.atan2(x, y))) % 360
        return 90.0 - c, (self.lon0 + math.degrees(math.atan2(x, -y))) % 360

    def window_m(self, cx, cy, half_m):
        """Heights in metres (float64) for a square window; NaN where missing."""
        c, r = self.xy_to_colrow(cx, cy)
        hp = int(math.ceil(half_m / self.scale_m)) + 2
        r0, r1 = int(r) - hp, int(r) + hp + 1
        c0, c1 = int(c) - hp, int(c) + hp + 1
        H, W = self.arr.shape
        rr0, rr1, cc0, cc1 = max(r0, 0), min(r1, H), max(c0, 0), min(c1, W)
        if rr0 >= rr1 or cc0 >= cc1:
            raise SystemExit('Shackleton is outside this raster - wrong file or projection?')
        out = np.full((r1 - r0, c1 - c0), np.nan)
        raw = np.asarray(self.arr[rr0:rr1, cc0:cc1]).astype(np.float64)
        bad = ~np.isfinite(raw)
        if self.missing is not None:
            bad |= raw == self.missing
        raw = (raw * self.dn_scale + self.dn_offset) * self.unit_to_m
        raw[bad] = np.nan
        out[rr0 - r0:rr1 - r0, cc0 - c0:cc1 - c0] = raw
        return out, r0, c0


def load_pds(path):
    lbl_path = path
    if path.upper().endswith('.IMG'):
        cand = [path[:-4] + e for e in ('.LBL', '.lbl')]
        found = [p for p in cand if os.path.exists(p)]
        lbl_path = found[0] if found else path       # attached label
    with open(lbl_path, 'rb') as f:
        head = f.read(200000)
    text = head.decode('latin-1')
    L = parse_pds_label(text)
    img = L.get('IMAGE')
    proj = L.get('IMAGE_MAP_PROJECTION')
    if img is None or proj is None:
        raise SystemExit(f'{lbl_path}: label has no IMAGE / IMAGE_MAP_PROJECTION object')
    lines = int(num(img['LINES']))
    samples = int(num(img['LINE_SAMPLES']))
    bits = int(num(img['SAMPLE_BITS']))
    stype = odl_value(img['SAMPLE_TYPE']).upper()
    dtype = {
        ('LSB_INTEGER', 16): '<i2', ('MSB_INTEGER', 16): '>i2',
        ('LSB_INTEGER', 32): '<i4', ('MSB_INTEGER', 32): '>i4',
        ('LSB_UNSIGNED_INTEGER', 16): '<u2', ('MSB_UNSIGNED_INTEGER', 16): '>u2',
        ('UNSIGNED_INTEGER', 8): 'u1', ('MSB_UNSIGNED_INTEGER', 8): 'u1',
        ('PC_REAL', 32): '<f4', ('IEEE_REAL', 32): '>f4',
        ('PC_REAL', 64): '<f8', ('IEEE_REAL', 64): '>f8',
    }.get((stype, bits))
    if dtype is None:
        raise SystemExit(f'unsupported SAMPLE_TYPE {stype} / SAMPLE_BITS {bits}')
    dn_scale = float(num(img.get('SCALING_FACTOR'), 1.0))
    dn_offset = float(num(img.get('OFFSET'), 0.0))
    unit = str(odl_value(img.get('UNIT'), 'METER')).upper()
    unit_to_m = 1000.0 if unit.startswith('KILO') or unit == 'KM' else 1.0
    missing = num(img.get('MISSING_CONSTANT'))
    if isinstance(missing, int) and dtype.endswith('i2') and missing > 32767:
        missing -= 65536

    ptr = L.get('^IMAGE')
    rec_bytes = int(num(L.get('RECORD_BYTES'), 0) or 0)
    img_path, byte_off = None, 0
    v = odl_value(ptr) if ptr else None
    if isinstance(v, str) or (ptr and ptr.strip().startswith('(')):
        m = re.match(r'^\(\s*"?([^",]+)"?\s*(?:,\s*(\d+)\s*(<BYTES>)?)?\s*\)$', ptr.strip())
        fname = m.group(1) if m else v
        if m and m.group(2):
            n = int(m.group(2))
            byte_off = n - 1 if m.group(3) else (n - 1) * rec_bytes
        d = os.path.dirname(lbl_path)
        cands = [os.path.join(d, fname), os.path.join(d, fname.lower()), os.path.join(d, fname.upper())]
        img_path = next((c for c in cands if os.path.exists(c)), None)
        if img_path is None:
            raise SystemExit(f'image file {fname} not found next to {lbl_path}')
    else:
        img_path = lbl_path
        if isinstance(v, tuple):
            byte_off = int(v[0]) - 1 if 'BYTE' in v[1] else (int(v[0]) - 1) * rec_bytes
        elif v is not None:
            byte_off = (int(v) - 1) * rec_bytes
    arr = np.memmap(img_path, dtype=dtype, mode='r', offset=byte_off, shape=(lines, samples))

    ptype = str(odl_value(proj.get('MAP_PROJECTION_TYPE'), '')).upper()
    if 'POLAR' not in ptype or 'STEREO' not in ptype:
        raise SystemExit(f'projection {ptype!r} not supported (need POLAR STEREOGRAPHIC)')
    scale = odl_value(proj['MAP_SCALE'])
    sval, sunit = (scale if isinstance(scale, tuple) else (scale, 'KM/PIXEL'))
    scale_m = float(sval) * (1000.0 if sunit.startswith('KM') else 1.0)
    radius = odl_value(proj.get('A_AXIS_RADIUS', '1737.4'))
    rval, runit = (radius if isinstance(radius, tuple) else (radius, 'KM'))
    radius_m = float(rval) * (1000.0 if (runit or 'KM').startswith('KM') else 1.0)
    clat = float(num(proj.get('CENTER_LATITUDE'), -90.0))
    lon0 = float(num(proj.get('CENTER_LONGITUDE'), 0.0))
    lpo = float(num(proj['LINE_PROJECTION_OFFSET']))
    spo = float(num(proj['SAMPLE_PROJECTION_OFFSET']))
    product = str(odl_value(L.get('PRODUCT_ID'), os.path.basename(img_path)))
    dataset = str(odl_value(L.get('DATA_SET_ID'), ''))
    g = PolarGrid(arr, scale_m, lpo, spo, lon0, radius_m, south=clat < 0, missing=missing,
                  dn_scale=dn_scale, dn_offset=dn_offset, unit_to_m=unit_to_m, name=product)
    g.dataset = dataset
    g.standin = 'STANDIN' in (product + dataset).upper()
    g.describe = (f'PDS3 {product} ({os.path.basename(img_path)}): {lines}x{samples} {stype}{bits}, '
                  f'{scale_m:g} m/px, DN*{dn_scale:g}+{dn_offset:g} {unit}')
    return g


def load_geotiff(path, lon0=0.0, radius_km=1737.4, height_scale=1.0, height_offset=0.0):
    try:
        import tifffile
    except ImportError:
        raise SystemExit('GeoTIFF needs tifffile:  pip install tifffile --break-system-packages\n'
                         '(or convert to PDS/raw first, e.g. gdal_translate -of ENVI)')
    with tifffile.TiffFile(path) as tf:
        page = tf.pages[0]
        tags = {t.name: t.value for t in page.tags.values()}
        try:
            arr = tf.asarray(out='memmap')
        except Exception:
            arr = tf.asarray()
    if arr.ndim == 3:
        arr = arr[..., 0] if arr.shape[-1] < arr.shape[0] else arr[0]
    ps = tags.get('ModelPixelScaleTag')
    tp = tags.get('ModelTiepointTag')
    if ps is None or tp is None:
        raise SystemExit(f'{path}: no GeoTIFF ModelPixelScale/ModelTiepoint tags')
    sx, sy = float(ps[0]), float(ps[1])
    if abs(sx - sy) > 1e-6 * sx:
        print(f'warning: non-square pixels {sx} x {sy}; using x scale', file=sys.stderr)
    i, j, _, X, Y, _ = [float(v) for v in tp[:6]]
    # tiepoint: raster (i=col, j=row) -> model (X, Y), pixel-corner convention.
    # PolarGrid uses pixel centres: x(col) = (col - spo) * s, y(row) = (lpo - row) * s
    spo = i - X / sx - 0.5
    lpo = j + Y / sx - 0.5
    nodata = tags.get('GDAL_NODATA')
    missing = float(nodata.strip('\x00')) if nodata else None
    g = PolarGrid(arr, sx, lpo, spo, lon0, radius_km * 1000.0, south=True, missing=missing,
                  dn_scale=height_scale, dn_offset=height_offset, unit_to_m=1.0,
                  name=os.path.basename(path))
    g.dataset = 'GeoTIFF'
    g.standin = False
    g.describe = (f'GeoTIFF {os.path.basename(path)}: {arr.shape[0]}x{arr.shape[1]} {arr.dtype}, '
                  f'{sx:g} m/px (assumed south polar stereographic, R={radius_km} km, lon0={lon0})')
    return g


# --------------------------------------------------------------------------
# locate + fit
# --------------------------------------------------------------------------
def fill_nans(a):
    bad = ~np.isfinite(a)
    if not bad.any():
        return a
    if bad.all():
        raise SystemExit('window is entirely missing data')
    idx = ndimage.distance_transform_edt(bad, return_distances=False, return_indices=True)
    return a[tuple(idx)]


def fit_circle(x, y):
    A = np.column_stack([x, y, np.ones_like(x)])
    b = x * x + y * y
    (a0, a1, a2), *_ = np.linalg.lstsq(A, b, rcond=None)
    cx, cy = a0 / 2, a1 / 2
    return cx, cy, math.sqrt(a2 + cx * cx + cy * cy)


def locate(g, search_m=24000.0, verbose=True):
    px, py = g.latlon_to_xy(SHACKLETON_LAT, SHACKLETON_LON)
    if verbose:
        print(f'nominal centre {SHACKLETON_LAT} {SHACKLETON_LON} -> x={px:.0f} y={py:.0f} m '
              f'({math.hypot(px, py) / 1000:.2f} km from the pole)')
    win, r0, c0 = g.window_m(px, py, search_m)
    win = fill_nans(win)
    s = g.scale_m
    sm = ndimage.gaussian_filter(win, sigma=max(1.0, 250.0 / s))

    def to_xy(rr, cc):
        return g.colrow_to_xy(cc + c0, rr + r0)

    def to_rc(x, y):
        c, r = g.xy_to_colrow(x, y)
        return r - r0, c - c0

    # 1) deepest point within 7 km of nominal centre, then floor centroid
    pr, pc = to_rc(px, py)
    yy, xx = np.mgrid[0:win.shape[0], 0:win.shape[1]]
    near = np.hypot(yy - pr, xx - pc) * s < 7000.0
    masked = np.where(near, sm, np.inf)
    mr, mc = np.unravel_index(np.argmin(masked), masked.shape)
    zmin = sm[mr, mc]
    lab, _ = ndimage.label((sm < zmin + 250.0) & near)
    floor = lab == lab[mr, mc]
    fr, fc = ndimage.center_of_mass(floor)
    cx, cy = to_xy(fr, fc)
    if verbose:
        print(f'floor centroid x={cx:.0f} y={cy:.0f} (moved {math.hypot(cx - px, cy - py):.0f} m)')

    # 2) rim crest: maximum along radial profiles, robust circle fit, iterate
    az = np.linspace(0, 2 * np.pi, 240, endpoint=False)
    radii = np.arange(5000.0, 16000.0, s)
    R = 10500.0
    for it in range(12):
        cr, cc = to_rc(cx, cy)
        ex = np.cos(az)[:, None] * radii[None, :]
        ey = np.sin(az)[:, None] * radii[None, :]
        rr = cr - ey / s
        ccs = cc + ex / s
        prof = ndimage.map_coordinates(sm, [rr.ravel(), ccs.ravel()], order=1,
                                       mode='nearest').reshape(rr.shape)
        # crest = where the climb out of the bowl stops: first radius beyond the
        # steepest wall point at which the outward gradient falls to 15% of its
        # peak. (A plain maximum would run up the ridges leaving the rim.)
        d = np.gradient(prof, s, axis=1)
        k = np.zeros(len(az), dtype=int)
        for a_i in range(len(az)):
            i_st = int(np.argmax(d[a_i]))
            after = np.nonzero(d[a_i, i_st:] < 0.15 * d[a_i, i_st])[0]
            k[a_i] = i_st + (after[0] if len(after) else len(radii) - 1 - i_st)
        rim_r = radii[k]
        rx = cx + np.cos(az) * rim_r
        ry = cy + np.sin(az) * rim_r
        keep = np.abs(rim_r - np.median(rim_r)) < 2.5 * (np.std(rim_r) + 1)
        ncx, ncy, R = fit_circle(rx[keep], ry[keep])
        moved = math.hypot(ncx - cx, ncy - cy)
        cx, cy = ncx, ncy
        if verbose:
            print(f'rim fit {it + 1}: centre x={cx:.0f} y={cy:.0f}, R={R:.0f} m '
                  f'({keep.sum()}/{len(keep)} crest points, moved {moved:.0f} m)')
        if moved < 0.25 * s:
            break
    crest_h = np.array([prof[i, k[i]] for i in range(len(k))])[keep]
    lat, lon = g.xy_to_latlon(cx, cy)
    return dict(cx=cx, cy=cy, R=R, zmin_smooth=float(zmin), crest_median=float(np.median(crest_h)),
                crest_heights=crest_h, lat=lat, lon=lon, nominal_xy=(px, py))


def crop(g, loc, size, factor=1.4):
    side = factor * 2 * loc['R']
    half = side / 2
    win, r0, c0 = g.window_m(loc['cx'], loc['cy'], half + 4 * g.scale_m)
    win = fill_nans(win)
    out_px = side / (size - 1)
    # pre-smooth when down-sampling to avoid aliasing
    sig = 0.5 * out_px / g.scale_m
    if sig > 0.6:
        win = ndimage.gaussian_filter(win, sigma=sig)
    u = np.linspace(-half, half, size)
    X, Y = np.meshgrid(loc['cx'] + u, loc['cy'] - u)   # row 0 = +y (as in the source raster)
    col, row = g.xy_to_colrow(X, Y)
    H = ndimage.map_coordinates(win, [row - r0, col - c0], order=1, mode='nearest')
    return H, side, out_px


def slope_stats(H, px_m, R_m, ref, vex=1.0, base_px=1):
    """Wall slope (deg) in the annulus between floor and crest."""
    gy, gx = np.gradient(H * vex, px_m * base_px)
    sl = np.degrees(np.arctan(np.hypot(gx, gy)))
    n = H.shape[0]
    u = (np.arange(n) - (n - 1) / 2) * px_m
    r = np.hypot(u[None, :], u[:, None])
    wall = (r > 0.33 * R_m) & (r < 0.98 * R_m)         # floor edge to just below the crest
    return float(sl[wall].mean()), float(np.percentile(sl[wall], 99)), float(sl[wall].max())


def write_outputs(H, meta, outdir):
    os.makedirs(outdir, exist_ok=True)
    hmin, hmax = float(H.min()), float(H.max())
    q = np.round((H - hmin) / (hmax - hmin) * 65535).astype('<u2')
    q.tofile(os.path.join(outdir, 'shackleton_height.u16'))
    try:
        from PIL import Image
        Image.fromarray(q.astype(np.uint16)).save(os.path.join(outdir, 'shackleton_height.png'))
    except Exception as e:  # PNG is a convenience copy; .u16 is authoritative
        print(f'warning: PNG not written ({e})', file=sys.stderr)
    meta.update(height_min_m=hmin, height_max_m=hmax,
                height_step_m=(hmax - hmin) / 65535)
    with open(os.path.join(outdir, 'shackleton_meta.json'), 'w') as f:
        json.dump(meta, f, indent=2)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('dem', nargs='?', help='.LBL / .IMG (PDS3) or .tif (GeoTIFF)')
    ap.add_argument('--standin', action='store_true', help='synthesise the stand-in DEM and ingest it')
    ap.add_argument('--size', type=int, default=513, help='output grid size (default 513)')
    ap.add_argument('--out', default=DATA, help='output directory (default ../data)')
    ap.add_argument('--lon0', type=float, default=0.0, help='GeoTIFF only: central meridian')
    ap.add_argument('--radius-km', type=float, default=1737.4, help='GeoTIFF only: sphere radius')
    ap.add_argument('--height-scale', type=float, default=1.0, help='GeoTIFF only: DN -> metres scale')
    ap.add_argument('--height-offset', type=float, default=0.0, help='GeoTIFF only: DN -> metres offset')
    a = ap.parse_args()

    if a.standin:
        sys.path.insert(0, HERE)
        import make_standin
        raw = os.path.join(LAB, 'raw')
        sys.argv = ['make_standin.py', raw]
        a.dem = make_standin.main()
    if not a.dem:
        ap.error('give a DEM path, or --standin')

    ext = os.path.splitext(a.dem)[1].lower()
    if ext in ('.tif', '.tiff'):
        g = load_geotiff(a.dem, a.lon0, a.radius_km, a.height_scale, a.height_offset)
    else:
        g = load_pds(a.dem)
    print(g.describe)
    loc = locate(g)
    H, side, out_px = crop(g, loc, a.size)
    ref = loc['crest_median']
    H = H - ref                                  # 0 = median rim crest height
    n = a.size
    u = (np.arange(n) - (n - 1) / 2) * out_px
    rgrid = np.hypot(u[None, :], u[:, None])
    floor_level = float(np.percentile(H[rgrid < 0.25 * loc['R']], 10))
    depth = -floor_level
    mean_s, p99_s, max_s = slope_stats(H, out_px, loc['R'], ref)
    # directions (grid frame: +col = +x, +row = -y) for orientation in the page
    to_pole = math.degrees(math.atan2(-loc['cy'], -loc['cx']))  # angle in the (x, y) = (col, -row) frame

    def dir_to(lat, lon):
        tx, ty = g.latlon_to_xy(lat, lon)
        return math.degrees(math.atan2(ty - loc['cy'], tx - loc['cx']))
    meta = dict(
        source='STAND-IN' if g.standin else 'LOLA',
        standin=bool(g.standin),
        source_detail=g.describe,
        source_file=os.path.basename(a.dem),
        generated=datetime.datetime.now(datetime.timezone.utc).isoformat(timespec='seconds'),
        grid_size=n,
        layout='row-major, row 0 = +y (projection), col 0 = -x; uint16 little-endian; '
               'height_m = height_min_m + v/65535*(height_max_m-height_min_m); '
               'heights relative to the median rim crest',
        extent_m=side,
        pixel_m=out_px,
        centre_lat=round(loc['lat'], 4), centre_lon=round(loc['lon'], 4),
        centre_xy_m=[round(loc['cx'], 1), round(loc['cy'], 1)],
        rim_radius_m=round(loc['R'], 1),
        rim_crest_ref_m=round(ref, 1),
        depth_m=round(depth, 1),
        true_wall_slope_deg=dict(mean=round(mean_s, 1), p99=round(p99_s, 1), max=round(max_s, 1)),
        game_scale=dict(rim_radius_m=GAME_RIM_RADIUS_M, horizontal_scale=GAME_RIM_RADIUS_M / loc['R'],
                        true_depth_at_game_scale_m=round(depth * GAME_RIM_RADIUS_M / loc['R'], 2)),
        directions_deg_in_grid=dict(
            note='angle in the (col, -row) plane, 0 = +col, 90 = towards row 0',
            to_south_pole=round(to_pole, 1),
            to_de_gerlache=round(dir_to(-88.5, -87.1), 1),
            to_slater=round(dir_to(-88.1, 111.0), 1)),
    )
    write_outputs(H, meta, a.out)
    print(f"source: {meta['source']}  centre {loc['lat']:.3f}, {loc['lon']:.2f}  "
          f"rim radius {loc['R']:.0f} m  depth {depth:.0f} m")
    print(f'true-scale wall slope: mean {mean_s:.1f} deg, p99 {p99_s:.1f}, max {max_s:.1f}')
    print(f"at game scale: rim radius {GAME_RIM_RADIUS_M} m -> true depth "
          f"{meta['game_scale']['true_depth_at_game_scale_m']} m")
    print(f'wrote {n}x{n} heightmap to {a.out}')


if __name__ == '__main__':
    main()
