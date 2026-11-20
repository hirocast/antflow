#!/usr/bin/env node
// GitHub Issue (feedback ラベル) に添付されたスクショを画像ファイルに抽出するヘルパー
// 使い方: node scripts/extract_feedback_img.mjs <issue番号> [出力パス] [--repo owner/repo]
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const args = process.argv.slice(2);
let repo = process.env.AF_FEEDBACK_REPO || 'hirocast/antflow-feedback';
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--repo' && args[i + 1]) {
    repo = args[++i];
  } else if (args[i] === '--private') {
    repo = 'hirocast/antflow-feedback';
  } else if (args[i] === '--public') {
    repo = 'hirocast/antflow';
  } else {
    positional.push(args[i]);
  }
}

const num = positional[0];
if (!num || !/^\d+$/.test(num) || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) {
  console.error('Usage: node scripts/extract_feedback_img.mjs <issue-number> [out-path] [--repo owner/repo | --private]');
  process.exit(1);
}

const raw = execFileSync('gh', ['issue', 'view', num, '--repo', repo, '--json', 'body'], { encoding: 'utf8' });
const { body } = JSON.parse(raw);
const m = String(body || '').match(/<!--\s*FEEDBACK_IMG:(data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+))\s*-->/);
if (!m) {
  console.error(`Issue #${num} (${repo}) にはスクショが添付されていません`);
  process.exit(2);
}

const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
const outPath = positional[1] || `/tmp/feedback_${num}.${ext}`;
fs.writeFileSync(outPath, Buffer.from(m[3], 'base64'));
console.log(outPath);
