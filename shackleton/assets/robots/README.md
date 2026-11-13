# Robot models — drop-in GLBs

Upload a robot here and it replaces the built-in robot the next time the page loads. No code change needed.

| File      | Robot | Colour |
|-----------|-------|--------|
| `L07.glb` | L-07  | yellow: single forward gripper (right), empty pauldron (left) |
| `M08.glb` | M-08  | red: two three-finger claws |
| `P03.glb` | P-03  | blue: drill (left arm), circular saw (right arm) |

**How to upload:** GitHub → `shackleton/assets/robots/` → *Add file → Upload files* → commit. Vercel deploys it.

## Meshy export

- Format **GLB**. Target **5–10k triangles**: it should read as low-poly, not sculpted.
- Robot **facing the front view** (Meshy's default front). The game turns it to face its walking direction.
- Size and position don't matter. The game scales each model to the height of the robot it replaces and stands it on the ground.
- Textures are fine. Materials are converted to the game's flat, matte look.

## Optional: moving arms

A single-mesh model moves as one rigid body; it still bobs as it walks. If you split each arm off as its own object named **`arm_L`** and **`arm_R`** (in Blender, or in Meshy if it allows), the game attaches them to the robot's existing arm joints so they swing.

## Collision (props and wreck pieces, not robots)

Any object in a GLB whose name starts with **`COL_`** is invisible and becomes a solid box the player bumps into, sized from that object's bounding box. You can stand on it if it's low enough to step onto; add `_nowalk` to the name (`COL_pipe_nowalk`) to stop that.

Open the game with `?debug&colliders` to see every collider drawn in magenta.

If a file is missing or fails to load, the game silently keeps the built-in robot. Delete the GLB to roll back.
