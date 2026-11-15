# SHACKLETON — Full Script v1

Canon. Later decisions that change details: the wreck is entered through an airlock, not a rip (15 Nov 2026); it has been two days since the crash (14 Nov 2026); the hull reads KHAL, not Starship (15 Nov 2026).

## The truth at the centre

The astronaut is **Elias Saba**, mission lead for a small lunar construction mission at Shackleton. The mission was to prove that a crater could become a self-sustaining foothold — ice, power, fuel, launch. It was politically marginal: contested funding, an unfashionable destination, no obvious champion in the agency. Elias was the believer. His older brother **Michel Saba**, flight director, fought for Elias's place because Elias was the only person willing to commit to a project most people had already written off. They are Palestinian, both born to a community whose ordinary trips home are themselves a small act of will.

The crash happened during descent after a guidance failure and manual correction. Michel, on console, urged Elias to abort to a holding orbit. Elias didn't. He landed because he was Elias and the work was the point. He survived because the robots pulled him from the wreck and continued the original mission around him. He has no memory because of impact trauma and oxygen deprivation. The robots have been rebuilding not because they understand grief, but because their final mission priority is simple: **keep Elias alive, complete the return vehicle, send him home.**

Elias never speaks because the transmitter is damaged at first; later, when it could be repaired, he still cannot answer. He has remembered enough to know who Michel is, but not enough to explain what happened, what was lost, or why he is still alive. The game ends before resolution. He crosses the rim. Michel never hears his voice. Home is not a place the game shows. It is a direction across a horizon. There is a niece or nephew waiting, who calls him Uncle Elias.

That is the core ache.

Michel speaks but cannot be heard.
The robots do not speak, but they are present.
Elias says nothing, but the player understands him.

---

## Mechanical story loop

```text
Wake with low oxygen.
Explore within short range.
Enter wreck.
Stabilise oxygen.
Find Structural Brace.
Reach first ice pocket.
Extend range.
Repair comms relay.
Hear Michel clearly.
Begin rebuilding Flyer.
Recover Nav Core from tunnel.
Recover Power Relay from central peak.
Restore fuel chain.
Recover Control CPU from rim path.
Return to rebuild site.
Install final part.
Fuel rises.
Wait.
Launch.
Cross rim.
Cut to black.
```

---

## Voice rules

### Elias / Astronaut
Silent. No spoken lines. No inner monologue. No subtitles. The player reads his condition through movement, HUD, memory fragments, and the world.

### Michel Saba
Human voice. Tired. Understated. Older brother who fought for Elias's place on this mission and now wonders if he should have. Speaks like someone who has been awake too long and is trying not to fall apart. He does not know Elias is alive for most of the game.

### Robots
Sparse text fragments only. Lower-case. No full sentences except rarely. They do not explain themselves.

**L-07** — yellow, gripper. Gentle, practical.
```text
steady.
found you.
dragged you :)
hold.
almost.
```

**M-08 / M-8** — red, two claws. Protective, oddly ceremonial. Builds the sculpture.
```text
come.
look.
made.
us.
home?
```

**P-03** — blue, drill / saw. Focused, industrious. Closest to a working dog.
```text
cutting.
ice.
deep.
clear.
path.
```

### Supervisor (memory only)
A senior agency colleague present in pre-mission planning memories. Skeptical of the mission but eventually backed Elias because Michel did. Voice from the planning room. Heard in M02, M03, M05.

### The child (memory only)
Michel's child, Elias's niece or nephew. Heard in M04, M05, M07, and one final fragment. Calls him *Uncle Elias.*

---

## Ship parts

### 1. Structural Brace
- **Location:** Wreck interior
- **Mechanical meaning:** Flyer frame is bent and cannot withstand thrust.
- **Visual install:** One side of the frame visibly straightens. M-08 clamps; P-03 welds.
- **Unlocked:** Rebuild site becomes active.

### 2. Nav Core
- **Location:** Tunnel / Memory Palace
- **Mechanical meaning:** Flyer can launch but cannot navigate or stabilise.
- **Visual install:** Cockpit instruments flicker on. Partial route lock.
- **Unlocked:** Central Peak memory marker becomes active.

### 3. Power Relay
- **Location:** Central Peak
- **Mechanical meaning:** Routes stored power to thruster ignition and fuel systems.
- **Visual install:** Four thruster pods get faint yellow status lights.
- **Unlocked:** Fuel chain can be brought online fully.

