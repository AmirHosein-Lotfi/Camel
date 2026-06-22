---
name: camel-dam
description: Dams up two specific token-heavy habits for the rest of the session — spawning subagents/Workflow by default, and taking your own screenshots to verify visual/frontend work. Invoke with /camel-dam to switch the session into this mode. While active, Claude defaults to doing tasks itself instead of fanning out to agents (asking the user first if it genuinely believes a task needs delegating), and skips browser/computer-use/preview screenshot tools for design verification — asking the user to test locally and send a screenshot instead. Does not reduce coding, debugging, or code-review quality or thoroughness in any way; it only removes these two specific orchestration habits.
---

# Agent and screenshot dam (camel-dam)

Two specific habits burn tokens disproportionately to the value they add: spawning subagents for tasks that didn't need one, and running a render-screenshot-inspect-iterate loop to "see" a UI change instead of just reasoning about the code and the diff. Both are easy defaults to fall into even on simple or moderate tasks, and both have a real cost — a subagent starts cold and re-derives context already available in the main thread; a screenshot loop adds image tokens and round-trips for confirmation that's often available more cheaply other ways.

`/camel-dam` turns both off for the rest of the conversation — a camel doesn't make a detour to a watering hole it doesn't need.

## While active

1. **Don't reach for subagents/Workflow as the default.** Handle the task directly in the main thread with your own tools (Read, Grep, Edit, Bash, etc.), including tasks that feel large — size alone isn't a reason to fan out. A subagent should be the exception you ask about, not the default you reach for.
2. **If you genuinely think a task needs a subagent, ask first.** Don't decide on your own that something warrants agents and launch them. State specifically what you think needs delegating and why (e.g. "this needs N independent searches across unrelated areas of the codebase — want me to spawn agents for that, or should I do it myself, serially?") and wait for a yes before spawning anything.
3. **Don't take your own screenshots to verify visual/frontend work.** Skip browser, computer-use, and preview screenshot tools as a way of checking a UI or design change you just made. Instead, tell the user exactly what to check (e.g. "run the dev server and look at the header spacing on mobile, around 600px width") and ask them to send a screenshot back if visual confirmation actually matters.
4. **This is scoped to orchestration habits, not to rigor.** Nothing here means writing less careful code, skipping edge cases, doing a shallower code review, or claiming something works without checking it through means still available to you — reading the diff, running tests, type-checking, tracing the logic by hand. The goal is fewer agents and fewer self-taken screenshots, not a lower bar anywhere else. If a task is genuinely too large or too parallel for one thread to handle well, rule 2 is the way through that — ask, don't just stay silent and grind serially through something that really did need delegating.

This pairs with, but is independent from, the `/camel` skill (read/tool-call discipline). Turn on either one alone, or both together, depending on what's actually costing you tokens in a given session.
