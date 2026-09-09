# Optimization Attempts

## 2026-09-07 - Runtime-generated item/color CSS (Idea #2)

### Goal
Reduce final zip size by removing repetitive static CSS item rules and/or root color custom properties from CSS, then generating them in JavaScript at runtime.

### Baseline
- Prior baseline before the experiment: 13286 B (`dist/index.zip`)

### Variants tested
1. Full runtime generation
- Root color custom properties moved from CSS to JS
- Item token rules generated in JS and injected via `<style>`
- Result: 13308 B
- Delta vs baseline: +22 B (regression)

2. Hybrid generation
- Root color custom properties kept in CSS
- Only item token rules generated in JS
- Result: 13295 B
- Delta vs baseline: +9 B (regression)

### Conclusion
- Repetitive static CSS compressed better than equivalent runtime JS string construction and style injection in this codebase.
- This optimization direction should be considered a losing path for now.
- Experiment changes were reverted.

### Post-revert verification
- Rebuild after rollback produced 13248 B.
- This was lower than the baseline observed before the experiment, likely due to compressor/search variance and/or unrelated dist state changes.
- Decision is still based on controlled A/B deltas above: both runtime-style variants regressed.

### Recommendation for future attempts
- Keep token/color mapping in static CSS.
- Prefer next experiments on:
  - ID/class shortening across HTML/CSS/TS.
  - Data/table packing in spell and sprite data.
  - Sketch font simplification.

## 2026-09-07 - Spells LUT String Packing

### Goal
Reduce spell-logic footprint in [src/game/spells.ts](src/game/spells.ts) by replacing numeric matrix/switch structures with denser encoded forms.

### Baseline
- Baseline before this experiment: 13248 B (`dist/index.zip`)

### Variant tested
1. Flattened LUT strings + direct indexing
- Replaced two 7x7 numeric LUT matrices with two 49-char digit strings.
- Replaced `matrix[a][b]` with `charCodeAt(a * 7 + b) - 48`.
- Replaced `gemForColor` switch with dense `GemItem[]` lookup.
- Replaced color complement switch with dense `ColorId[]` lookup.
- Result: 13191 B
- Delta vs baseline: -57 B (improvement)

### Conclusion
- Kept. This is a clear net win with no behavior-surface changes to spell timing/flow.
- Note: true 3-bit packing was not used because ADD outcomes include value `8` (white), so a plain base-10 digit encoding produced a smaller code path than extra bit-unpack logic in this attempt.

### Follow-up tried (same day)
1. Pair-packed representation (2 values/char, 25 chars)
- ADD-only packed variant: 13219 B (regression, +28 B vs 13191 B)
- ADD+SUB packed variant with shared decoder: 13217 B (regression, +26 B vs 13191 B)
- Outcome: reverted. Decoder overhead and arithmetic canceled out shorter LUT literals.

## 2026-09-07 - Glyph Table Representation (Sketch Font)

### Goal
Reduce source and packed size of the custom glyph data representation without changing rendered output.

### Baseline
- Baseline before this test: 13191 B (`dist/index.zip`)

### Variant tested
1. Replace tuple array with split table strings
- Replaced `glyphEntries: [char,path][]` with:
  - `glyphChars` single string (`ABCDEFGHIJKLMNOPQRSTUVWY!?1234567890`)
  - `glyphPaths` one `~`-delimited string split at runtime
- Updated init loop to index both arrays by position.
- Result: 13190 B
- Delta vs baseline: -1 B (improvement)

### Conclusion
- Kept. Very small win, but positive and no visual compromise.

### Follow-up tried (same day)
1. Strip leading `m` from every stored glyph path, prepend `m` at read time
- Result: 13193 B
- Delta vs current 13190 B variant: +3 B (regression)
- Outcome: reverted.

### Readability decision
- The `glyphChars` + packed `glyphPaths` representation (13190 B) was reverted to readable `glyphEntries` tuples.
- Readability-first version result: 13191 B.
- Net tradeoff accepted: +1 B for much better maintainability of glyph edits.