### 4. Control CPU
- **Location:** Rim Path; carried back down
- **Mechanical meaning:** Master controller. Without it, the Flyer cannot accept launch sequence.
- **Visual install:** Top strobe pulses. The Flyer wakes as one system.
- **Unlocked:** Final fuel fill / launch readiness.

---

## Progression script

### Scene 1 — Wake Site

**Visual.**
Black screen. Faint red pulse. Suit HUD flickers. Regolith close to visor. Breathing thin, distorted. The astronaut lies face-down.

**HUD text:**
```text
O₂: 10%
suit pressure: unstable
transmit: offline
memory: unavailable
```

**Audio.**
No music. Breathing. Tiny suit alarms. Vacuum silence.

**Player input.**
First input is not "move". It is "push up". Astronaut gets one elbow under himself, slips slightly, pushes again, rises to knees, then stands.

**Camera reveals:** the Starship wreck on its side, broken hull, debris, the crater wall, central peak silhouette in the distance, three robots working as if nothing has happened.

**Robot beat.**
L-07 turns and looks at the player.

```text
!
```
Then:
```text
found you.
```

L-07 returns to work.

**Objective:**
```text
find oxygen
```

No explanation yet.

---

### Scene 2 — Short range

**Reachable area.** Wake site, wreck exterior, immediate debris field.

**Oxygen behaviour.** Drains quickly outside safe range. Walking too far turns the HUD amber, then red.

**HUD warning:**
```text
range unstable
return to wreck
```

**Player discovers** a broken suit refill point near the wreck entrance. Not fully working.

**M-08 behaviour.** Moving debris with claws. Pauses when the player passes, turns its red eye toward him, then resumes.

```text
careful.
```

This should feel slightly odd. The robot is not just working. It is watching.

---

### Scene 3 — Wreck entrance

**Visual.** Hull torn open. Interior dark. Hard black shadow inside. Loose panels. One faint emergency light still blinking.

**Objective:**
```text
enter the wreck
```

**Inside HUD:**
```text
signal detected
source: internal emergency reserve
```

The player restores a damaged oxygen stabiliser by reconnecting a cable, aligning a battery, and clearing debris.

**On success:**
```text
O₂ stabilised
range increased
```

Range expands from roughly **40–70m** to **100–150m**.

**Michel — Transmission 01, faint / static.**

Barely audible. Mostly static.

```text
...Shackleton...
...
Elias?
...
if anyone...
...
respond...
```

The player cannot respond.

**HUD:**
```text
receive: unstable
transmit: offline
```

---

### Scene 4 — Structural Brace

**Location.** Wreck interior, partially collapsed cargo section.

**Puzzle.** The Brace is trapped under hull plating. M-08 is already there, trying to lift it but failing because one claw slips. Player moves a locking pin, releases pressure, clears a smaller panel. M-08 grips the brace properly and pulls it free.

```text
yes.
```
Then:
```text
strong.
```

**Item acquired:**
```text
ship part recovered:
STRUCTURAL BRACE
```

**Memory Fragment 01 — "Hands"**

White flash. Sound drops. The lunar scene overlays with a warm Earth memory.

Two hands tightening a bolt on a training rig. One hand younger, one older. A voice laughs off-screen.

Memory text fragments, not spoken by Elias:
```text
again.
not tighter.
cleaner.
```

Then Michel's voice, from memory, younger and warmer:

```text
You always force it. Let the tool do the work.
```

Flash ends. No explanation.

---

### Scene 5 — First return to Flyer Rebuild Site

**Visual.** Flyer visible early but useless: open-frame, leaning, one side visibly buckled. L-07 is tidying parts into little rows. P-03 is cutting damaged tubing. M-08 waits near the frame.

**Objective:**
```text
install structural brace
```

**Install animation.** Player places brace. M-08 clamps. P-03 welds. L-07 holds a work light. Frame straightens slightly.

P-03:
```text
hot.
```

L-07:
```text
hold.
```

M-08:
```text
good.
```

**System:**
```text
Flyer frame stabilised
3 parts missing
```

**Michel — Transmission 02, still broken.**

```text
...Elias, this is Michel...
...
we are still calling...
...
if your receiver survived...
...
do not try to climb yet...
```

The warning cuts out before explaining why.

