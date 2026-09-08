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
