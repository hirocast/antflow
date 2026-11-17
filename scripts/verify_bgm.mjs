#!/usr/bin/env node
// BGM音程・リズム・歌詞タイミング高精度検証スクリプト
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SOUND_JS = path.join(ROOT, 'sound.js');

function loadSound() {
  const code = fs.readFileSync(SOUND_JS, 'utf8');
  const sandbox = {
    window: {},
    AF_LOADED: [],
    setInterval: () => 0,
    clearInterval: () => {},
    Math,
    Set,
    Array,
    Object,
    console,
  };
  return vm.runInNewContext(code + '\nSound;', sandbox);
}

const SOLFEGE_SHARP = ['ド', 'ド♯', 'レ', 'レ♯', 'ミ', 'ファ', 'ファ♯', 'ソ', 'ソ♯', 'ラ', 'ラ♯', 'シ'];
const SOLFEGE_FLAT  = ['ド', 'レ♭', 'レ', 'ミ♭', 'ミ', 'ファ', 'ソ♭', 'ソ', 'ラ♭', 'ラ', 'シ♭', 'シ'];

function noteName(n, useFlat = false) {
  const oct = Math.floor(n / 12); // 1 = C4..B4, 0 = C3..B3, 2 = C5..B5
  const pc = ((n % 12) + 12) % 12;
  const base = (useFlat ? SOLFEGE_FLAT : SOLFEGE_SHARP)[pc];
  const mark = oct <= 0 ? '↓'.repeat(1 - oct) : oct >= 2 ? '↑'.repeat(oct - 1) : '';
  return base + mark;
}

function durName(d) {
  const map = {
    1: '16分', 2: '8分', 3: '付点8分', 4: '4分',
    5: '4分+16分', 6: '付点4分', 7: '4分+付点8分',
    8: '2分', 10: '2分+8分', 12: '付点2分', 16: '全音符'
  };
  return map[d] || `${d}拍/16`;
}

// 日本語歌詞のモーラ（音節）数を概算（♪・空白・〜・ー・っ・ゃゅょを除く）
function countMora(lyric) {
  if (!lyric) return 0;
  const s = lyric
    .replace(/♪/g, '')
    .replace(/[〜ー\s　・]/g, '')
    .replace(/[っッぁぃぅぇぉゃゅょゎァィゥェォャュョヮ]/g, '');
  return s.length;
}

function toAsciiSafe(str) {
  const map = {
    あ:'a',い:'i',う:'u',え:'e',お:'o',か:'ka',き:'ki',く:'ku',け:'ke',こ:'ko',
    さ:'sa',し:'shi',す:'su',せ:'se',そ:'so',た:'ta',ち:'chi',つ:'tsu',て:'te',と:'to',
    な:'na',に:'ni',ぬ:'nu',ね:'ne',の:'no',は:'ha',ひ:'hi',ふ:'fu',へ:'he',ほ:'ho',
    ま:'ma',み:'mi',む:'mu',め:'me',も:'mo',や:'ya',ゆ:'yu',よ:'yo',
    ら:'ra',り:'ri',る:'ru',れ:'re',ろ:'ro',わ:'wa',を:'o',ん:'n',
    が:'ga',ぎ:'gi',ぐ:'gu',げ:'ge',ご:'go',ざ:'za',じ:'ji',ず:'zu',ぜ:'ze',ぞ:'zo',
    だ:'da',ぢ:'ji',づ:'zu',で:'de',ど:'do',ば:'ba',び:'bi',ぶ:'bu',べ:'be',ぼ:'bo',
    ぱ:'pa',ぴ:'pi',ぷ:'pu',ぺ:'pe',ぽ:'po',っ:'-',ー:'-', '〜':'~',
    ア:'a',イ:'i',ウ:'u',エ:'e',オ:'o',カ:'ka',キ:'ki',ク:'ku',ケ:'ke',コ:'ko',
    サ:'sa',シ:'shi',ス:'su',セ:'se',ソ:'so',タ:'ta',チ:'chi',ツ:'tsu',テ:'te',ト:'to',
    ナ:'na',ニ:'ni',ヌ:'nu',ネ:'ne',ノ:'no',ハ:'ha',ヒ:'hi',フ:'fu',ヘ:'he',ホ:'ho',
    マ:'ma',ミ:'mi',ム:'mu',メ:'me',モ:'mo',ヤ:'ya',ユ:'yu',ヨ:'yo',
    ラ:'ra',リ:'ri',ル:'ru',レ:'re',ロ:'ro',ワ:'wa',ヲ:'o',ン:'n',
    ガ:'ga',ギ:'gi',グ:'gu',ゲ:'ge',ゴ:'go',ザ:'za',ジ:'ji',ズ:'zu',ゼ:'ze',ゾ:'zo',
    ダ:'da',ヂ:'ji',ヅ:'zu',デ:'de',ド:'do',バ:'ba',ビ:'bi',ブ:'bu',ベ:'be',ボ:'bo',
    パ:'pa',ピ:'pi',プ:'pu',ペ:'pe',ポ:'po',ッ:'-',ャ:'ya',ュ:'yu',ョ:'yo',
    '♪':'*'
  };
  return Array.from(str || '').map(ch => map[ch] ?? (/^[\x20-\x7e]$/.test(ch) ? ch : ' ')).join('').replace(/\s+/g, ' ').trim();
}

function barsEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ma = a[i].m || [], mb = b[i].m || [];
    if (ma.length !== mb.length) return false;
    for (let j = 0; j < ma.length; j++) {
      if (ma[j][0] !== mb[j][0] || ma[j][1] !== mb[j][1] || ma[j][2] !== mb[j][2]) return false;
    }
  }
  return true;
}

function auditSong(key, song, lyrics, title) {
  const issues = [];
  const bSteps = song.barSteps || 16;
  const useFlat = key === 'birthday' || key === 'doremi';
  const checkSection = (secName, list) => {
    let prevN = null;
    list.forEach((bar, idx) => {
      const m = bar.m || [];
      let prevEnd = -1;
      m.forEach(([st, n, d], ni) => {
        if (st < 0 || st >= bSteps) {
          issues.push({ level: 'ERROR', msg: `${secName}[${idx}] note#${ni}: step ${st} が小節範囲外 (0..${bSteps - 1})` });
        }
        if (d <= 0) {
          issues.push({ level: 'ERROR', msg: `${secName}[${idx}] note#${ni}: 音価 d=${d} が0以下` });
        }
        if (st + d > bSteps) {
          issues.push({ level: 'ERROR', msg: `${secName}[${idx}] note#${ni} (${noteName(n, useFlat)}): step ${st}+${d}=${st + d} > ${bSteps} (小節はみ出し)` });
        }
        if (st < prevEnd) {
          issues.push({ level: 'ERROR', msg: `${secName}[${idx}] note#${ni} (${noteName(n, useFlat)}): step ${st} が前の音 (end=${prevEnd}) と重複/逆順` });
        }
        if (prevN !== null && Math.abs(n - prevN) >= 10) {
          issues.push({
            level: 'CHECK',
            msg: `${secName}[${idx}] 大きな跳躍 (${Math.abs(n - prevN)}半音): ${noteName(prevN, useFlat)}(${prevN}) → ${noteName(n, useFlat)}(${n})`
          });
        }
        prevEnd = st + d;
        prevN = n;
      });
    });
  };

  if (song.intro) {
    checkSection('intro', song.intro);
    if (barsEqual(song.intro, song.bars.slice(0, song.intro.length))) {
      issues.push({ level: 'WARN', msg: `intro が本編冒頭と同じです（前奏らしく聞こえない可能性）` });
    }
    const lastBar = song.intro[song.intro.length - 1];
    const lastM = lastBar?.m || [];
    if (lastM.length) {
      const lastNote = lastM[lastM.length - 1][1];
      const expectedTonic = lastBar.r2 !== undefined ? lastBar.r2 : lastBar.r;
      if (((lastNote % 12) + 12) % 12 !== ((expectedTonic % 12) + 12) % 12) {
        issues.push({
          level: 'WARN',
          msg: `intro の最終音 ${noteName(lastNote, useFlat)} が終止コードの主音 (root=${expectedTonic}) に解決していません`
        });
      }
    }
  }
  checkSection('bars', song.bars);

  if (lyrics) {
    if (lyrics.length !== song.bars.length) {
      issues.push({ level: 'ERROR', msg: `LYRICS 行数 (${lyrics.length}) !== bars 数 (${song.bars.length})` });
    } else {
      song.bars.forEach((bar, idx) => {
        const notes = (bar.m || []).length;
        const mora = countMora(lyrics[idx]);
        if (notes > 0 && Math.abs(mora - notes) > 2 && !(mora === 0 && notes === 1)) {
          issues.push({
            level: 'WARN',
            msg: `bars[${idx}] 音符数(${notes}) と歌詞モーラ数(${mora}) に差があります: "${lyrics[idx]}"`
          });
        }
      });
    }
  } else if (key !== 'matsuri' && key !== 'breeze') {
    issues.push({ level: 'WARN', msg: `LYRICS.${key} が未定義です` });
  }

  return { key, title, bpm: song.bpm, bSteps, style: song.style, useFlat, issues };
}