---

### Scene 6 — First Ice Pocket

**Location.** Permanent shadow pocket in crater wall, just beyond earlier range.

**Visual.** The sunlit crater is white and grey. The shadow pocket is almost black. Blue ice crystals glow faintly in the darkness.

**Oxygen pressure.** Player barely reaches it. HUD edges red on arrival.

P-03 is already there, drilling slowly.
```text
ice.
```
Then:
```text
breathe.
```

**Puzzle.** Player must direct power from a portable battery, rotate a reflector, and clear regolith from an exposed crystal so the suit extractor can process ice.

**On success:**
```text
ice deposit active
oxygen refill available
range increased
```

Range expands to roughly **160–200m**.

**Memory Fragment 02 — "Cold room"**

A cold lab. Ice sample in a glovebox. Elias and Michel behind glass.

Michel:
```text
If we can breathe from this, we can build from it.
```

Supervisor, dry:
```text
That's your pitch?
```

Michel:
```text
That's the whole Moon.
```

Supervisor, after a pause:
```text
And the only person who'll fly it is your brother.
```

Memory ends.

---

### Scene 7 — L-07 rescue (only triggers on first oxygen blackout)

**Visual.** HUD red. Breathing ragged. Sound narrows. Player collapses.

Black screen. Faint mechanical footsteps. Dragging sound. Screen fades back in near a safe oxygen point. L-07 stands nearby.

```text
dragged you :)
```

Then L-07 walks away as if embarrassed by nothing.

**Design note.** Confirms the robots are protective, but quietly. Should not become a comic failure loop. Happens rarely and softly.

---

### Scene 8 — Relay climb

**Location.** Ridge / upper crater wall.

**Requirement.** First ice pocket active.

**Visual.** Player climbs beyond the original safe circle. Central peak visible the whole way. Comms dish on ridge, partly collapsed. The climb should make the crater feel large.

**HUD:**
```text
signal strength increasing
```

Static pulses. Michel becomes clearer as the player approaches.

**Michel — Transmission 03, approaching relay.**

```text
Shackleton relay is still showing intermittent power.

That makes no sense.

If the array is alive, something down there is keeping it alive.

Elias, if that is you...

No. Sorry.

If anyone is receiving this, get to the ridge relay.
```

He corrects himself because he does not want to hope.

---

### Scene 9 — Repairing the comms relay

**Puzzle.** Three steps:

1. Clear dust from dish mechanism.
2. Reconnect power line.
3. Align dish toward Earth using audio / signal strength.

P-03 may be nearby cutting a jammed support strut.

```text
clear.
```

**On alignment:**
```text
receive: online
transmit: damaged
```

Player sees:
```text
TX PATH: BROKEN
MIC INPUT: UNAVAILABLE
```

This explains silence mechanically for now.

**Michel — Transmission 04, first clear voice.**

```text
This is Michel.

Shackleton surface relay just came up.

I don't know who did that.

I don't know if I'm talking to a suit recorder, a maintenance bot, or a ghost.

But if you can hear me, listen carefully.

Do not attempt launch.

You need power, guidance, fuel, and a control path.

One missing link and that Flyer tears itself apart.

Start with the rebuild site.
```

**Objective:**
```text
return to Flyer rebuild site
```

---

### Scene 10 — Instructions unlock

At the comms relay terminal, the player can read basic mission instructions.

**Terminal text:**
```text
SHACKLETON ISRU RETURN TEST
priority chain:

1. stabilise crew
2. recover return vehicle frame
3. restore navigation
4. route power
5. process ice
6. synthesise fuel
7. launch from rim-safe vector
```

Some lines corrupted.

**Optional log fragment:**
```text
crew count: [corrupted]
mission lead: E. SABA
flight director: M. SABA
```

The player probably does not yet understand the names.

---

### Scene 11 — Return to rebuild site after comms

Michel can now issue practical guidance when the player approaches the Flyer.

**Michel — Transmission 05.**

```text
The Flyer was designed ugly for a reason.

Open frame. Four pods. Nothing clever.

If the brace is in, good.

Next you need guidance.

Nav Core should have been in the survey package. If the manifest is right, it went down with the west tunnel cache.

Shackleton wall. Shadow side.

You'll know it when you see it.
```

**Objective:**
```text
find Nav Core in tunnel cache
```

---

