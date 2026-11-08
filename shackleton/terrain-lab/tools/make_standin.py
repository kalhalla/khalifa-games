#!/usr/bin/env python3
"""
make_standin.py - synthesise a STAND-IN LOLA-style DEM of Shackleton crater.

This is NOT real data. It builds a raster from published measurements of
Shackleton (lunar south pole) and writes it as a PDS3 .IMG + detached .LBL
pair laid out like a LOLA polar gridded product (south polar stereographic,
20 m/px, int16 heights with SCALING_FACTOR/OFFSET). The point is that the
stand-in goes through exactly the same ingest pipeline (ingest_dem.py) as
the real LDEM file, so swapping in real data is one command.

Published figures the shape is built from:
  * rim crest diameter ~21 km, rim-to-floor depth ~4.2 km
  * near-axisymmetric simple bowl; interior walls ~30 deg average, ~35 deg max
  * small flattish floor ~6.6 km across, hummocky, with slump/landslide
    mounds at the foot of the walls
  * slightly raised, irregular rim; ridges running off the rim towards
    de Gerlache and Slater craters
  * superposed small craters on walls and exterior
  * centre ~89.67 S, 129.8 E

Usage:  python3 make_standin.py OUTDIR
"""
import math
import os
import sys

import numpy as np
from scipy import ndimage

R_MOON_KM = 1737.4
SCALE_M = 20.0                      # metres per pixel
NPIX = 2400                         # 48 km square
CENTRE_LAT, CENTRE_LON = -89.67, 129.8
DE_GERLACHE = (-88.5, -87.1)
SLATER = (-88.1, 111.0)

RIM_R = 10500.0                     # rim crest radius (m)
DEPTH = 4100.0                      # rim crest to floor (m)
FLOOR_FRAC = 3300.0 / RIM_R         # floor radius as fraction of rim radius
CREST_H = 230.0                     # mean crest height above surrounding plain (m)

# The synthetic crater is deliberately offset from the nominal lat/lon so
# that ingest_dem.py's centre refinement is exercised (it must find it).
TEST_OFFSET_M = (260.0, -190.0)


def south_polar_xy(lat_deg, lon_deg, lon0=0.0, r_km=R_MOON_KM):
    """South polar stereographic (LOLA/PDS convention), metres."""
    rho = 2.0 * r_km * 1000.0 * math.tan(math.radians(90.0 + lat_deg) / 2.0)
    lam = math.radians(lon_deg - lon0)
    return rho * math.sin(lam), rho * math.cos(lam)


def value_noise(shape, cell_px, rng):
    """Smooth random field ~N(0,1) with feature size ~cell_px pixels."""
    gh = int(math.ceil(shape[0] / cell_px)) + 4
    gw = int(math.ceil(shape[1] / cell_px)) + 4
    g = rng.standard_normal((gh, gw))
    z = ndimage.zoom(g, cell_px, order=3, mode='wrap')
    z = z[:shape[0], :shape[1]]
    return z / (z.std() + 1e-9)


def wall_profile_lut():
    """Normalised rim-to-floor curve g(t), t=0 at floor edge, 1 at crest.

    Built from a slope shape s(t): soft toe (debris apron), steepest in the
    upper-middle wall, rounding over at the crest. Scaled so mean slope is
    (by construction) the average 30 deg; peak ~1.2x mean -> ~35 deg.
    """
    t = np.linspace(0.0, 1.0, 2001)
    ss = lambda e0, e1, x: np.clip((x - e0) / (e1 - e0), 0, 1) ** 2 * (3 - 2 * np.clip((x - e0) / (e1 - e0), 0, 1))
    s = ss(0.0, 0.16, t) * (0.95 + 0.12 * t) * (1.0 - 0.85 * ss(0.93, 1.0, t))
    g = np.concatenate([[0.0], np.cumsum((s[1:] + s[:-1]) * 0.5 * (t[1] - t[0]))])
    g /= g[-1]
    return t, g


