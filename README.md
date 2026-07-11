# SplitBeat

SplitBeat is a browser game about divided attention. Fly through a scrolling
hazard field with one hand while answering timed trivia with the other. Both
tasks draw from one shared Focus meter.

A We Are Meatbags game.

## Controls

- W, A, S, D or the arrow keys: fly the ship
- J, K, L, and semicolon: answer trivia
- Mouse or trackpad: optional trivia input
- Enter or Space: start a round
- Escape or P: pause and resume

SplitBeat needs a physical keyboard and a landscape screen at least 900 pixels
wide.

## Local preview

The game is a dependency-free static page.

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

## Release history

The `main` branch contains one shippable game version per commit:

- v1: the original four-lane rhythm highway with mouse trivia
- v2: free-flight spaceship evasion with keyboard trivia

The Pages workflow delegates to the We Are Meatbags versioned deployment
workflow. It publishes the newest commit at the site root, preserves every
release under `versions/<short-commit>/`, and writes a machine-readable
manifest at `versions/index.json`. Verified source releases receive matching
annotated tags such as `v0.0.1` and `v0.0.2`.

The We Are Meatbags game hub uses that manifest for its version picker. The
hub derives friendly Version 1, Version 2, and later labels from manifest order.
The latest release remains the default Play target, while older releases open
from their immutable archive URLs.

## Source provenance

The v2 implementation was integrated from the `splitbeat-preview` prototype.
Only its active `index.html` is used. The preview's duplicated `check.js` and
unused alternate `new-game.js` are intentionally excluded.
