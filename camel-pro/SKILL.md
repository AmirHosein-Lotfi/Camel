---
name: camel-pro
description: Aggressive maximum-cut token-saving mode for when there's a lot of work left and very little budget to do it in. Stacks /camel and /camel-dam automatically, then cuts harder on every front — a compressed high-density output register (the biggest output-side lever), routing noisy commands through the cam filter by default, skipping plan preambles and clarifying round-trips in favor of stated assumptions, batching verification, and scoping tests/diffs to what changed — while holding a hard floor on correctness, security, honest disclosure of what was cut, and confirmation before destructive actions. Invoke with /camel-pro when budget is the binding constraint, not just a nice-to-have.
---

# Aggressive token-saving mode (camel-pro)

For when there's a lot of work and very little token budget left to do it in — the desert crossing, not the easy stretch. This is `/camel` and `/camel-dam` stacked, then pushed further — cutting verbosity, redundant verification, and round-trips harder than either base mode allows on its own. The tradeoff is real and intentional: pro mode skips things that aren't strictly necessary. What makes that safe is the floor at the bottom of this file — pro mode never crosses it, no matter how tight the budget is.

## On invocation

Invoke the `camel` and `camel-dam` skills (via the Skill tool) right away so their full rules actually load into context — don't just take them on faith from this description. That's a small fixed cost paid once, and it's what makes "stacking" real instead of a name.

## Additional cuts, on top of camel + camel-dam

1. **No upfront plan exposition for routine work.** Skip "here's my plan: 1, 2, 3" for normal-sized tasks — just do the work. Keep a visible plan/todo list only for genuinely multi-step work where losing track of steps is the real risk.
2. **Default to the reasonable assumption instead of asking.** Don't spend a round-trip on a clarifying question when there's a sane default — pick it, do the work, and name the assumption in one short clause. Only stop and ask when the request is genuinely ambiguous in a way that changes the outcome materially, or the action is destructive/irreversible.
3. **Batch edits and verification — don't checkpoint every step.** Make all the related edits to a file or set of files before re-checking anything. Don't re-read, re-lint, or re-typecheck after each small change; verify once at the end of a coherent chunk of work.
4. **Scope verification to what changed, not the whole project.** Run the specific test or function affected, not the full suite; diff the relevant hunk, not the whole history. Run the full suite only at a real completion checkpoint, not continuously through the work.
5. **No speculative extras.** No comments beyond what's load-bearing, no defensive handling for cases that can't occur, no docs/tests/refactors beyond exactly what was asked. This is already the baseline rule everywhere — pro mode enforces it without exception.
6. **Compressed output register — the biggest output-side lever.** Output tokens get spent on every turn, so this is where the largest steady saving lives. Write in a clipped, high-density technical register: drop articles and filler ("the", "just", "simply", "I'll go ahead and"), lead with the answer, use fragments where a full sentence adds nothing. Lists and tables over prose. Symbols and shorthand where they're unambiguous (`->`, `fn`, `cfg`, `repro`). One-line acknowledgments; no restating the request; no closing summary beyond a single clause. The bar: a competent engineer reads it just as fast and loses no information. This is a denser register, not a cryptic one — code, identifiers, paths, commands, and error strings stay byte-exact, and anything genuinely ambiguous gets its words back. If `caveman` is also active, defer to its style; the two stack rather than fight.
7. **Route noisy commands through cam.** `/camel` already loaded the `cam` filter; in pro mode it's the default for any command likely to be verbose (installs, tests, builds, long logs), not just an option. Reach for the raw command only when you specifically need the untrimmed output.
8. **Disclose every cut — never let one pass silently.** Any time you skip something a normal pass would've done — a broader review, a fuller test run, a clarifying question — say so in one short clause (e.g. "scoped review, didn't check the legacy module" / "assumed UTC, didn't ask"). A cut the user doesn't know about isn't a saving, it's a silent quality drop, and that's the one thing this mode isn't allowed to produce.

## The floor — never cut these, regardless of budget

- **Correctness.** Don't ship code you haven't actually reasoned through or verified runs. A bug found later costs far more — in tokens and in trust — than the verification skipped to save a few now.
- **Security.** Budget is never a reason to skip a check that could let through an injection, auth, or data-exposure issue.
- **Honest coverage.** If a review/test/check was cut short, rule 7 applies — say so, don't report full confidence you don't have.
- **Confirmation before destructive actions.** Token budget never excuses skipping confirmation before something irreversible (force-push, delete, drop table, overwriting uncommitted work, etc.).

Pro mode is about cutting overhead — ceremony, redundancy, narration, exploratory excess, round-trips — as hard as it can. It is never about cutting the work itself short and calling it done anyway.