### Scene 12 — Tunnel Mouth / Memory Palace

**Location.** Crater wall tunnel.

**Requirement.** Expanded oxygen range + Michel instruction.

**Visual.** Tunnel mouth dark but artificial — cut into the wall, not natural. Inside: hand-shaped geometry, cables, old markers, rough construction.

M-08 patrols outside but does not enter at first. P-03 enters ahead.

```text
deep.
```

**Tunnel design.** First chamber is practical. Deeper chambers become stranger: stored equipment, mission markings, personal objects, regolith drawings, partial memory projections.

**Michel — Transmission 06, at tunnel entrance.**

```text
That tunnel was your idea.

You said the crater wall was a better archive than any server.

No atmosphere. No weather. No rot.

You said, "If we build it here, it remembers."

I told you that was sentimental.

You said, "Good."
```

The player still cannot respond.

---

### Scene 13 — Nav Core puzzle

**Puzzle.** The Nav Core is inside a locked survey crate. The code is not numerical; it is spatial.

The player aligns three wall markers in the tunnel so their shadows form the mission emblem — a circle of robot and human figures. This is the first "memory palace" puzzle: location and memory combine.

**On success:** crate opens.

**Item acquired:**
```text
ship part recovered:
NAV CORE
```

**Memory Fragment 03 — "The tunnel"**

Pre-crash tunnel. Elias, Michel on comms, robots new and cleaner. Elias laughs silently in the memory — we hear Michel, but not Elias.

Michel:
```text
You're really putting personal memory markers in a construction tunnel?

You realise that is not in the grant application.
```

Supervisor:
```text
Let him have it. It's the only poetry he gets.
```

Michel:
```text
Fine. Officially: geological indexing marks.

Unofficially: your little moon diary.
```

Memory ends.

---

### Scene 14 — M-08 hand scene setup

As the player exits the tunnel with the Nav Core, M-08 is waiting outside. It does not block the route. It extends one claw.

```text
come.
```

If the player walks away, M-08 waits. If the player follows, it leads them slowly to a small alcove behind boulders, off the direct route.

No music at first.

---

### Scene 15 — M-08 sculpture

**Location.** Hidden alcove near tunnel / mid-crater boulder field.

**Visual.** A small sculpture made from stacked regolith stones, scrap metal, and tiny coloured fragments.

Five figures stand in a circle holding hands:

- astronaut
- yellow robot
- red robot
- blue robot
- one smaller human figure, ambiguous

The sculpture is crude but careful. M-08 stands beside it.

```text
made.
```

Long pause.

```text
us.
```

The player can stay as long as they want.

**Memory Fragment 04 — "Circle"**

Triggered only if the player looks at the sculpture for a few seconds.

Earthside training room. Three robots in diagnostic frames. Elias placing coloured tape on each robot: yellow, red, blue.

A small child's hand places a sticker on M-08: a tiny star.

The child, certain:
```text
This one is the brave one.
```

Michel, amused:
```text
They're construction units.
```

Child:
```text
No. This one is brave.
```

Memory cuts.

This introduces the smaller figure without explaining who they are.

**M-08 final text for this scene:**
```text
home?
```

Then it walks back to work.

This is the first clear heartbreak beat.

---

### Scene 16 — Installing Nav Core

**Location.** Flyer Rebuild Site.

**Install animation.** Player inserts Nav Core into cockpit housing. Instruments flicker. A dim map of the crater appears.

**System:**
```text
navigation partial
route lock unavailable
2 parts missing
```

**Michel — Transmission 07.**

```text
Good. Guidance is waking up.

I'm seeing a partial return path in the old sim data.

You still need power routing.

There should be a relay module in the high survey kit.

Central peak.

You always wanted the best view for the important things.
```

**Objective:**
```text
reach central peak
recover Power Relay
```

---

### Scene 17 — Approach to Central Peak

The Central Peak has been visible from the start. The player may have approached earlier; upper slopes were oxygen-expensive, unstable, or unrewarding. Now Michel's restored instructions activate the summit marker.

**HUD:**
```text
survey cache signal detected
```

P-03 is on lower rocks, cutting footholds or clearing a narrow ledge.

```text
path.
```

The player still climbs themselves. P-03 does not become a tool; it has simply been working there.

---

### Scene 18 — Summit

