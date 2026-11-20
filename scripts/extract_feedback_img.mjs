#!/usr/bin/env node
// GitHub Issue (feedback ラベル) に添付されたスクショを画像ファイルに抽出するヘルパー
// 使い方: node scripts/extract_feedback_img.mjs <issue番号> [出力パス]
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const num = process.argv[2];
if (!num || !/^\d+$/.test(num)) {
  console.error('Usage: node scripts/extract_feedback_img.mjs <issue-number> [out-path]');
  process.exit(1);
}

const raw = execFileSync('gh', ['issue', 'view', num, '--repo', 'hirocast/antflow', '--json', 'body'], { encoding: 'utf8' });
const { body } = JSON.parse(raw);
const m = String(body || '').match(/<!--\s*FEEDBACK_IMG:(data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+))\s*-->/);
if (!m) {
  console.error('Issue #' + num + ' にはスクショが添付されていません');
  process.exit(2);
}

const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
const outPath = process.argv[3] || `/tmp/feedback_${num}.${ext}`;
fs.writeFileSync(outPath, Buffer.from(m[3], 'base64'));
console.log(outPath);