## 2026-09-07 - Sketch Font Pipeline Simplification

### Goal
Simplify actual font drawing/rendering code with low-risk assumptions (manual gameplay verification) and remove unused rendering paths.

### Baseline
- Baseline before this test: 13191 B (`dist/index.zip`)

### Variant tested
1. Remove defensive and unused font rendering path
- Removed unused exported canvas renderer `drawSketchText`.
- Removed `glyphs` map and `loaded` state.
- Removed `ensureHtmlAssets` indirection and built assets directly in `initSketchFont`.
- Removed stale commented `initSketchFont` guards and the unused `FONT_EM` constant.
- Result: 13166 B
- Delta vs baseline: -25 B (improvement)

### Conclusion
- Kept. Meaningful size win with simpler code and no intended visual behavior changes for the active DOM text path.

### Follow-up tried (same day)
1. Extract repeated span setup into helper in `setSketchText` + `appendSpacer`
- Result: 13169 B
- Delta vs 13166 B baseline: +3 B (regression)
- Outcome: reverted.

## 2026-09-08 - Sketch Path Cleanup Attempts

### Goal
Simplify [src/game/sketch-path.ts](src/game/sketch-path.ts) internals without changing the hand-drawn look.

### Baseline
- Baseline before tests: 13166 B (`dist/index.zip`)

### Variants tested
1. Replace temporary point objects with flat numeric array in `drawSketchStroke`
- Result: 13195 B
- Delta vs baseline: +29 B (regression)

2. Collapse `hash` + `pathNoise` into one helper
- Result: 13175 B
- Delta vs baseline: +9 B (regression)

### Conclusion
- Both cleanups regressed final packed size.
- Reverted both; existing structure remains the winner for now.

## 2026-09-08 - Rename sketch Attribute to sk

### Goal
Reduce HTML/selector bytes by replacing the custom `sketch` attribute with `sk`.

### Variant tested
1. Rename markup attributes + selector
- Updated all `sketch` attributes in [index.html](index.html) to `sk`.
- Updated selector in [src/game/sketch-font.ts](src/game/sketch-font.ts) from `[sketch]` to `[sk]`.
- Result observed: 13225 B.

### Conclusion
- Regressed versus nearby baseline state and was reverted.
- Kept `sketch` as-is.

## 2026-09-08 - Rename help Attribute to h

### Goal
Reduce bytes in HTML/CSS/selector strings by shortening `help` to `h`.

### Baseline
- Baseline before test: 13232 B (`dist/index.zip`)

### Variant tested
1. Rename `help` -> `h` across all touchpoints
- Updated help spans in [index.html](index.html).
- Updated selectors in [style.css](style.css) from `[help]` / `[help="n"]` to `[h]` / `[h="n"]`.
- Updated runtime selector in [src/game-states/game.state.ts](src/game-states/game.state.ts) to `[h="${helpId}"]`.
- Result: 13230 B
- Delta vs baseline: -2 B (improvement)

### Conclusion
- Kept. Small but positive win.

## 2026-09-08 - Trail File Simplification Attempts

### Goal
Find size wins in [src/game/trail.ts](src/game/trail.ts) without changing visual behavior.

### Baseline
- Baseline before tests: 13230 B (`dist/index.zip`)

### Variants tested
1. Flatten sprite shape + remove Vec2 prev state
- Replaced nested `pos/angle/born` structure with short flat fields and scalar prev coords.
- Result: 13235 B
- Delta vs baseline: +5 B (regression)
- Outcome: reverted.

2. Reuse one `performance.now()` per draw/update tick
- Captured `now` once at top of `drawTrail` and reused it for spawned sprite `born` and fade filtering.
- Result: 13226 B
- Delta vs baseline: -4 B (improvement)

### Conclusion
- Kept variant 2 only.

## 2026-09-09 - Flatten CountSet Wrapper

### Goal
Reduce output size by removing the generic `Set`-based wrapper around the tiny inventory/staged-fruit counting logic and making the local map-backed structure flatter.

