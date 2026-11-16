# Shackleton — robot minds (design)

15 Nov 2026. Khal: "the robot friendship side of things is so important… write it into the design document and then start working on it." Later the same day: "they 'love' the astronaut and will do anything to protect him."

## Status

**Stages 1 and 2 are built** (stage 2 in v0.23.0, preview only).

| Version | Commit | What |
|---|---|---|
| v0.22.0 | `ba17c76` | Stage 1 |
| v0.22.1 | `11c32e6` | Devotion and the suit's oxygen warnings |
| v0.22.2 | `5613770` | L-07's spare bottle |
| v0.23.0 | (preview) | Stage 2: sight, investigate, inspect the Flyer, remembered places, affinity from helping |

- **Code:** the `robotMinds` IIFE sits just after `ROBOT_NAMES`. The robot states `mind_walk`, `attend`, `escort`, `lead` and `share` run from `robotMinds.step()` inside `updateRobotCore`.
- **Switches:** `?debug` shows each robot's intention, state and affinity over its head. `?nominds` turns the minds off.

### Devotion (v0.22.1)

Love for Elias is the core value: "protect crew" ranks above the mission. It multiplies every protective score: L-07 1.0, M-08 0.95, P-03 0.85.

- **Lead:** at ≤10% oxygen and more than 8 m from air, one robot walks ahead of him to the nearest oxygen. It waits and calls "come." if he falls more than 7 m behind.
- **Never alone:** if no robot has been within 15 m of him for 12 s, the most devoted free one escorts him. Urgent errands are never taken over by this.
- **Spot:** when he stands more than 2 m up, one comes and stands below him ("careful.").
- **Comfort:** if he stands still for 20 s away from the station, M-08 stands beside him, facing his way ("here.").
- **Greet:** when he comes out of the wreck, the robots nearby come to meet him.

### Suit oxygen warnings (v0.22.1)

| Level | Banner | Sound | HUD |
|---|---|---|---|
| 20% of the tank | "O₂ LOW" (amber) | two-tone beep | gauge pulses |
| 10% of the tank | "O₂ DANGEROUSLY LOW" (red) | alarm every 2 s | red pulse at the screen edges |

The warnings re-arm above 30% and 15%. They don't fire at the station or in the wreck. These are the robots' oxygen alarms too.

### L-07's spare bottle (v0.22.2)

- **When it starts:** only after L-07's first blackout rescue, so the "dragged you :)" scene isn't spoiled. L-07 says "spare. for you." and carries the bottle on its back.
- **What it gives:** one top-up of 15% of the tank. That buys time; it doesn't promise he gets home.
- **When L-07 goes:** at ≤11% oxygen, or as soon as the air he has left won't get him back to the station. It judges this as distance ÷ 2.8 m/s > 0.8 × seconds left, at ≤25%.
- **The hand-over:** L-07 runs to him at about 2.2 m/s, tracking him as he moves. A hose shows during the transfer. L-07 says "air. take." and the suit says "O₂ +15% — from L-07's spare bottle".
- **Refilling:** the bottle's band goes dark when empty. It refills when L-07 passes within 6 m of the O₂ station, and an empty bottle draws L-07 there.

### Stage 2 (v0.23.0)

- **Sight.** A robot reacts only to what it can see: 45 m, with rocks, dunes and the hull blocking the line (eye 1.0 m, his chest 0.8 m). The suit's oxygen alarms go out on the radio, so all three hear those. `robotMinds.sees(i, pos)`.
- **Investigate.** When he puts a part down outside, or solves the ice pocket, the robots that saw it walk over (stopping 1.3 m short), look, and say "hm." / "ok." / "look." They remember what they have looked at. Curiosity drives it.
- **Inspect return path.** A new drive, *restore*: P-03 0.9, M-08 0.6, L-07 0.45. They walk to the Flyer and look it over (3.8 m out before the brace, 2.9 m after). Once the frame holds, P-03 works on it and says "three." (the three missing parts). The repair (`_scene5Finish`) boosts the drive in those that saw it.
- **Keep-clear.** While he carries the brace, the Flyer is a no-go zone (4.6 m) and walks route round it. In general a walk that would clip the Flyer goes round by one waypoint.
- **Remembered places.** Each robot remembers where it saw him fall or nearly run out of air (up to 16 places). If he goes back there, at least 30 s later, the nearest protective robot that remembers comes to his side: "loose." / "careful." / "fell here." (or "air." / "air?"). At most once every 90 s each.
- **Affinity from helping.** Helping him raises affinity: check on him +0.04, spot +0.03, comfort +0.03, greet +0.02, lead him home +0.08, the bottle +0.08. So does him helping them: freeing P-03 +0.3; the brace with M-08 +0.12 (+0.04 the others); wrist-pad questions +0.06. 30% of each gain is lasting (affinity relaxes to a rising base, up to 0.7).
- **Affinity shows.** Fond robots greet more readily, wave when they arrive (affinity > 0.6), and escort closer (2.2 m → about 1.3 m).
- **Fixes.** A greeting or a guard finishes its walk instead of being re-thought after 8 s. A mind walk with no progress for 1.5 s counts as arrived. A lead first walks to him, waits only when it is ahead of him, and catches up (2 m/s) if he outpaces it.
- **Tests (harness):** sight cases; investigate with one robot out of sight; 5-minute mixes (P-03 mostly work and the Flyer, L-07 mostly escort, M-08 mixed; no mind change under 3 s except on events); remembered fall; greet with the hull blocking one robot; low oxygen → lead home from 47 m; brace keep-clear (closest 4.6 m) and "three." after the repair.