**Visual.** The crater opens below. Wreck. Flyer site. Ice pockets. Relay. Tunnel. Rim path. The player sees the whole game-world at once. Earth visible low in black sky.

**Michel — Transmission 08.**

```text
You used to call that peak the pulpit.

I hated that.

You said every base needs one place where a person can stand and decide whether the work was worth it.

So.

If you are there...

I hope it was.
```

**Item.** Power Relay is in a survey case wedged between rocks.

**Item acquired:**
```text
ship part recovered:
POWER RELAY
```

**Memory Fragment 05 — "The argument"**

Mission planning room. Elias and Michel at a table. Supervisor across from them, papers.

Supervisor:
```text
You don't have to send him yourself.

We can re-list the mission for next year. Find someone else.
```

Michel, quiet:
```text
He does have to go.

There isn't anyone else.
```

Supervisor:
```text
You backed him.

You know what people are saying.
```

Michel:
```text
I know what they're saying.

Back him anyway.
```

The child's voice, from another room:
```text
Will you see Earth from there?
```

Michel, gentler, to the child:
```text
He'll see all of us.
```

Memory ends.

This establishes that Michel fought for Elias when nobody else would, and that the mission was politically marginal. The supervisor is dubious but not hostile.

---

### Scene 19 — Installing Power Relay

**Location.** Flyer Rebuild Site.

**Install animation.** Power Relay slides into side panel. Cables light up. Four thruster pod indicators pulse yellow.

**System:**
```text
power routing restored
ignition path incomplete
1 part missing
```

**Michel — Transmission 09.**

```text
Power looks good from here.

I mean — if those readings are real.

I'm getting returns from the fuel chain now.

Solar, battery, processor, synthesiser.

One of them is still out.

You need the whole chain.

No shortcuts, Elias.

Sorry.

No shortcuts, whoever you are.
```

He slips and says Elias again, then corrects himself.

**Objective:**
```text
restore fuel chain
```

---

### Scene 20 — Solar Array

**Location.** Right side of crater floor.

**Puzzle.** Several panels misaligned or dust-covered. L-07 is trying to wipe one clean with its gripper.

```text
dust.
```

Player aligns the panels toward fixed sun.

**System:**
```text
solar array online
```

Michel:
```text
Solar first. Always solar first.

If the array is awake, route it to storage before you touch the processor.
```

---

### Scene 21 — Battery Bank

**Puzzle.** Batteries physically intact but one connection severed. M-08 holds the cable ends apart, preventing sparking.

```text
hold.
```

Player locks breaker, inserts fuse, reroutes cable.

**System:**
```text
battery bank online
```

M-08:
```text
safe.
```

---

### Scene 22 — Processor

**Puzzle.** Processor accepts ice but is jammed. P-03 cuts open a blocked intake.

```text
cutting.
```

Player clears fragments and restarts.

**System:**
```text
processor online
```

Michel:
```text
Processor should sound wrong before it sounds right.

If it screams, kill power.

If it hums, let it hum.
```

---

### Scene 23 — Synthesiser

**Puzzle.** The synthesiser needs three inputs:

- stored power
- processed ice
- routing from processor
- Power Relay installed

The player connects the final line.

**System:**
```text
synthesiser online
fuel production pending
```

But it does not start fully.

**HUD:**
```text
launch controller missing
```

Michel:
```text
Fuel chain is ready.

But the Flyer won't accept it without the master controller.

Control CPU.

It was in the rim path emergency kit.

That path is not safe without full oxygen.

Do not climb it unless you can come back.
```

**Objective:**
```text
recover Control CPU from rim path
```

---

### Scene 24 — Rim Path climb

**Requirement.** Maximum oxygen range, second ice deposit, restored systems.

**Visual.** Most exposed route. No cosy machines. No wreck. No shelter. Just hard rock, black sky, and the rim above.

Robots do not all follow. One may be visible far below, watching. M-08 appears at the base, looks up.

```text
far.
```
Then:
```text
come back.
```

This is one of the few times robot text should feel like a plea.

---

### Scene 25 — Second Ice Deposit / final oxygen extension

If needed, the rim path includes a last permanent-shadow pocket.

**Visual.** Blue ice in near-total darkness. Player must activate it to make the return safe.

**System:**
```text
oxygen range near-full
crater access unlocked
```

This is the point where the open world finally becomes fully open.

---

### Scene 26 — Rim cache