### Baseline
- Baseline before this test: 13024 B (`dist/index.zip`)

### Variant tested
1. Remove `extends Set` and drop the unused generic Set behavior
- Replaced the wrapper with a direct `Map<T, number>` class that exposes the same `add`, `remove`, and `count` API.
- Kept the public behavior identical for the current inventory/staged-fruit usage.
- Result: 13014 B
- Delta vs baseline: -10 B (improvement)

### Conclusion
- Kept. This is a small but measurable improvement without changing game behavior.
- This is a good example of a real over-abstraction cleanup in a tiny data structure: the generic `Set` wrapper was not buying enough bytes to justify the extra emitted code.

### Follow-up note
- This is the first successful experiment from the “flat structures vs abstraction-heavy wrappers” line of inquiry.
- Continue with one new idea at a time, re-measuring after each change.

## Possible ideas to try next

### 1. Replace abstraction-heavy wrappers with flatter local logic
- Look for places where a generic layer is larger than the actual behavior it wraps.
- Good candidates:
  - [src/core/event.ts](src/core/event.ts)
  - [src/core/state.ts](src/core/state.ts)
  - [src/core/state-machine.ts](src/core/state-machine.ts)
  - [src/game-state-machine.ts](src/game-state-machine.ts)
  - [src/core/util/count-set.ts](src/core/util/count-set.ts)
- These are worth testing when the game state is tiny and the utility code is doing mostly bookkeeping.
- For JS13k, direct condition checks and tiny local state can beat generic helper layers after minification.

### 2. Prefer dense data tables over verbose object/branch logic
- A small table or LUT is often smaller than a more "structured" implementation made of multiple helpers and condition blocks.
- This already proved true in:
  - [src/game/spells.ts](src/game/spells.ts)
  - [src/game/level-data.ts](src/game/level-data.ts)
- Favor encoded literals, compact tuples, and index-based lookups over expressive object graphs when the data is fixed and tiny.

### 3. Consolidate duplicate descriptions into one canonical source
- Avoid parallel representations of the same thing in multiple arrays/objects/DOM attributes.
- Current pressure areas:
  - [src/game/game-item.ts](src/game/game-item.ts)
  - [src/game/game-data.ts](src/game/game-data.ts)
  - [src/game-states/game.state.ts](src/game-states/game.state.ts)
- A good canonical source is one compact definition that other code derives from, instead of several slightly different parallel views.

### 4. Flat structures over abstraction-heavy classes
- Small isolated classes with many methods can regress when the code is tiny and heavily compressed.
- Watch for: generic wrappers, lifecycle methods, large helper chains, and over-built state machines.
- The low-level goal is not "cleaner code" but "less output bytes after the optimizer".

### 5. Check for faux-optimization in "cleaner" refactors
- Refactors that look nicer in source often lose after Terser + Roadroller + ECT.
- This is especially common when the refactor only rearranges logic without removing the real runtime cost.
- Rule of thumb: if the code still has the same branches/helpers but just moves them around, it is probably not a real win.

### 6. Keep static shared CSS; avoid pushing too much into runtime-generated markup/styles
- Already validated as a losing direction in this project.
- Repeated inline attribute styles and per-node runtime style generation can be worse than a small shared selector in static CSS.
- This should stay as a cautionary pattern rather than a preferred optimization path.

### 7. Prefer compact numeric/index representations when the data is naturally small and fixed
- Numeric ids, index lookups, and tuple-based config can often outperform verbose named strings or object property maps.
- However, this only wins when the conversion logic is small and the actual data payload is large enough to justify the compact representation.
- This is the exact place where experiments should be measured against the real build, not source intuition.

### 8. Revisit “better-looking” code only if it reduces literal payload
- The most promising candidates are not the most readable ones.
- The next search should focus on literal-heavy metadata, not wrapper-heavy architecture.
- If an optimization does not reduce bytes in the built output, it should be reverted immediately.

