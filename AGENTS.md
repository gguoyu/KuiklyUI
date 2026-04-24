# KuiklyUI — AI Skills

KuiklyUI is a Kotlin Multiplatform cross-platform UI framework. The web rendering layer
(`core-render-web` + `h5App`) compiles to browser-executable code via Kotlin/JS.

This file is the project-level entry point for all AI agents. It describes the available skills
and where to find their full definitions.

---

## Available Skills

### kuikly-web-autotest

Run and maintain the KuiklyUI web automated test closed loop.

**Use when**: executing web E2E tests, collecting Kotlin coverage, inspecting failing cases,
detecting missing `web_test` page coverage, improving coverage toward thresholds, or driving
the repo toward a fully automated test state with minimal manual intervention.

**Full skill definition**: `web-autotest/SKILL.md`

**Trigger (Claude Code)**: `/kuikly-web-autotest`

**Quick start**:
```bash
node web-autotest/scripts/loop/run-autotest-loop.mjs \
  --skip-build --max-rounds 3 --max-new-specs 20 --allow-incomplete-scan
```

---

## Adding a new Skill

1. Create a directory for the skill at the repo root (e.g. `my-skill/`).
2. Write the full skill definition in `my-skill/SKILL.md` following the structure in
   `web-autotest/SKILL.md` as a reference.
3. Add a short entry to this file under **Available Skills**.
4. Create `.claude/commands/my-skill.md` containing a single line:
   `@../my-skill/SKILL.md`
