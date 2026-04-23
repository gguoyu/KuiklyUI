# Classification Upgrade Rules Reference

Use this reference when a generated or repaired spec starts to mix semantic intents.

## Upgrade paths

### static -> functional
Upgrade when the spec adds:
- a real interaction action, and
- a post-interaction state assertion proving behavior changed

### static -> visual
Upgrade when the primary oracle becomes a screenshot or visual result instead of deterministic DOM/state assertions.

### functional -> hybrid
Upgrade when the same scenario needs both:
- a functional interaction/state proof, and
- a visual proof such as screenshot-based confirmation

## Non-goals

- Do not upgrade just because a spec contains both `expect(...)` and `toBeVisible(...)`.
- Do not mark a spec as hybrid when the visual assertion covers a different scenario from the functional one.
- Do not keep an obviously visual-first assertion inside a plain functional spec.

## First implementation scope

The first implementation should only detect upgrade opportunities and warn. It should not auto-move files across semantic directories.
