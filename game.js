'use strict';
/*
 * Baby Craft — 6살 아이를 위한 탐험·제작 게임 + 한글/영어 읽기 카드
 *
 * 1단계: 맵, 이동(키보드/조이스틱), 아이템 줍기, 인벤토리, 집,
 *        단어 카드 읽기(음성 인식 판정 + 따라 읽기 + 탭 모드 폴백)
 *
 * 학습 기록은 이 기기의 localStorage 에만 저장한다. 외부로 보내지 않는다.
 */

// ============================================================
// CONFIG — 조절하고 싶은 값은 여기 모아둔다
// ============================================================
const CONFIG = {
  // 맵
  TILE: 32,               // 맵 그림의 타일 크기(px). 화면 배율은 VIEW_TILES 로 정해진다
  MAP_W: 40,
  MAP_H: 30,
  VIEW_TILES: 9,          // 화면 짧은 변에 보이는 타일 수
  PLAYER_SPEED: 4.2,      // 타일/초
  PLAYER_RADIUS: 0.3,     // 타일 단위 충돌 반경
  ITEM_COUNT: 16,
  ITEM_RESPAWN_MS: 6000,
  HEART_COUNT: 4,         // 맵에 떠 있는 ❤️ 하트 수
  HEART_RESPAWN_MS: 10000,
  HEART_HEAL: 2,          // ❤️ 하나로 채우는 체력
  PICKUP_RADIUS: 0.7,     // 타일 단위

  // 전투
  MAX_HEARTS: 5,
  INVULN_SEC: 1.2,        // 다친 뒤 무적 시간
  HIT_FLASH_SEC: 0.35,    // 맞았을 때 빨갛게 번쩍이며 흔들리는 시간
  STEP_SEC: 0.3,          // 발자국 소리 간격
  KNOCKBACK: 6,           // 맞았을 때 뒤로 밀리는 속도 (타일/초, 0.15초 동안)
  SPAWN_INVULN_SEC: 3,    // 기절 후 집에서 다시 시작할 때 무적 시간
  MONSTER_COUNT: 5,
  MONSTER_RESPAWN_MS: 8000,
  AGGRO_RANGE: 4.5,       // 타일. 이 안에 들어오면 몬스터가 다가온다
  SAFE_RADIUS: 4,         // 타일. 집 주변은 몬스터가 못 들어오는 안전지대
  ATTACK_RANGE: 0.9,      // 타일. 근접 무기 사거리
  ARROW_SPEED: 10,        // 타일/초
  ARROW_RANGE: 6,         // 타일
  BOSS_AFTER_KILLS: 3,    // 몬스터를 이만큼 잡으면 보스 등장
  BOSS_CARDS: 3,          // 보스를 잡으면 읽을 카드 수

  // 원격 2인용
  NET_SEND_MS: 100,       // 상태를 보내는 간격
  NET_EVENT_KEEP_MS: 3000, // 줍기/때리기 같은 이벤트를 이 시간 동안 계속 실어 보낸다
  NET_TIMEOUT_MS: 8000,   // 이 시간 동안 소식이 없으면 상대가 나간 것으로 본다
  NAME_MAX: 8,

  // 읽기 판정
  JUDGE_THRESHOLDS: { loose: 0.5, normal: 0.65, strict: 0.8 },
  CONTAINS_SCORE: 0.95,   // 인식 결과 문장 안에 정답이 들어있을 때 점수
  MAX_ALTERNATIVES: 5,
  HINT_DELAY_MS: 5000,    // 이 시간 동안 시도가 없으면 🔊 반짝임
  MAX_TRIES: 3,           // 이만큼 틀리면 "따라 읽어봐!" 모드
  LISTEN_START_DELAY_MS: 100,  // 카드가 뜨자마자 바로 듣기
  TTS_TAIL_MS: 300,       // TTS 가 끝난 뒤 마이크를 다시 켜기까지 여유
  QUICK_END_MS: 400,      // 인식이 이보다 빨리 끝나면 "고장" 의심
  QUICK_END_LIMIT: 4,     // 연속으로 이만큼 빨리 끝나면 탭 모드로 전환
  SUCCESS_SHOW_MS: 1600,  // 칭찬 화면 최소 표시 시간 (칭찬 음성이 끝나면 바로 다음으로)

  LOG_LIMIT: 300,
  DEFAULT_SETTINGS: { lang: 'ko', maxLevel: 2, stt: true, strictness: 'normal' },
};

const LANG_CODE = { ko: 'ko-KR', en: 'en-US' };
const PRAISE = { ko: '잘했어요!', en: 'Great job!' };
const FOLLOW_TEXT = { ko: '따라 읽어봐!', en: 'Say it with me!' };
const FATAL_SPEECH_ERRORS = ['not-allowed', 'service-not-allowed', 'audio-capture', 'language-not-supported', 'network'];

const FONT_UI = '"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif';
const FONT_EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';

// 게임 아이템 (이름은 화면에 글자로 같이 보여준다)
const ITEMS = {
  wood:   { emoji: '🪵', ko: '나무', en: 'log',    kind: 'material', weight: 4 },
  stone:  { emoji: '🪨', ko: '돌',   en: 'rock',   kind: 'material', weight: 3 },
  string: { emoji: '🧵', ko: '실',   en: 'string', kind: 'material', weight: 2 },
  iron:   { emoji: '🔩', ko: '쇠',   en: 'iron',   kind: 'material', weight: 2 },
  apple:  { emoji: '🍎', ko: '사과', en: 'apple',  kind: 'food',     weight: 2 },
  milk:   { emoji: '🥛', ko: '우유', en: 'milk',   kind: 'food',     weight: 1 },
  grape:  { emoji: '🍇', ko: '포도', en: 'grape',  kind: 'food',     weight: 1 },
  egg:    { emoji: '🥚', ko: '알',   en: 'egg',    kind: 'food',     weight: 1 },
  // 하트는 따로 HEART_COUNT 개가 생긴다. 다쳤으면 바로 체력을 채우고, 가득이면 가방에 넣어 둔다
  heart:  { emoji: '❤️', ko: '하트', en: 'heart',  kind: 'heart',    weight: 0 },
};

// 무기 (power 가 클수록 강하다. 제일 센 무기를 자동으로 든다)
const WEAPONS = {
  hand:  { emoji: '✋', ko: '손',   en: 'hand',  power: 1 },
  axe:   { emoji: '🪓', ko: '도끼', en: 'axe',   power: 2 },
  bow:   { emoji: '🏹', ko: '활',   en: 'bow',   power: 3 },
  sword: { emoji: '🗡️', ko: '칼',   en: 'sword', power: 4 },
};

// 제작대 레시피 (집 안). unlock: 몬스터를 이만큼 잡아야 열린다
const RECIPES = [
  { result: 'axe',   needs: { wood: 2, stone: 1 },           unlock: 0 },
  { result: 'bow',   needs: { wood: 1, string: 2 },          unlock: 1 },
  { result: 'sword', needs: { iron: 2, stone: 1, wood: 1 }, unlock: 2 },
];

// 몬스터 (이름도 글자로 같이 보여준다. emoji 가 words.csv 와 같으면 처치 후 그 단어 카드가 나온다)
const MONSTERS = {
  spider: { emoji: '🕷️', ko: '거미', en: 'spider', hp: 3, speed: 1.6, size: 24, drops: { string: 2 },          weight: 3 },
  fox:    { emoji: '🦊', ko: '여우', en: 'fox',    hp: 4, speed: 1.9, size: 26, drops: { iron: 1, wood: 1 }, weight: 3 },
  hippo:  { emoji: '🦛', ko: '하마', en: 'hippo',  hp: 5, speed: 1.3, size: 28, drops: { stone: 2 },          weight: 2 },
  bear:   { emoji: '🐻', ko: '곰',   en: 'bear',   hp: 6, speed: 1.5, size: 28, drops: { iron: 2 },           weight: 2 },
};
const BOSS = { emoji: '🐉', ko: '용', en: 'dragon', hp: 12, speed: 1.4, size: 56, drops: {}, boss: true };

const FACING = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

// ============================================================
// 유틸
// ============================================================
const $ = sel => document.querySelector(sel);
const delay = ms => new Promise(res => setTimeout(res, ms));
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
// 맵 생성 때만 시드 난수로 바꿔서, 같은 시드면 두 기기에서 같은 맵이 나온다
let rng = Math.random;
const randInt = (a, b) => a + Math.floor(rng() * (b - a + 1));
const randFloat = (a, b) => a + rng() * (b - a);
function seededRandom(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const stripVS = s => (s || '').replace(/[︎️]/g, '');

function hash(x, y, s) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// 받침에 맞는 조사: josa('도끼', '을', '를') → '도끼를', josa('칼', '을', '를') → '칼을'
function josa(word, withBatchim, without) {
  const c = word.charCodeAt(word.length - 1);
  if (c < 0xAC00 || c > 0xD7A3) return word + without;
  return word + ((c - 0xAC00) % 28 ? withBatchim : without);
}

// 별/반짝이 터지는 칭찬 연출
function burst() {
  const layer = $('#stars');
  const icons = ['⭐', '🌟', '✨', '💖', '🎉'];
  for (let i = 0; i < 16; i++) {
    const s = document.createElement('span');
    s.className = 'star';
    s.textContent = icons[i % icons.length];
    const ang = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
    const dist = Math.min(innerWidth, innerHeight) * randFloat(0.3, 0.5);
    s.style.setProperty('--tx', `${Math.cos(ang) * dist}px`);
    s.style.setProperty('--ty', `${Math.sin(ang) * dist}px`);
    s.style.setProperty('--rot', `${randInt(-180, 180)}deg`);
    layer.appendChild(s);
    setTimeout(() => s.remove(), 1400);
  }
}

function toast(html) {
  const layer = $('#toast-layer');
  while (layer.children.length >= 3) layer.firstChild.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = html;
  layer.appendChild(el);
  setTimeout(() => el.remove(), 1700);
}

// 설정 언어에 맞춘 아이템 이름 (둘 다: 한글 크게 + 영어 작게)
function itemNames(def) {
  const lang = Store.settings.lang;
  if (lang === 'en') return { main: def.en, sub: '' };
  if (lang === 'ko') return { main: def.ko, sub: '' };
  return { main: def.ko, sub: def.en };
}

// ============================================================
// Store — localStorage 래퍼 (기기 안에만 저장)
// ============================================================
const KEYS = { settings: 'bc.settings', stats: 'bc.stats', log: 'bc.log', csv: 'bc.wordsCsv', look: 'bc.look', name: 'bc.name' };

const Store = {
  settings: null,

  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* 저장 불가(사생활 보호 모드 등) */ }
  },

  // 저장된 설정 + URL 파라미터(?lang=ko&level=1&strict=loose&stt=0)
  // URL 파라미터는 이번 실행에만 적용하고 저장하지 않는다
  loadSettings() {
    const s = { ...CONFIG.DEFAULT_SETTINGS, ...this.get(KEYS.settings, {}) };
    const q = new URLSearchParams(location.search);
    if (['ko', 'en', 'both'].includes(q.get('lang'))) s.lang = q.get('lang');
    const lv = parseInt(q.get('level'), 10);
    if (lv >= 1 && lv <= 3) s.maxLevel = lv;
    if (CONFIG.JUDGE_THRESHOLDS[q.get('strict')]) s.strictness = q.get('strict');
    if (q.has('stt')) s.stt = q.get('stt') !== '0';
    this.settings = s;
  },

  logAttempt(entry) {
    const log = this.get(KEYS.log, []);
    log.push({ t: Date.now(), ...entry });
    this.set(KEYS.log, log.slice(-CONFIG.LOG_LIMIT));
  },

  recordResult(word, method, tries) {
    const stats = this.get(KEYS.stats, {});
    const s = stats[word.id] || (stats[word.id] = { word: word.word, lang: word.lang, seen: 0, correct: 0, firstTry: 0, follow: 0, tap: 0 });
    s.seen++;
    if (method === 'speech') {
      s.correct++;
      if (tries === 0) s.firstTry++;
    } else if (method.startsWith('follow')) s.follow++;
    else s.tap++;
    s.last = Date.now();
    this.set(KEYS.stats, stats);
  },
};

// ============================================================
// Words — words.csv 로드 (부모가 불러온 CSV 가 localStorage 에 있으면 우선)
// ============================================================
function parseCSV(text) {
  text = text.replace(/^﻿/, '');
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row);
      row = []; field = '';
    } else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(f => f.trim()));
}

function parseWords(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) return [];
  const head = rows[0].map(h => h.trim().toLowerCase());
  const col = name => head.indexOf(name);
  const cId = col('id'), cWord = col('word'), cLang = col('lang'), cEmoji = col('emoji'),
    cLevel = col('level'), cCat = col('category'), cAlts = col('alts');
  if (cWord < 0 || cLang < 0) {
    console.warn('[Words] CSV 에 word, lang 컬럼이 필요해요');
    return [];
  }
  const words = [];
  rows.slice(1).forEach((r, i) => {
    const get = c => (c >= 0 && r[c] != null ? r[c].trim() : '');
    const word = get(cWord), lang = get(cLang).toLowerCase();
    if (!word || !LANG_CODE[lang]) {
      console.warn(`[Words] ${i + 2}번째 줄 건너뜀:`, r.join(','));
      return;
    }
    words.push({
      id: get(cId) || `${lang}-${word}`,
      word,
      lang,
      emoji: get(cEmoji),
      level: clamp(parseInt(get(cLevel), 10) || 1, 1, 3),
      category: get(cCat),
      alts: get(cAlts).split('|').map(s => s.trim()).filter(Boolean),
    });
  });
  return words;
}