**Location.** Near the rim path, before the final crossing.

**Puzzle.** The emergency kit is pinned under collapsed rock. Unlike previous puzzles, the robots are not physically present. The player must solve this one alone.

This matters: the final part is recovered by Elias, not for him.

**Item acquired:**
```text
ship part recovered:
CONTROL CPU
```

**Memory Fragment 06 — "Impact"**

Descent. Alarms. Starship interior. Shaking. The robots secured in racks. Elias strapped in. The seat next to him is where the robot rack is — a structural cage, not a person.

Michel, through comms, controlled but afraid:

```text
Shackleton, you are drifting long.

Elias, correct now.

Do you copy?

Correct now.
```

Then, lower:

```text
You can still come home.
```

Alarms peak. White flash. Memory ends.

---

### Scene 27 — Last view from near rim

**Visual.** Player stands just below the rim. They can almost leave on foot, but they cannot. The Flyer is the way out. The crater lies below.

**Michel — Transmission 10.**

```text
I'm going to say this because there's nobody here to stop me.

Elias was my brother.

If any part of this system is still recording, log that he did his job.

Log that he got them down.

Log that we kept calling.

That's all.
```

This is the first explicit reveal that Michel is his brother. *Got them down* refers to the robots — Elias landed his crew safely even though he didn't land safely himself.

The astronaut still does not speak.

**HUD pulse:**
```text
memory integrity rising
```

---

### Scene 28 — Memory Fragment 07: "Brother"

Triggered as the player starts descending back from the rim with the Control CPU.

Earth. Night before launch. Michel and Elias alone in a kitchen.

Michel:
```text
You know I'll be the one on console.
```

Pause.

```text
So don't make me say all the official things.
```

Elias is silent in memory too. We never hear him.

Michel:
```text
Just come back.
```

A child's voice from another room:
```text
Uncle Elias?
```

Memory cuts before we see them clearly.

---

### Scene 29 — The return walk

The player now has the final part but must descend back to the Flyer Rebuild Site.

No new objective spam. Just:
```text
return to the Flyer
```

Music: barely there. Maybe two notes.

Oxygen no longer a major threat if the final ice pocket is active. The crater is open.

The player passes:

- Central Peak
- Memory Palace
- Wreck
- M-08 sculpture if they choose
- Ice deposits
- Robots working

This is the game giving them space before the end.

---

### Scene 30 — Install Control CPU

**Location.** Flyer Rebuild Site.

All three robots gather, but not theatrically. They arrive because they have work to do.

**Install animation.** Player inserts Control CPU. The Flyer wakes fully. Lights move through the frame:

- brace lock
- nav core
- power relay
- thrusters
- control CPU
- fuel line

**System:**
```text
Flyer control online
fuel intake ready
launch sequence locked
```

Then:
```text
transmit path repair available
```

The player can interact with a damaged transmitter module. Optional but heavily implied.

**Objective:**
```text
repair transmitter
```

The repair is simple: connect a module, align a cable, press test.

**On repair:**
```text
transmit: online
```

Michel is calling.

**Michel — Transmission 11.**

```text
Surface relay just changed state.

I have uplink.

I have downlink.

If someone is there...

if you can hear me...

key your mic.
```

Player is given an interaction prompt:
```text
hold to transmit
```

When held, the astronaut raises hand to chest control. The transmit light turns green.

No voice comes out. Only breathing.

Michel:
```text
Hello?

I can hear...

No. Say again.

Please say again.
```

The player can hold again. Still nothing.

**No HUD text.** No system message. No *voice input: none*. Just the green light, the breath, the carrier tone, and Michel's silence on the other side.

Michel, after a long pause:
```text
It's all right.

Whoever you are.

It's all right.
```

This is the emotional lock. Do not overdo it.

---

### Scene 31 — Fuel synthesis begins

Player activates synthesiser feed.

**System:**
```text
fuel production active
estimated fill: rising
```

Fuel line glows slowly from synthesiser to Flyer.

Flyer fuel gauge begins:
```text
FUEL 03%
FUEL 04%
FUEL 05%
```

It fills over several real minutes.

**Michel does not speak.** Silence belongs here.

**Objective:**
```text
wait for fuel
```

A few seconds later:
```text
or walk
```

Then objective fades. The player is free.

#### Things the player can do during waiting

##### 1. Sit near the Flyer