function formatSongTimeline(key, song, lyrics, title) {
  const bSteps = song.barSteps || 16;
  const useFlat = key === 'birthday' || key === 'doremi';
  const lines = [];
  lines.push(`=== ${key} (${title}) | BPM=${song.bpm} | ${bSteps}/16 (${bSteps === 12 ? '3/4' : '2/4×2 or 4/4'}) | style=${song.style} ===`);
  const dump = (label, list, lyrList) => {
    list.forEach((bar, i) => {
      const notesStr = (bar.m || []).map(([st, n, d]) => `[${st}]${noteName(n, useFlat)}(${durName(d)})`).join(' ');
      const lyr = lyrList ? lyrList[i] : (label === 'intro' ? '♪ 〜（前奏）' : '');
      const lyrCol = lyr ? ` | ${lyr}` : '';
      lines.push(`  ${label}[${String(i).padStart(2, ' ')}]${lyrCol}\n           ${notesStr}`);
    });
  };
  if (song.intro) dump('intro', song.intro, null);
  dump('bars ', song.bars, lyrics);
  return lines.join('\n');
}

function renderPng(key, song, lyrics, title, outPath) {
  const safeLyrics = (lyrics || []).map(toAsciiSafe);
  const payload = JSON.stringify({ key, song, lyrics: safeLyrics, title: toAsciiSafe(title) });
  const py = `
import json, sys
from PIL import Image, ImageDraw

data = json.loads(sys.stdin.read())
song = data['song']
lyrics = data['lyrics'] or []
bSteps = song.get('barSteps') or 16
intro = song.get('intro') or []
bars = song.get('bars') or []
rows = [('intro', i, b, '* intro') for i, b in enumerate(intro)] + [('bar', i, b, lyrics[i] if i < len(lyrics) else '') for i, b in enumerate(bars)]

all_notes = [n for _, _, b, _ in rows for _, n, _ in b.get('m', [])]
min_n = min(all_notes) - 1 if all_notes else 10
max_n = max(all_notes) + 1 if all_notes else 26

W_LABEL = 240
CELL_W = 28
ROW_H = 66
TOP_H = 44
W = W_LABEL + bSteps * CELL_W + 24
H = TOP_H + len(rows) * ROW_H + 16

im = Image.new('RGB', (W, H), '#fcfaff')
d = ImageDraw.Draw(im)
d.text((12, 12), f"{data['key']} | BPM={song['bpm']} | barSteps={bSteps}", fill='#3a2a3a')

SOL_S = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

for r_idx, (kind, idx, b, lyr) in enumerate(rows):
  y0 = TOP_H + r_idx * ROW_H
  bg = '#f3f0ff' if kind == 'intro' else ('#ffffff' if r_idx % 2 == 0 else '#faf6fa')
  d.rectangle([0, y0, W, y0 + ROW_H - 1], fill=bg)
  d.line([0, y0 + ROW_H - 1, W, y0 + ROW_H - 1], fill='#e5dce8')
  d.text((10, y0 + 8), f"{kind}[{idx}]", fill='#6b5b7b')
  d.text((10, y0 + 28), lyr, fill='#c23b55')
  for s in range(bSteps + 1):
    x = W_LABEL + s * CELL_W
    col = '#c8bed0' if s % 4 == 0 else '#efeaf2'
    d.line([x, y0, x, y0 + ROW_H - 1], fill=col)
    if r_idx == 0 and s < bSteps and s % 4 == 0:
      d.text((x + 2, 26), str(s), fill='#8a748a')
  for st, n, dur in b.get('m', []):
    x1 = W_LABEL + st * CELL_W + 2
    x2 = W_LABEL + (st + dur) * CELL_W - 2
    norm = (n - min_n) / max(1, max_n - min_n)
    ny = y0 + ROW_H - 14 - int(norm * (ROW_H - 26))
    col = '#3949ab' if kind == 'intro' else '#ff5a8a'
    d.rounded_rectangle([x1, ny - 8, x2, ny + 8], radius=4, fill=col, outline='#3a2a3a')
    oct_m = '-' if n < 12 else ('+' if n >= 24 else '')
    lbl = f"{SOL_S[n % 12]}{oct_m}({dur})"
    d.text((x1 + 3, ny - 6), lbl, fill='#ffffff')

im.save(sys.argv[1])
`;
  execFileSync('python3', ['-c', py, outPath], { input: payload, stdio: ['pipe', 'inherit', 'inherit'] });
}