const Words = {
  all: [],
  source: 'default',
  lastId: null,
  nextLang: 'ko',

  async load() {
    const custom = Store.get(KEYS.csv, null);
    if (custom) {
      const words = parseWords(custom);
      if (words.length) {
        this.all = words; this.source = 'custom';
        console.log(`[Words] 부모가 불러온 CSV 사용: ${words.length}개`);
        return;
      }
    }
    const res = await fetch('words.csv', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`words.csv ${res.status}`);
    this.all = parseWords(await res.text());
    this.source = 'default';
    console.log(`[Words] words.csv 사용: ${this.all.length}개`);
  },

  // level 은 누적: maxLevel 2 → level 1~2
  pool(lang) {
    return this.all.filter(w => w.level <= Store.settings.maxLevel && (!lang || w.lang === lang));
  },

  // emoji 가 주어지면 같은 그림의 단어를 우선 (예: 거미를 잡으면 "거미" 카드)
  pick({ emoji } = {}) {
    let lang = Store.settings.lang;
    if (lang === 'both') {
      lang = this.nextLang;
      this.nextLang = lang === 'ko' ? 'en' : 'ko';
    }
    let pool = this.pool(lang);
    if (!pool.length) pool = this.pool();
    if (!pool.length) pool = this.all;
    if (emoji) {
      const match = pool.find(w => stripVS(w.emoji) === stripVS(emoji));
      if (match) return this.remember(match);
    }
    // TODO(4단계): 자주 틀리는 단어 가중치
    const choices = pool.length > 1 ? pool.filter(w => w.id !== this.lastId) : pool;
    return this.remember(choices[Math.floor(Math.random() * choices.length)]);
  },

  remember(w) { this.lastId = w.id; return w; },
};

// ============================================================
// Judge — 관대한 읽기 판정 (한글은 자모 단위 편집거리)
// ============================================================
const Judge = (() => {
  const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
  const JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅗㅏ', 'ㅗㅐ', 'ㅗㅣ', 'ㅛ', 'ㅜ',
    'ㅜㅓ', 'ㅜㅔ', 'ㅜㅣ', 'ㅠ', 'ㅡ', 'ㅡㅣ', 'ㅣ'];
  const JONG = ['', 'ㄱ', 'ㄲ', 'ㄱㅅ', 'ㄴ', 'ㄴㅈ', 'ㄴㅎ', 'ㄷ', 'ㄹ', 'ㄹㄱ', 'ㄹㅁ', 'ㄹㅂ', 'ㄹㅅ', 'ㄹㅌ',
    'ㄹㅍ', 'ㄹㅎ', 'ㅁ', 'ㅂ', 'ㅂㅅ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  const isHangul = ch => { const c = ch.charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3; };

  function normalize(s) {
    return (s || '').normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
  }

  // "나무" → "ㄴㅏㅁㅜ", 겹받침/이중모음도 쪼갠다
  function toJamo(s) {
    let out = '';
    for (const ch of s) {
      if (!isHangul(ch)) { out += ch; continue; }
      const idx = ch.charCodeAt(0) - 0xAC00;
      out += CHO[Math.floor(idx / 588)] + JUNG[Math.floor((idx % 588) / 28)] + JONG[idx % 28];
    }
    return out;
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  function similarity(a, b) {
    const ja = toJamo(a), jb = toJamo(b);
    return 1 - levenshtein(ja, jb) / Math.max(ja.length, jb.length, 1);
  }

  // 인식 결과가 정답보다 길면("나모야") 비슷한 길이의 구간들과 비교해 최고점을 쓴다
  function windowSimilarity(target, cand) {
    const t = Array.from(target), c = Array.from(cand);
    if (c.length <= t.length + 1) return similarity(target, cand);
    let best = 0;
    for (let len = Math.max(1, t.length - 1); len <= t.length + 1; len++) {
      for (let i = 0; i + len <= c.length; i++) {
        best = Math.max(best, similarity(target, c.slice(i, i + len).join('')));
      }
    }
    return best;
  }

  function scoreOne(t, c) {
    if (c === t) return { score: 1, how: 'exact' };
    const single = Array.from(t).length === 1 && isHangul(t);
    if (single && c.includes(t)) return { score: 1, how: 'single-char' };
    if (c.includes(t)) return { score: CONFIG.CONTAINS_SCORE, how: 'contains' };
    return { score: windowSimilarity(t, c), how: 'similar' };
  }

  // quiet: 말하는 도중(중간 결과) 판정은 통과할 때만 로그를 남긴다
  function judge(target, candidates, strictness = 'normal', alts = [], quiet = false) {
    const threshold = CONFIG.JUDGE_THRESHOLDS[strictness] ?? CONFIG.JUDGE_THRESHOLDS.normal;
    const targets = [target, ...alts].map(normalize).filter(Boolean);
    let best = { cand: '', score: 0, how: 'none' };
    for (const raw of candidates) {
      const c = normalize(raw);
      if (!c) continue;
      for (const t of targets) {
        const r = scoreOne(t, c);
        if (r.score > best.score) best = { cand: raw, ...r };
      }
    }
    const pass = best.score >= threshold;
    if (quiet && !pass) return { pass, score: best.score, best: best.cand, how: best.how, threshold };
    console.log(`[Judge]${quiet ? '(중간)' : ''} 목표="${target}" 후보=${JSON.stringify(candidates)} → 최고="${best.cand}" ` +
      `점수=${best.score.toFixed(2)} 기준=${threshold} (${best.how}) ${pass ? '✅ 통과' : '❌ 실패'}`);
    return { pass, score: best.score, best: best.cand, how: best.how, threshold };
  }

  return { judge, normalize, toJamo, similarity };
})();

// ============================================================
// Sfx — WebAudio 로 만든 부드러운 효과음 (파일 없음)
// ============================================================
const Sfx = {
  ctx: null,

  unlock() {
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      this.ctx.resume();
    } catch { this.ctx = null; }
  },

  tone(freq, dur, { type = 'sine', vol = 0.15, delay: wait = 0, to = null } = {}) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime + wait;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  },

  pickup() { this.tone(660, 0.08); this.tone(990, 0.14, { delay: 0.07 }); },
  success() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', delay: i * 0.09 })); },
  soft() { this.tone(330, 0.25, { to: 260, vol: 0.1 }); },
  swing() { this.tone(240, 0.12, { type: 'triangle', to: 120, vol: 0.06 }); },
  door() { this.tone(392, 0.12, { type: 'triangle' }); this.tone(523, 0.18, { type: 'triangle', delay: 0.1 }); },
  hit() { this.tone(180, 0.1, { type: 'square', to: 90, vol: 0.08 }); },
  hurt() { this.tone(440, 0.2, { type: 'triangle', to: 220, vol: 0.1 }); },
  defeat() { [392, 523, 659].forEach((f, i) => this.tone(f, 0.12, { type: 'square', vol: 0.06, delay: i * 0.06 })); },
  // 터벅터벅: 낮은 '쿵' + 짧은 흙 밟는 소리. 왼발/오른발 높이를 조금 다르게
  step(left) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime;
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 0.12, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    }
    const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    src.buffer = this.noise;
    filter.type = 'lowpass';
    filter.frequency.value = left ? 700 : 900;
    gain.gain.setValueAtTime(0.5, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t0);
    this.tone(left ? 95 : 115, 0.09, { to: 55, vol: 0.35 });
  },
  boss() { this.tone(110, 0.6, { type: 'sawtooth', to: 70, vol: 0.08 }); this.tone(147, 0.6, { type: 'sawtooth', to: 90, vol: 0.06, delay: 0.3 }); },
};

// ============================================================
// Speech — TTS(speechSynthesis) + STT(SpeechRecognition)
// ============================================================
const Speech = {
  SR: window.SpeechRecognition || window.webkitSpeechRecognition || null,
  voices: [],
  speaking: false,

  init() {
    if (!('speechSynthesis' in window)) return;
    const load = () => { this.voices = speechSynthesis.getVoices(); };
    load();
    speechSynthesis.addEventListener('voiceschanged', load);
  },

  // 첫 사용자 탭 안에서 한 번 불러줘야 이후 TTS 가 막히지 않는다
  unlock() {
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      speechSynthesis.speak(u);
    } catch { /* 미지원 */ }
  },

  pickVoice(code) {
    const prefix = code.slice(0, 2).toLowerCase();
    const vs = this.voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(prefix));
    return vs.find(v => /google/i.test(v.name)) || vs.find(v => v.lang === code) || vs[0] || null;
  },

  speak(text, lang) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window)) return resolve();
      if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANG_CODE[lang] || 'ko-KR';
      const voice = this.pickVoice(u.lang);
      if (voice) u.voice = voice;
      u.rate = 0.85;
      u.pitch = 1.1;
      let done = false;
      // 안드로이드에서 onend 가 안 오는 경우가 있어 시간 제한을 둔다
      const timer = setTimeout(() => finish(), 1500 + text.length * 250);
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        setTimeout(() => { this.speaking = false; resolve(); }, CONFIG.TTS_TAIL_MS);
      };
      u.onend = finish;
      u.onerror = finish;
      this.speaking = true;
      speechSynthesis.speak(u);
    });
  },

  // 계속 듣기 (말할 때마다 결과가 온다). stop() 하면 이후 이벤트는 모두 무시된다
  // 한 번 듣고 끝나는 방식은 다시 켜지는 사이에 한 말을 놓치기 쉬워서 continuous 로 둔다
  listen(lang, h) {
    const rec = new this.SR();
    rec.lang = LANG_CODE[lang];
    rec.continuous = true;
    rec.interimResults = true; // 말하는 도중 글자를 보여주고, 맞으면 바로 통과
    rec.maxAlternatives = CONFIG.MAX_ALTERNATIVES;
    let live = true;
    const guard = fn => (...args) => { if (live) fn(...args); };
    rec.onstart = guard(() => console.log(`[Speech] 듣기 시작 (${rec.lang})`));
    rec.onsoundstart = guard(() => h.onSound());
    rec.onspeechstart = guard(() => h.onSound());
    rec.onresult = guard(e => {
      // 이번에 말한 부분(resultIndex 이후)만 본다. 여러 조각이면 이어 붙인 것도 후보로 넣는다
      const parts = Array.from(e.results).slice(e.resultIndex);
      const alts = [];
      if (parts.length > 1) alts.push(parts.map(res => res[0].transcript).join(''));
      for (const res of parts) for (let i = 0; i < res.length; i++) alts.push(res[i].transcript);
      const final = parts.every(res => res.isFinal);
      if (final) console.log('[Speech] 들은 말:', alts);
      h.onResult(alts, final);
    });
    rec.onerror = guard(e => h.onError(e.error));
    rec.onend = guard(() => { live = false; h.onEnd(); });
    try {
      rec.start();
    } catch (err) {
      setTimeout(guard(() => { h.onError('start-failed'); live = false; h.onEnd(); }), 0);
    }
    return { stop() { live = false; try { rec.abort(); } catch { /* 이미 끝남 */ } } };
  },
};

// ============================================================
// Meter — 🎤 주변에 소리 크기를 보여준다 (마이크가 내 목소리를 듣고 있는지 확인용)
// 안드로이드는 마이크를 두 곳에서 동시에 쓰면 음성 인식이 실패할 수 있어 끈다
// ============================================================
const Meter = {
  enabled: !/Android/i.test(navigator.userAgent),
  stream: null,
  analyser: null,
  source: null,
  data: null,
  level: 0,

  async start() {
    if (!this.enabled || this.stream || !Sfx.ctx || !navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!Card.active || Card.passed) { stream.getTracks().forEach(tr => tr.stop()); return; }
      this.stream = stream;
      this.source = Sfx.ctx.createMediaStreamSource(stream);
      this.analyser = Sfx.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.data = new Uint8Array(this.analyser.fftSize);
      this.source.connect(this.analyser);
    } catch (err) {
      console.warn('[Meter] 사용 안 함:', err.name);
      this.enabled = false;
    }
  },

  stop() {
    if (this.stream) this.stream.getTracks().forEach(tr => tr.stop());
    if (this.source) this.source.disconnect();
    this.stream = this.source = this.analyser = null;
    this.level = 0;
  },

  // 0~1 (조용한 말소리도 보이도록 크게 키운다)
  read() {
    if (!this.analyser) return 0;
    this.analyser.getByteTimeDomainData(this.data);
    let sum = 0;
    for (const v of this.data) sum += ((v - 128) / 128) ** 2;
    const rms = Math.sqrt(sum / this.data.length);
    this.level = Math.max(Math.min(1, rms * 6), this.level * 0.85);
    return this.level;
  },
};