If the player stops moving near the Flyer, the astronaut slowly sits. Robots gather at a respectful distance.

L-07:
```text
almost.
```

P-03:
```text
warm.
```

M-08:
```text
home?
```

No answer.

##### 2. Return to wreck

At the wreck, final optional memory triggers.

**Memory Fragment 08 — "What happened"**

Crash aftermath, but from robot perspective. Low angle. Dust. Elias unconscious. Oxygen warning. Robots damaged but active.

Their internal priority text flickers visually, not spoken:

```text
crew vital signs detected
mission priority updated
protect crew
restore return path
```

L-07 drags Elias from the wreck.
M-08 clears debris.
P-03 cuts through a bent support.

The robots place Elias in shadow near emergency oxygen. The memory ends with the three robots standing over him.

Text fragments overlap:

```text
found you.
hold.
breathe.
```

This reveals that they saved him at the start, before he knew they cared.

##### 3. Visit M-08 sculpture

If the player returns to the sculpture during the waiting moment, M-08 is already there.

It has added one tiny object: a small rocket made of scrap, placed beside the circle.

```text
go.
```

Pause.

```text
us.
```

This should hurt.

---

### Scene 32 — Fuel complete

**System:**
```text
fuel complete
launch sequence available
```

All three robots turn toward the Flyer.

Michel returns for final practical instruction.

**Michel — Transmission 12.**

```text
Flyer fuel is reading full.

Control path is green.

Nav is ugly, but it's enough.

Launch vector should clear the rim if you hold steady.

Once you cross it, relay contact will probably drop.

I don't know what happens after that.
```

Pause.

```text
I'm still here.
```

No reply.

**Objective:**
```text
board the Flyer
```

---

### Scene 33 — Boarding

The player climbs into the Flyer. Playable and simple. No cutscene yet.

The three robots stand below.

L-07:
```text
steady.
```

P-03:
```text
clear.
```

M-08:
```text
mate.
```

This is the only time M-08 uses *mate*. It should be ambiguous: designation, joke, affection.

HUD wakes.

```text
brace: locked
nav: online
power: online
control: online
fuel: full
transmit: online
launch: ready
```

Prompt:
```text
press to launch
```

No countdown unless player triggers it.

---

### Scene 34 — Final memory and final transmission

When the player presses launch but before ignition, one last memory triggers — brief, partial, the unfinished sentence.

**Memory Fragment 09 — "Unfinished"**

The child's voice. Closer this time. Not from another room.

```text
When you come back, we're going to —
```

Memory cuts.

The launch button glows.

**Michel — Transmission 13.**

```text
Shackleton, this is Michel.

If you can hear me...

you are go for launch.
```

Pause. His voice breaks slightly but he contains it.

```text
Come home.
```

No music yet.

---

### Scene 35 — Launch

The Flyer rises. Brief. Controlled. Not cinematic excess.

Dust kicks up. Robots become smaller. The wreck falls away. The central peak slides below. The rim approaches.

The player may have slight control, but not enough to fail. The launch is earned; do not punish now.

Michel, faint as relay geometry changes:

```text
Signal is dropping.

Shackleton, I'm losing you.

I'm losing—
```

Cut before the sentence completes.

The Flyer crosses the rim.

**Cut to black immediately.**

No reveal beyond rim. No starscape escape shot. No destination.

---

### Credits

Black screen. Silence for several seconds. Then either very sparse music or no music.

After a long delay, fade in:

```text
SHACKLETON
```

Then credits. No epilogue.

---

## Robot signature moments

### L-07
**Moment:** Rescues Elias after oxygen blackout.
```text
dragged you :)
```
Function: establishes protection with warmth.

### M-08 / M-8
**Moment:** Takes Elias by the hand to the sculpture.
```text
come.
made.
us.
home?
```
Later, at launch:
```text
mate.
```
Function: emotional centre of robot relationship.

### P-03
**Moment:** Opens ice and cuts paths.
```text
ice.
breathe.
path.
clear.
```
Function: practical guardian, the one making the crater traversable.

---

## Final design note

The strongest thing here is the asymmetry:

**Michel has words but no presence.**
**The robots have presence but almost no words.**
**Elias has neither words nor memory at first.**

By the end:

- Michel still has words.
- The robots still have presence.
- Elias has memory.
- But he still has no answer.

That is why the ending works. Do not resolve it.
