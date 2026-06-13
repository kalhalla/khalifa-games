# Moonforge: Phase 1 Prototype

A browser-only Three.js prototype for a low-poly lunar industrial logistics game.

## Goal

Build enough lunar industry to launch the first aluminium payload by mass driver.

## Included

- Large low-poly Moon terrain
- Craters, resource patches, Earthrise and stars
- Base starter habitat
- Solar arrays, excavators, ice harvesters, oxygen plant, aluminium refinery and mass driver
- Resource production loop
- Mission checklist
- Payload launch animation
- Simple WASD/QE camera controls

## Run locally

Because this uses ES module imports, run it from a local server rather than double-clicking the HTML file.

From this folder:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Build order suggestion

1. Solar Array
2. Excavator
3. Ice Harvester
4. Oxygen Plant
5. Aluminium Refinery
6. More Solar Arrays
7. Mass Driver
8. Launch payload

## Next phase ideas

- Manual placement with ghost previews
- Proper roads/cables/pipes
- Power consumption rather than static power
- Lunar night / battery challenge
- Orbital construction yard scene
- Data centre assembly after first launch
