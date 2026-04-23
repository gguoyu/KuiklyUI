# Test Page Design Reference

Use this reference when the loop needs to add or review a `web_test` carrier page before adding or repairing specs.

## Core principles

- **Single responsibility**: each test page should focus on one component, one style family, or one narrow interaction scenario.
- **Deterministic content**: prefer fixed text, fixed item counts, fixed image URLs, and embedded data over network-driven or random content.
- **Stable layout**: keep geometry and visual hierarchy predictable so assertions and screenshots remain durable.
- **No external dependencies**: avoid network requests, local storage dependencies, and other non-essential runtime coupling unless the page explicitly exists to test that module behavior.
- **Direct accessibility**: every page must be routable through `kuiklyPage.goto('<PageName>')`.

## Carrier page rules

- `web-autotest/tests/` must target only pages registered under `demo/.../pages/web_test/`.
- If a spec currently targets a page outside `web_test`, delete that spec or retarget it only after recreating the capability under `web_test`.
- If no existing `web_test` carrier can express the missing capability, add a carrier page before adding the spec.
- Do not create placeholder carrier pages that only show a title and do not expose the missing behavior itself.
- If the intended page behavior is still ambiguous after reading nearby `web_test` patterns and the source file under test, stop and emit a manual-review warning.
- A new carrier page is only useful when it also passes `testability-hard-rules.md`; a placeholder page that cannot support stable assertions is still a blocker.

## Naming

- Prefer `{Subject}TestPage` naming for carriers.
- Keep the page name aligned with the runtime concern the spec is supposed to cover.
- When a page is interaction-heavy, expose stable labels or visible state text that the generated spec can assert without reverse-engineering runtime internals.

## What a good page exposes

A good carrier page gives the loop at least one of the following:
- stable title text
- stable visible content text
- stable action labels
- stable `data-kuikly-component` nodes
- stable state transitions after a click / input / scroll

## Review questions

Before keeping a new carrier page, confirm:
- Does the page cover a real missing capability rather than duplicate an existing carrier?
- Can the spec interact with it using stable selectors and stable oracles?
- Does it avoid unnecessary business logic and unrelated branches?
