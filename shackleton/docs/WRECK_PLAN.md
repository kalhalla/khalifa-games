# Shackleton — wreck interior: plan, puzzles, room order

13 Nov 2026. Describes the wreck level blockout as of v0.9.1 (`?wreck2=in`). Since then (v0.20.0) the breach was replaced by an airlock: see `HANDOVER.md`.

## How the level is laid out

The interior is a separate level at `WL_ORIGIN`, loaded with a fade when you use the hatch. The ship lies on its side, so you walk along its length. Design units are multiplied by `WL_K = 1.5` in plan: 63 m long, 9.2 m wide. Rooms run in one line, joined by 2.55 m doorways in the bulkheads.

| Room | Size (m) | What is there | Camera |
|---|---|---|---|
| S0 Breach | 10.5 × 9.2 | The rip in the hull, way in and out. Fallen locker. | Fixed |
| S1 Corridor | 15 × 4.5 | Fallen deck plates narrow the route. Debris to step over. Sideways ladder overhead. | Rail, slides with you |
| S2 Life support | 12 × 9.2 | Puzzle A, oxygen stabiliser. | Fixed |
| S3 Cargo bay | 16.5 × 9.2 | Puzzle B, structural brace. Crates, one climbable. | Fixed |
| S4 Crew quarters | 7.8 × 9.2 | Personal locker (memory site). Bunks on the wall. | Fixed |
| S5 Tail | — | Sealed bulkhead, engine bay beyond. | — |

## Puzzles

Both puzzles come from `SCRIPT.md`. The brace was redesigned in v0.21.0: see `PUZZLES_V2.md`.

### Puzzle A — Oxygen stabiliser (Scene 3, life support)

- **Set-up:** on entering, the suit reports "signal detected / source: internal emergency reserve". A damaged stabiliser cabinet, one emergency light blinking.
- **Three actions, any order:** clear the debris off it, seat the loose battery, reconnect the cable.
- **Result:** lamp goes green, hum starts, "O₂ stabilised / range increased". In the build, oxygen capacity rises from 50 to 120. Michel's Transmission 01 follows, mostly static.
- **Purpose:** teaches pick up, carry, place. Buys the range to reach the rest of the crater.

### Puzzle B — Structural brace (Scene 4, cargo bay)

- **Set-up:** the brace is trapped under hull plating. M-08 is already there trying to lift it, and one claw keeps slipping.
- **Three actions:** move the locking pin, release the pressure, clear the smaller panel. M-08 then grips properly and pulls the brace free ("yes." / "strong.").
- **Result:** "ship part recovered: STRUCTURAL BRACE". Memory Fragment 01 "Hands" fires on pickup.
- **Purpose:** first cooperation with a robot, first ship part, first memory.

### Crew quarters — memory site, no puzzle

**Decided 13 Nov:** the personal locker is the site of Fragment 08 "What happened" (the crash from the robots' view). The script already puts M08 in the wreck interior, and only during the fuel wait near the end. So in the demo the locker is **dormant**: it is visibly his, it can be looked at, and the suit answers "memory: unavailable", echoing the opening HUD. No fragment is moved from its scripted trigger.

The nine fragments and their triggers, for reference:

| # | Title | Fires when |
|---|---|---|
| M01 | Hands | Structural Brace picked up (wreck, cargo bay) |
| M02 | Cold room | First ice extracted (ice pocket) |
| M03 | The tunnel | Nav Core recovered |
| M04 | Circle | Looking at M-08's sculpture |
| M05 | The argument | Power Relay recovered (central peak) |
| M06 | Impact | Control CPU recovered |
| M07 | Brother | Coming down from the rim with the CPU |
| M08 | What happened | Back in the wreck during the fuel wait (crew-quarters locker) |
| M09 | Unfinished | Launch pressed, before ignition |

The demo slice (Scenes 1–6) contains M01 and M02 only.

## Room re-order and upright-ship reading

**Accepted by Khal 13 Nov. Built in v0.9.2.**

### Problem with the old order

Stood upright, the old order from the top was: breach, corridor, life support, cargo, crew quarters, engines. Crew quarters next to the engines makes no sense. Crew live at the nose; cargo sits low, near the ground.

### Accepted order, nose to tail

1. **Flight deck (new).** Nose. Seats bolted to what is now the wall, facing "up" toward the nose. The radio that Transmission 01 comes from. Crushed at the far end.
2. **Crew quarters.** Moved forward from the tail end. Bunks on the wall, personal locker (dormant M08 site).
3. **Life support.** Puzzle A. Unchanged.
4. **Airlock and suit bay (new).** The way in. Suit racks, the O₂ refill point's indoor twin.
5. **Cargo bay.** Puzzle B. The cargo lift rail runs along the floor toward the tail.
6. **Tank dome / engine bay.** Sealed for the demo.

Two further rooms are possible later (galley/wardroom, workshop for the robots' charging frames) but would add build time without a scripted scene to justify them.

Consequence for play: the player enters mid-ship at the airlock. Puzzle A is one room toward the nose, Puzzle B one room toward the tail.

### The "designed to lie down" fiction

The ship was meant to be tipped over after landing and become the first habitat. It crashed part-way through that plan. So:

- **Converted rooms** (life support, airlock) have the habitat floor panels deployed. Tidy, walkable, lit.
- **Unconverted rooms** (flight deck, crew quarters, cargo) are still in flight layout, now sideways. Chaos.

### Artefacts that show it once stood upright

- Bulkheads are the old decks: round hatch openings with a ladder passing through them, now lying horizontal.
- Deck numbers and "UP" arrows stencilled sideways on the walls.
- Flight seats and bunks bolted to the wall.
- Stowed floor panels on the hull side labelled for deployment after tip-over.
- Everything loose has fallen to the same side: lockers hang open with their contents in a drift along one wall.
- A fold-down table hanging from the "ceiling" with its chairs still clipped to it.
- The cargo lift rail running the length of the floor.

## Decisions

1. Room re-order and the two new rooms (flight deck, airlock and suit bay): **yes** (13 Nov).
2. "Designed to lie down, crashed half-converted" fiction: **yes** (13 Nov).
3. Crew-quarters locker: **M08 site, dormant in the demo** (13 Nov).
4. No breach. The airlock is the only way in and out: from inside you only see the inner hatch, from outside only the outer one (15 Nov).
5. Red light in rooms with no power; a room goes white when it is fixed (15 Nov).
