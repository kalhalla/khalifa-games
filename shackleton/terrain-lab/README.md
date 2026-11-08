# Shackleton terrain lab

A standalone prototype, separate from the game (`shackleton/index.html` is untouched). It shows what the game crater looks like if its shape comes from NASA's LRO LOLA elevation data of the real Shackleton crater, scaled down to the game crater (rim radius 240 m) and drawn in the house style: flat-shaded `MeshPhongMaterial`, a single harsh low sun, hard shadows, black sky, Three.js r128.

Open `index.html` (on the Vercel preview: `/shackleton/terrain-lab/`). The controls are top-left:

- **depth**: vertical exaggeration, shown as metres and as a multiple of true proportions (about 96 m at this scale). The readout gives the resulting wall slope (mean, max as the 99th percentile, and the absolute peak) and the share of the wall under the **walk limit**. **Tint** marks faces steeper than that limit.
- **triangle size**, **facet roughness**, **terracing**: the low-poly stylisation.
- **sun azimuth/elevation**, **exposure**, **fill (wall bounce)**.
- **small craters**, **boulders**: surface detail added on top of the elevation data.
- Camera presets, plus drag to orbit, right-drag or shift-drag to pan, and the wheel to zoom.

URL parameters set the same values, e.g. `?depth=96&el=3&view=top&ui=0`. `?local` loads `lib/three.min.js` instead of the CDN. This is for offline testing only and `lib/` is gitignored.

## STAND-IN DATA: read this first

The heightmap currently committed in `data/` is **not LOLA data**. `tools/make_standin.py` synthesised it from published measurements of Shackleton:

- 21 km rim diameter, about 4.2 km deep
- interior walls about 30° on average (about 35° on the steepest section)
- a flat, hummocky floor about 6.6 km across, with slump lobes at the foot of the walls
- an irregular raised rim, with ridges running off towards de Gerlache and Slater
- superposed small craters

The page shows an orange "STAND-IN" banner whenever the data comes from this generator. The stand-in is written as a PDS3 `.IMG` + `.LBL` laid out exactly like a LOLA polar product. It goes through the same ingest as the real file, so swapping in real data takes one command.

## Getting the real data

Either of these will do:

1. **PDS LOLA polar gridded DEM (preferred).** `LDEM_875S_20M.IMG` plus its label `LDEM_875S_20M.LBL`, from the LOLA RDR/GDR archive at the PDS Geosciences Node / MIT: `https://imbrium.mit.edu/DATA/LOLA_GDR/POLAR/IMG/`. It is south polar stereographic at 20 m/px. Download **both** the `.IMG` and the `.LBL`. Any other south-polar `LDEM_*S_*M` product whose window contains Shackleton works too.
2. **PGDA GeoTIFF.** NASA GSFC Planetary Geodesy Data Archive (`https://pgda.gsfc.nasa.gov/`), "LOLA south pole 20 m/px DEM" mosaics (`.tif`, polar stereographic metres).

Put the files in `shackleton/terrain-lab/raw/`. That folder is gitignored, because the files are hundreds of MB.

## Running the ingest

Needs Python 3 with `numpy`, `scipy` and `Pillow`. A GeoTIFF also needs `tifffile` (`pip install tifffile --break-system-packages`).

```sh
cd shackleton/terrain-lab
python3 tools/ingest_dem.py raw/LDEM_875S_20M.LBL        # real PDS product
python3 tools/ingest_dem.py raw/<mosaic>.tif             # or a GeoTIFF
python3 tools/ingest_dem.py --standin                    # regenerate the stand-in
```

The script does the following:

1. Reads everything from the PDS label: size, sample type, `SCALING_FACTOR`/`OFFSET`, units, `MAP_SCALE`, projection offsets and radius. The `.IMG` is memory-mapped, so only the window around Shackleton is read.
2. Projects the nominal centre (89.67° S, 129.8° E) with those parameters.
3. Refines the centre from the floor of the deepest bowl nearby.
4. Fits a circle to the rim crest.
5. Crops a square 1.4× the rim diameter.
6. Resamples it to 513×513.

Output, in `data/`:

- `shackleton_height.u16`: raw little-endian uint16, row-major. This is what the page loads, because browsers decode 16-bit PNGs to 8 bits.
- `shackleton_height.png`: the same samples as a 16-bit greyscale PNG.
- `shackleton_meta.json`: source, real extents, min/max height (m, relative to the median rim crest), fitted centre, rim radius, depth, true-scale slope statistics, game scale, and directions to the pole, de Gerlache and Slater.

Commit the three files in `data/` and the page picks them up. The STAND-IN banner disappears on its own, because the label no longer says STANDIN.

GeoTIFF notes: the projection is assumed to be south polar stereographic centred on the pole with R = 1737.4 km. Override with `--lon0` / `--radius-km` if the file differs, and use `--height-scale` / `--height-offset` if the samples are not in metres.

A note on the nominal position: at 89.67° S the crater centre is about 10 km from the pole, not about 3.7 km. The pole sits on the rim. The script computes this from the label, and the refine step finds the crater anyway.

## What is data and what is stylisation

| Element | Source |
|---|---|
| Bowl shape, rim, floor, slumps, ridges, craters larger than about 100 m (real) | heightmap (currently the stand-in; LOLA once ingested) |
| Vertical exaggeration | the depth control |
| Facet crumple, terracing | stylisation, at triangle scale |
| Small craters (1–26 m at game scale), boulders | stylisation (seeded, deterministic) |

## Files

- `index.html`: the lab page (single file).
- `tools/ingest_dem.py`: the DEM to heightmap pipeline.
- `tools/make_standin.py`: the stand-in generator.
- `data/`: the current heightmap and its metadata.
- `shots/`: reference screenshots, rendered headless with SwiftShader.