// ============================================================
// Card — 단어 카드 읽기
//   speech : 음성 인식으로 판정 (최대 3번)
//   follow : 3번 실패 → 읽어준 뒤 소리만 나도 통과 (또는 ✅)
//   tap    : 마이크 불가 → ✅ 누르면 통과
// ============================================================
const Card = {
  el: null,
  active: false,
  passed: false,
  word: null,
  mode: 'speech',
  tries: 0,
  heard: false,
  gotAttempt: false,
  quickEnds: 0,
  startedAt: 0,
  listener: null,
  hintTimer: null,
  restartTimer: null,
  resolve: null,

  init() {
    this.el = {
      overlay: $('#card-overlay'), card: $('#card'), word: $('#card-word'), reveal: $('#card-reveal'),
      praise: $('#card-praise'), follow: $('#card-follow'), speaker: $('#btn-speaker'), mic: $('#mic'),
      pass: $('#btn-pass'), heard: $('#card-heard'), status: $('#card-status'),
    };
    this.el.speaker.addEventListener('click', () => this.sayWord());
    this.el.pass.addEventListener('click', () => this.tapPass());
    document.addEventListener('visibilitychange', () => {
      if (!this.active || this.passed) return;
      if (document.hidden) this.stopListening();
      else this.scheduleListen(300);
    });
  },

  show(word) {
    Object.assign(this, {
      active: true, passed: false, word, tries: 0, heard: false, gotAttempt: false, quickEnds: 0,
      mode: Game.tapMode ? 'tap' : 'speech',
    });
    const e = this.el;
    e.card.className = `card lang-${word.lang}`;
    e.word.textContent = word.word;
    e.word.lang = word.lang;
    e.reveal.textContent = '';
    e.praise.textContent = '';
    e.heard.textContent = '';
    e.follow.textContent = `👂 ${FOLLOW_TEXT[word.lang]}`;
    e.overlay.classList.remove('hidden');
    this.fitWord();
    this.updateUI();
    this.setHint(false);
    this.hintTimer = setTimeout(() => { if (!this.gotAttempt) this.setHint(true); }, CONFIG.HINT_DELAY_MS);
    this.scheduleListen(CONFIG.LISTEN_START_DELAY_MS);
    if (!Game.tapMode) Meter.start();
    console.log(`[Card] 표시 "${word.word}" (${word.lang}, level ${word.level}) 모드=${this.mode}`);
    return new Promise(res => { this.resolve = res; });
  },

  // 글자를 카드 폭에 맞춰 최대한 크게
  fitWord(mult = 1) {
    if (!this.word) return;
    const len = Array.from(this.word.word).length;
    const perChar = this.word.lang === 'ko' ? 1.05 : 0.62;
    const maxW = this.el.card.clientWidth * 0.88;
    const base = Math.min(innerWidth, innerHeight) * 0.3;
    this.el.word.style.fontSize = `${Math.min(base, maxW / (len * perChar)) * mult}px`;
  },

  updateUI() {
    const e = this.el;
    e.card.classList.toggle('follow-mode', this.mode === 'follow');
    e.follow.classList.toggle('hidden', this.mode !== 'follow');
    e.pass.classList.toggle('hidden', this.mode === 'speech');
    // 부모 확인용: 탭 모드가 된 이유
    e.status.textContent = Game.tapMode ? `🎤✖ ${Game.tapReason}` : '';
    if (!this.listener) this.setMic(this.micIdleState());
  },

  micIdleState() { return Game.tapMode ? 'off' : 'idle'; },
  setMic(state) { this.el.mic.dataset.state = state; },
  setHint(on) { this.el.speaker.classList.toggle('hint', on); },

  canListen() {
    return this.active && !this.passed && !Game.tapMode && this.mode !== 'tap' &&
      !Speech.speaking && !document.hidden && !this.listener;
  },

  scheduleListen(ms) {
    clearTimeout(this.restartTimer);
    this.restartTimer = setTimeout(() => this.listen(), ms);
  },

  listen() {
    if (!this.canListen()) return;
    this.startedAt = performance.now();
    this.heard = false;
    this.listener = Speech.listen(this.word.lang, {
      onSound: () => {
        this.heard = true;
        if (!this.el.heard.textContent) this.el.heard.textContent = '🗣️ …';
      },
      onResult: (alts, final) => this.onResult(alts, final),
      onError: err => this.onError(err),
      onEnd: () => this.onEnd(),
    });
    this.setMic('listening');
  },

  stopListening() {
    clearTimeout(this.restartTimer);
    if (this.listener) {
      this.listener.stop();
      this.listener = null;
    }
    this.setMic(this.micIdleState());
  },

  // final=false 는 말하는 도중의 중간 결과: 맞으면 바로 통과, 틀린 판정은 최종 결과에서만
  onResult(alts, final = true) {
    this.showHeard(alts[0]);
    if (this.mode === 'follow') {
      this.gotAttempt = true;
      this.log(alts, null, 'follow');
      this.pass('follow');
      return;
    }
    const r = Judge.judge(this.word.word, alts, Store.settings.strictness, this.word.alts, !final);
    if (!r.pass && !final) return;
    this.gotAttempt = true;
    this.log(alts, r, 'speech');
    if (r.pass) this.pass('speech');
    else this.fail();
  },

  // 아이가 말한 것이 글자로 보이면 "듣고 있구나" 를 알 수 있다
  showHeard(text) {
    this.el.heard.textContent = text ? `🗣️ ${text}` : '';
  },

  onError(err) {
    if (err === 'aborted') return;
    console.warn('[Speech] 인식 오류:', err);
    if (FATAL_SPEECH_ERRORS.includes(err)) {
      Game.setTapMode(err);
      return;
    }
    // 소리는 났는데 알아듣지 못함 → 시도 1회로 친다
    if (err === 'no-match' && this.mode === 'speech') {
      this.gotAttempt = true;
      this.log([], null, 'no-match');
      this.fail();
    }
  },

  onEnd() {
    this.listener = null;
    if (!this.active || this.passed) return;
    this.setMic(this.micIdleState());
    if (this.mode === 'follow' && this.heard) {
      this.log([], null, 'follow-sound');
      this.pass('follow');
      return;
    }
    if (performance.now() - this.startedAt < CONFIG.QUICK_END_MS) {
      if (++this.quickEnds >= CONFIG.QUICK_END_LIMIT) {
        Game.setTapMode('quick-end');
        return;
      }
    } else this.quickEnds = 0;
    this.scheduleListen(250);
  },

  fail() {
    this.tries++;
    Sfx.soft();
    const w = this.el.word;
    w.classList.remove('shake');
    void w.offsetWidth; // 애니메이션 재시작
    w.classList.add('shake');
    this.setHint(true);
    if (this.tries >= CONFIG.MAX_TRIES) this.enterFollow();
  },

  async enterFollow() {
    this.mode = 'follow';
    this.stopListening();
    this.updateUI();
    console.log(`[Card] "${this.word.word}" 따라 읽기 모드`);
    await this.sayWord();
  },

  async sayWord() {
    if (!this.active || this.passed) return;
    this.stopListening();
    this.gotAttempt = true;
    this.setHint(false);
    this.el.speaker.classList.add('playing');
    await Speech.speak(this.word.word, this.word.lang);
    this.el.speaker.classList.remove('playing');
    this.scheduleListen(0);
  },

  tapPass() {
    if (!this.active || this.passed || this.mode === 'speech') return;
    this.log([], null, this.mode === 'follow' ? 'follow-tap' : 'tap');
    this.pass(this.mode === 'follow' ? 'follow-tap' : 'tap');
  },

  // 마이크를 쓸 수 없게 됐을 때 (권한 거부, 오류 등)
  toTap() {
    if (!this.active || this.passed) return;
    if (this.mode === 'speech') this.mode = 'tap';
    this.stopListening();
    Meter.stop();
    this.updateUI();
  },

  async pass(method) {
    if (this.passed) return;
    this.passed = true;
    this.stopListening();
    clearTimeout(this.hintTimer);
    this.setHint(false);
    Store.recordResult(this.word, method, this.tries);
    console.log(`[Card] 통과 "${this.word.word}" 방법=${method} 실패=${this.tries}`);

    const e = this.el;
    e.card.classList.add('success');
    e.reveal.textContent = this.word.emoji || '⭐';
    e.praise.textContent = PRAISE[this.word.lang];
    this.fitWord(0.55);
    Sfx.success();
    burst();
    const praise = Speech.speak(`${this.word.word}! ${PRAISE[this.word.lang]}`, this.word.lang);
    await Promise.all([praise, delay(CONFIG.SUCCESS_SHOW_MS)]);
    this.close({ method, tries: this.tries });
  },

  close(result) {
    this.el.overlay.classList.add('hidden');
    this.active = false;
    Meter.stop();
    const resolve = this.resolve;
    this.resolve = null;
    if (resolve) resolve(result);
  },


  log(heard, r, kind) {
    Store.logAttempt({
      id: this.word.id, word: this.word.word, lang: this.word.lang, kind, heard,
      score: r ? Number(r.score.toFixed(2)) : null,
      pass: r ? r.pass : kind !== 'no-match',
    });
  },
};

// ============================================================
// Craft — 집 안 제작대: 그림 + 글자 레시피를 보고 🔨 을 눌러 무기를 만든다
// ============================================================
const Craft = {
  el: null,
  open: false,
  resolve: null,

  init() {
    this.el = { overlay: $('#craft-overlay'), list: $('#recipes') };
    $('#btn-craft-close').addEventListener('click', () => this.close());
    this.el.list.addEventListener('click', e => {
      const btn = e.target.closest('button[data-recipe]');
      if (btn) this.make(RECIPES[Number(btn.dataset.recipe)]);
    });
    addEventListener('keydown', e => { if (this.open && e.code === 'Escape') this.close(); });
  },

  has(type, n) { return (Game.inventory[type] || 0) >= n; },
  unlocked(r) { return Game.kills >= r.unlock; },
  canMake(r) {
    return this.unlocked(r) && !Game.weapons.has(r.result) &&
      Object.entries(r.needs).every(([type, n]) => this.has(type, n));
  },
  canMakeAny() { return RECIPES.some(r => this.canMake(r)); },

  show() {
    this.open = true;
    this.render();
    this.el.overlay.classList.remove('hidden');
    return new Promise(res => { this.resolve = res; });
  },

  render() {
    this.el.list.innerHTML = RECIPES.map((r, i) => {
      const w = WEAPONS[r.result], names = itemNames(w);
      const owned = Game.weapons.has(r.result), ready = this.canMake(r), locked = !this.unlocked(r);
      // 잠긴 레시피: 몬스터를 몇 마리 더 잡아야 하는지 👾 로 보여준다
      const needs = locked
        ? `<div class="lock">🔒 👾 ${Game.kills}/${r.unlock}</div>`
        : Object.entries(r.needs).map(([type, n]) => {
          const def = ITEMS[type], have = Math.min(Game.inventory[type] || 0, n);
          return `<div class="need${have >= n ? ' ok' : ''}"><span class="e">${def.emoji}</span>` +
            `<span class="n">${itemNames(def).main}</span><b>${have}/${n}</b></div>`;
        }).join('<span class="plus">+</span>');
      return `<div class="recipe${owned ? ' owned' : ''}${ready ? ' ready' : ''}${locked ? ' locked' : ''}">
        <div class="recipe-result"><span class="e">${w.emoji}</span>
          <span class="names"><span class="n">${names.main}</span>${names.sub ? `<span class="s">${names.sub}</span>` : ''}</span>
          <span class="power">${'⭐'.repeat(w.power)}</span></div>
        <div class="recipe-needs">${needs}</div>
        <button class="big-btn make" data-recipe="${i}" ${ready ? '' : 'disabled'}>${owned ? '✅' : locked ? '🔒' : '🔨'}</button>
      </div>`;
    }).join('');
  },

  make(r) {
    if (!r || !this.canMake(r)) return;
    for (const [type, n] of Object.entries(r.needs)) Game.inventory[type] -= n;
    Game.weapons.add(r.result);
    const w = WEAPONS[r.result], { main } = itemNames(w);
    console.log(`[Craft] ${w.ko} 제작 (power ${w.power})`);
    Sfx.success();
    burst();
    toast(`${w.emoji} ${main}!`);
    if (Store.settings.lang === 'en') Speech.speak(`${w.en}!`, 'en');
    else Speech.speak(`${josa(w.ko, '을', '를')} 만들었어요!`, 'ko');
    Game.renderInventory();
    this.render();
  },

  close() {
    if (!this.open) return;
    this.open = false;
    this.el.overlay.classList.add('hidden');
    const resolve = this.resolve;
    this.resolve = null;
    if (resolve) resolve();
  },
};

// ============================================================
// World — 타일 맵 생성 + 픽셀 그림
// ============================================================
const T = CONFIG.TILE;
const P = T / 8; // 픽셀 한 칸
const TILE = { GRASS: 0, TREE: 1, WATER: 2, SAND: 3, ROCK: 4, FLOWER: 5, HOUSE: 6, DOOR: 7, PATH: 8 };
const BLOCKING = new Set([TILE.TREE, TILE.WATER, TILE.ROCK, TILE.HOUSE]);

