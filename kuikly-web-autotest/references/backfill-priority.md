# Backfill Priority Reference

Use this reference when coverage is below threshold and the loop must decide what to extend next.

## Priority order

1. **Completeness gaps first**: pages under `web_test` without any spec are higher priority than pure coverage tuning.
2. **Reachable coverage gaps second**: prefer low-coverage source objects that already map to an existing, usable carrier page.
3. **New carrier pages last**: only add a carrier page when nearby `web_test` patterns already make the intended behavior obvious.
4. **Stop instead of guessing**: if the missing behavior is ambiguous, emit a manual-review warning instead of inventing page semantics.

## Candidate scoring dimensions

When choosing among multiple reachable coverage targets, prefer the page that has more of the following:
- a larger uncovered branch / line / statement gap
- a higher-value category (`interactions`, `modules`, then `animations`, then `composite`)
- stable visible text or stable state text that can act as a post-action oracle
- explicit action scripts or deterministic input / scroll paths
- no handwritten blocker spec for the same page
- no known flakiness marker

## De-prioritize or stop when

- the page only offers smoke-level visibility assertions and no meaningful post-action oracle
- the page depends on ambiguous geometry or runtime internals to prove behavior
- the page is already marked as blocked by a handwritten spec
- the page requires a brand new carrier but nearby repo patterns do not define the behavior clearly enough

## Decision outputs

Every automated backfill choice should be explainable in these terms:
- why this page was chosen over the other candidates
- which stable oracle proves the target behavior
- whether the result is expected to improve completeness, reachable coverage, or both
- why the loop did not create a new carrier page if one was missing