def smooth01(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def build(seed=7):
    rng = np.random.default_rng(seed)
    cx, cy = south_polar_xy(CENTRE_LAT, CENTRE_LON)
    cx += TEST_OFFSET_M[0]
    cy += TEST_OFFSET_M[1]

    # Grid placement: the window is NOT centred on the crater (tests the
    # label's projection offsets). Projection x of column j, y of row i.
    x0 = cx - 21000.0                 # x at column 0
    y0 = cy + 26000.0                 # y at row 0 (rows go -y)
    cols = np.arange(NPIX)
    rows = np.arange(NPIX)
    X = x0 + cols[None, :] * SCALE_M
    Y = y0 - rows[:, None] * SCALE_M
    dx = X - cx
    dy = Y - cy
    r = np.hypot(dx, dy)
    th = np.arctan2(dy, dx)

    # ---- irregular rim: radius and crest height vary with azimuth
    ph = rng.uniform(0, 2 * np.pi, 8)
    rim_r = RIM_R * (1 + 0.018 * np.sin(2 * th + ph[0]) + 0.011 * np.sin(3 * th + ph[1])
                     + 0.007 * np.sin(5 * th + ph[2]) + 0.004 * np.sin(9 * th + ph[3]))
    crest = CREST_H * (1 + 0.35 * np.sin(th + ph[4]) + 0.25 * np.sin(4 * th + ph[5])
                       + 0.15 * np.sin(7 * th + ph[6]))

    # Ridges off the rim: directions from the crater towards de Gerlache, Slater
    ridges = []
    for (lat, lon), height, width in ((DE_GERLACHE, 620.0, 2600.0), (SLATER, 430.0, 2200.0)):
        tx, ty = south_polar_xy(lat, lon)
        ridges.append((math.atan2(ty - cy, tx - cx), height, width))
    for ang, height, width in ridges:
        dth = np.angle(np.exp(1j * (th - ang)))
        crest += height * 0.9 * np.exp(-(dth / 0.16) ** 2)   # rim raised where a ridge leaves

    rn = r / rim_r
    t_lut, g_lut = wall_profile_lut()
    floor_h = CREST_H - DEPTH
    h = np.empty_like(r)

    inside = rn < 1.0
    t = np.clip((rn - FLOOR_FRAC) / (1.0 - FLOOR_FRAC), 0, 1)
    g = np.interp(t, t_lut, g_lut)
    h_in = floor_h + (crest - floor_h) * g
    # exterior: ejecta blanket falls away from the crest
    h_out = crest * np.clip(rn, 1, None) ** -5.0
    h[:] = np.where(inside, h_in, h_out)

    # regional tilt: Shackleton sits on the flank of a broad high
    h += 0.012 * (dx * 0.6 - dy * 0.8)

    # ridges: crest lines running out from the rim, meandering slightly
    meander = value_noise(r.shape, 400, rng)
    for ang, height, width in ridges:
        ux, uy = math.cos(ang), math.sin(ang)
        along = dx * ux + dy * uy
        cross = -dx * uy + dy * ux + 900.0 * meander
        a = along - RIM_R
        w = width + 0.06 * np.clip(a, 0, None)
        prof = height * np.exp(-(cross / w) ** 2) * np.exp(-np.clip(a, 0, None) / 16000.0)
        prof *= smooth01((along - RIM_R * 0.92) / (RIM_R * 0.15))   # starts at the crest
        h += prof

    # ---- slump lobes: alcove scar high on the wall + debris lobe at the foot
    for ang, scale in ((0.6, 1.0), (2.75, 0.8), (4.45, 1.15)):
        dth = np.angle(np.exp(1j * (th - ang)))
        # alcove: arcuate scar on the upper wall
        alc = np.exp(-(dth / 0.16) ** 2) * np.exp(-((rn - 0.84) / 0.10) ** 2)
        h -= 170.0 * scale * alc * inside
        # lobe: tongue of debris from the wall foot out on to the floor
        lobe_r = 0.36 + 0.10 * np.exp(-(dth / 0.12) ** 2)
        lobe = np.exp(-(dth / 0.24) ** 2) * np.exp(-((rn - lobe_r) / 0.085) ** 2)
        lumps = 1.0 + 0.25 * value_noise(r.shape, 45, rng)
        h += 260.0 * scale * lobe * lumps

    # ---- hummocky floor
    floorw = 1.0 - smooth01((rn - FLOOR_FRAC * 0.8) / (FLOOR_FRAC * 0.6))
    h += floorw * (25.0 * value_noise(r.shape, 40, rng) + 12.0 * value_noise(r.shape, 15, rng))
    for _ in range(34):
        rr = FLOOR_FRAC * RIM_R * math.sqrt(rng.uniform(0, 1.1))
        aa = rng.uniform(0, 2 * np.pi)
        sx, sy = cx + rr * math.cos(aa), cy + rr * math.sin(aa)
        sig = rng.uniform(130, 420)
        amp = rng.uniform(18, 70)
        _add_window(h, X, Y, sx, sy, 3 * sig, lambda d: amp * np.exp(-(d / sig) ** 2))

    # ---- wall texture: faint downslope ribs, broad irregularity
    wallw = smooth01((rn - FLOOR_FRAC) / 0.1) * (1 - smooth01((rn - 0.97) / 0.06))
    rib = value_noise((r.shape[0], r.shape[1]), 25, rng)
    ribs = np.sin(th * 46 + 2.0 * value_noise(r.shape, 200, rng))
    h += wallw * (6.0 * ribs * (0.5 + 0.5 * rib))

    # ---- multi-scale roughness everywhere
    h += 70.0 * value_noise(r.shape, 200, rng)
    h += 12.0 * value_noise(r.shape, 50, rng)
    h += 4.0 * value_noise(r.shape, 18, rng)
    h += 1.5 * value_noise(r.shape, 6, rng)

    # ---- superposed small craters (power-law sizes)
    n_cr = 700
    u = rng.uniform(0, 1, n_cr)
    dmin, dmax = 100.0, 3200.0
    diam = dmin * (1 - u * (1 - (dmin / dmax) ** 2)) ** -0.5   # N(>D) ~ D^-2
    span = NPIX * SCALE_M
    for D in diam:
        sx = x0 + rng.uniform(0, span)
        sy = y0 - rng.uniform(0, span)
        rr = math.hypot(sx - cx, sy - cy) / RIM_R
        fresh = rng.uniform(0.25, 1.0)
        if 0.35 < rr < 0.97:
            fresh *= 0.55                     # wall craters degrade fast
        rc = D / 2

        def crater(d, D=D, rc=rc, fresh=fresh):
            q = d / rc
            inner = D * (0.20 * (q * q - 1.0) + 0.04)
            outer = 0.04 * D * np.clip(q, 1, None) ** -3.0 * (1 - smooth01((q - 2.0) / 1.0))
            return fresh * np.where(q < 1, inner, outer)
        _add_window(h, X, Y, sx, sy, 3 * rc, crater)

    return h, dict(x0=x0, y0=y0, cx=cx, cy=cy)


def _add_window(h, X, Y, sx, sy, rad, fn):
    xs = X[0]
    ys = Y[:, 0]
    j0 = max(0, int((sx - rad - xs[0]) / SCALE_M))
    j1 = min(len(xs), int((sx + rad - xs[0]) / SCALE_M) + 2)
    i0 = max(0, int((ys[0] - (sy + rad)) / SCALE_M))
    i1 = min(len(ys), int((ys[0] - (sy - rad)) / SCALE_M) + 2)
    if j0 >= j1 or i0 >= i1:
        return
    d = np.hypot(xs[None, j0:j1] - sx, ys[i0:i1, None] - sy)
    h[i0:i1, j0:j1] += fn(d)


LABEL = """PDS_VERSION_ID               = PDS3
/* STAND-IN, SYNTHETIC. Not LOLA data. Generated by make_standin.py from   */
/* published measurements of Shackleton crater, laid out like a LOLA polar */
/* gridded product so that ingest_dem.py treats it exactly like the real   */
/* LDEM file.                                                              */
RECORD_TYPE                  = FIXED_LENGTH
RECORD_BYTES                 = {rec}
FILE_RECORDS                 = {lines}
^IMAGE                       = "{img}"
DATA_SET_ID                  = "STANDIN-SYNTHETIC-NOT-LOLA"
PRODUCT_ID                   = "SHACKLETON_STANDIN_20M"
TARGET_NAME                  = MOON

OBJECT                       = IMAGE
  NAME                       = HEIGHT
  DESCRIPTION                = "Synthetic stand-in heights. Not real data."
  LINES                      = {lines}
  LINE_SAMPLES               = {samples}
  MAXIMUM                    = {dnmax}
  MINIMUM                    = {dnmin}
  SAMPLE_TYPE                = LSB_INTEGER
  SAMPLE_BITS                = 16
  UNIT                       = METER
  SCALING_FACTOR             = 0.5
  OFFSET                     = 1737400.
  MISSING_CONSTANT           = -32768
END_OBJECT                   = IMAGE

OBJECT                       = IMAGE_MAP_PROJECTION
  ^DATA_SET_MAP_PROJECTION   = "DSMAP_POLAR.CAT"
  MAP_PROJECTION_TYPE        = "POLAR STEREOGRAPHIC"
  A_AXIS_RADIUS              = 1737.4 <KM>
  B_AXIS_RADIUS              = 1737.4 <KM>
  C_AXIS_RADIUS              = 1737.4 <KM>
  FIRST_STANDARD_PARALLEL    = 'N/A'
  SECOND_STANDARD_PARALLEL   = 'N/A'
  POSITIVE_LONGITUDE_DIRECTION = "EAST"
  CENTER_LATITUDE            = -90. <DEG>
  CENTER_LONGITUDE           = 0. <DEG>
  REFERENCE_LATITUDE         = 'N/A'
  REFERENCE_LONGITUDE        = 'N/A'
  LINE_FIRST_PIXEL           = 1
  LINE_LAST_PIXEL            = {lines}
  SAMPLE_FIRST_PIXEL         = 1
  SAMPLE_LAST_PIXEL          = {samples}
  MAP_PROJECTION_ROTATION    = 0.0 <DEG>
  MAP_SCALE                  = {scale} <METERS/PIXEL>
  LINE_PROJECTION_OFFSET     = {lpo} <PIXEL>
  SAMPLE_PROJECTION_OFFSET   = {spo} <PIXEL>
  COORDINATE_SYSTEM_TYPE     = "BODY-FIXED ROTATING"
  COORDINATE_SYSTEM_NAME     = "MEAN EARTH/POLAR AXIS OF DE421"
END_OBJECT                   = IMAGE_MAP_PROJECTION
END
"""


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else '.'
    os.makedirs(out, exist_ok=True)
    h, geo = build()
    dn = np.clip(np.round(h / 0.5), -32767, 32767).astype('<i2')
    img = 'SHACKLETON_STANDIN_20M.IMG'
    dn.tofile(os.path.join(out, img))
    # PDS: x = (SAMPLE - SPO - 1) * scale ; y = (1 - LINE + LPO) * scale
    # column j is SAMPLE j+1, so x0 = -SPO*scale ; row i is LINE i+1, y0 = LPO*scale
    spo = -geo['x0'] / SCALE_M
    lpo = geo['y0'] / SCALE_M
    with open(os.path.join(out, 'SHACKLETON_STANDIN_20M.LBL'), 'w') as f:
        f.write(LABEL.format(rec=NPIX * 2, lines=NPIX, samples=NPIX, img=img,
                             dnmax=int(dn.max()), dnmin=int(dn.min()),
                             scale=f'{SCALE_M:.1f}', lpo=f'{lpo:.3f}', spo=f'{spo:.3f}'))
    print(f'stand-in written to {out}: {NPIX}x{NPIX} @ {SCALE_M} m/px, '
          f'h {h.min():.0f}..{h.max():.0f} m')
    return os.path.join(out, 'SHACKLETON_STANDIN_20M.LBL')


if __name__ == '__main__':
    main()
