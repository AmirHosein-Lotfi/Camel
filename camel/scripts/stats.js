#!/usr/bin/env node
// Computes real (non-estimated) tool-call and token stats from a Claude Code
// session transcript JSONL file. No LLM involved — pure log parsing.

const fs = require('fs');
const os = require('os');
const path = require('path');

function findTranscriptPath(explicitPath) {
  if (explicitPath) return explicitPath;

  const projectHash = process.cwd().replace(/[:\\/ ]/g, '-');
  const dir = path.join(os.homedir(), '.claude', 'projects', projectHash);

  if (!fs.existsSync(dir)) {
    throw new Error(
      `No transcript directory found at ${dir}\n` +
      `Pass the transcript path explicitly: node stats.js <path-to-session>.jsonl`
    );
  }

  const candidates = fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isFile() && d.name.endsWith('.jsonl'))
    .map(d => {
      const full = path.join(dir, d.name);
      return { full, mtime: fs.statSync(full).mtimeMs };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (candidates.length === 0) {
    throw new Error(`No .jsonl session files found in ${dir}`);
  }

  return candidates[0].full;
}

function resultText(content) {
  if (typeof content === 'string') return content;
  try {
    return JSON.stringify(content);
  } catch {
    return '';
  }
}

function analyze(transcriptPath) {
  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

  const toolCounts = {};
  const toolUseIndex = new Map(); // tool_use_id -> { name, input }
  const readFileCounts = new Map(); // file_path -> count
  const resultSizeByTool = {};
  const bigResults = [];

  let turns = 0;
  let inputTokens = 0, outputTokens = 0, cacheWrite = 0, cacheRead = 0;
  let targetedReads = 0, fullReads = 0;

  for (const line of lines) {
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue; // malformed/truncated line, skip
    }

    if (obj.type === 'assistant') {
      const usage = (obj.message && obj.message.usage) || {};
      inputTokens += usage.input_tokens || 0;
      outputTokens += usage.output_tokens || 0;
      cacheWrite += usage.cache_creation_input_tokens || 0;
      cacheRead += usage.cache_read_input_tokens || 0;
      turns++;

      const content = obj.message && obj.message.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type !== 'tool_use') continue;
          toolCounts[item.name] = (toolCounts[item.name] || 0) + 1;
          toolUseIndex.set(item.id, { name: item.name, input: item.input || {} });

          if (item.name === 'Read' && item.input && item.input.file_path) {
            const fp = item.input.file_path;
            readFileCounts.set(fp, (readFileCounts.get(fp) || 0) + 1);
            if (item.input.offset != null || item.input.limit != null) targetedReads++;
            else fullReads++;
          }
        }
      }
    }

    if (obj.type === 'user') {
      const content = obj.message && obj.message.content;
      if (Array.isArray(content)) {
        for (const item of content) {
          if (item.type !== 'tool_result') continue;
          const info = toolUseIndex.get(item.tool_use_id);
          const text = resultText(item.content);
          const size = text.length;
          if (!info) continue;

          resultSizeByTool[info.name] = (resultSizeByTool[info.name] || 0) + size;

          const label = info.name === 'Read' ? info.input.file_path
            : info.name === 'Grep' ? (info.input.pattern || '')
            : info.name === 'Bash' || info.name === 'PowerShell' ? (info.input.command || '')
            : '';
          bigResults.push({ name: info.name, label, size });
        }
      }
    }
  }

  const totalTokens = inputTokens + outputTokens + cacheWrite + cacheRead;
  const cacheDenominator = cacheRead + cacheWrite + inputTokens;
  const cacheHitRate = cacheDenominator > 0 ? cacheRead / cacheDenominator : 0;

  const rereadFiles = [...readFileCounts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  bigResults.sort((a, b) => b.size - a.size);

  return {
    transcriptPath, turns,
    inputTokens, outputTokens, cacheWrite, cacheRead, totalTokens, cacheHitRate,
    toolCounts, targetedReads, fullReads, rereadFiles,
    resultSizeByTool, topResults: bigResults.slice(0, 5),
  };
}

function fmt(n) {
  return n.toLocaleString('en-US');
}

function report(stats) {
  const lines = [];
  lines.push(`Transcript: ${stats.transcriptPath}`);
  lines.push(`Assistant turns: ${fmt(stats.turns)}`);
  lines.push('');
  lines.push('-- Token usage (real, from usage blocks) --');
  lines.push(`  input:        ${fmt(stats.inputTokens)}`);
  lines.push(`  output:       ${fmt(stats.outputTokens)}`);
  lines.push(`  cache write:  ${fmt(stats.cacheWrite)}`);
  lines.push(`  cache read:   ${fmt(stats.cacheRead)}`);
  lines.push(`  total:        ${fmt(stats.totalTokens)}`);
  lines.push(`  cache hit rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
  lines.push('');
  lines.push('-- Tool call counts --');
  for (const [name, count] of Object.entries(stats.toolCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${name}: ${count}`);
  }
  lines.push('');
  const totalReads = stats.targetedReads + stats.fullReads;
  if (totalReads > 0) {
    const pct = ((stats.targetedReads / totalReads) * 100).toFixed(0);
    lines.push(`-- Read calls: ${stats.targetedReads}/${totalReads} targeted (offset/limit) = ${pct}% --`);
  }
  if (stats.rereadFiles.length > 0) {
    lines.push('');
    lines.push('-- Files Read more than once --');
    for (const [fp, count] of stats.rereadFiles) {
      lines.push(`  ${count}x  ${fp}`);
    }
  }
  if (stats.topResults.length > 0) {
    lines.push('');
    lines.push('-- Biggest individual tool results (chars) --');
    for (const r of stats.topResults) {
      lines.push(`  ${fmt(r.size)}  ${r.name}  ${r.label}`);
    }
  }
  return lines.join('\n');
}

try {
  const explicitPath = process.argv[2];
  const transcriptPath = findTranscriptPath(explicitPath);
  const stats = analyze(transcriptPath);
  console.log(report(stats));
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
