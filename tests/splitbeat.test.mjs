import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

function loadCore() {
  const start = html.indexOf("// SPLITBEAT_CORE_START");
  const end = html.indexOf("// SPLITBEAT_CORE_END");
  assert.notEqual(start, -1, "core start marker exists");
  assert.notEqual(end, -1, "core end marker exists");
  const source = html.slice(start, end);
  const context = {};
  vm.runInNewContext(`${source}\nthis.core = SplitBeatCore;`, context);
  return context.core;
}

const core = loadCore();

test("all inline JavaScript compiles", () => {
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
  assert.ok(scripts.length > 0);
  for (const [, source] of scripts) new vm.Script(source);
});

test("DOM ids are unique and every byId binding resolves", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "ids must be unique");
  const references = [...html.matchAll(/byId\("([^"]+)"\)/g)].map((match) => match[1]);
  assert.deepEqual(references.filter((id) => !ids.includes(id)), []);
});

test("V4 ships a substantial, valid trivia deck", () => {
  assert.ok(core.QUESTIONS.length >= 60);
  for (const question of core.QUESTIONS) {
    assert.ok([0, 1, 2].includes(question.rank));
    assert.equal(question.answers.length, 4);
    assert.equal(new Set(question.answers).size, 4);
    assert.ok(Number.isInteger(question.correct));
    assert.ok(question.correct >= 0 && question.correct < 4);
    assert.ok(question.prompt.length > 8);
  }
});

test("beat phrases are valid and cover all wave types", () => {
  assert.ok(core.WAVE_PHRASES.length >= 8);
  const kinds = new Set();
  for (const phrase of core.WAVE_PHRASES) {
    assert.equal(phrase.events.length, 8);
    for (const event of phrase.events) {
      kinds.add(event.kind);
      assert.ok(event.beat >= 0 && event.beat < core.PHRASE_BEATS);
      assert.ok([0, 1, 2].includes(event.level));
      if (event.kind === "wall") assert.ok(event.gapLane >= 0 && event.gapLane <= 4);
      else assert.ok(event.lanes.every((lane) => lane >= 0 && lane <= 4));
    }
  }
  assert.deepEqual([...kinds].sort(), ["double", "single", "wall"]);
});

test("seeded randomness is repeatable and independent", () => {
  const first = core.makeRandom(314159);
  const second = core.makeRandom(314159);
  const different = core.makeRandom(271828);
  const sequence = Array.from({ length: 12 }, first);
  assert.deepEqual(sequence, Array.from({ length: 12 }, second));
  assert.notDeepEqual(sequence, Array.from({ length: 12 }, different));
});

test("Duo role swaps are seeded and reserved beyond the authored chart", () => {
  const firstRandom = core.makeRandom(314159 ^ 0x85ebca6b);
  const secondRandom = core.makeRandom(314159 ^ 0x85ebca6b);
  const first = core.createInitialRoleSwapTimes("standard", firstRandom);
  const second = core.createInitialRoleSwapTimes("standard", secondRandom);
  assert.deepEqual(first, second);
  assert.equal(first.length, 2);
  assert.ok(first[0] >= 44 * core.BEAT_MS && first[0] <= 68 * core.BEAT_MS);
  assert.ok(first[1] >= 92 * core.BEAT_MS && first[1] <= 116 * core.BEAT_MS);

  const endlessRandom = core.makeRandom(271828 ^ 0x85ebca6b);
  const initial = core.createInitialRoleSwapTimes("endless", endlessRandom);
  const reservationHorizon = initial[0] + (36 + core.PHRASE_BEATS) * core.BEAT_MS;
  const extended = core.extendEndlessRoleSwapTimes(initial, reservationHorizon, endlessRandom);
  assert.ok(extended.at(-1) >= reservationHorizon);
  for (let index = 1; index < extended.length; index += 1) {
    const intervalBeats = Math.round((extended[index] - extended[index - 1]) / core.BEAT_MS);
    assert.ok([48, 60, 72, 84].includes(intervalBeats));
  }
  assert.match(html, /ensureEndlessRoleSwapsScheduled\(elapsed \+ \(36 \+ PHRASE_BEATS\) \* BEAT_MS\)/);
});

test("reduced motion preserves critical role-swap banners", () => {
  assert.match(html, /body\.reduce-motion \.role-swap-banner\.show-warning,[\s\S]*?opacity: 1;/);
  assert.match(html, /body\.reduce-motion \.countdown-value \{[\s\S]*?animation: none !important;[\s\S]*?opacity: 1;/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.role-swap-banner\.show-warning,[\s\S]*?opacity: 1;/);
});

test("critical screen-reader announcements survive countdown and tier changes", () => {
  assert.match(html, /Split\. Round live\. Question \$\{questionsSeen\}/);
  assert.match(html, /updatePressureTier\(elapsed, roleSwapped\)/);
  assert.match(html, /roleSwapped \? `\$\{dom\.liveRegion\.textContent\} \$\{announcement\}`/);
});

test("wave components resolve to exactly one wave outcome", () => {
  assert.equal(core.resolveWaveComponentStates(["pending", "cleared"]), "pending");
  assert.equal(core.resolveWaveComponentStates(["cleared", "cleared"]), "cleared");
  assert.equal(core.resolveWaveComponentStates(["hit", "cleared"]), "miss");
  assert.equal(core.resolveWaveComponentStates(["contacted", "cleared"]), "miss");
});

test("endless pressure tiers advance every thirty seconds", () => {
  assert.equal(core.pressureTier("endless", 0), 0);
  assert.equal(core.pressureTier("endless", 29999), 0);
  assert.equal(core.pressureTier("endless", 30000), 1);
  assert.equal(core.pressureTier("endless", 90500), 3);
});

test("preferences are schema validated and clamped", () => {
  const preferences = core.validatePreferences({ playStyle: "duo", mode: "endless", difficulty: "hard", muted: true, volume: 9, metronome: false, motion: "reduced" });
  assert.equal(preferences.playStyle, "duo");
  assert.equal(preferences.mode, "endless");
  assert.equal(preferences.difficulty, "hard");
  assert.equal(preferences.volume, 1);
  assert.equal(preferences.metronome, false);
  assert.equal(preferences.motion, "reduced");
  assert.equal(core.validatePreferences({ difficulty: "impossible" }).difficulty, "normal");
});

test("records stay isolated by setup and merge personal bests", () => {
  assert.notEqual(core.recordKey("solo", "standard", "normal"), core.recordKey("duo", "standard", "normal"));
  assert.notEqual(core.recordKey("duo", "standard", "normal"), core.recordKey("duo", "endless", "normal"));
  const first = core.mergeRecord(null, { mode: "standard", score: 1200, complete: true, grade: "B", bestCombo: 8, dodgeAccuracy: 80, triviaAccuracy: 60, elapsed: 78000, tier: 1, focus: 30 });
  const second = core.mergeRecord(first.record, { mode: "standard", score: 900, complete: false, grade: "C", bestCombo: 12, dodgeAccuracy: 70, triviaAccuracy: 75, elapsed: 42000, tier: 1, focus: 0 });
  assert.equal(first.newBest, true);
  assert.equal(second.newBest, false);
  assert.equal(second.record.bestScore, 1200);
  assert.equal(second.record.bestGrade, "B");
  assert.equal(second.record.bestCombo, 12);
  assert.equal(second.record.bestTriviaAccuracy, 75);
  assert.equal(second.record.attempts, 2);
  assert.equal(second.record.completions, 1);
});