const World = {
  w: 0,
  h: 0,
  tiles: null,
  reachable: null,
  house: { x: 0, y: 0 },
  door: { x: 0, y: 0 },
  spawn: { x: 0, y: 0 },
  canvas: null,

  generate(seed) {
    rng = seededRandom(seed);
    try { this.build(); } finally { rng = Math.random; }
  },

  build() {
    const W = this.w = CONFIG.MAP_W, H = this.h = CONFIG.MAP_H;
    const t = this.tiles = new Uint8Array(W * H);
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v; };

    const blob = (type, cx, cy, rx, ry) => {
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) {
        for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
          if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + rng() * 0.3) set(x, y, type);
        }
      }
    };

    // 연못 (모래 테두리)
    for (let i = 0; i < 2; i++) {
      const cx = randInt(5, W - 6), cy = randInt(5, H - 6), rx = randFloat(2, 3.5), ry = randFloat(1.5, 3);
      blob(TILE.SAND, cx, cy, rx + 1.2, ry + 1.2);
      blob(TILE.WATER, cx, cy, rx, ry);
    }
    for (let i = 0; i < 14; i++) blob(TILE.TREE, randInt(2, W - 3), randInt(2, H - 3), randFloat(0.8, 2.4), randFloat(0.8, 2.4));
    for (let i = 0; i < 6; i++) blob(TILE.ROCK, randInt(2, W - 3), randInt(2, H - 3), randFloat(0.5, 1.4), randFloat(0.5, 1.4));
    for (let i = 0; i < t.length; i++) if (t[i] === TILE.GRASS && rng() < 0.06) t[i] = TILE.FLOWER;

    // 테두리 나무
    for (let x = 0; x < W; x++) { set(x, 0, TILE.TREE); set(x, H - 1, TILE.TREE); }
    for (let y = 0; y < H; y++) { set(0, y, TILE.TREE); set(W - 1, y, TILE.TREE); }

    // 집 (가운데, 3x3) + 문 + 길
    const hx = Math.floor(W / 2) - 1, hy = Math.floor(H / 2) - 2;
    for (let y = hy - 3; y <= hy + 6; y++) for (let x = hx - 4; x <= hx + 6; x++) set(x, y, TILE.GRASS);
    for (let y = hy; y < hy + 3; y++) for (let x = hx; x < hx + 3; x++) set(x, y, TILE.HOUSE);
    set(hx + 1, hy + 2, TILE.DOOR);
    for (let y = hy + 3; y <= hy + 5; y++) set(hx + 1, y, TILE.PATH);
    this.house = { x: hx, y: hy };
    this.door = { x: hx + 1, y: hy + 2 };
    this.spawn = { x: (hx + 1) * T + T / 2, y: (hy + 4) * T + T / 2 };

    this.floodFill(hx + 1, hy + 4);
    this.renderMap();
  },

  floodFill(sx, sy) {
    const r = this.reachable = new Uint8Array(this.w * this.h);
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
      const i = y * this.w + x;
      if (r[i] || BLOCKING.has(this.tiles[i])) continue;
      r[i] = 1;
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
  },

  tile(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return TILE.TREE;
    return this.tiles[ty * this.w + tx];
  },
  tileAtPx(x, y) { return this.tile(Math.floor(x / T), Math.floor(y / T)); },

  canStand(x, y, r = CONFIG.PLAYER_RADIUS * T) {
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
      if (BLOCKING.has(this.tileAtPx(x + dx, y + dy))) return false;
    }
    return true;
  },

  // ---------- 픽셀 그림 (한 번만 그려서 오프스크린에 저장) ----------
  renderMap() {
    const c = document.createElement('canvas');
    c.width = this.w * T;
    c.height = this.h * T;
    const g = c.getContext('2d');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.drawTile(g, x, y, this.tile(x, y));
    this.drawHouse(g);
    this.canvas = c;
  },

  drawTile(g, x, y, type) {
    const px = (gx, gy, color, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(x * T + gx * P, y * T + gy * P, w * P, h * P); };
    const fill = color => { g.fillStyle = color; g.fillRect(x * T, y * T, T, T); };
    const specks = (n, colors, seed) => {
      for (let i = 0; i < n; i++) {
        px(Math.floor(hash(x, y, seed + i) * 8), Math.floor(hash(x, y, seed + i + 50) * 8),
          colors[Math.floor(hash(x, y, seed + i + 99) * colors.length)]);
      }
    };
    const grass = () => { fill('#5cb85c'); specks(6, ['#4fa64f', '#6fcb6a'], 1); };

    switch (type) {
      case TILE.GRASS: grass(); break;
      case TILE.FLOWER: {
        grass();
        const fx = 2 + Math.floor(hash(x, y, 7) * 4), fy = 2 + Math.floor(hash(x, y, 8) * 3);
        const color = hash(x, y, 9) > 0.5 ? '#e74c3c' : '#f1c40f';
        px(fx, fy + 1, '#2e7d32', 1, 2);
        px(fx - 1, fy, color); px(fx + 1, fy, color); px(fx, fy - 1, color); px(fx, fy, '#fff59d');
        break;
      }
      case TILE.TREE:
        grass();
        px(3, 5, '#795548', 2, 3);
        px(1, 0, '#2e7d32', 6, 5);
        px(0, 1, '#2e7d32', 8, 3);
        for (let i = 0; i < 5; i++) px(1 + Math.floor(hash(x, y, 20 + i) * 6), Math.floor(hash(x, y, 30 + i) * 4) + 1, '#43a047');
        px(2, 1, '#66bb6a');
        break;
      case TILE.WATER:
        fill('#3b8de0');
        for (let i = 0; i < 2; i++) px(Math.floor(hash(x, y, 40 + i) * 6), Math.floor(hash(x, y, 45 + i) * 8), '#74b9f0', 2, 1);
        break;
      case TILE.SAND: fill('#e9d68f'); specks(5, ['#d8c27a', '#f3e3a6'], 60); break;
      case TILE.ROCK:
        grass();
        px(0, 1, '#8d939b', 8, 7);
        px(0, 1, '#a7adb5', 8, 1);
        specks(6, ['#6f757d', '#7d838b'], 70);
        break;
      case TILE.PATH: fill('#c8a06a'); specks(5, ['#b48a55', '#d6b07c'], 80); break;
      default: break; // HOUSE, DOOR 는 drawHouse 에서 한 번에 그린다
    }
  },

  drawHouse(g) {
    const X = this.house.x * T, Y = this.house.y * T, W3 = 3 * T;
    // 벽 (나무 판자)
    g.fillStyle = '#b5793f';
    g.fillRect(X, Y + T * 0.7, W3, T * 2.3);
    g.fillStyle = '#8e5a2b';
    for (let yy = Y + T * 0.7; yy < Y + 3 * T; yy += P * 2) g.fillRect(X, yy, W3, P / 2);
    // 지붕
    g.fillStyle = '#c0392b';
    g.fillRect(X - P, Y, W3 + 2 * P, T * 0.85);
    g.fillStyle = '#e74c3c';
    g.fillRect(X - P, Y, W3 + 2 * P, P);
    g.fillStyle = '#962d22';
    for (let i = 0; i < W3 + 2 * P; i += P * 2) g.fillRect(X - P + i, Y + T * 0.85 - P, P, P);
    // 창문
    for (const wx of [X + P * 1.5, X + 2 * T + P * 1.5]) {
      g.fillStyle = '#5d4037';
      g.fillRect(wx, Y + T * 1.15, P * 5, P * 5);
      g.fillStyle = '#9ad7ff';
      g.fillRect(wx + P / 2, Y + T * 1.15 + P / 2, P * 4, P * 4);
      g.fillStyle = '#5d4037';
      g.fillRect(wx + P * 2.25, Y + T * 1.15, P / 2, P * 5);
    }
    // 문
    const dx = X + T, dy = Y + 2 * T;
    g.fillStyle = '#4e342e';
    g.fillRect(dx + P, dy - T * 0.3, T - 2 * P, T * 1.3);
    g.fillStyle = '#6d4321';
    g.fillRect(dx + P * 1.5, dy - T * 0.3 + P / 2, T - 3 * P, T * 1.3 - P / 2);
    g.fillStyle = '#f1c40f';
    g.fillRect(dx + T - P * 3, dy + T * 0.3, P, P);
  },
};

// ============================================================
// Items — 맵 위 아이템
// ============================================================
const Items = {
  list: [],
  spots: [],
  respawnQueue: [], // { at, heart }
  pending: new Map(), // 2인용 손님: 주웠다고 알린 아이템 id → 시각 (답이 올 때까지 숨김)
  version: 0, // 바뀔 때마다 +1 (2인용일 때 바뀐 경우에만 보낸다)
  nextId: 1,

  computeSpots() {
    const { house } = World;
    this.spots = [];
    for (let y = 0; y < World.h; y++) {
      for (let x = 0; x < World.w; x++) {
        const tt = World.tile(x, y);
        if (!World.reachable[y * World.w + x]) continue;
        if (![TILE.GRASS, TILE.FLOWER, TILE.SAND].includes(tt)) continue;
        if (Math.abs(x - (house.x + 1)) <= 3 && Math.abs(y - (house.y + 2)) <= 3) continue;
        this.spots.push({ x, y });
      }
    }
  },

  randomType() {
    const entries = Object.entries(ITEMS).filter(([, d]) => d.weight > 0);
    let r = Math.random() * entries.reduce((sum, [, d]) => sum + d.weight, 0);
    for (const [type, d] of entries) {
      r -= d.weight;
      if (r <= 0) return type;
    }
    return entries[0][0];
  },

  add(type, x, y, extra) {
    this.list.push({ id: this.nextId++, type, tx: Math.floor(x / T), ty: Math.floor(y / T), x, y, phase: Math.random() * Math.PI * 2, ...extra });
    this.version++;
  },

  spawnOne(type, avoidPlayers) {
    if (!this.spots.length) return;
    for (let attempt = 0; attempt < 50; attempt++) {
      const s = this.spots[Math.floor(Math.random() * this.spots.length)];
      if (this.list.some(it => it.tx === s.x && it.ty === s.y)) continue;
      const x = s.x * T + T / 2, y = s.y * T + T / 2;
      if (avoidPlayers && Multi.nearPlayer(x, y, 4 * T)) continue;
      this.add(type || this.randomType(), x, y);
      return;
    }
  },

  fill() {
    this.computeSpots();
    for (let i = 0; i < CONFIG.ITEM_COUNT; i++) this.spawnOne(null, false);
    for (let i = 0; i < CONFIG.HEART_COUNT; i++) this.spawnOne('heart', false);
  },

  // 내 캐릭터가 아이템 위에 서면 줍는다. 손님 기기는 방장에게 알리고 답을 기다린다
  pickup() {
    const r = CONFIG.PICKUP_RADIUS * T, now = performance.now();
    for (const [id, at] of this.pending) if (now - at > 2000) this.pending.delete(id);
    for (const it of [...this.list]) {
      if (this.pending.has(it.id) || Math.hypot(it.x - Player.x, it.y - Player.y) >= r) continue;
      if (Multi.isGuest) {
        this.pending.set(it.id, now);
        Multi.send('pick', it.id);
      } else {
        this.take(it);
        Game.addItem(it.type);
      }
    }
  },

  take(it) {
    this.list.splice(this.list.indexOf(it), 1);
    this.version++;
    // 몬스터가 떨어뜨린 것은 다시 생기지 않는다
    if (it.dropped) return;
    const heart = it.type === 'heart';
    this.respawnQueue.push({ at: performance.now() + (heart ? CONFIG.HEART_RESPAWN_MS : CONFIG.ITEM_RESPAWN_MS), heart });
  },

  // 주운 만큼 시간이 지나면 다른 곳에 새로 생긴다 (방장/혼자 기기만)
  respawn() {
    const now = performance.now();
    for (const q of this.respawnQueue.filter(q => q.at <= now)) {
      this.respawnQueue.splice(this.respawnQueue.indexOf(q), 1);
      this.spawnOne(q.heart ? 'heart' : null, true);
    }
  },

  // 몬스터가 떨어뜨린 재료 (다시 생기지 않는다)
  drop(type, x, y) {
    const dx = randFloat(-10, 10), dy = randFloat(-6, 6);
    if (World.canStand(x + dx, y + dy, 4)) { x += dx; y += dy; }
    this.add(type, x, y, { dropped: true });
  },
};

// ============================================================
// Monsters — 돌아다니다가 가까이 오면 다가온다. 집 주변(안전지대)은 못 들어온다
// ============================================================
const Monsters = {
  list: [],
  arrows: [],
  respawnQueue: [],
  bossSpawned: false,
  nextId: 1,
  kills: 0, // 이 세상에서 잡힌 몬스터 수 (보스 등장 조건). 무기 레시피는 각자 Game.kills 로 열린다
  nextBossAt: CONFIG.BOSS_AFTER_KILLS,

  radius(m) { return (m.def.boss ? 0.55 : 0.3) * T; },

  safeZone(x, y) {
    return Math.hypot(x - (World.door.x * T + T / 2), y - (World.door.y * T + T / 2)) < CONFIG.SAFE_RADIUS * T;
  },

  canStand(m, x, y) { return !this.safeZone(x, y) && World.canStand(x, y, this.radius(m)); },

  // 집에서 멀고 플레이어와도 먼 곳
  spots(minFromHome) {
    return Items.spots.filter(s =>
      Math.hypot(s.x - World.door.x, s.y - World.door.y) >= minFromHome &&
      !Multi.nearPlayer(s.x * T, s.y * T, 7 * T));
  },

  randomType() {
    const entries = Object.entries(MONSTERS);
    let r = Math.random() * entries.reduce((sum, [, d]) => sum + d.weight, 0);
    for (const [type, d] of entries) {
      r -= d.weight;
      if (r <= 0) return type;
    }
    return entries[0][0];
  },

  spawn(type, spot) {
    const def = type === 'boss' ? BOSS : MONSTERS[type];
    this.list.push({
      id: this.nextId++, type, def, x: spot.x * T + T / 2, y: spot.y * T + T / 2, hp: def.hp,
      dirX: 0, dirY: 0, wanderT: 0, hitT: 0, knock: { x: 0, y: 0, t: 0 },
      phase: Math.random() * Math.PI * 2, faceRight: false,
    });
  },

  spawnRandom() {
    const spots = this.spots(CONFIG.SAFE_RADIUS + 5);
    if (spots.length) this.spawn(this.randomType(), spots[Math.floor(Math.random() * spots.length)]);
  },

  fill() {
    for (let i = 0; i < CONFIG.MONSTER_COUNT; i++) this.spawnRandom();
  },

  spawnBoss() {
    this.bossSpawned = true;
    const spots = this.spots(CONFIG.SAFE_RADIUS + 5);
    if (!spots.length) return;
    // 집에서 가장 먼 곳
    const far = spots.reduce((a, b) =>
      Math.hypot(b.x - World.door.x, b.y - World.door.y) > Math.hypot(a.x - World.door.x, a.y - World.door.y) ? b : a);
    this.spawn('boss', far);
    const { main } = itemNames(BOSS);
    console.log('[Monsters] 보스 등장');
    Sfx.boss();
    toast(`${BOSS.emoji} ${main}!`);
    if (Store.settings.lang === 'en') Speech.speak(`A ${BOSS.en}!`, 'en');
    else Speech.speak(`${josa(BOSS.ko, '이', '가')} 나타났어요!`, 'ko');
  },

  get boss() { return this.list.find(m => m.def.boss); },

  // 몬스터가 노리는 사람: 놀고 있고(카드/제작 중이 아님) 안전지대 밖에 있는 캐릭터
  targets() {
    const list = [];
    if (Game.state === 'play' && !this.safeZone(Player.x, Player.y)) list.push(Player);
    const o = Multi.other;
    if (Multi.otherActive() && !this.safeZone(o.x, o.y)) list.push(o);
    return list;
  },

  // 몬스터 움직임 (방장/혼자 기기만)
  update(dt) {
    const targets = this.targets();
    for (const m of [...this.list]) {
      m.hitT = Math.max(0, m.hitT - dt);
      let vx = 0, vy = 0;
      if (m.knock.t > 0) {
        m.knock.t -= dt;
        vx = m.knock.x;
        vy = m.knock.y;
      } else {
        let dx = 0, dy = 0, d = Infinity;
        for (const p of targets) {
          const pd = Math.hypot(p.x - m.x, p.y - m.y);
          if (pd < d) { d = pd; dx = p.x - m.x; dy = p.y - m.y; }
        }
        const speed = m.def.speed * T;
        if (d < CONFIG.AGGRO_RANGE * T && d > 1) {
          vx = dx / d * speed;
          vy = dy / d * speed;
        } else {
          m.wanderT -= dt;
          if (m.wanderT <= 0) {
            m.wanderT = randFloat(1.2, 3);
            const a = Math.random() * Math.PI * 2, go = Math.random() < 0.6;
            m.dirX = go ? Math.cos(a) : 0;
            m.dirY = go ? Math.sin(a) : 0;
          }
          vx = m.dirX * speed * 0.5;
          vy = m.dirY * speed * 0.5;
        }
        if (Math.abs(vx) > 1) m.faceRight = vx > 0;
      }
      const nx = m.x + vx * dt;
      if (this.canStand(m, nx, m.y)) m.x = nx; else m.wanderT = 0;
      const ny = m.y + vy * dt;
      if (this.canStand(m, m.x, ny)) m.y = ny; else m.wanderT = 0;
    }

    const now = performance.now();
    while (this.respawnQueue.length && this.respawnQueue[0] <= now) {
      this.respawnQueue.shift();
      this.spawnRandom();
    }
  },

  // 내 캐릭터가 몬스터에 닿으면 다친다 (각자 기기에서 자기 캐릭터만 확인)
  touch() {
    for (const m of this.list) {
      if (Math.hypot(Player.x - m.x, Player.y - m.y) < this.radius(m) + CONFIG.PLAYER_RADIUS * T + 4) {
        Game.hurt(m);
        return;
      }
    }
  },

  // 내 공격: 활은 화살을 쏘고, 나머지는 앞쪽을 휘두른다. 상대 캐릭터도 맞는다
  attack() {
    const w = Game.weapon, power = WEAPONS[w].power;
    const [fx, fy] = FACING[Player.dir];
    if (w === 'bow') {
      this.arrows.push({
        x: Player.x + fx * 10, y: Player.y - 8 + fy * 10, fx, fy,
        left: CONFIG.ARROW_RANGE * T, power,
      });
      return;
    }
    const cx = Player.x + fx * 0.5 * T, cy = Player.y + fy * 0.5 * T;
    for (const m of [...this.list]) {
      if (Math.hypot(m.x - cx, m.y - cy) < CONFIG.ATTACK_RANGE * T + this.radius(m)) this.damage(m, power);
    }
    Multi.hitOther(cx, cy, CONFIG.ATTACK_RANGE * T);
  },

  // 내가 쏜 화살 (각자 기기에서 움직인다)
  updateArrows(dt) {
    for (const a of [...this.arrows]) {
      const step = CONFIG.ARROW_SPEED * T * dt;
      a.x += a.fx * step;
      a.y += a.fy * step;
      a.left -= step;
      const tt = World.tileAtPx(a.x, a.y + 8);
      let done = a.left <= 0 || tt === TILE.TREE || tt === TILE.ROCK || tt === TILE.HOUSE;
      const target = !done && this.list.find(m => Math.hypot(m.x - a.x, m.y - (a.y + 8)) < this.radius(m) + 8);
      if (target) { this.damage(target, a.power); done = true; }
      else if (!done && Multi.hitOther(a.x, a.y + 8, 8)) done = true;
      if (done) this.arrows.splice(this.arrows.indexOf(a), 1);
    }
  },

  // 내가 몬스터를 때림. 손님 기기는 방장에게 알리고, 맞는 모습만 먼저 보여준다
  damage(m, power) {
    if (!Multi.isGuest) { this.hit(m, power, Player.x, Player.y); return; }
    Multi.send('hitM', m.id, power, Math.round(Player.x), Math.round(Player.y));
    m.hitT = 0.25;
    Sfx.hit();
    Floaters.add(m.x, m.y - m.def.size * 0.6, '💥', 16);
  },

  // 몬스터 체력을 깎는다 (방장/혼자 기기). byOther: 상대가 때림 → 잡았으면 true, 카드는 상대 기기에서
  hit(m, dmg, fromX, fromY, byOther = false) {
    m.hp -= dmg;
    m.hitT = 0.25;
    const dx = m.x - fromX, dy = m.y - fromY, d = Math.hypot(dx, dy) || 1;
    const kb = (m.def.boss ? 3 : 6) * T;
    m.knock = { x: dx / d * kb, y: dy / d * kb, t: 0.15 };
    Sfx.hit();
    Floaters.add(m.x, m.y - m.def.size * 0.6, '💥', 16);
    if (m.hp > 0) return false;
    this.kill(m, byOther);
    return true;
  },

  kill(m, byOther) {
    this.list.splice(this.list.indexOf(m), 1);
    Sfx.defeat();
    for (let i = 0; i < 4; i++) Floaters.add(m.x + randFloat(-14, 14), m.y - randFloat(0, 20), '✨', 14);
    for (const [type, n] of Object.entries(m.def.drops)) for (let i = 0; i < n; i++) Items.drop(type, m.x, m.y);
    if (m.def.boss) {
      // 보스가 쓰러지면 몇 마리 더 잡은 뒤 다시 나온다
      this.bossSpawned = false;
      this.nextBossAt = this.kills + CONFIG.BOSS_AFTER_KILLS;
    } else {
      this.kills++;
      this.respawnQueue.push(performance.now() + CONFIG.MONSTER_RESPAWN_MS);
    }
    console.log(`[Monsters] ${m.def.ko} 처치${byOther ? ` (${Multi.other.name})` : ''}`);
    if (!byOther) Game.onMonsterDefeated(m);
  },
};

