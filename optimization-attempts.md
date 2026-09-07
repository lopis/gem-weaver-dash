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