// CLI
const args = process.argv.slice(2);
const songFilter = args.includes('--song') ? args[args.indexOf('--song') + 1] : null;
const showTimeline = args.includes('--timeline') || Boolean(songFilter);
const pngPath = args.includes('--png') ? args[args.indexOf('--png') + 1] : null;

const Sound = loadSound();
const keys = songFilter ? [songFilter] : Object.keys(Sound.EXTRA_SONGS);

let errorCount = 0;
let warnCount = 0;

for (const k of keys) {
  const song = Sound.EXTRA_SONGS[k];
  if (!song) {
    console.error(`Unknown song: ${k}`);
    process.exit(2);
  }
  const res = auditSong(k, song, Sound.LYRICS[k], Sound.BGM_TITLES?.[k] || k);
  const errs = res.issues.filter(x => x.level === 'ERROR');
  const warns = res.issues.filter(x => x.level === 'WARN');
  const checks = res.issues.filter(x => x.level === 'CHECK');
  errorCount += errs.length;
  warnCount += warns.length;

  const status = errs.length ? 'FAIL' : warns.length ? 'WARN' : 'OK';
  console.log(`[${status}] ${k} (${res.title}) — BPM:${res.bpm}, bars:${song.bars.length}, intro:${song.intro ? song.intro.length : 0}, errors:${errs.length}, warns:${warns.length}, checks:${checks.length}`);
  for (const it of res.issues) {
    console.log(`   - [${it.level}] ${it.msg}`);
  }
  if (showTimeline) {
    console.log(formatSongTimeline(k, song, Sound.LYRICS[k], res.title));
  }
  if (pngPath && (songFilter === k || !songFilter)) {
    const target = songFilter ? pngPath : pngPath.replace(/\.png$/i, `_${k}.png`);
    renderPng(k, song, Sound.LYRICS[k], res.title, target);
    console.log(`   -> PNG saved: ${target}`);
  }
}

if (errorCount > 0) process.exit(1);