// ============================================================
// Floaters — 💥 ✨ 처럼 잠깐 떠올랐다 사라지는 그림
// ============================================================
const Floaters = {
  list: [],
  add(x, y, text, size = 16) { this.list.push({ x, y, text, size, t: 0 }); },
  update(dt) {
    for (const f of this.list) f.t += dt;
    this.list = this.list.filter(f => f.t < 0.9);
  },
};

// ============================================================
// Player
// ============================================================
const Player = {
  x: 0,
  y: 0,
  dir: 'down',
  moving: false,
  walkT: 0,
  stepT: 0,
  stepLeft: false,
  swingT: 0,
  invulnT: 0,
  hitT: 0,
  knock: { x: 0, y: 0, t: 0 },

  reset() {
    this.x = World.spawn.x;
    this.y = World.spawn.y;
    this.dir = 'down';
    this.knock = { x: 0, y: 0, t: 0 };
  },

  canStand(x, y) { return World.canStand(x, y); },

  update(dt) {
    this.invulnT = Math.max(0, this.invulnT - dt);
    this.hitT = Math.max(0, this.hitT - dt);
    if (this.knock.t > 0) {
      this.knock.t -= dt;
      const kx = this.x + this.knock.x * dt, ky = this.y + this.knock.y * dt;
      if (this.canStand(kx, this.y)) this.x = kx;
      if (this.canStand(this.x, ky)) this.y = ky;
    }
    const v = Input.vector();
    this.moving = v.x !== 0 || v.y !== 0;
    this.swingT = Math.max(0, this.swingT - dt);
    if (!this.moving) { this.stepT = 0; return; }
    this.walkT += dt;
    if (Math.abs(v.x) > Math.abs(v.y)) this.dir = v.x < 0 ? 'left' : 'right';
    else this.dir = v.y < 0 ? 'up' : 'down';
    const speed = CONFIG.PLAYER_SPEED * T;
    const nx = this.x + v.x * speed * dt;
    if (this.canStand(nx, this.y)) this.x = nx;
    const ny = this.y + v.y * speed * dt;
    if (this.canStand(this.x, ny)) this.y = ny;
    this.stepT -= dt;
    if (this.stepT <= 0) {
      this.stepT = CONFIG.STEP_SEC;
      this.stepLeft = !this.stepLeft;
      Sfx.step(this.stepLeft);
    }
  },
};

// ============================================================
// Multi — 원격 2인용. 두 사람 모두 같은 규칙으로 논다 (체력, 가방, 무기, 단어 카드는 각자 기기에).
//         방을 만든 기기(host)가 세상(아이템, 몬스터, 보스)을 돌리고, 들어온 기기(guest)는
//         줍기/때리기를 이벤트로 알린다. 통신은 net.js (Firebase)
// ============================================================
const DIRS = ['up', 'down', 'left', 'right'];
// 캐릭터 모양 (기기마다 하나를 고른다. 시작 화면 🎨 로 바꾸기)
const LOOKS = [
  { shirt: '#2fb5c8', hair: '#5a3a1e', pants: '#3949ab', hat: null },
  { shirt: '#e53935', hair: '#212121', pants: '#37474f', hat: { type: 'cap', color: '#1e88e5' } },
  { shirt: '#43a047', hair: '#8d5524', pants: '#5d4037', hat: { type: 'band', color: '#fdd835' } },
  { shirt: '#8e24aa', hair: '#f4c542', pants: '#283593', hat: { type: 'crown' } },
  { shirt: '#fb8c00', hair: '#3e2723', pants: '#455a64', hat: { type: 'beanie', color: '#c62828' } },
  { shirt: '#f06292', hair: '#6d4c41', pants: '#4527a0', hat: { type: 'cap', color: '#fff176' } },
  { shirt: '#fdd835', hair: '#212121', pants: '#2e7d32', hat: null },
  { shirt: '#1e88e5', hair: '#bf360c', pants: '#212121', hat: { type: 'band', color: '#e53935' } },
];
const STATUS_ICONS = { card: '📖', craft: '🔨', faint: '💫', end: '🏆' };

// 상대 기기의 캐릭터: 받은 위치(tx, ty)로 부드럽게 따라간다
function makeRemote() {
  return { x: 0, y: 0, tx: 0, ty: 0, dir: 'down', moving: false, walkT: 0, swingT: 0, invulnT: 0, hitT: 0, seen: false };
}
function followRemote(e, dt) {
  const k = 1 - Math.exp(-dt * 15);
  e.x += (e.tx - e.x) * k;
  e.y += (e.ty - e.y) * k;
  if (e.moving) e.walkT += dt;
  e.swingT = Math.max(0, (e.swingT || 0) - dt);
  e.invulnT = Math.max(0, (e.invulnT || 0) - dt);
  e.hitT = Math.max(0, (e.hitT || 0) - dt);
}

