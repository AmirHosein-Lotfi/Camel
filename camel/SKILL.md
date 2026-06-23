---
name: camel
description: Token-frugal reading and tool-call discipline for the rest of the session — prefer targeted Grep/offset+limit reads over full-file dumps, avoid redundant re-reads and repeated tool calls, and trim verbose command output before it lands in context. Invoke with /camel to switch the session into frugal mode, or /camel stats to see a real (non-estimated) breakdown of this session's tool-call and token usage pulled straight from the session transcript.
---

# Token-frugal mode (camel)

A camel crosses long stretches without stopping to drink. Most token waste in an agentic coding session doesn't come from prose — it comes from what gets pulled into context by tool calls: a full 2,000-line file read to find one function, the same file re-read three times across a session, a build log dumped wholesale when only the last error line mattered. This skill is a standing checklist for catching that waste *before* the tool call happens, not after — so the session goes just as far on a lot less.

This skill has two modes, decided by the argument it's invoked with:

- `/camel` (no argument) — adopt the discipline below for the rest of this conversation. Confirm activation in one short line, then keep following it silently; don't narrate every time you choose Grep over Read.
- `/camel stats` — run `scripts/stats.js` against this session's own transcript and report the numbers. These are exact counts pulled from the JSONL log, not an estimate.

## The discipline (when in frugal mode)

1. **Locate before you load.** Before reading a file to find something, Grep for it first. Only Read once you know which file and roughly which lines.
2. **Read ranges, not whole files.** Once Grep gives you a line number, use Read's `offset`/`limit` to pull a window around it instead of the whole file — especially for anything over a few hundred lines.
3. **Don't re-read what's already in context.** If you already Read a file this session and haven't since changed it through another tool, you already have its contents — don't call Read again to "double check." If you just used Edit/Write, the tool would have errored on failure, so there's no need to Read afterward just to confirm it worked.
4. **Filter verbose output at the source.** For build logs, test runs, installs — pipe to the part that matters (`| Select-String`, `-q`, `--silent`, tail the last N lines) instead of letting the full output land in context and summarizing it after the fact.
5. **Batch instead of looping.** If you're about to make the same small check across many files, do it as one Grep with a glob/type filter rather than N separate Read calls.
6. **Skip generated/vendored content.** Lockfiles, `node_modules`, build output, minified bundles — don't Read these to understand a codebase; they're bulk, not signal.
7. **Don't restate what a tool already returned.** If a result is already in context, point at it (e.g. `file:line`) instead of quoting it back at length in your own response.
8. **Scope searches before running them.** A broad `Glob`/`Grep` over an entire tree tends to come back huge and truncated, which costs more than it saves. Narrow the path or pattern first, and reach for `files_with_matches`/`head_limit` before pulling full content.

None of this is about being less thorough — it's about getting the same answer with less bulk sitting in context. If a full read genuinely is the right call (a 40-line config file, say), just do it; this isn't a ban on Read.

## The cam filter — trim command output mechanically

Rule 4 asks you to filter verbose output. `scripts/cam.js` does it deterministically so you don't have to hand-craft a pipe each time. It runs a command, then strips ANSI codes, collapses progress-bar redraws and repeated lines, drops known install/build noise, and head/tail-truncates very long logs — while always preserving lines that look like errors, including ones buried in the middle of a truncated section. It exits with the wrapped command's own exit code, so control flow is unchanged.

Route any command you expect to be noisy through it — installs, test runs, builds, linters, anything that tends to spew hundreds of lines where only a few matter:
```bash
node <skill-dir>/scripts/cam.js -- npm test
node <skill-dir>/scripts/cam.js -- pip install -r requirements.txt
node <skill-dir>/scripts/cam.js --head 80 --tail 60 -- cargo build
```
It prints a `[cam] 464->162 lines, 65% trimmed` footer so the saving is visible. Skip it when output is already short, or pass `--raw` to keep every line but still get the ANSI/progress cleanup. This is the most reliable single token cut in the skill: a typical install or test log is mostly noise that costs tokens just by sitting in context.

cam re-runs the wrapped command through a shell, which is reliable for plain token commands (`npm test`, `cargo build`, `pytest -q`, `node build.js`) — exactly the kind that produce verbose logs. It is *not* reliable for commands carrying their own shell quoting, semicolons, or pipes (e.g. an inline `node -e '...'` script), because the re-run goes through the platform's default shell and the quoting can be reinterpreted differently. Those commands are almost never the noisy ones anyway, so just run them directly without cam.

## Output discipline (light — always on in frugal mode)

Your own replies cost output tokens every turn, so keep them lean without going cryptic: no preamble restating the request, no "I'll now..." narration before acting, no closing summary that just repeats what the diff already shows. Prefer a short list or table over a paragraph when the content is structured, and say each thing once. This is the gentle version; `/camel-pro` pushes output compression much harder for when budget is genuinely tight.

For agent-spawning and screenshot-verification restraint specifically, see the separate `/camel-dam` skill — kept apart from this one so you can turn on read/tool discipline without also damming up agents and screenshots, or vice versa.

## Checking your savings

`/camel stats` runs `scripts/stats.js`, which:
- Finds this session's transcript under `~/.claude/projects/<project-hash>/` (most recently modified `.jsonl` in that folder)
- Counts tool calls by name, and splits Read calls into targeted (had `offset`/`limit`) vs full
- Flags files that were Read more than once
- Sums real token usage (input / output / cache write / cache read) straight from each turn's `usage` block
- Lists the biggest individual tool results by character count — i.e., where most of the context bulk actually came from

Run it from the skill directory:
```bash
node scripts/stats.js
```
Pass an explicit transcript path as the first argument if the auto-detected one isn't the session you want:
```bash
node scripts/stats.js "C:\Users\<you>\.claude\projects\<hash>\<session-id>.jsonl"
```
