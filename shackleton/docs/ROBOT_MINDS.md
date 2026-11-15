# Shackleton — robot minds (design)

15 Nov 2026. Khal: "the robot friendship side of things is so important… write it into the design document and then start working on it." Later the same day: "they 'love' the astronaut and will do anything to protect him."

## Status

**Stage 1 plus devotion is built.**

| Version | Commit | What |
|---|---|---|
| v0.22.0 | `ba17c76` | Stage 1 |
| v0.22.1 | `11c32e6` | Devotion and the suit's oxygen warnings |
| v0.22.2 | `5613770` | L-07's spare bottle |

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

### What the tests showed

- The robots spread out to their own jobs.
- Low oxygen: L-07 and M-08 hurry over within about 3 s; P-03 finishes its rock study first.
- When he walks off, L-07 escorts. A lead holds all the way home.
- From about 20 m away, L-07 delivers the bottle (6% → 20%).
- No robot entered a rock during a 30 s walk.

**Fixed along the way:** scripted gestures (`robotEmote`) used to reset a robot to idle, which broke leads and escorts. They no longer do.

### Not built yet

- The "restore return path" drive (stage 2).
- The line-of-sight check on events; every robot hears every event.
- No-go zones beyond the ice pocket.

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
| **investigate** | looks at something that changed | stage 2 |
| **inspect return path** | looks over the Flyer or a found part | stage 2 |

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

### Guard rails

- Story scenes win (`r.scripted`, `pinned`). The ice pocket is a no-go zone.
- Escort keeps to his shoulder and behind.
- Hurrying (up to 2.2 m/s for the bottle) happens only for him, with the stride rate matched to speed. Otherwise they keep their 0.4 m/s plod.
- Straight lines with rock-avoiding steering; no pathfinding.

## Build stages

1. **Stage 1 and devotion: built.**
2. **Stage 2:**
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
