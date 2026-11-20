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
const m = String(body || '').match(/<!--\s*FEEDBACK_IMG:(data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+))\s*-->\s*$/);
if (!m) {
  console.error(`Issue #${num} (${repo}) にはスクショが添付されていません`);
  process.exit(2);
}

const fmt = m[2];
const buf = Buffer.from(m[3], 'base64');
const validMagic =
  buf.length >= 12 && (
    ((fmt === 'jpeg' || fmt === 'jpg') && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) ||
    (fmt === 'png' && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47 && buf[4] === 0x0D && buf[5] === 0x0A && buf[6] === 0x1A && buf[7] === 0x0A) ||
    (fmt === 'webp' && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50)
  );
if (!validMagic) {
  console.error(`Issue #${num} (${repo}) の添付画像データが不正です`);
  process.exit(3);
}

const ext = fmt === 'jpeg' ? 'jpg' : fmt;
const outPath = positional[1] || `/tmp/feedback_${num}.${ext}`;
fs.writeFileSync(outPath, buf);
console.log(outPath);
