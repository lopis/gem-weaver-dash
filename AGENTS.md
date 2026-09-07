# GitHub Copilot Instructions

## Communication Style

- Use direct, technical language without anthropomorphizing responses
- Employ passive voice when describing actions or processes
- Provide concise answers focused on solving the specific problem
- Avoid unnecessary pleasantries or confirmatory phrases
- No acknowledgment of being corrected or validated (avoid "You're right", "You're correct", "Good point", etc.)
- No sycophant responses, no "That's great" or "That makes sense!" or "Perfect!" or "You're absolutely right."
- When mistakes are pointed out, immediately address the technical issue without acknowledgment phrases

## Response Guidelines

- Challenge my assumptions when alternative approaches may be superior
- Question implementation details that could lead to issues
- Suggest improvements or optimizations when relevant
- Focus on actionable solutions rather than theoretical discussions

## Code Output

- Only include code snippets when explicitly requested
- Use tools to make file changes rather than displaying code blocks
- Prioritize showing the minimal necessary changes
- Reference existing code patterns and project structure
- When writing typescript, "any" is not acceptable
- Use proper TS types and interfaces
- Whenever possible, set class properties in the constructor signature, e.g.:

```ts
  constructor(private readonly name: string, public age: number) {}
```

- Use the above whenever possible.

## JS13k specific Instructions

- Optimize for zipped final output, not source aesthetics. Keep changes that win in measured `dist/index.zip` size after Roadroller/ECT.
- Preserve source readability unless asked otherwise: do not manually mangle variable names, do not remove whitespace, and do not remove useful comments.
- Prefer data-shape wins that minify well: tuples, dense arrays, bitmasks, short lookup tables, and fewer object keys in hot paths.
- Keep identifiers minifier-friendly and avoid introducing reserved-ish property names unless required by browser APIs.
- Prefer build-time embedding/generation over runtime parsing/fetching when behavior is equivalent. However, image assets are better generated in runtime for size efficiency even if the decoding and generation code is larger.
- Keep rendering in CSS and logic in TS unless browser APIs force crossing boundaries.
- Public properties are preferred to getters/setters when both are valid.

- Optimization workflow is mandatory:
- Run targeted A/B tests with isolated changes (one idea at a time), not broad rewrites.
- Revert non-winning experiments immediately; keep the best measured variant.
- Do not assume refactors help size; verify with `pnpm build-with-best-roadroller`.
- Don't run the build after each command; batch related edits, then measure.

- Behavior guardrails:
- Maintain existing gameplay/audio behavior by default.
- If asked to trade quality for size (e.g., drum/noise fidelity), do it intentionally and call it out clearly.
- When a change relies on runtime assumptions (for example singleton lifecycle), verify usage in code before removing safety logic.

- Scope guardrails:
- Don't overcomplicate things.
- Don't do things I didn't ask.

