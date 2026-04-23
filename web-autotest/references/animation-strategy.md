# Animation Strategy Reference

Use this reference when generating or repairing animation-oriented specs.

## Animation families

- **CSS transition**: trigger a state change, then prefer an end-state wait or end-state assertion.
- **JS frame animation**: prefer stable end-state assertions; use frame-sensitive logic only for page-specific templates that already expose strong signals.
- **KR property animation**: prefer trigger -> wait -> visible end-state or toggle-state assertions.
- **PAG / canvas animation**: prefer page-specific templates and visible rendering evidence instead of fragile pixel-perfect timing in generic repairs.

## Preferred assertion strategy

1. First choice: stable state text, stable style state, or deterministic visible end state.
2. Second choice: screenshot or frame-based validation only when the page is explicitly built for visual validation.
3. CI fallback: when timing is unstable, prefer simpler end-state checks over frame-sensitive checks.

## Practical rules for generated specs

- Keep generic animation repairs conservative.
- Prefer one trigger + one stable end-state assertion over long animation scripts.
- If the page already has a page-specific template, keep using it; only downgrade to a lighter repair profile when failures show the richer path is unstable.
- When a page does not expose a stable animation oracle, emit a manual-review warning instead of inventing one.

## CI stability

When `process.env.CI === 'true'`:
- prefer shorter waits and stable end-state assertions
- avoid relying purely on frame counts or precise animation timing in generic templates
- keep page-specific visual templates only where the page already exposes deterministic checkpoints
