# Repair Ladder Reference

Use this reference when a managed spec fails and the loop must choose the next repair strength.

## Repair order

1. **Page-specific downgrade**
   - Prefer a page-specific lighter template when one exists and the failure evidence matches it.
2. **Category-generic downgrade**
   - If no page-specific repair is suitable, move to the category-level generic repair template.
3. **Generic smoke fallback**
   - If the category repair still fails or no longer changes the output, fall back to the lightest smoke-oriented template.
4. **Stop with blocker**
   - If the ladder is exhausted, stop mutating this page automatically and emit a blocker warning.

## Rules

- Each repair step should make the spec strictly simpler or more deterministic than the previous one.
- Do not loop forever on the same template profile and same failure evidence.
- If a lower step no longer changes the generated content, skip to the next allowed step or stop.
- Record the current repair step in managed metadata so later rounds can continue from the last safe downgrade point.

## Review question

For each repair step, ask:

> Did this step reduce uncertainty without throwing away the core behavior the page is supposed to cover?

If the answer is no, stop and escalate.
