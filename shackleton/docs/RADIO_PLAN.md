# Shackleton — robot radio and question menu (v1, built 14 Nov 2026)

**Status:** approved by Khal and built in **v0.19.0** (commit `98ff532`). Live since 14 Nov.

**Decisions:**
- Elias asks by typing on his wrist pad, never by voice.
- Helmet radio only; the floating comic bubbles are gone.
- It has been **two days** since the crash (new canon).

It follows `SCRIPT.md`: Elias never speaks, the robots speak only in lower-case fragments, and Michel can never hear him.

## The rule this protects

The script's ending depends on Elias having no voice. In Scene 30 he keys the mic and only breathing comes out. So:

- **Elias asks with his suit, not his voice.** The wrist pad sends short typed queries over a short-range data link. They appear as `PAD ▸ …` radio lines and are never spoken aloud.
- **The robots answer on the helmet radio.**
- **Nothing in the menu can address Michel.** His long-range transmitter stays broken until Scene 30.

## 1. Helmet radio (built)

- **All voices arrive as radio lines** under the objective, each tagged with the sender: L-07 yellow, M-08 red, P-03 blue, Michel (`HOUSTON`) white, the suit pale blue, the pad grey.
- **Michel's broken lines** (those containing "...") flicker with static.
- **Robot voice:** a tone pattern of about one note per word, with its own timbre per robot. L-07 is a soft sine, M-08 a low slow triangle, P-03 a quick clipped square. Questions and ":)" rise at the end. Robots are never given TTS voices.
- **Presence:** the speaking robot's eyes brighten and swell for a moment. If it is off screen, an arrow on the line points towards it.

## 2. Question menu (built)

### How it works

- **Prompt:** near a robot (within 3 m), with nothing else in reach, `ask L-07` appears on the usual E/tap prompt.
- **Choices:** the wrist pad shows `what now?` plus up to two fresh questions. Pick by tap or with keys 1–3; Esc closes it.
- **Reply:** the robot turns to face you and answers in one to three fragments, with a gesture.
- **Stock:** each question can be asked once per robot. `what now?` can always be asked.
- **Closing:** the pad closes if you walk away (more than 5 m) or a memory, cinematic or level change starts.

### Questions

| Query | Unlocks | L-07 | M-08 | P-03 | Gesture |
|---|---|---|---|---|---|
| `what now?` (repeatable) | start | one word for the objective: `P-03.` / `wreck.` / `flyer.` / `ice.` / `air.` (P-03 itself says `stuck.` while pinned) | same | same | taps chest, points at the objective |
| `who are you?` | start | `L-07.` / `yours.` | `M-08.` | `P-03.` / `cutting.` | faces you |
| `where am I?` | start | `moon.` / `shackleton.` | `crater.` | `deep.` | points up and out towards the rim |
| `what happened?` | start | `fell.` | `loud.` | `hull.` / `open.` | points at the wreck |
| `who am I?` | start | `crew.` | `ours.` | `you.` | taps own chest, points at you |
| `how long?` | start | `two days.` | `two.` | `48 hours.` | faces you |
| `the voice?` | after any Michel line | `calling.` | `far.` | `earth.` | hand up to the sky |
| `can we leave?` | after the brace is fitted | `almost.` | `home?` | `parts.` | points at the Flyer |

Not in the demo yet:
- `did you save me?` (needs the Scene 7 blackout rescue).
- `who is Michel?` (needs the Scene 10 terminal log). Answers before the Scene 27 reveal: `voice.` / `far.` / `calling.`

### Rules for answers

- No answer reveals what a memory reveals. Never "brother", "Elias Saba", "crash", "abort" or the child before the matching memory or transmission.
- Three words at most; each robot stays in character.

## 3. Code map

`ROBOT_QUERIES`, `openWristPad`, `askRobot`, `_objectiveHint`, `robotChirp`, `radioDirMark` and `updateWristPad` sit just above `robotCues`. Radio styling is the `HELMET RADIO` CSS block. Robot "ask" candidates are added at the end of `_gatherCandidates`, only when no other actionable candidate is in reach. `processSpeech` tags lines and skips TTS for `robot` and `pad`. Gestures use `robotEmote`, which gained a `face` kind (turn to face, no arm movement).