const Multi = {
  mode: 'solo', // solo | host | guest
  net: null,
  sendT: 0,
  sid: Math.random().toString(36).slice(2, 8), // 이 기기 접속 id (상대가 새로 들어왔는지 구분)
  beat: 0,
  events: [], // 보낼 이벤트 [seq, 시각, 종류, ...값]
  eventSeq: 0,
  itemsVersion: -1,
  monsterMap: new Map(), // 손님 기기: 방장에게 받은 몬스터
  hostSeen: false,

  // 상대 캐릭터 (이름표, 상태, 무기, 화살까지)
  other: { ...makeRemote(), isPlayer: true, name: '', hearts: CONFIG.MAX_HEARTS, st: 'play', weapon: 'hand', arrows: [], lk: 0, sid: '', lastSeq: 0, lastSeen: 0 },

  get isHost() { return this.mode === 'host'; },
  get isGuest() { return this.mode === 'guest'; },

  // 내 모양 / 상대 모양 (같은 모양이면 상대를 다음 모양으로 보여줘서 구분되게)
  myLook() { return LOOKS[Game.lookIndex]; },
  remoteLook() {
    const i = this.other.lk % LOOKS.length;
    return LOOKS[i === Game.lookIndex ? (i + 1) % LOOKS.length : i];
  },

  otherVisible() { return this.mode !== 'solo' && this.other.seen; },
  // 놀고 있는 상대 (카드/제작/기절 중이면 몬스터도 안 쫓고 맞지도 않는다)
  otherActive() { return this.otherVisible() && this.other.st === 'play'; },

  // 아이템/몬스터를 새로 놓을 때 두 캐릭터 근처는 피한다
  nearPlayer(x, y, d) {
    if (Math.hypot(x - Player.x, y - Player.y) < d) return true;
    return this.otherVisible() && Math.hypot(x - this.other.x, y - this.other.y) < d;
  },

  // 상대를 쓰러뜨렸을 때 카드용 (이모지가 없으니 아무 단어나 나온다)
  otherDef() {
    const name = this.other.name || '?';
    return { emoji: '', ko: name, en: name, boss: false, drops: {} };
  },

  // 방 번호: 왼쪽 위에 작게 계속 + 처음엔 가운데에 크게 (누르면 다시 크게)
  showBadge(code) {
    const b = $('#room-badge');
    b.textContent = `👥 ${code}`;
    b.classList.remove('hidden');
    b.onclick = () => this.showCode(code);
    this.showCode(code);
  },

  showCode(code) {
    const el = $('#room-code');
    el.innerHTML = `<div class="room-code-label">👥 방 번호</div><div class="room-code-num">${code}</div>`;
    el.classList.remove('hidden');
    clearTimeout(this.codeTimer);
    this.codeTimer = setTimeout(() => el.classList.add('hidden'), 8000);
    el.onclick = () => el.classList.add('hidden');
  },

  async startHost() {
    const Net = await import('./net.js');
    this.net = await Net.host(Game.seed);
    this.mode = 'host';
    this.net.onGuest(d => this.onPeer(d));
    this.showBadge(this.net.code);
    console.log('[Multi] 방 만들기', this.net.code);
  },

  async startGuest(code) {
    const Net = await import('./net.js');
    this.net = await Net.join(code);
    this.mode = 'guest';
    // 같은 시드로 같은 맵. 아이템/몬스터는 방장 기기에서 받는다
    World.generate(this.net.seed);
    Player.reset();
    Items.computeSpots();
    Items.list = [];
    Items.respawnQueue = [];
    Monsters.list = [];
    Monsters.respawnQueue = [];
    this.net.onState(st => this.onState(st));
    this.net.onItems(list => this.onItems(list));
    this.showBadge(code);
    console.log('[Multi] 참가', code);
  },

  // 이벤트는 받는 쪽이 놓치지 않게 잠깐 동안 매번 같이 보낸다 (받는 쪽은 번호로 한 번만 처리)
  send(kind, ...args) {
    if (this.mode === 'solo') return;
    this.events.push([++this.eventSeq, performance.now(), kind, ...args]);
  },

  // 내 공격이 상대에게 닿았는지. 맞으면 상대 기기에 알린다 (하트는 상대 기기에서 깎는다)
  hitOther(x, y, r) {
    const o = this.other;
    if (!this.otherActive() || o.invulnT > 0) return false;
    if (Math.hypot(o.x - x, o.y - y) >= r + CONFIG.PLAYER_RADIUS * T) return false;
    this.send('hitP');
    o.hitT = CONFIG.HIT_FLASH_SEC;
    o.invulnT = CONFIG.INVULN_SEC; // 같은 공격으로 여러 번 맞히지 않게
    // 상대 기기에서 밀려난 위치가 오기 전에 이 화면에서도 바로 뒤로 밀어 보여준다
    const dx = o.x - Player.x, dy = o.y - Player.y, d = Math.hypot(dx, dy) || 1;
    const push = CONFIG.KNOCKBACK * T * 0.15;
    if (World.canStand(o.x + dx / d * push, o.y + dy / d * push)) { o.x += dx / d * push; o.y += dy / d * push; }
    Sfx.hit();
    Floaters.add(o.x, o.y - 30, '💥', 16);
    return true;
  },

  tick(dt) {
    if (this.mode === 'solo') return;
    const o = this.other;
    followRemote(o, dt);
    if (o.seen && performance.now() - o.lastSeen > CONFIG.NET_TIMEOUT_MS) this.leave();
    if (this.isGuest) for (const m of Monsters.list) followRemote(m, dt);
    this.sendT -= dt * 1000;
    if (this.sendT > 0) return;
    this.sendT = CONFIG.NET_SEND_MS;
    const sent = this.isHost ? this.sendHost() : this.net.sendGuest(this.myPacket());
    sent.catch(err => console.warn('[Multi] 전송 실패', err));
  },

  leave() {
    if (this.other.seen) toast(`👋 ${this.other.name}`);
    this.other.seen = false;
  },

  // 두 기기가 똑같이 보내는 내 캐릭터 정보
  myPacket() {
    const r = Math.round, now = performance.now();
    this.events = this.events.filter(ev => now - ev[1] < CONFIG.NET_EVENT_KEEP_MS);
    // h: 가만히 서 있어도 값이 바뀌게 해서 상대 쪽에서 '나갔다'고 보지 않게 한다
    this.beat = (this.beat + 1) % 1000;
    return {
      sid: this.sid,
      h: this.beat,
      n: Game.playerName,
      lk: Game.lookIndex,
      st: Game.state,
      p: [r(Player.x), r(Player.y), DIRS.indexOf(Player.dir), Player.moving ? 1 : 0,
        Player.swingT > 0 ? 1 : 0, Player.invulnT > 0 ? 1 : 0, Player.hitT > 0 ? 1 : 0],
      hp: Game.hearts,
      w: Game.weapon,
      a: Monsters.arrows.map(a => [r(a.x), r(a.y), a.fx, a.fy]),
      ev: this.events.map(([seq, , kind, ...args]) => [seq, kind, ...args]),
    };
  },

  // ---------- host: 내 캐릭터 + 세상 ----------
  sendHost() {
    const r = Math.round;
    if (Items.version !== this.itemsVersion) {
      this.itemsVersion = Items.version;
      this.net.sendItems(Items.list.map(it => [it.id, it.type, r(it.x), r(it.y)]))
        .catch(err => console.warn('[Multi] 아이템 전송 실패', err));
    }
    return this.net.sendState({
      ...this.myPacket(),
      m: Monsters.list.map(m => [m.id, m.type, r(m.x), r(m.y), m.hp, m.faceRight ? 1 : 0, m.hitT > 0 ? 1 : 0]),
    });
  },

  // 상대 캐릭터 정보 받기 (두 기기 공통)
  onPeer(d) {
    const o = this.other;
    if (!d) { this.leave(); return; }
    const p = d.p;
    const evs = (d.ev || []).filter(Boolean);
    if (!o.seen || d.sid !== o.sid) {
      // 새로 들어옴: 위치를 바로 맞추고, 그 전 이벤트는 무시
      o.x = p[0];
      o.y = p[1];
      o.lastSeq = evs.reduce((max, ev) => Math.max(max, ev[0]), 0);
      if (!o.seen) toast(`👋 ${d.n || ''}`);
    }
    o.seen = true;
    o.sid = d.sid;
    o.lastSeen = performance.now();
    o.name = String(d.n || '').slice(0, CONFIG.NAME_MAX);
    o.lk = d.lk || 0;
    o.st = d.st;
    o.tx = p[0];
    o.ty = p[1];
    o.dir = DIRS[p[2]] || 'down';
    o.moving = !!p[3];
    if (p[4] && o.swingT <= 0) o.swingT = 0.25;
    if (p[5]) o.invulnT = Math.max(o.invulnT, 0.2);
    if (p[6] && o.hitT <= 0) o.hitT = CONFIG.HIT_FLASH_SEC;
    o.hearts = Number.isInteger(d.hp) ? d.hp : CONFIG.MAX_HEARTS;
    o.weapon = WEAPONS[d.w] ? d.w : 'hand';
    o.arrows = (d.a || []).filter(Boolean).map(([x, y, fx, fy]) => ({ x, y, fx, fy }));
    for (const ev of evs.sort((a, b) => a[0] - b[0])) {
      if (ev[0] <= o.lastSeq) continue;
      o.lastSeq = ev[0];
      this.handle(ev[1], ev.slice(2));
    }
  },

  handle(kind, args) {
    if (kind === 'pick' && this.isHost) {
      // 손님이 주웠다고 함 → 아직 있으면 주고, 없으면(내가 먼저 주움) 무시
      const it = Items.list.find(i => i.id === args[0]);
      if (it) { Items.take(it); this.send('got', it.type); }
    } else if (kind === 'got') {
      if (ITEMS[args[0]]) Game.addItem(args[0]);
    } else if (kind === 'hitM' && this.isHost) {
      const [id, power, x, y] = args;
      const m = Monsters.list.find(mm => mm.id === id);
      if (m && Monsters.hit(m, power, x, y, true)) this.send('kill', m.type);
    } else if (kind === 'kill') {
      const def = args[0] === 'boss' ? BOSS : MONSTERS[args[0]];
      if (!def) return;
      Sfx.defeat();
      Game.onMonsterDefeated({ def });
    } else if (kind === 'hitP') {
      Game.hurt(this.other);
    } else if (kind === 'ko') {
      // 내가 상대를 쓰러뜨림 → 몬스터를 잡은 것처럼 단어 카드
      Sfx.defeat();
      const o = this.other;
      for (let i = 0; i < 4; i++) Floaters.add(o.x + randFloat(-14, 14), o.y - randFloat(0, 20), '✨', 14);
      Game.onMonsterDefeated({ def: this.otherDef() });
    }
  },

  // ---------- guest: 방장 캐릭터 + 세상 받기 ----------
  onState(s) {
    if (!s) {
      if (this.hostSeen) toast('📴');
      this.hostSeen = false;
      this.leave();
      return;
    }
    this.hostSeen = true;
    this.onPeer(s);

    const seen = new Set();
    const hadBoss = !!Monsters.boss;
    for (const [id, type, x, y, hp, face, hit] of (s.m || []).filter(Boolean)) {
      seen.add(id);
      let m = this.monsterMap.get(id);
      if (!m) {
        m = { id, type, def: type === 'boss' ? BOSS : MONSTERS[type], x, y, phase: id };
        this.monsterMap.set(id, m);
      }
      Object.assign(m, { tx: x, ty: y, hp, faceRight: !!face });
      if (hit) m.hitT = 0.25;
    }
    for (const id of [...this.monsterMap.keys()]) if (!seen.has(id)) this.monsterMap.delete(id);
    Monsters.list = [...this.monsterMap.values()].filter(m => m.def);
    if (!hadBoss && Monsters.boss) {
      Sfx.boss();
      toast(`${BOSS.emoji} ${itemNames(BOSS).main}!`);
    }
  },

  onItems(list) {
    Items.list = (list || []).filter(Boolean).map(([id, type, x, y]) =>
      ({ id, type, x, y, tx: Math.floor(x / T), ty: Math.floor(y / T), phase: id }));
    for (const id of [...Items.pending.keys()]) if (!Items.list.some(it => it.id === id)) Items.pending.delete(id);
  },
};

// ============================================================
// Input — 키보드(방향키/WASD/스페이스) + 가상 조이스틱
// ============================================================
const KEYMAP = {
  ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1],
};

const Input = {
  keys: new Set(),
  joy: { x: 0, y: 0, id: null },

  init() {
    // e.code 를 써서 한글 입력 상태에서도 WASD 가 동작하게 한다
    addEventListener('keydown', e => {
      if (KEYMAP[e.code]) { this.keys.add(e.code); e.preventDefault(); }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (!e.repeat) Game.onAction();
      }
    });
    addEventListener('keyup', e => this.keys.delete(e.code));
    addEventListener('blur', () => this.reset());

    if (matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0) document.body.classList.add('touch');

    const zone = $('#joystick-zone'), base = $('#joy-base'), knob = $('#joy-knob');
    const move = e => {
      const r = base.getBoundingClientRect();
      const max = r.width / 2;
      const dx = e.clientX - (r.left + max), dy = e.clientY - (r.top + max);
      const len = Math.hypot(dx, dy);
      const k = len > max ? max / len : 1;
      knob.style.setProperty('--dx', `${dx * k}px`);
      knob.style.setProperty('--dy', `${dy * k}px`);
      let nx = dx / max, ny = dy / max;
      const l = Math.hypot(nx, ny);
      if (l < 0.15) nx = ny = 0;
      else if (l > 1) { nx /= l; ny /= l; }
      this.joy.x = nx;
      this.joy.y = ny;
    };
    const end = e => { if (e.pointerId === this.joy.id) this.resetJoy(); };
    zone.addEventListener('pointerdown', e => {
      if (this.joy.id !== null) return;
      this.joy.id = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      move(e);
    });
    zone.addEventListener('pointermove', e => { if (e.pointerId === this.joy.id) move(e); });
    zone.addEventListener('pointerup', end);
    zone.addEventListener('pointercancel', end);
    zone.addEventListener('lostpointercapture', end);

    $('#btn-action').addEventListener('pointerdown', e => { e.preventDefault(); Game.onAction(); });
    addEventListener('contextmenu', e => e.preventDefault());
  },

  resetJoy() {
    this.joy = { x: 0, y: 0, id: null };
    const knob = $('#joy-knob');
    knob.style.setProperty('--dx', '0px');
    knob.style.setProperty('--dy', '0px');
  },

  reset() {
    this.keys.clear();
    this.resetJoy();
  },

  vector() {
    let x = this.joy.x, y = this.joy.y;
    for (const k of this.keys) { x += KEYMAP[k][0]; y += KEYMAP[k][1]; }
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    return { x, y };
  },
};

