# SHACKLETON — Memory Fragment System Spec v1

A data-driven sequence player for Elias's nine memory fragments. Built once. Reused for all of them. Designed so adding fragment ten is one data entry, not one engineering project.

(The fragment data itself, `MEMORY_FRAGMENTS`, now lives inside `index.html`.)

---

## 1. What a fragment is

A timed sequence of beats that plays over the running world. The world keeps simulating underneath — robots keep working, the sun stays where it is, the synthesiser keeps producing fuel. Player input is suspended. Camera holds. The astronaut stands inside himself.

A fragment fires exactly once per save. After firing, its trigger is dead.

A fragment is defined entirely by data. Adding a new memory means adding an entry to a list. No bespoke code per fragment.

---

## 2. The data shape

```js
{
  id: 'M01_HANDS',          // unique key, also the fired-flag name
  title: 'Hands',           // for debug/dev only, never shown
  beats: [
    { ...beat },
    { ...beat },
    ...
  ]
}
```

The whole fragment registry is an object keyed by id:

```js
const MEMORY_FRAGMENTS = {
  M01_HANDS: { ... },
  M02_COLD_ROOM: { ... },
  ...
};
```

The fired set is just a `Set<string>` of ids. Initially empty.

---

## 3. Beat types

Five beat types, deliberately small. Each beat is `{ type, ...fields }`.

### `flash`
Full-screen colour wash, fast in, slow out. Used to open a fragment.

```js
{ type: 'flash', color: '#ffffff', inMs: 150, holdMs: 200, outMs: 600 }
```

### `text`
Display one or more lines, attributed to a speaker. Text fades in line-by-line. Total duration is either explicit or derived (see §5).

```js
{
  type: 'text',
  speaker: 'michel',          // see §4
  lines: [                    // each line fades in separately
    "You always force it.",
    "Let the tool do the work."
  ],
  voice: 'michel/m01_hands.ogg',  // optional. see §6
  holdMs: 3500                // ignored if voice present
}
```

A text beat with `lines: ['again.', 'not tighter.', 'cleaner.']` and `speaker: 'ambient'` produces three short fragments fading in one after another, no voice, character-count timing.

### `wait`
Silent gap.

```js
{ type: 'wait', ms: 800 }
```

### `fade`
Fades the overlay out over `ms`. Always the final beat. After fade ends, input resumes.

```js
{ type: 'fade', ms: 1200 }
```

### `audio`
Plays a one-shot on a named channel. Used sparingly — most audio comes from voice within text beats. Useful for ambient sweeteners (a heartbeat, a kitchen kettle, the alarm in M06).

```js
{ type: 'audio', file: 'sfx/memory_alarm.ogg', channel: 'sfx', volume: 0.6 }
```

---

## 4. Speakers

A speaker tag controls visual styling and audio routing. Six speakers cover everything in the script:

| tag | use | style |
|---|---|---|
| `ambient` | residue text, no quoted dialogue (e.g. *again. / not tighter. / cleaner.*) | italic, dim white, smaller, centred |
| `michel` | Michel's spoken lines | normal, white, quoted, centred |
| `supervisor` | the agency colleague's lines (M02, M03, M05) | normal, soft grey, quoted |
| `child` | Michel's child's lines (M04, M05, M07, M09) | small caps, warm soft tone |
| `priority` | robot internal priority text (M08 only) | monospace, robot-yellow, smaller |
| `robot` | robot text fragments inside memory (M08) | matches in-world robot text style |

Visual styling specifics get tuned at desktop. The point of the tag is that they're consistent and themable.

---

## 5. Timing rules

Two timing modes for text beats. Whichever produces the longer duration wins, so a fragment never feels rushed:

**Voice mode.** Beat has a `voice:` field. Duration = audio file length + 600ms post-roll. Lines fade in proportionally to the audio's progress.

**Character-count mode.** No voice. Duration = `max(holdMs, charBased)` where `charBased = totalChars * 50ms + lines.length * 400ms`. Roughly 200 words per minute reading rate, with extra hold per line break.

Minimum line hold is 800ms even for one-word lines. Single-word ambient fragments ("again.") need to *land*.

Flash is fixed-timing — never voice-driven.

---

## 6. Audio integration

The fragment system assumes four audio channels: `music`, `sfx`, `voice`, `ambient`. While a fragment plays:

- `music` fades to 0 over 400ms at fragment start, returns over 800ms after `fade` beat
- `sfx` ducks to 30% — footsteps and machine sounds still present, just quieter
- `ambient` (drones, low world hum) ducks to 50%
- `voice` plays at full volume — both Michel transmissions on the radio and memory voice files share this channel

Memory voice files route to `voice` like Michel's transmissions do. They're the same kind of thing — Elias hearing his brother — and should have the same prominence.

If `voice:` references a file that doesn't exist yet, the beat falls back to character-count timing silently. This means we can wire the entire fragment system before any voice is recorded, and recordings slot in later without touching data.

---

## 7. Triggers

