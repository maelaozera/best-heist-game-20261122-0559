# Velvet Vault — A Quiet Heist

[![best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/maelaozera/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/maelaozera/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

**Velvet Vault** is an original top-down stealth heist game that runs offline in a desktop browser from static files. You are the thief: cross three guarded rooms, read the patrols and vision cones, crack the vault, grab every piece of loot, and slip out the exit before the alarm hits 100%.

## How to play

1. **Plan the heist** — pick an entry route: `1` front door (fast, watched) or `2` vent (quiet, long way round).
2. **Sneak** — move with `WASD` / arrow keys. Hold `Shift` to sneak slowly and quietly; guards spot you slower while sneaking.
3. **Read the cones** — guards sweep vision cones along patrol routes; cameras rotate theirs. Being seen raises suspicion and the alarm. Hide in shadow pools to cool the alarm down.
4. **Use tools** — `Q` or click throws a coin (3 per room) to lure a guard away; `H` hacks the cameras dark for 8 seconds (2 per room). Both cost you: coins and hacks are limited.
5. **Crack the vault** — stand beside it and hold `E` for 2.5 seconds. Small loot (gold, gems, art) is grabbed on touch.
6. **Escape** — the exit opens once every loot item is taken. Walk into it to clear the room. Get caught by a guard, or let the alarm reach 100%, and the run ends.

`Space` pauses, `M` mutes the synth sound effects, `R` restarts after a win or a loss.

## The three rooms

- **Room 1 — The Velvet Gallery:** 2 guards, 1 camera, 3 loot pieces.
- **Room 2 — The Gilded Vault:** 3 guards, 2 cameras, a vault to crack, 4 loot pieces.
- **Room 3 — The Midnight Ledger:** 4 guards, 3 cameras, a faster alarm, 5 loot pieces.

## Run it locally

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Open `http://localhost:8080` in a desktop browser. No build step, no network requests, no external assets — all art is drawn on canvas and all sounds are synthesised with WebAudio.

Screenshot scenes: `?shot=start|play|loot|end&seed=1`. Headless self-test: `?selftest=1` (reports PASS/FAIL in the page title).

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored `vendor/makefun-game.ts` library:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Original work: idea, names, art, sounds and levels are all my own. MIT licensed.
