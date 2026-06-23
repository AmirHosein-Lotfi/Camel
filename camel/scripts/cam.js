#!/usr/bin/env node
// cam — run a command and trim its output before it reaches the model's context.
// Strips ANSI codes, collapses progress-bar spam and duplicate lines, and
// head/tail-truncates very long output. Never hides error lines. Exits with the
// wrapped command's own exit code.
//
// Usage:
//   node cam.js -- <command and args>
//   node cam.js --head 80 --tail 50 -- npm test
//
// Design goal: deterministic, zero model effort. The savings come from the
// fact that a 2,000-line install/test log usually carries a few dozen lines of
// real signal; everything else is noise that costs tokens to sit in context.

const { spawn } = require('child_process');

// Matches CSI/SGR escape sequences (colors, cursor moves, etc.).
const ANSI = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;

// Lines matching these are pure noise from common tools — safe to drop.
// Kept deliberately conservative so nothing diagnostic is ever removed.
const NOISE = [
  /^npm warn deprecated /i,
  /^npm notice/i,
  /^\s*(Downloading|Fetching|Resolving|Linking|Building fresh packages)\b/i,
  /^\s*\[?=*>?\s*\]?\s*\d+%/,            // bare progress bars
  /^\s*\d+\/\d+\s*$/,                     // "12/40" counters
  /^(info|verbose|silly)\b/i,
];

function parseArgs(argv) {
  const opts = { head: 60, tail: 40, maxLines: 200, cmd: [] };
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--') { opts.cmd = argv.slice(i + 1); break; }
    else if (a === '--head') { opts.head = parseInt(argv[++i], 10); }
    else if (a === '--tail') { opts.tail = parseInt(argv[++i], 10); }
    else if (a === '--max') { opts.maxLines = parseInt(argv[++i], 10); }
    else if (a === '--raw') { opts.raw = true; }
    i++;
  }
  return opts;
}

// Progress bars overwrite a line with \r; keep only the final state of each line.
function lastCarriageSegment(line) {
  const idx = line.lastIndexOf('\r');
  return idx === -1 ? line : line.slice(idx + 1);
}

function looksLikeError(line) {
  return /\b(error|fail|failed|exception|traceback|fatal|panic)\b/i.test(line)
    || /[✗✖×]/.test(line); // ✗ ✖ ×
}

function filter(raw, opts) {
  let lines = raw
    .replace(ANSI, '')
    .split('\n')
    .map(lastCarriageSegment);

  // Drop trailing empty lines.
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();

  if (opts.raw) return lines.join('\n');

  // Remove known noise, but never an error line.
  lines = lines.filter(l => looksLikeError(l) || !NOISE.some(re => re.test(l)));

  // Collapse consecutive duplicates into "line  (xN)".
  const collapsed = [];
  for (const line of lines) {
    const prev = collapsed[collapsed.length - 1];
    if (prev && prev.text === line) prev.count++;
    else collapsed.push({ text: line, count: 1 });
  }
  let out = collapsed.map(c => (c.count > 1 ? `${c.text}  (x${c.count})` : c.text));

  // Head/tail truncation for very long output — but keep every error line that
  // would otherwise fall in the cut middle, since errors are the whole point.
  if (out.length > opts.maxLines) {
    const head = out.slice(0, opts.head);
    const tail = out.slice(out.length - opts.tail);
    const middle = out.slice(opts.head, out.length - opts.tail);
    const keptErrors = middle.filter(looksLikeError);
    const dropped = middle.length - keptErrors.length;
    out = [
      ...head,
      `... [cam trimmed ${dropped} middle lines${keptErrors.length ? `, kept ${keptErrors.length} error line(s)` : ''}] ...`,
      ...keptErrors,
      ...tail,
    ];
  }

  return out.join('\n');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.cmd.length) {
    console.error('Usage: node cam.js [--head N --tail N --max N --raw] -- <command>');
    process.exit(2);
  }

  const child = spawn(opts.cmd.join(' '), { shell: true });
  let buf = '';
  child.stdout.on('data', d => { buf += d.toString(); });
  child.stderr.on('data', d => { buf += d.toString(); });

  child.on('close', code => {
    const rawLines = buf.split('\n').length;
    const filtered = filter(buf, opts);
    const newLines = filtered ? filtered.split('\n').length : 0;
    process.stdout.write(filtered);
    if (filtered && !filtered.endsWith('\n')) process.stdout.write('\n');
    if (rawLines > newLines) {
      const pct = Math.round((1 - newLines / rawLines) * 100);
      process.stdout.write(`[cam] ${rawLines}->${newLines} lines, ${pct}% trimmed (exit ${code})\n`);
    }
    process.exit(code);
  });

  child.on('error', err => {
    console.error(`[cam] failed to run command: ${err.message}`);
    process.exit(1);
  });
}

main();
