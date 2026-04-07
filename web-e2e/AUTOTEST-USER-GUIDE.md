# Kuikly Web Autotest User Guide

1. Trigger

Run from the repo root: `node kuikly-web-autotest/scripts/run-autotest-loop.mjs`.
This is the only recommended closed-loop entrypoint for this repo.

2. Common input

The usual flags are `--skip-build`, `--max-rounds 3`, `--max-new-specs 20`, and `--allow-incomplete-scan`.
The default continuation command is:
`node kuikly-web-autotest/scripts/run-autotest-loop.mjs --skip-build --max-rounds 3 --max-new-specs 20 --allow-incomplete-scan`

3. Focused rerun

If only one spec needs verification, run:
`node web-e2e/scripts/kuikly-test.mjs --skip-build --test <spec>`

4. Automatic work

The loop scans `demo/.../pages/web_test` and `web-e2e/tests`, runs the canonical full suite, analyzes Playwright failures, summarizes Kotlin coverage, and applies safe managed-spec mutations.
If a round makes safe progress, it continues to the next round.

5. Output to inspect

The main output file is `web-e2e/reports/autotest/loop-report.json`.
Focus on `scan.summary`, `attempts[*].summary`, `mutations`, `warnings`, and `finalStatus`.

6. What the output means

`scan.summary` shows completeness.
`attempts[*].summary` shows per-round test and coverage status.
`mutations` shows automatic edits.
`warnings` shows blockers or rollback signals.
`finalStatus` is the final verdict.

7. Safe mutation scope

AI may safely update managed specs, apply deterministic goto remaps, and make narrow assertion fixes.
AI must not silently weaken meaningful tests or change product behavior without evidence.

8. Manual-boundary cases

Manual review is required for `orphanSpecTarget`, ambiguous product behavior, pages blocked by external SDK or product capability, or low-coverage files that still have no real carrier page.

9. Final stop rules

If a page already has a handwritten spec that is explicitly `test.skip`, TODO-driven, or blocked by missing SDK or product capability, AI must stop and report a blocker instead of generating a parallel managed spec.
If a new `web_test` page would only be a placeholder title page and would not exercise the missing capability itself, AI must stop and wait for manual confirmation.

10. Recommended order

Run the closed loop first.
If it fails, inspect `loop-report.json`.
If the issue is isolated, use `--test <spec>` for focused repair, then return to the closed loop.
