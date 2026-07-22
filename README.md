<div align="center">

# 🐫 camel

**Claude Code sessions that go the distance on a lot less.**

Four small, composable skills that catch token waste *before* it happens — sloppy reads, agent/screenshot overkill, and self-checks the user could run in one second.

[![License: MIT](https://img.shields.io/badge/license-MIT-4c9a8e?style=flat-square)](./LICENSE)
[![Skills](https://img.shields.io/badge/skills-4-b98c4a?style=flat-square)](#whats-in-here)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Linux%20%7C%20Windows-6b8fb3?style=flat-square)](#install)
[![Install](https://img.shields.io/badge/install-one%20line-2ea44f?style=flat-square)](#install)

_Also available in [فارسی](./README.fa.md)._

</div>

---

A camel crosses long stretches without stopping to drink. Most token waste in an agentic coding session doesn't come from prose — it comes from what gets pulled into context: a full 2,000-line file read to find one function, a subagent spun up for something that could've been done directly, a screenshot loop to "see" a UI change instead of reading the diff, a full test suite run just to confirm something the user could check in one command. `camel` is a standing checklist that catches that waste before the tool call happens, not after.

Type a command, the discipline applies for the rest of the session. **How carefully the code itself gets written never changes — this only cuts orchestration overhead, not rigor.**

## Contents

- [Why this exists](#why-this-exists)
- [What's in here](#whats-in-here)
- [The cam filter](#the-cam-filter)
- [Install](#install)
- [What `/camel stats` looks like](#what-camel-stats-looks-like)
- [Why four commands instead of one](#why-four-commands-instead-of-one)
- [What this doesn't do](#what-this-doesnt-do)
- [Credit](#credit)

## Why this exists

I kept watching Claude Code do the same things on tasks that didn't call for them:

- Read a whole file to find one function.
- Spin up a subagent for something it could've just done directly.
- Take a screenshot of a UI change to "check" it instead of reading the diff.
- Run a full test suite / build / dev server just to confirm something the user was already going to check themselves.

None of that is wrong on its own. It adds up fast across a long session, and almost all of it is avoidable without giving up anything real.

## What's in here

| Command | What it does |
|---|---|
| 🎯 `/camel` | Reading and tool-call discipline: targeted Grep before Read, offset/limit instead of full files, no redundant re-reads, plus the `cam` filter for trimming verbose command output before it lands in context. |
| 📊 `/camel stats` | Pulls real numbers from this session's own transcript: tool-call counts, how many reads were targeted vs full, files read more than once, actual token usage per turn. No estimating. |
| 🚧 `/camel-dam` | Turns off three defaults: spinning up subagents, taking screenshots to verify UI work, and proactively running tests/builds/dev servers the user could just as easily run themselves. If Claude thinks a task genuinely needs delegating, it has to say so and ask first — and for anything else, it tells you the exact command and expected result instead of spending tokens running it for you. |
| ⚡ `/camel-pro` | Maximum cut. Loads `/camel` and `/camel-dam`, then goes further: a compressed high-density output register, `cam` on by default for noisy commands, no plan write-ups for routine work, reasonable assumptions instead of clarifying questions, batched verification. Anything it cuts, it says out loud. |

Each one is a normal skill folder with a `SKILL.md`. Drop the ones you want into your skills directory and the slash commands show up.

## The cam filter

`/camel` ships a small command wrapper, `camel/scripts/cam.js`, that attacks the other big token sink: command output. A single `npm install` or test run can dump hundreds of lines into context where only a handful matter. cam runs the command, strips ANSI codes, collapses progress-bar redraws and repeated lines, drops known install/build noise, and head/tail-truncates very long logs — all while keeping every line that looks like an error, even ones buried in the middle. It exits with the wrapped command's own code, so nothing downstream changes.

```bash
node camel/scripts/cam.js -- npm test
# ...trimmed output...
# [cam] 464->162 lines, 65% trimmed (exit 0)
```

It works on plain commands (package managers, test runners, builds). For commands that carry their own shell quoting or pipes, run them directly instead, since the wrapper re-runs through a shell and the quoting can shift. Pass `--raw` to keep every line but still clean up ANSI and progress spam.

## Install

<table>
<tr><td>

**macOS / Linux / WSL / Git Bash**

```bash
curl -fsSL https://raw.githubusercontent.com/AmirHosein-Lotfi/Camel/main/install.sh | bash
```

</td></tr>
<tr><td>

**Windows (PowerShell)**

```powershell
irm https://raw.githubusercontent.com/AmirHosein-Lotfi/Camel/main/install.ps1 | iex
```

</td></tr>
</table>

Both scripts download the repo and copy `camel`, `camel-dam`, and `camel-pro` into `~/.claude/skills/`. Set `CLAUDE_SKILLS_DIR` first if yours lives somewhere else. Restart Claude Code (or start a new session) afterward and the commands will show up.

<details>
<summary><strong>Prefer not to pipe a script into your shell? Install manually.</strong></summary>

```bash
git clone https://github.com/AmirHosein-Lotfi/Camel.git
cp -r Camel/camel Camel/camel-dam Camel/camel-pro ~/.claude/skills/
```

</details>

## What `/camel stats` looks like

```
Transcript: ~/.claude/projects/<project-hash>/<session-id>.jsonl
Assistant turns: 57

-- Token usage (real, from usage blocks) --
  input:        111
  output:       78,507
  cache write:  456,380
  cache read:   5,256,785
  total:        5,791,783
  cache hit rate: 92.0%

-- Tool call counts --
  Glob: 9
  Bash: 7
  Write: 3
  AskUserQuestion: 2
  ...

-- Read calls: 6/9 targeted (offset/limit) = 67% --
```

Every number there comes straight from the transcript file Claude Code already writes to disk. Nothing is guessed.

## Why four commands instead of one

I wanted to turn on exactly what was costing tokens in a given session, not everything at once.

| Your session looks like... | Reach for... |
|---|---|
| Mostly reading and grepping a codebase | `/camel` |
| Frontend tweaks where Claude keeps grabbing screenshots, spawning agents, or re-running tests to "check" | `/camel-dam` |
| Tight budget, a lot of ground to cover | `/camel-pro` (pulls in both, pushes further) |
| Want the receipts | `/camel stats` |

Keeping them separate means none of them get forced on you when they don't apply.

## What this doesn't do

None of these skills make Claude write worse code, skip edge cases, do a shallower review, or claim something works without a real basis for believing so. `/camel-pro` is the most aggressive of the four, and even it has a hard floor: correctness, security, and disclosing what got cut are never on the table. If it skips something a full pass would have caught, it has to say so.

## Credit

The idea of a slash command that changes Claude's behavior for the rest of a session, plus a stats command that measures real savings instead of guessing, came from using [caveman](https://github.com/juliusbrussee/caveman). That skill rewrites everything Claude says into a much shorter register and tracks the savings the same way. `camel` borrows the pattern and points it at a different problem: how Claude reads files, decides when to delegate, and decides when to check its own work — instead of how it phrases replies. None of the code here is copied from that project; the credit is for the idea, not the implementation.

## License

MIT. See [LICENSE](./LICENSE).
