# Shackleton — demo puzzles v2 (brace and ice pocket)

15 Nov 2026. Built in **v0.21.0** (`73d9c32`).

Khal's verdict: the oxygen stabiliser is OK, but the brace was "no puzzle at all", and the ice pocket was button presses too. We kept the count at three puzzles plus the brace install, and made the two weak ones real.

| # | Puzzle | Kind | Where |
|---|---|---|---|
| 1 | Free P-03 | climbing | crater |
| 2 | Oxygen stabiliser | hands-on fix + close-up panel | wreck, life support |
| 3 | **The brace** | teamwork with M-08, order and load | wreck, cargo bay |
| 4 | **The ice pocket** | light and line of sight | crater, north-west |

The brace install at the Flyer is a scene, not a puzzle.

## The brace: a load puzzle with M-08

Code: `braceV2` IIFE, after the cargo-bay relocation. It keeps the old scene flags: `scene4.pinDone`, `panelDone`, `pulled` and `braceHeld`.

**Set-up.** A heavy hull plate is hinged at the wall and lies over the brace. A fallen cargo-lift ram props its free edge at 16°; the ram is pressurised and locked by a pin. The brace's orange end sticks out from under the plate. M-08 is at the smooth edge, and his claw keeps slipping ("slips.").

**Pieces.**
- Three grip points on the edge:
  - the smooth edge, which slips
  - a visibly bent lug, which snaps under load and is then gone
  - the good lifting lug
- The player asks M-08 to grip one ("ask M-08 to grip …"), and he walks there.
- A blue pressure valve and a yellow locking pin on the ram.
- The small panel, which is the prop.

**Rules.**
- Pull the pin while the ram is pressurised: "pin under load — release the pressure first". Nothing moves.
- Open the valve while M-08 is not on the good lug: the plate drops onto the brace (thump and dust; "no." or "snap."). After about 3.6 s he heaves it back ("again."), the ram re-pressurises, and he goes back to the edge. Nothing is lost except the bent lug.
- **Right order:** grip the lifting lug, then open the valve ("heavy."), then pull the pin. The ram lies down, he lifts the plate to 48° ("up."), and the small panel is now free to move. Stand it on the glowing mark and the plate settles on it at 34°. He lets go, walks to the brace end and pulls it free ("yes." / "strong."). Take the brace; M01 "Hands" fires as before.

**Hints:** the robots' "what now?" goes lug, then valve, then pin, then "under." (`puzzleHintFns`).

**Later fixes (v0.21.1–3):** M-08 has a real lifting pose (`robotStates[2].scripted.lift/strain/slip`). A "prop the plate with the panel" prompt (radius 2.0) puts the panel exactly on the mark, because placing it by hand was nearly impossible on a phone. The brace group stays visible in the wreck (`keep.add(braceV2.group)`).

## The ice pocket: a light puzzle

Code: `iceV2` IIFE, after the old reflector crank (now hidden). It keeps `scene6.power`, `aligned` and `cleared`, then calls `_scene6Check()` as before (M02, range 160).

**Why it works physically.** The sun is 17° up in the east (+x). The ice sits west of a boulder ridge 3.6 m tall, so it stays in real shadow (about 12 m long). The old dome and its fake dark disc are gone. Light gets through only at one gap in the ridge.

**Pieces** (positions relative to `ICE_POCKET`, u = x, v = z):
- The ridge: two runs of boulders at u 0.15–1.15, with a gap at v 1.8–3.0. They have colliders and a textured rock surface (v0.21.1).
- Three footings on the sunlit side:
  - F1 (3.4, 2.5): sun, and a line through the gap. **The right one.**
  - F2 (3.1, −1.2): sun, but the line to the reflector hits the ridge. The mirror starts here, facing the wrong way.
  - F3 (3.0, 6.0): in the shadow of a boulder at (5.6, 6.0), so no sun.
- The survey mirror on a tripod. "Set the mirror up here" moves it to a footing, facing the sun.
- The reflector (the old dish rig) on the shadow side at (−2.0, 3.0). Its motor needs the battery before it can be turned. Default yaw −1.3, so it doesn't start near the answer.
- The regolith chunk sits on the line from the reflector to the ice. It stops the beam until it is carried away.

**Aiming.** "Aim the mirror" or "aim the reflector" enters aim mode: walking is locked (`aimLock`), left/right turns it (A/D, arrow keys or the stick), and E finishes. The beams are drawn live: sun to mirror, mirror to first hit, reflector to first hit, with a glow where each lands. The ray cast is 2-D in the ground plane, against the ridge boxes, the boulder, the reflector, the chunk and the ice.

**Success:** light on the ice for 1.2 s. The crystals brighten as it holds, then P-03 says "ice." / "breathe.", followed by the memory.

**Hints:** sun (go to F1), then mirror, then power, then rock, then ice. The suit's idle hint now says to catch the sun and send it through the gap.

## Still open

- Aim mode on phones uses the stick; still to be tried on a real device.
- The ice pocket might want a second short beat (a second mirror) if testers find it quick.
