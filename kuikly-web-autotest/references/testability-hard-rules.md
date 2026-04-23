# Testability Hard Rules Reference

Use this reference before creating or refreshing a managed spec.

## Stable oracle requirements

A page is not eligible for automatic backfill unless it exposes at least one stable oracle:
- stable page title or stable visible text
- stable action result text
- stable `data-kuikly-component` anchor used together with a deterministic state assertion
- a page-specific scripted interaction with an explicit expected label

## Actionability requirements

For interaction-oriented automatic backfill, the page must expose at least one usable action path:
- explicit action scripts with expected results
- deterministic input flow
- deterministic scroll flow
- stable visible labels that map to a known state change

A page that only offers a clickable surface without a stable post-action oracle should be skipped.

## Hard stop cases

Stop and warn instead of generating a managed spec when:
- the page has no stable oracle
- the page has no usable action path for its category
- the page has no stable post-action outcome
- the page is marked as known-flaky and has no page-specific repair strategy
- the only proof would rely on runtime internals, obfuscated names, or ad-hoc debug objects

## Output expectation

When the loop blocks a page for testability, the report should name the page and the exact blocker rule so the next repair can be deliberate instead of guesswork.
