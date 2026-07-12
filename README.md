# SplitBeat

SplitBeat is a beat-driven browser game about divided attention. Fly through
authored hazard phrases while answering timed trivia. Clean waves build Sync,
correct answers bank it, and both tasks draw from one shared Focus meter.

A We Are Meatbags game.

## Controls

- W, A, S, D or the arrow keys: fly the ship
- J, K, L, and semicolon: answer trivia
- Mouse or trackpad: optional trivia input
- Enter or Space: start a round
- Escape or P: pause and resume

Couch Duo gives Player 1 the Pilot role and Player 2 the Operator role. Both
players ready up before launch, then deterministic surprise handoffs swap their
roles during the signal.

SplitBeat needs a physical keyboard and a landscape screen at least 900 pixels
wide.

## Local preview

The game is a dependency-free static page.

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

For a repeatable hazard and question sequence during QA, append a numeric seed,
for example <http://localhost:8000/?seed=314159>.

Run the zero-dependency deterministic checks with:

```sh
node --test tests/*.test.mjs
```

## Release history

The `main` branch contains one shippable game version per commit:

- v1: the original four-lane rhythm highway with mouse trivia
- v2: free-flight spaceship evasion with keyboard trivia
- v3: the v2 spaceship game with fairer spawning, interruption-safe timing,
  refined controls, clearer feedback, smoother motion, and accessibility polish
- v4: beat-authored wave phrases, wave-level scoring, shared Sync, persistent
  records, Standard and Endless signals, preferences, and focused Couch Duo with
  surprise role swaps

The Pages workflow delegates to the We Are Meatbags versioned deployment
workflow. It publishes the newest commit at the site root, preserves every
release under `versions/<short-commit>/`, and writes a machine-readable
manifest at `versions/index.json`. Verified source releases receive matching
annotated tags such as `v0.0.1`, `v0.0.2`, and `v0.0.3`.

The We Are Meatbags game hub uses that manifest for its version picker. The
hub derives friendly Version 1, Version 2, and later labels from manifest order.
The latest release remains the default Play target, while older releases open
from their immutable archive URLs.

## Source provenance

The v2 implementation was integrated from the `splitbeat-preview` prototype.
Only its active `index.html` is used. The preview's duplicated `check.js` and
unused alternate `new-game.js` are intentionally excluded.