Triggers are *not* part of fragment data. The fragment data describes *what plays*. The trigger describes *when*. Keeping them separate means we can swap triggers, add debug commands, or fire fragments from anywhere without rewriting the fragment.

Three trigger types are needed across the nine fragments:

### `item_acquired`
Fires when a named ship part enters Elias's inventory. Fragments M01, M03, M05, M06.

### `proximity_dwell`
Fires when the player is within radius `r` of point `p` for cumulative time `t`. Fragments M02, M04, M08.

The cumulative is important for M04 (Circle): "if the player looks at the sculpture for a few seconds." Walking past doesn't fire it. Stopping and looking does.

### `event`
Explicit fire from another system. Fragments M07 (custom condition: descending from rim while carrying CPU), M09 (launch button pressed, before ignition).

### The wiring rule
Triggers all resolve to one call:

```js
fireFragment('M01_HANDS');
```

`fireFragment` is the only public entry point. It checks the fired set, sets the flag, kicks the playback. Trigger conditions live next to the gameplay site they belong to — proximity for the sculpture lives in the sculpture entity, event for launch lives in the launch handler.

| Fragment | Trigger |
|---|---|
| M01_HANDS | item_acquired: STRUCTURAL_BRACE |
| M02_COLD_ROOM | event: first_ice_extracted |
| M03_TUNNEL | item_acquired: NAV_CORE |
| M04_CIRCLE | proximity_dwell: sculpture, radius 4, 3000 ms |
| M05_ARGUMENT | item_acquired: POWER_RELAY |
| M06_IMPACT | item_acquired: CONTROL_CPU |
| M07_BROTHER | event: descending_from_rim_with_cpu |
| M08_WHAT_HAPPENED | proximity_dwell: wreck_interior, radius 6, 1500 ms, requires waiting_moment_active |
| M09_UNFINISHED | event: launch_pressed_pre_ignition |

---

## 8. Player input during a fragment

Input is fully suspended for the fragment's duration. Movement keys do nothing. The astronaut stands. The camera holds its current position and rotation.

The world itself does not pause. Robots keep moving on their paths. Footsteps and ambient continue (ducked). The fuel synthesiser keeps producing. Houston transmissions are queued — if a Michel transmission would have triggered during a memory, it fires the moment the memory ends.

Mobile-only consideration: any on-screen control buttons hide during a fragment.

---

## 9. The public API

```js
shackletonMemory.fire(id)           // play if not fired; idempotent if fired
shackletonMemory.hasFired(id)       // boolean check
shackletonMemory.firedSet()         // returns Set<string> for save serialisation
shackletonMemory.restoreFired(set)  // restore from save
```

Internal: `_play(fragment)`, `_blockInput()`, `_releaseInput()`, `_duckAudio()`, `_restoreAudio()`, the beat dispatcher.

---

## 10. Visual treatment

While a fragment plays, the world gets a soft overlay:

- 35% opacity black wash, fades in over 600ms at fragment start
- mild desaturation of the world view (CSS filter or shader, ~50% saturation)
- slight blur (3-4px) — the world becomes the *background* of the memory

Text renders on top of this overlay, centred, with generous margin. Lines fade in with a 200ms cross-fade. They do not slide. They do not animate. They appear, hold, and the next one fades in over the previous.

The flash beat sits *over* the overlay — full-screen white, then fading to reveal the dimmed world and the first text.

The fade beat reverses everything: text fades, overlay fades, world returns to full saturation, input returns.

This is intentionally simple. Good memory beats are about silence and pause, not transitions.

---

## 11. Persistence

Per-fragment fired flags persist across save/load. The save system is not built yet, so for v0 the fired set lives in memory only — restart the game, fragments re-fire.

When save/load lands, `firedSet()` and `restoreFired()` are the only hooks needed.

---

## 12. Failure modes and edge cases

- **Voice file missing.** Silent fallback to character-count timing. Logs a warning to console. Game does not stall.
- **Player dies during fragment.** Death is suppressed for the fragment's duration. Oxygen drain pauses. The L-07 rescue in scene 7 is its own flow and never collides with a fragment.
- **Trigger fires during another fragment.** Queue. Play after current fragment ends.
- **Trigger fires during launch sequence.** M09 (Unfinished) is the only memory designed to fire during launch, and it fires *before* ignition. After ignition, all fragment triggers are disabled.
- **Player skips a fragment.** Not allowed in v1. Fragments play through. Reconsider only if playtesting shows accessibility issues.

---

## 13. What this spec deliberately doesn't decide

- **Font choice for memory text.** Tune at desktop with a real screen.
- **Exact dim/blur values.** Same.
- **Whether ambient drone *also* ducks or is replaced by a memory-specific drone.** Try both; commit later.
- **Voice processing for memory lines.** Whether memory-Michel sounds different from radio-Michel is a recording-time decision. The data shape supports either.
- **Subtitling.** Currently text *is* the visual. If we ever want voice-only with separate subtitle toggling, the text beat needs a `subtitleOnly` flag.
