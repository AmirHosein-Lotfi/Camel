# camel

Three small Claude Code skills for when a session is burning more tokens than the work needs: one for sloppy file reads, one for agent and screenshot overkill, and one that stacks both and cuts harder for when the budget itself is the constraint.

## Why this exists

I kept watching Claude Code do the same three things on tasks that didn't call for them: read a whole file to find one function, spin up a subagent for something it could've just done directly, and take a screenshot of a UI change to "check" it instead of reading the diff. None of that is wrong on its own. It adds up fast across a long session, and most of it is avoidable without giving up anything real.

So `camel` is a set of mode-switching skills. Type the command, the discipline applies for the rest of the session, and how carefully the code itself gets written doesn't change at all.

## What's in here

| Command | What it does |
|---|---|
| `/camel` | Reading and tool-call discipline: targeted Grep before Read, offset/limit instead of full files, no redundant re-reads, no dumping verbose command output into context. |
| `/camel stats` | Pulls real numbers from this session's own transcript: tool-call counts, how many reads were targeted vs full, files read more than once, actual token usage per turn. No estimating. |
| `/camel-dam` | Turns off the default of spinning up subagents and taking screenshots to verify UI work. If Claude thinks a task genuinely needs delegating, it has to say so and ask first. For visual checks, it tells you what to look at instead of grabbing a screenshot itself. |
| `/camel-pro` | Loads `/camel` and `/camel-dam` together, then goes further: no plan write-ups for routine work, reasonable assumptions instead of clarifying questions, batched verification instead of checking after every step. Anything it cuts, it has to say out loud. |

Each one is a normal skill folder with a `SKILL.md`. Drop the ones you want into your skills directory and the slash commands show up.

## Install

Clone the repo, then copy whichever skill folders you want into your Claude Code skills directory.

macOS / Linux:
```bash
git clone https://github.com/AmirHosein-Lotfi/Camel.git
cp -r Camel/camel Camel/camel-dam Camel/camel-pro ~/.claude/skills/
```

Windows (PowerShell):
```powershell
git clone https://github.com/AmirHosein-Lotfi/Camel.git
Copy-Item -Recurse Camel\camel, Camel\camel-dam, Camel\camel-pro "$HOME\.claude\skills\"
```

Restart Claude Code (or start a new session) and `/camel`, `/camel-dam`, and `/camel-pro` will show up.

## What /camel stats looks like

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

## Why three commands instead of one

I wanted to turn on exactly what was costing tokens in a given session, not everything at once. A session that's mostly reading and grepping a codebase only needs `/camel`. A session full of frontend tweaks where Claude keeps grabbing screenshots needs `/camel-dam`. A session with a tight budget and a lot of ground to cover needs `/camel-pro`, which pulls in both and pushes further. Keeping them separate also means none of them get forced on you when they don't apply.

## What this doesn't do

None of these skills make Claude write worse code, skip edge cases, do a shallower review, or claim something works without checking it. `/camel-pro` is the most aggressive of the three, and even it has a hard rule: correctness, security, and disclosing what got cut are never on the table. If it skips something a full pass would have caught, it has to say so.

## Credit

The idea of a slash command that changes Claude's behavior for the rest of a session, plus a stats command that measures real savings instead of guessing, came from using [caveman](https://github.com/juliusbrussee/caveman). That skill rewrites everything Claude says into a much shorter register and tracks the savings the same way. `camel` borrows the pattern and points it at a different problem: how Claude reads files and decides when to delegate, instead of how it phrases replies. None of the code here is copied from that project; the credit is for the idea, not the implementation.

## License

MIT. See [LICENSE](./LICENSE).