### What the tests showed (stage 1)

- The robots spread out to their own jobs.
- Low oxygen: L-07 and M-08 hurry over within about 3 s; P-03 finishes its rock study first.
- When he walks off, L-07 escorts. A lead holds all the way home.
- From about 20 m away, L-07 delivers the bottle (6% → 20%).
- No robot entered a rock during a 30 s walk.

**Fixed along the way:** scripted gestures (`robotEmote`) used to reset a robot to idle, which broke leads and escorts. They no longer do.

### Not built yet

- Robot-to-robot moments, personal job sites with props (stage 3).
- The checking robots don't follow him home after a lead; only the leader does.

## What the script asks for (canon to protect)

- They survived the crash and carry on the original mission "as if nothing happened, because they can't grieve". **They are not tools. The player does not direct them.**
- Their hidden priorities, revealed in memory M08: `crew vital signs detected / mission priority updated / protect crew / restore return path`.
- Presence without words: lower-case fragments, three words at most, no spoilers.
- Signature roles:
  - **L-07** protects ("dragged you :)").
  - **M-08** is the emotional centre: the sculpture, "come.", "mate.".
  - **P-03** is the practical guardian ("ice.", "breathe.", "path.", "clear.").

## The model: drives → intentions → actions

Each robot has a small utility mind. Every 1.5–3 s, or on an event, it scores its intentions and picks the best one, with a +0.15 loyalty bias to what it's already doing. A job can be reconsidered after 8 s. Urgent intentions (share, lead, check on him) are kept until they end. Alarms break into any job.

### Drives

| Drive | Rises when | Falls when |
|---|---|---|
| **Mission** | time passes | it works |
| **Protect crew** | he is far away, alarms | it is near him and he's fine |
| **Curiosity** | something new happens | it has looked (stage 2) |
| **Company** | it is alone | it is near him or a robot |
| **Restore return path** | — | — (stage 2) |

### Personalities

| | Mission | Protect | Curiosity | Company | Devotion |
|---|---|---|---|---|---|
| **P-03** (blue, worker) | **1.0** | 0.75 | 0.8 | 0.45 | 0.85 |
| **L-07** (yellow, protector) | 0.6 | **1.0** | 0.5 | 0.7 | **1.0** |
| **M-08** (red, heart) | 0.7 | 0.85 | 0.6 | **1.0** | 0.95 |

### Intentions

| Intention | What you see | Built |
|---|---|---|
| **work** / **survey** | its own job sites; P-03 at the outcrop, L-07 at the tunnel | yes |
| **escort** | off his shoulder, hurrying when far | yes |
| **check on him** | comes over on an alarm, one word | yes |
| **lead** | walks ahead to the nearest air | yes |
| **share** | L-07 runs over with the spare bottle | yes |
| **spot** | stands below him when he is up high | yes |
| **comfort** | stands beside him when he's still | yes |
| **greet** | meets him out of the wreck | yes |
| **watch** | turns to watch him pick up or jump | yes |
| **visit** | goes to watch another robot | yes |
| **rest** | stands and looks around | yes |
| **refill bottle** | L-07 heads to the station with an empty bottle | yes |
| **investigate** | looks at something that changed | yes (v0.23.0) |
| **inspect return path** | looks over the Flyer; P-03 works on it | yes (v0.23.0) |
| **guard** | back where he fell or ran low: comes to his side | yes (v0.23.0) |

### Words (barks)

At most one robot line every 12 s, the same line not repeated within 2 min, and none during memories.

| Event | P-03 | L-07 | M-08 |
|---|---|---|---|
| hard landing | ok? | careful. / ok? | ok? |
| low oxygen | air. | air. / back. | air? |
| critical oxygen | breathe. | back. now. | air! |
| pickup | good. | heavy? | mine? / good. |
| escort | path. | with you. | come. |
| his return | you. | back. | back. / you. |
| leading | this way. | air. this way. | come. air. |
| he lags | come. | come. hurry. | come. |
| up high | careful. | careful. / down. | high. |
| still | — | here. | here. / with you. |
| bottle | — | air. take. / share. | — |
| looks at a change | hm. | ok. | look. / new. |
| at the Flyer | parts. / three. | — | home? |
| back where he fell | loose. | careful. | fell here. |
| back where air ran low | air. | careful. | air? |

### Guard rails

- Story scenes win (`r.scripted`, `pinned`). The ice pocket is a no-go zone.
- Escort keeps to his shoulder and behind.
- Hurrying (up to 2.2 m/s for the bottle) happens only for him, with the stride rate matched to speed. Otherwise they keep their 0.4 m/s plod.
- Straight lines with rock-avoiding steering; no pathfinding.

## Build stages

1. **Stage 1 and devotion: built.**
2. **Stage 2 (built, v0.23.0):**
   - investigate
   - inspect return path, with its drive
   - line of sight
   - remembered places
   - affinity from helping
3. **Stage 3:**
   - robot-to-robot moments
   - personal job sites with props
4. **Stage 4:** story.
   - M-08's sculpture grows with affinity.
   - The M08 memory replays the minds' own priorities.
   - The fuel-wait scene uses what they're doing.

## Done when

- A tester describes each robot's personality differently, unprompted.
- Robots react visibly to oxygen trouble and falls within a few seconds.
- No puzzle prompt is ever blocked by an idle robot.
- No robot changes its mind more than once every 3 s without an event.