// ============================================================
// Render — 캔버스 그리기
// ============================================================
const Render = {
  canvas: null,
  ctx: null,
  dpr: 1,
  cssW: 0,
  cssH: 0,
  scale: 1,
  camX: 0,
  camY: 0,

  init() {
    this.canvas = $('#game');
    this.ctx = this.canvas.getContext('2d');
    const onResize = () => this.resize();
    addEventListener('resize', onResize);
    if (window.visualViewport) visualViewport.addEventListener('resize', onResize);
    this.resize();
  },

  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cssW = innerWidth;
    this.cssH = innerHeight;
    this.canvas.width = Math.round(this.cssW * this.dpr);
    this.canvas.height = Math.round(this.cssH * this.dpr);
    this.scale = Math.min(this.cssW, this.cssH) / (CONFIG.VIEW_TILES * T);
    if (Card.active) Card.fitWord(Card.passed ? 0.55 : 1);
  },

  draw(time) {
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#2e7d32';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (!World.canvas) return;

    const viewW = this.cssW / this.scale, viewH = this.cssH / this.scale;
    const mapW = World.w * T, mapH = World.h * T;
    this.camX = mapW <= viewW ? (mapW - viewW) / 2 : clamp(Player.x - viewW / 2, 0, mapW - viewW);
    this.camY = mapH <= viewH ? (mapH - viewH) / 2 : clamp(Player.y - viewH / 2, 0, mapH - viewH);

    const s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, -this.camX * s, -this.camY * s);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(World.canvas, 0, 0);

    // y 순서대로 그려서 앞뒤가 자연스럽게
    const drawables = Items.list.filter(it => !Items.pending.has(it.id)).map(it => ({ y: it.y, draw: () => this.drawItem(it, time) }));
    for (const m of Monsters.list) drawables.push({ y: m.y, draw: () => this.drawMonster(m, time) });
    const showHearts = Multi.mode !== 'solo';
    drawables.push({ y: Player.y, draw: () => this.drawCharacter(Player, Multi.myLook(), Game.weapon, Game.playerName, true, showHearts ? Game.hearts : null) });
    const o = Multi.other;
    if (Multi.otherVisible()) {
      drawables.push({ y: o.y, draw: () => {
        this.drawCharacter(o, Multi.remoteLook(), o.weapon, o.name, false, o.hearts);
        const icon = STATUS_ICONS[o.st];
        if (icon) this.drawStatus(o, icon, time);
      } });
    }
    drawables.sort((a, b) => a.y - b.y).forEach(d => d.draw());
    Monsters.arrows.forEach(a => this.drawArrow(a));
    if (Multi.otherVisible()) o.arrows.forEach(a => this.drawArrow(a));
    this.drawFloaters();
    this.drawCraftHint(time);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawEdgeArrow(World.door.x * T + T / 2, World.door.y * T, '🏠', Craft.canMakeAny() ? '🔨' : '');
    const boss = Monsters.boss;
    if (boss) this.drawEdgeArrow(boss.x, boss.y, BOSS.emoji, '');
    if (Multi.otherVisible()) this.drawEdgeArrow(o.x, o.y, '🧑', '', o.name);
  },

  drawMonster(m, time) {
    const ctx = this.ctx, s = m.def.size;
    const bob = Math.sin(time * 6 + m.phase) * 1.5;
    ctx.fillStyle = 'rgba(0,0,0,.22)';
    ctx.beginPath();
    ctx.ellipse(m.x, m.y + s * 0.35, s * 0.4, s * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(m.x, m.y - s * 0.15 + bob);
    if (m.faceRight) ctx.scale(-1, 1); // 이모지는 대부분 왼쪽을 본다
    if (m.hitT > 0 && Math.floor(m.hitT * 20) % 2) ctx.globalAlpha = 0.35;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.font = `${s}px ${FONT_EMOJI}`;
    ctx.fillText(m.def.emoji, 0, 0);
    ctx.restore();

    // 체력 막대
    const w = m.def.boss ? 44 : 24, top = m.y - s * 0.15 - s * 0.62 - 6;
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    ctx.fillRect(m.x - w / 2 - 1, top - 1, w + 2, 6);
    ctx.fillStyle = m.def.boss ? '#e53935' : '#66bb6a';
    ctx.fillRect(m.x - w / 2, top, w * Math.max(0, m.hp) / m.def.hp, 4);

    // 이름표
    const { main, sub } = itemNames(m.def);
    const ny = m.y + s * 0.45 + 6;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,.95)';
    ctx.fillStyle = m.def.boss ? '#b71c1c' : '#222';
    ctx.font = `800 ${m.def.boss ? 13 : 10}px ${FONT_UI}`;
    ctx.strokeText(main, m.x, ny);
    ctx.fillText(main, m.x, ny);
    if (sub) {
      ctx.font = `700 7px ${FONT_UI}`;
      ctx.fillStyle = '#555';
      ctx.strokeText(sub, m.x, ny + 9);
      ctx.fillText(sub, m.x, ny + 9);
    }
  },

  drawArrow(a) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(Math.atan2(a.fy, a.fx));
    ctx.fillStyle = '#6d4c41';
    ctx.fillRect(-9, -1, 14, 2);
    ctx.fillStyle = '#90a4ae';
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(4, -3);
    ctx.lineTo(4, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e53935';
    ctx.fillRect(-10, -2, 3, 4);
    ctx.restore();
  },

  drawFloaters() {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    for (const f of Floaters.list) {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 0.9);
      ctx.font = `${f.size}px ${FONT_EMOJI}`;
      ctx.fillText(f.text, f.x, f.y - f.t * 30);
    }
    ctx.globalAlpha = 1;
  },

  drawItem(it, time) {
    const ctx = this.ctx, def = ITEMS[it.type];
    const bob = Math.sin(time * 3 + it.phase) * 2;
    ctx.fillStyle = 'rgba(0,0,0,.2)';
    ctx.beginPath();
    ctx.ellipse(it.x, it.y + 9, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000'; // 반투명 색이 남아 있으면 이모지도 흐려진다
    ctx.font = `22px ${FONT_EMOJI}`;
    ctx.fillText(def.emoji, it.x, it.y - 4 + bob);

    // 반짝임
    const a = (Math.sin(time * 4 + it.phase) + 1) / 2;
    this.sparkle(it.x + 10, it.y - 14 + bob, 3 + a * 2, 0.4 + a * 0.6);

    // 이름표
    const { main, sub } = itemNames(def);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,.95)';
    ctx.fillStyle = '#222';
    ctx.font = `800 10px ${FONT_UI}`;
    ctx.strokeText(main, it.x, it.y + 16);
    ctx.fillText(main, it.x, it.y + 16);
    if (sub) {
      ctx.font = `700 7px ${FONT_UI}`;
      ctx.fillStyle = '#555';
      ctx.strokeText(sub, it.x, it.y + 25);
      ctx.fillText(sub, it.x, it.y + 25);
    }
  },

  sparkle(x, y, r, alpha) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + r * 0.3, y - r * 0.3);
    ctx.lineTo(x + r, y);
    ctx.lineTo(x + r * 0.3, y + r * 0.3);
    ctx.lineTo(x, y + r);
    ctx.lineTo(x - r * 0.3, y + r * 0.3);
    ctx.lineTo(x - r, y);
    ctx.lineTo(x - r * 0.3, y - r * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  },

  // 8칸 x 13칸 픽셀 캐릭터. e: 위치/방향/걷기/휘두르기 상태, look: 옷 색, weapon: 손에 든 무기,
  // label: 머리 위 이름, mine: 내 캐릭터면 이름을 파란색으로
  drawCharacter(e, look, weapon, label, mine, hearts) {
    const ctx = this.ctx, { y, dir } = e;
    const u = 2.5;
    // 맞은 순간: 좌우로 흔들리며 빨갛게 번쩍인다
    const hitT = e.hitT || 0;
    const x = e.x + (hitT > 0 ? Math.sin(hitT * 80) * 2.5 : 0);
    const flash = hitT > 0 && Math.floor(hitT * 20) % 2 === 0;
    const left = x - 4 * u, top = y + 6 - 13 * u;
    const step = e.moving ? Math.sin(e.walkT * 12) * 0.6 : 0;
    const box = (gx, gy, w, h, color) => { ctx.fillStyle = flash ? '#ff5252' : color; ctx.fillRect(left + gx * u, top + gy * u, w * u, h * u); };
    // 다친 뒤 무적 시간에는 깜빡인다
    ctx.save();
    if (hitT <= 0 && e.invulnT > 0 && Math.floor(e.invulnT * 10) % 2) ctx.globalAlpha = 0.4;

    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath();
    ctx.ellipse(x, y + 6, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const SKIN = '#f1c27d', SHOE = '#555', { hair: HAIR, shirt: SHIRT, pants: PANTS } = look;
    // 다리
    box(2, 9 + step, 2, 3, PANTS); box(2, 12 + step, 2, 1, SHOE);
    box(4, 9 - step, 2, 3, PANTS); box(4, 12 - step, 2, 1, SHOE);
    // 몸통 + 팔
    box(1, 5, 6, 4, SHIRT);
    box(0, 5 - step * 0.5, 1, 3, SHIRT); box(0, 8 - step * 0.5, 1, 1, SKIN);
    box(7, 5 + step * 0.5, 1, 3, SHIRT); box(7, 8 + step * 0.5, 1, 1, SKIN);
    // 머리
    box(1, 0, 6, 5, SKIN);
    if (dir === 'up') {
      box(1, 0, 6, 5, HAIR);
    } else {
      box(1, 0, 6, 2, HAIR);
      if (dir === 'down') {
        box(1, 2, 1, 1, HAIR); box(6, 2, 1, 1, HAIR);
        box(2, 3, 1, 1, '#fff'); box(5, 3, 1, 1, '#fff');
        box(2.5, 3, 0.5, 1, '#1a237e'); box(5, 3, 0.5, 1, '#1a237e');
      } else if (dir === 'left') {
        box(5, 2, 2, 2, HAIR);
        box(1.5, 3, 1, 1, '#1a237e');
      } else {
        box(1, 2, 2, 2, HAIR);
        box(5.5, 3, 1, 1, '#1a237e');
      }
    }
    this.drawHat(box, look.hat, dir);

    if (e.swingT > 0) {
      const k = e.swingT / 0.25;
      const ang = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 }[dir];
      ctx.strokeStyle = `rgba(255,255,255,${k})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y - 10, 20, ang - 0.9, ang + 0.9);
      ctx.stroke();
    }

    // 손에 든 무기 (휘두르면 앞으로 돌아간다)
    if (weapon && weapon !== 'hand') {
      const side = dir === 'left' ? -1 : 1;
      const swing = e.swingT > 0 ? 1 - e.swingT / 0.25 : 0;
      ctx.save();
      ctx.translate(x + side * 11, y - 9);
      ctx.rotate(side * (-0.5 + swing * 1.8));
      ctx.scale(side, 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.font = `15px ${FONT_EMOJI}`;
      ctx.fillText(WEAPONS[weapon].emoji, 0, -4);
      ctx.restore();
    }

    if (label) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,.95)';
      ctx.fillStyle = mine ? '#1565c0' : '#c62828';
      ctx.font = `900 11px ${FONT_UI}`;
      const ly = top - (look.hat ? 12 : 7);
      ctx.strokeText(label, x, ly);
      ctx.fillText(label, x, ly);
      // 2인용: 이름 위에 남은 하트
      if (hearts != null) {
        ctx.fillStyle = '#000';
        ctx.font = `7px ${FONT_EMOJI}`;
        for (let i = 0; i < CONFIG.MAX_HEARTS; i++) ctx.fillText(i < hearts ? '❤️' : '🤍', x + (i - (CONFIG.MAX_HEARTS - 1) / 2) * 8, ly - 10);
      }
    }
    ctx.restore();
  },

  // 모자 (box 는 drawCharacter 의 픽셀 격자 그리기 함수)
  drawHat(box, hat, dir) {
    if (!hat) return;
    if (hat.type === 'cap') {
      box(1, -1, 6, 1.6, hat.color);
      if (dir === 'down') box(0.5, 0.4, 7, 0.6, hat.color);
      else if (dir === 'left') box(-1, 0.4, 3, 0.6, hat.color);
      else if (dir === 'right') box(6, 0.4, 3, 0.6, hat.color);
    } else if (hat.type === 'band') {
      box(1, 0.8, 6, 0.8, hat.color);
    } else if (hat.type === 'beanie') {
      box(1, -1.2, 6, 2.2, hat.color);
      box(1, 0.6, 6, 0.4, '#fff');
      box(3.5, -2, 1, 1, '#fff');
    } else if (hat.type === 'crown') {
      box(1.5, -1.4, 5, 1.4, '#fdd835');
      box(1.5, -2.2, 1, 0.8, '#fdd835');
      box(3.5, -2.2, 1, 0.8, '#fdd835');
      box(5.5, -2.2, 1, 0.8, '#fdd835');
      box(3.5, -1.1, 1, 0.7, '#e53935');
    }
  },

  // 시작 화면의 캐릭터 미리보기
  drawLookPreview() {
    const c = $('#look-preview');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = 72 * dpr;
    c.height = 104 * dpr;
    const saved = this.ctx;
    this.ctx = c.getContext('2d');
    this.ctx.setTransform(2.4 * dpr, 0, 0, 2.4 * dpr, 0, 0);
    this.drawCharacter({ x: 15, y: 34, dir: 'down', moving: false, walkT: 0, swingT: 0 }, LOOKS[Game.lookIndex], 'hand', '');
    this.ctx = saved;
  },

  // 상대가 카드/제작/기절 중이면 머리 위(이름표 위)에 표시
  drawStatus(e, icon, time) {
    const ctx = this.ctx;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.font = `18px ${FONT_EMOJI}`;
    ctx.fillText(icon, e.x, e.y - 66 + Math.sin(time * 4) * 2);
  },

  // 만들 수 있는 무기가 있으면 집 위에 🔨 가 통통 튄다
  drawCraftHint(time) {
    if (!Craft.canMakeAny()) return;
    const ctx = this.ctx;
    const x = World.door.x * T + T / 2, y = World.house.y * T - 10 + Math.sin(time * 5) * 4;
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.font = `16px ${FONT_EMOJI}`;
    ctx.fillText('🔨', x, y + 1);
  },

  // 집/보스/상대가 화면 밖에 있으면 가장자리에 그 방향 화살표 (label: 아래에 이름)
  drawEdgeArrow(wx, wy, icon, badge, label) {
    const ctx = this.ctx;
    const hx = (wx - this.camX) * this.scale;
    const hy = (wy - this.camY) * this.scale;
    if (hx > 0 && hx < this.cssW && hy > 0 && hy < this.cssH) return;
    // 위쪽은 인벤토리, 아래쪽은 조이스틱/버튼을 피해서 놓는다
    const mx = 70, top = 100, bottom = document.body.classList.contains('touch') ? 200 : 70;
    const cx = this.cssW / 2, cy = (top + this.cssH - bottom) / 2;
    const halfH = Math.max(10, (this.cssH - bottom - top) / 2);
    const dx = hx - cx, dy = hy - cy;
    const k = Math.min((cx - mx) / Math.abs(dx || 1e-6), halfH / Math.abs(dy || 1e-6));
    const ax = cx + dx * k, ay = cy + dy * k, ang = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang);
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath();
    ctx.moveTo(48, 0);
    ctx.lineTo(30, -14);
    ctx.lineTo(30, 14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,.9)';
    ctx.beginPath();
    ctx.arc(ax, ay, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `32px ${FONT_EMOJI}`;
    ctx.fillText(icon, ax, ay + 2);
    if (badge) ctx.fillText(badge, ax + 26, ay - 24);
    if (label) {
      ctx.font = `900 13px ${FONT_UI}`;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,.95)';
      ctx.fillStyle = '#c62828';
      ctx.strokeText(label, ax, ay + 40);
      ctx.fillText(label, ax, ay + 40);
    }
  },
};

// ============================================================
// Game — 상태 관리 + 메인 루프
// ============================================================
const Game = {
  state: 'loading', // loading → title → play ↔ card / craft / faint → end
  tapMode: false,
  tapReason: '',
  inventory: {},
  weapons: new Set(),
  hearts: CONFIG.MAX_HEARTS,
  lookIndex: 0,
  playerName: '',
  kills: 0,
  bossKills: 0,
  cardsRead: 0,
  startedAt: 0,
  wasOnDoor: false,
  lastTime: 0,

  async init() {
    Store.loadSettings();
    console.log('[Game] 설정', Store.settings);
    Speech.init();
    Card.init();
    Craft.init();
    Input.init();
    Render.init();

    const msg = $('#title-msg');
    if (location.protocol === 'file:') {
      msg.textContent = '⚠️ 파일을 바로 열면 동작하지 않아요. README 의 로컬 서버 실행 방법을 따라 주세요. (python -m http.server 8000)';
      return;
    }
    try {
      await Words.load();
      if (!Words.all.length) throw new Error('단어가 없어요');
    } catch (err) {
      console.error('[Words] 불러오기 실패', err);
      msg.textContent = '⚠️ words.csv 를 불러오지 못했어요';
      return;
    }

    this.seed = Math.floor(Math.random() * 1e9);
    World.generate(this.seed);
    Player.reset();
    Items.fill();
    Monsters.fill();
    this.renderInventory();
    this.renderHearts();
    $('#btn-restart').addEventListener('click', () => location.reload());
    this.initMultiPanel();
    this.initLook();
    this.initName();
    $('#btn-continue').addEventListener('click', () => this.continueGame());

    this.state = 'title';
    const btn = $('#btn-start');
    btn.disabled = false;
    btn.addEventListener('click', () => this.start());
    requestAnimationFrame(t => this.loop(t));
    this.keepAliveInBackground();
    this.initFullscreen();
  },

  async start() {
    if (!this.prepare()) return;
    await this.begin();
  },

  // 시작 버튼을 눌렀을 때 바로 (소리 권한은 누른 순간에 받아야 한다). 이름이 없으면 시작하지 않는다
  prepare() {
    if (this.state !== 'title' || !this.readName()) return false;
    this.state = 'starting';
    Sfx.unlock();
    Speech.unlock();
    this.goFullscreen();
    return true;
  },

  // 폰 아래 버튼(뒤로/홈)을 덜 건드리게 전체 화면으로. 누른 순간에만 허락된다.
  // 실수로 빠져나가면 다음에 화면을 누를 때 다시 들어간다
  goFullscreen() {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen;
    this.wantFullscreen = true;
    if (!req || document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
      const p = req.call(el, { navigationUI: 'hide' });
      if (p && p.catch) p.catch(() => {});
    } catch { /* 미지원 */ }
  },

  initFullscreen() {
    document.addEventListener('pointerdown', () => {
      if (this.wantFullscreen && this.state === 'play') this.goFullscreen();
    }, true);
  },

  async begin() {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    $('#btn-start').disabled = true;
    await this.checkMic();
    $('#title').classList.add('hidden');
    this.renderInventory();
    this.renderHearts();
    this.startedAt = performance.now();
    this.state = 'play';
  },

  // 캐릭터 이름: 머리 위에 보인다. 이 기기에 저장해서 다음부터는 바로 시작
  initName() {
    const input = $('#name-input');
    input.maxLength = CONFIG.NAME_MAX;
    input.value = Store.get(KEYS.name, '') || '';
    // 글자를 칠 때 WASD/스페이스가 게임 조작으로 가지 않게
    input.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter') input.blur();
    });
  },

  readName() {
    const input = $('#name-input');
    const name = input.value.trim().slice(0, CONFIG.NAME_MAX);
    if (!name) {
      input.classList.remove('shake');
      void input.offsetWidth; // 애니메이션 다시 시작
      input.classList.add('shake');
      input.focus();
      return false;
    }
    this.playerName = name;
    Store.set(KEYS.name, name);
    return true;
  },

  // 캐릭터 모양: 처음엔 무작위, 이 기기에 저장. 🎨 로 다음 모양
  initLook() {
    const saved = Store.get(KEYS.look, null);
    this.lookIndex = Number.isInteger(saved) && saved >= 0 && saved < LOOKS.length
      ? saved : Math.floor(Math.random() * LOOKS.length);
    Store.set(KEYS.look, this.lookIndex);
    Render.drawLookPreview();
    $('#btn-look').addEventListener('click', () => {
      this.lookIndex = (this.lookIndex + 1) % LOOKS.length;
      Store.set(KEYS.look, this.lookIndex);
      Render.drawLookPreview();
      Sfx.unlock();
      Sfx.pickup();
    });
  },

  // 시작 화면의 👥: 🏠 방 만들기 / 번호 입력 후 ▶ 참가
  initMultiPanel() {
    const panel = $('#mp-panel'), input = $('#mp-code'), msg = $('#mp-msg');
    $('#btn-multi').disabled = false;
    $('#btn-multi').addEventListener('click', () => panel.classList.toggle('hidden'));
    $('#btn-host').addEventListener('click', () => this.startHost());
    $('#btn-join').addEventListener('click', () => this.startGuest(input.value.trim()));
    input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') this.startGuest(input.value.trim()); });
    const code = new URLSearchParams(location.search).get('join');
    if (/^\d{4}$/.test(code || '')) { input.value = code; panel.classList.remove('hidden'); }
    this.mpMsg = text => { msg.textContent = text; };
  },

  async startHost() {
    if (!this.prepare()) return;
    this.mpMsg('⏳');
    try {
      await Multi.startHost();
    } catch (err) {
      console.warn('[Multi] 방 만들기 실패', err);
      this.mpMsg('⚠️ 연결 실패');
      this.state = 'title';
      return;
    }
    await this.begin();
  },

  async startGuest(code) {
    if (this.state !== 'title') return;
    if (!/^\d{4}$/.test(code)) { this.mpMsg('🔢 ????'); return; }
    if (!this.prepare()) return;
    this.mpMsg('⏳');
    try {
      await Multi.startGuest(code);
    } catch (err) {
      console.warn('[Multi] 참가 실패', err);
      this.mpMsg(err.message === 'no-room' ? '❌ 방이 없어요' : '⚠️ 연결 실패');
      this.state = 'title';
      return;
    }
    await this.begin();
  },

  // 시작할 때 한 번 마이크 권한을 받아 둔다 (카드 도중에 권한 창이 뜨지 않게)
  async checkMic() {
    if (!Store.settings.stt) return this.setTapMode('disabled');
    if (!Speech.SR) return this.setTapMode('unsupported');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return this.setTapMode('insecure-context');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(tr => tr.stop());
      console.log('[Speech] 마이크 사용 가능');
    } catch (err) {
      this.setTapMode(`mic-denied:${err.name}`);
    }
  },

  setTapMode(reason) {
    if (this.tapMode) return;
    this.tapMode = true;
    this.tapReason = reason;
    console.warn('[Speech] 탭 모드로 전환:', reason);
    Card.toTap();
  },

  loop(ts) {
    this.step(ts);
    Render.draw(ts / 1000);
    if (Card.active) Card.el.mic.style.setProperty('--level', Meter.read().toFixed(2));
    requestAnimationFrame(t => this.loop(t));
  },

  // 지난 시간만큼 게임을 진행한다. 0.05초씩 나눠서 움직여 벽을 뚫지 않게 한다
  step(ts) {
    let left = Math.min(1, (ts - (this.lastTime || ts)) / 1000);
    this.lastTime = ts;
    Multi.tick(left);
    while (left > 0) {
      const dt = Math.min(0.05, left);
      left -= dt;
      this.update(dt);
      Floaters.update(dt);
    }
  },

  // 2인용인데 이 탭이 안 보이면(다른 탭/앱) 화면 그리기가 멈춘다. 그래도 상대와 통신은 계속한다
  keepAliveInBackground() {
    setInterval(() => {
      if (document.hidden && Multi.mode !== 'solo') this.step(performance.now());
    }, 250);
  },

  update(dt) {
    const playing = this.state === 'play';
    if (playing) Player.update(dt);
    else Player.moving = false;
    // 세상(아이템, 몬스터)은 방장/혼자 기기가 돌린다. 혼자 할 때는 카드/제작 중에 멈추고,
    // 2인용에서는 상대가 계속 놀 수 있게 계속 돌린다. 손님 기기는 받아서 그리기만 한다
    if (!Multi.isGuest && (playing || Multi.isHost)) {
      Items.respawn();
      Monsters.update(dt);
    }
    if (playing || Multi.mode !== 'solo') Monsters.updateArrows(dt);
    if (this.state !== 'play') return; // 화살로 처치해서 상태가 바뀌었을 수 있다
    Items.pickup();
    Monsters.touch();
    if (this.state !== 'play') return; // 다쳐서 기절했을 수 있다
    if (!Multi.isGuest && !Monsters.bossSpawned && Monsters.kills >= Monsters.nextBossAt) Monsters.spawnBoss();
    const onDoor = World.tileAtPx(Player.x, Player.y) === TILE.DOOR;
    if (onDoor && !this.wasOnDoor) this.enterHome();
    this.wasOnDoor = onDoor;
  },

  onAction() {
    if (this.state === 'title') { this.start(); return; }
    if (this.state === 'card') { Card.tapPass(); return; }
    if (this.state === 'end') { this.continueGame(); return; }
    if (this.state === 'play' && Player.swingT <= 0.1) {
      Player.swingT = 0.25;
      Sfx.swing();
      Monsters.attack();
    }
  },

  // 집에 들어가면: 체력 회복 → 제작대
  async enterHome() {
    this.state = 'craft';
    Input.reset();
    Sfx.door();
    this.hearts = CONFIG.MAX_HEARTS;
    this.renderHearts();
    await Craft.show();
    Player.reset();
    this.wasOnDoor = false;
    this.state = 'play';
  },

  // 단어 카드 n 장 (첫 장은 emoji 가 같은 단어 우선)
  async showCards(n, emoji) {
    this.state = 'card';
    Input.reset();
    for (let i = 0; i < n; i++) {
      await Card.show(Words.pick(i === 0 && emoji ? { emoji } : {}));
      this.cardsRead++;
    }
  },

  // 한 번에 여러 마리를 잡아도 카드가 겹치지 않게 차례대로 처리한다
  defeated: [],
  handlingDefeats: false,
  unlockShown: new Set(),

  onMonsterDefeated(m) {
    if (!m.def.boss) this.kills++;
    this.state = 'card';
    Input.reset();
    this.defeated.push(m);
    if (!this.handlingDefeats) this.handleDefeats();
  },

  async handleDefeats() {
    this.handlingDefeats = true;
    await delay(700); // 쓰러지는 모습을 잠깐 보여준다
    while (this.defeated.length) {
      const m = this.defeated.shift();
      await this.showCards(m.def.boss ? CONFIG.BOSS_CARDS : 1, m.def.emoji);
      if (m.def.boss) {
        this.handlingDefeats = false;
        this.victory();
        return;
      }
    }
    this.handlingDefeats = false;

    // 새로 열린 레시피 알림
    for (const r of RECIPES) {
      if (r.unlock > 0 && this.kills >= r.unlock && !this.unlockShown.has(r.result)) {
        this.unlockShown.add(r.result);
        const w = WEAPONS[r.result];
        toast(`🔓 ${w.emoji} ${itemNames(w).main}`);
      }
    }
    this.state = 'play';
  },

  // m: 몬스터 또는 상대 캐릭터(isPlayer). 맞으면 빨갛게 번쩍이며 때린 쪽 반대로 밀린다
  hurt(m) {
    if (this.state !== 'play' || Player.invulnT > 0) return;
    this.hearts--;
    Player.invulnT = CONFIG.INVULN_SEC;
    Player.hitT = CONFIG.HIT_FLASH_SEC;
    const dx = Player.x - m.x, dy = Player.y - m.y, d = Math.hypot(dx, dy) || 1;
    Player.knock = { x: dx / d * CONFIG.KNOCKBACK * T, y: dy / d * CONFIG.KNOCKBACK * T, t: 0.15 };
    Sfx.hurt();
    Floaters.add(Player.x, Player.y - 30, '💔', 16);
    this.renderHearts();
    if (this.hearts <= 0) {
      if (m.isPlayer) Multi.send('ko'); // 쓰러뜨린 상대 기기에 단어 카드
      this.faint();
    } else if (this.hearts === 1) this.autoEat();
  },

  // 체력이 1 남으면 가방의 하트나 음식을 자동으로 먹는다
  autoEat() {
    const food = this.inventory.heart > 0 ? 'heart'
      : Object.keys(ITEMS).find(type => ITEMS[type].kind === 'food' && this.inventory[type] > 0);
    if (!food) return;
    this.inventory[food]--;
    const heal = food === 'heart' ? CONFIG.HEART_HEAL : 2;
    this.hearts = Math.min(CONFIG.MAX_HEARTS, this.hearts + heal);
    const def = ITEMS[food];
    toast(`${def.emoji} ${itemNames(def).main} ❤️+${heal}`);
    Sfx.pickup();
    this.renderInventory();
    this.renderHearts();
  },

  // 기절해도 아이템은 그대로. 집에서 다시 시작 + 단어 카드
  async faint() {
    this.state = 'faint';
    Input.reset();
    console.log('[Game] 기절');
    const el = $('#faint');
    el.textContent = Store.settings.lang === 'en' ? '💫 Oops!' : '💫 기절!';
    el.classList.remove('hidden');
    await delay(1600);
    el.classList.add('hidden');
    Player.reset();
    this.wasOnDoor = false;
    this.hearts = CONFIG.MAX_HEARTS;
    this.renderHearts();
    await this.showCards(1);
    Player.invulnT = CONFIG.SPAWN_INVULN_SEC;
    this.state = 'play';
  },

  victory() {
    this.state = 'end';
    this.bossKills++;
    const mins = Math.max(1, Math.round((performance.now() - this.startedAt) / 60000));
    const total = this.kills + this.bossKills;
    console.log(`[Game] 승리! 처치 ${total}, 카드 ${this.cardsRead}, ${mins}분`);
    $('#end-title').textContent = PRAISE[Store.settings.lang === 'en' ? 'en' : 'ko'];
    $('#end-stats').innerHTML = `<span>👾 ${total}</span><span>📖 ${this.cardsRead}</span><span>⏱️ ${mins}</span>`;
    $('#end-overlay').classList.remove('hidden');
    Sfx.success();
    burst();
    if (Store.settings.lang === 'en') Speech.speak('You beat the dragon!', 'en');
    else Speech.speak(`${josa(BOSS.ko, '을', '를')} 물리쳤어요! 최고예요!`, 'ko');
  },

  // 같은 맵에서 계속: 몬스터는 계속 나오고, 몇 마리 더 잡으면 용이 다시 나온다 (Monsters.kill 참고)
  continueGame() {
    if (this.state !== 'end') return;
    $('#end-overlay').classList.add('hidden');
    Player.invulnT = CONFIG.INVULN_SEC;
    this.state = 'play';
  },

  renderHearts() {
    let html = '';
    for (let i = 0; i < CONFIG.MAX_HEARTS; i++) html += i < this.hearts ? '❤️' : '🤍';
    $('#hearts').textContent = html;
  },

  // 가진 무기 중 제일 센 것
  get weapon() {
    let best = 'hand';
    for (const id of this.weapons) if (WEAPONS[id].power > WEAPONS[best].power) best = id;
    return best;
  },

  addItem(type) {
    const def = ITEMS[type];
    if (def.kind === 'heart' && this.hearts < CONFIG.MAX_HEARTS) {
      this.hearts = Math.min(CONFIG.MAX_HEARTS, this.hearts + CONFIG.HEART_HEAL);
      Sfx.pickup();
      toast(`${def.emoji} ${itemNames(def).main} ❤️+${CONFIG.HEART_HEAL}`);
      this.renderHearts();
      return;
    }
    // 다쳤을 때 음식을 주우면 바로 먹는다
    if (def.kind === 'food' && this.hearts < CONFIG.MAX_HEARTS) {
      this.hearts++;
      Sfx.pickup();
      toast(`${def.emoji} ${itemNames(def).main} ❤️+1`);
      this.renderHearts();
      return;
    }
    this.inventory[type] = (this.inventory[type] || 0) + 1;
    Sfx.pickup();
    const { main, sub } = itemNames(def);
    toast(`${def.emoji} ${main}${sub ? ` <small>${sub}</small>` : ''} +1`);
    this.renderInventory(type);
  },

  renderInventory(bumpType) {
    const inv = $('#inventory');
    inv.innerHTML = '';
    // 들고 있는 무기 (✋ 버튼 그림도 같이 바꾼다)
    const w = WEAPONS[this.weapon];
    $('#btn-action').textContent = w.emoji;
    if (this.weapon !== 'hand') {
      const { main, sub } = itemNames(w);
      const slot = document.createElement('div');
      slot.className = 'inv-slot weapon';
      slot.innerHTML = `<span class="e">${w.emoji}</span><span class="names"><span class="n">${main}</span>` +
        `${sub ? `<span class="s">${sub}</span>` : ''}</span>`;
      inv.appendChild(slot);
    }
    const owned = Object.keys(ITEMS).filter(type => this.inventory[type] > 0);
    if (!owned.length) {
      if (this.weapon === 'hand') inv.innerHTML = '<div class="inv-empty">🎒</div>';
      return;
    }
    for (const type of owned) {
      const def = ITEMS[type], { main, sub } = itemNames(def);
      const slot = document.createElement('div');
      slot.className = `inv-slot${type === bumpType ? ' bump' : ''}`;
      slot.innerHTML = `<span class="e">${def.emoji}</span><span class="names"><span class="n">${main}</span>` +
        `${sub ? `<span class="s">${sub}</span>` : ''}</span><b>${this.inventory[type]}</b>`;
      inv.appendChild(slot);
    }
  },
};

// 콘솔 디버깅용: BC.Judge.judge('나무', ['나모']), BC.Game.enterHome() 등
window.BC = { CONFIG, Store, Words, Judge, Speech, Card, Craft, World, Items, Monsters, Player, Multi, Game };

Game.init();
