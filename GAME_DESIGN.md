# Brinewake
*A little further below.*

Title shortlist: Brinewake, The Little Below, Lanterns of the Deep. **Brinewake** wins for its
short, evocative sound, its sense of a journey leaving traces, and because the deepest trench in
the game is called The Brinewake — the name is the destination.

## Pillars

1. **A small, lovable machine in an enormous living ocean.** The submarine is the protagonist.
   It is four and a half metres long, hand-built, and by the end it is something else entirely.
2. **Curiosity funds capability.** Everything you can buy was paid for by something you were
   curious enough to go and look at.
3. **Observation is worth as much as harvesting.** A photograph of a whale is worth more than a
   hold full of bream, and you cannot put a whale in the hold.
4. **Every expedition changes the home you return to.** The museum fills, the lab expands, the
   dock gets longer, and the people in the harbour talk about what you found.
5. **Pressure creates anticipation; rescue prevents catastrophe.** Going too deep is frightening
   and survivable. Dying costs you cargo and a fee, never your progress.

## Art direction

Pure, hard-edged **low poly**. Every surface is flat-shaded: one normal and one colour per
triangle, no smooth gradients, no specular, no gloss. Models are *authored*, not composed from
primitives — bodies are lofts through hand-written cross-sections, fins are single flat plates
with five vertices, and rocks are convex hulls of a dozen deliberately placed points. If a shape
could be described as "a sphere with things stuck on it", it is wrong and gets rebuilt.

Palette: jade `#398d89`, abyss ink `#082a35`, sunlit sand `#cdb37c`, submarine yellow `#f0b93f`,
coral rose `#eaa494`, plankton mint `#a5eee0`. Terrain facets are quantised into four brightness
steps so neighbouring faces differ by a clean, visible amount. All visuals are runtime geometry,
shader or canvas generated. No external media of any kind.

## Structure

Ten contiguous descending regions from a sheltered coastal bay to a hadal trench nine kilometres
down. Each has its own palette, terrain character, flora set, creature population, wrecks,
secrets, relic story and research line.

## The descent economy

The central design problem: *how does a player get deeper without the answer always being "buy a
bigger number"?* Brinewake gives depth **five** separate axes, only one of which is a purchase.

**1. Crush depth is a soft limit.** Below your hull rating you take damage at a rate proportional
to the square of the excess. A rating of 260 m means 260 m is free, 300 m costs a slow trickle,
and 380 m is a genuine emergency. Every pilot's first trip past their rating is a decision, not a
wall, and a well-prepared dip of 25 % below rating is a legitimate strategy rather than an
exploit.

**2. Pressure reserve.** A rechargeable bank that absorbs overpressure damage for a limited time.
It turns "how deep can I go" into "how deep can I go *and get back*", which is a much better
question. It recharges at port and at moorings, never in open water.

**3. Moorings — the important one.** Scattered through the world are anchor points: an old
research buoy, a wreck's intact airlock, a vent-warmed alcove, a sealed chamber in the ruins.
Finding and activating one gives you repair, recharge, a pressure-reserve refill and a fast-travel
node. **Your effective reach is your crush depth plus your deepest mooring**, so *exploring*
extends your depth just as much as *upgrading* does. A patient pilot with a modest hull who has
found the mooring at 900 m can work the 1200 m band comfortably; an impatient one with a better
hull and no moorings cannot.

**4. Descent routes.** The seabed is shaped so that depth and distance are separable. A sheltered
trench, a cave system, or a long lateral shelf lets a modest boat reach deep water gradually,
arriving with full reserves, instead of plunging straight down from the surface and arriving with
nothing left. Certain ruin halls and wreck interiors are **pressure shadows** — sealed structures
that hold their own pressure, where the game treats your effective depth as shallower. Sheltering
inside one is how you cross a band you cannot yet survive in the open.

**5. Consumables and ballast.** Pressure sealant buys a temporary rating increase. Hull foam
repairs while submerged. Ballast stones make you heavier: you sink faster and more cheaply, but
ascending costs far more energy, and dropping ballast is an irreversible emergency measure. A deep
dive is a *commitment* you prepare for, not a slider you push.

Finally, **material gating runs one band ahead**: the rare component each hull tier needs is found
only in the band *below* your current safe depth. Every upgrade therefore requires one deliberate,
prepared, slightly frightening trip — which is exactly the feeling the whole game is built around.

## Economy

Fish pay the rent. Salvage pays for repairs. Minerals pay for hulls. Artefacts pay for everything
else, but must be identified first, and identification requires research, and research requires
observations you can only make by going somewhere new. No single income stream can be ground; the
market's demand shifts, and the highest-value activity is always the one you have not done yet.

## Quality and duration

The brief targets thirty hours. Content counts and automated progression tests do not establish a
thirty-hour experience, and this document will not claim one until a human has played it.
Measured results are recorded separately in `PROGRESS.md` from intentions.
