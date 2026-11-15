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
  MAP_W: 120,
  MAP_H: 90,
  VIEW_TILES: 9,          // 화면 짧은 변에 보이는 타일 수
  PLAYER_SPEED: 4.2,      // 타일/초
  PLAYER_RADIUS: 0.3,     // 타일 단위 충돌 반경
  ITEM_COUNT: 90,
  ITEM_RESPAWN_MS: 6000,
  HEART_COUNT: 20,        // 맵에 떠 있는 ❤️ 하트 수
  HEART_RESPAWN_MS: 10000,
  HEART_HEAL: 2,          // ❤️ 하나로 채우는 체력
  PICKUP_RADIUS: 0.7,     // 타일 단위

  // 전투
  MAX_HEARTS: 5,
  INVULN_SEC: 1.2,        // 다친 뒤 무적 시간
  HIT_FLASH_SEC: 0.35,    // 맞았을 때 빨갛게 번쩍이며 흔들리는 시간
  STEP_SEC: 0.12,         // 발자국 소리 간격
  STEP_VOL: 0.02,         // 발자국 소리 크기 (다른 효과음은 0.06~0.15)
  KNOCKBACK: 6,           // 맞았을 때 뒤로 밀리는 속도 (타일/초, 0.15초 동안)
  SPAWN_INVULN_SEC: 3,    // 기절 후 집에서 다시 시작할 때 무적 시간
  TORCH_RADIUS: 3,        // 타일. 🔥 횃불 둘레는 몬스터가 못 들어온다
  SAVE_MS: 5000,          // 세상/가방 저장 간격
  TREE_HITS: 3,           // 맨손으로 나무를 캐는 데 필요한 횟수 (🪓 도끼는 한 번)
  ROCK_HITS: 5,           // 맨손으로 바위를 캐는 데 필요한 횟수 (🪓 도끼, 🗡️ 칼은 ROCK_HITS_TOOL 번)
  ROCK_HITS_TOOL: 2,
  MONSTER_RESPAWN_MS: 8000, // 몇 마리씩 사는지는 MONSTERS 의 count
  FLEE_RANGE: 3.5,          // 타일. 초식동물/물고기는 사람이나 육식동물이 이만큼 오면 도망간다
  PET_FOLLOW: 1.3,        // 타일. 먹이를 받은 동물이 주인과 이만큼 떨어져 따라온다
  PET_TELEPORT: 12,       // 타일. 주인과 이보다 멀어지면 (집에서 다시 시작 등) 주인 옆으로 온다
  PET_PLAY: [1.1, 2.4],   // 타일. 따라온 동물이 주인 둘레를 서성이는 거리 (가까이 ~ 멀리)
  PET_HAPPY_SEC: 3,       // 먹이를 또 받으면 이만큼 신나서 콩콩 뛴다
  BITE_SEC: 1,            // 육식동물이 초식동물을 무는 간격
  THROW_RANGE: 5,         // 타일. 먹이 던지는 거리
  AGGRO_RANGE: 4.5,       // 타일. 이 안에 들어오면 몬스터가 다가온다
  BOSS_AGGRO_RANGE: 7,    // 용은 더 멀리서 알아챈다
  SAFE_RADIUS: 4,         // 타일. 집 주변은 몬스터가 못 들어오는 안전지대
  ATTACK_RANGE: 0.9,      // 타일. 근접 무기 사거리
  ARROW_SPEED: 10,        // 타일/초
  ARROW_RANGE: 6,         // 타일
  BOSS_AFTER_KILLS: 3,    // 몬스터를 이만큼 잡으면 보스 등장

  // 원격 여럿이 하기
  NET_SEND_MS: 100,       // 상태를 보내는 간격
  NET_EVENT_KEEP_MS: 3000, // 줍기/때리기 같은 이벤트를 이 시간 동안 계속 실어 보낸다
  NET_TIMEOUT_MS: 8000,   // 이 시간 동안 소식이 없으면 그 사람이 나간 것으로 본다
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
  wood:   { emoji: '🪵', ko: '통나무', en: 'log',  kind: 'material', weight: 4 },
  stone:  { emoji: '🪨', ko: '돌',   en: 'rock',   kind: 'material', weight: 3 },
  string: { emoji: '🧵', ko: '실',   en: 'string', kind: 'material', weight: 2 },
  iron:   { emoji: '🔩', ko: '쇠',   en: 'iron',   kind: 'material', weight: 2 },
  apple:  { emoji: '🍎', ko: '사과', en: 'apple',  kind: 'food',     weight: 2 },
  milk:   { emoji: '🥛', ko: '우유', en: 'milk',   kind: 'food',     weight: 1 },
  grape:  { emoji: '🍇', ko: '포도', en: 'grape',  kind: 'food',     weight: 1 },
  egg:    { emoji: '🥚', ko: '알',   en: 'egg',    kind: 'food',     weight: 1 },
  // 하트는 따로 HEART_COUNT 개가 생긴다. 다쳤으면 바로 체력을 채우고, 가득이면 가방에 넣어 둔다
  heart:  { emoji: '❤️', ko: '하트', en: 'heart',  kind: 'heart',    weight: 0 },
  // 맵에서 캔 것. 손에 들고 ✋ 를 누르면 앞칸에 놓는다 (tile: 놓으면 되는 맵 칸).
  // 그림은 이모지 대신 맵 칸 그림 그대로 (iconHtml / tileIcon)
  tree:   { emoji: '🌳', ko: '나무', en: 'tree',    kind: 'block', tile: 'TREE',   weight: 0 },
  flower: { emoji: '🌷', ko: '꽃',   en: 'flower',  kind: 'block', tile: 'FLOWER', weight: 0 },
  rock:   { emoji: '🪨', ko: '바위', en: 'boulder', kind: 'block', tile: 'ROCK',   weight: 0 },
  // 제작대에서 만드는 블록
  brick:  { emoji: '🧱', ko: '벽돌', en: 'brick',   kind: 'block', tile: 'BRICK',  weight: 0 },
  gate:   { emoji: '🚪', ko: '문',   en: 'door',    kind: 'block', tile: 'GATE',   weight: 0 }, // 사람은 지나가고 몬스터는 못 지나간다
  bridge: { emoji: '🌉', ko: '다리', en: 'bridge',  kind: 'block', tile: 'BRIDGE', weight: 0 }, // 물 위에만 놓는다
  torch:  { emoji: '🔥', ko: '횃불', en: 'torch',   kind: 'block', tile: 'TORCH',  weight: 0 }, // 둘레에 몬스터가 못 온다
};

// 무기 (power 가 클수록 강하다. 제일 센 무기를 자동으로 든다)
const WEAPONS = {
  hand:  { emoji: '✋', ko: '손',   en: 'hand',  power: 1 },
  // fix: 이모지가 놓인 방향 바로잡기 (flip: 좌우 뒤집기 → 도끼날이 앞으로, turn: 180도 → 칼날이 위로)
  axe:   { emoji: '🪓', ko: '도끼', en: 'axe',   power: 2, fix: 'flip' },
  bow:   { emoji: '🏹', ko: '활',   en: 'bow',   power: 3 },
  sword: { emoji: '🗡️', ko: '칼',   en: 'sword', power: 4, fix: 'turn' },
};

// 제작대 레시피 (집 안). unlock: 몬스터를 이만큼 잡아야 열린다. 무기는 한 번만, 블록은 몇 번이든 (count 개씩)
const RECIPES = [
  { result: 'axe',    needs: { wood: 2, stone: 1 },           unlock: 0 },
  { result: 'bow',    needs: { wood: 1, string: 2 },          unlock: 1 },
  { result: 'sword',  needs: { iron: 2, stone: 1, wood: 1 }, unlock: 2 },
  { result: 'brick',  needs: { stone: 2 },                    unlock: 0, count: 2 },
  { result: 'gate',   needs: { wood: 2 },                     unlock: 0, count: 1 },
  { result: 'bridge', needs: { wood: 1 },                     unlock: 0, count: 2 },
  { result: 'torch',  needs: { wood: 1, stone: 1 },           unlock: 0, count: 2 },
];

// 지도 네 구역 (집은 가운데, 경계는 구불구불하게 이어진다). 구역마다 땅 색과 사는 동물이 다르다
const REGION = { FOREST: 0, LAKE: 1, SWAMP: 2, MEADOW: 3 };
const REGIONS = [
  { emoji: '🌲', ko: '무서운 숲', en: 'Dark Forest' }, // 왼쪽 위: 나무가 빽빽, 육식동물
  { emoji: '🏞️', ko: '호수',     en: 'Lakes' },       // 오른쪽 위: 큰 호수, 물고기
  { emoji: '🍄', ko: '어두운 늪', en: 'Dark Swamp' },  // 왼쪽 아래: 어둡고 축축, 벌레
  { emoji: '🌼', ko: '초원',     en: 'Meadow' },      // 오른쪽 아래: 꽃밭, 초식동물
];
// 땅 색 (풀 + 점, 물, 모래, 나뭇잎). DEFAULT 는 블록 그림 같은 구역 없는 그림
const GROUND = {
  DEFAULT: { grass: ['#5cb85c', '#4fa64f', '#6fcb6a'], water: ['#3b8de0', '#74b9f0'], sand: ['#e9d68f', '#d8c27a', '#f3e3a6'], leaf: ['#2e7d32', '#43a047', '#66bb6a'] },
  [REGION.FOREST]: { grass: ['#4a9a48', '#3f8a3e', '#56a854'], water: ['#3b8de0', '#74b9f0'], sand: ['#e0cc85', '#cfb972', '#ead99c'], leaf: ['#1b5e20', '#2e7d32', '#43a047'] },
  [REGION.LAKE]:   { grass: ['#5cb87a', '#4fa66c', '#6fcb8a'], water: ['#3b8de0', '#74b9f0'], sand: ['#e9d68f', '#d8c27a', '#f3e3a6'], leaf: ['#2e7d32', '#43a047', '#66bb6a'] },
  [REGION.SWAMP]:  { grass: ['#4e6b48', '#435d3e', '#6b5a7a'], water: ['#4d7468', '#6b9488'], sand: ['#7d6b4c', '#6d5c40', '#8c7a58'], leaf: ['#33502f', '#3f6339', '#55744a'] },
  [REGION.MEADOW]: { grass: ['#7ccc5c', '#6dbd4e', '#8fd96b'], water: ['#3b8de0', '#74b9f0'], sand: ['#f0df9a', '#e0cd85', '#f8ebb5'], leaf: ['#2e7d32', '#43a047', '#66bb6a'] },
};

// 동물 (이름도 글자로 같이 보여준다. emoji 가 words.csv 와 같으면 잡은 뒤 그 단어 카드가 나온다)
//   region: 사는 구역 (거기서 생기고, 쫓아가지 않을 때는 그 구역 안을 돌아다닌다), count: 몇 마리
//   hunts: 육식동물 (사람과 초식동물을 쫓는다), calm: 먼저 공격하지 않고 다가가면 도망간다
//   (먹이를 맞으면 그 사람을 따라다닌다), swim: 물에서만 다닌다
const MONSTERS = {
  // 🌲 무서운 숲
  wolf:     { emoji: '🐺', ko: '늑대',   en: 'wolf',     hp: 4, speed: 2.0, size: 26, drops: { iron: 1 },            region: REGION.FOREST, count: 3, hunts: true },
  fox:      { emoji: '🦊', ko: '여우',   en: 'fox',      hp: 4, speed: 1.9, size: 26, drops: { iron: 1, wood: 1 },   region: REGION.FOREST, count: 3, hunts: true },
  bear:     { emoji: '🐻', ko: '곰',     en: 'bear',     hp: 6, speed: 1.5, size: 28, drops: { iron: 2 },            region: REGION.FOREST, count: 2, hunts: true },
  tiger:    { emoji: '🐯', ko: '호랑이', en: 'tiger',    hp: 7, speed: 1.8, size: 28, drops: { iron: 2, wood: 1 },   region: REGION.FOREST, count: 2, hunts: true },
  // 🏞️ 호수
  fish:     { emoji: '🐟', ko: '물고기', en: 'fish',     hp: 2, speed: 1.6, size: 22, drops: { egg: 1 },             region: REGION.LAKE, count: 8, calm: true, swim: true },
  blowfish: { emoji: '🐡', ko: '복어',   en: 'blowfish', hp: 3, speed: 1.2, size: 22, drops: { egg: 1, stone: 1 },   region: REGION.LAKE, count: 4, calm: true, swim: true },
  hippo:    { emoji: '🦛', ko: '하마',   en: 'hippo',    hp: 5, speed: 1.3, size: 28, drops: { stone: 2 },           region: REGION.LAKE, count: 2 },
  crab:     { emoji: '🦀', ko: '게',     en: 'crab',     hp: 3, speed: 1.5, size: 22, drops: { stone: 1 },           region: REGION.LAKE, count: 3 },
  // 🍄 어두운 늪
  spider:   { emoji: '🕷️', ko: '거미',   en: 'spider',   hp: 3, speed: 1.6, size: 24, drops: { string: 2 },          region: REGION.SWAMP, count: 4, hunts: true },
  scorpion: { emoji: '🦂', ko: '전갈',   en: 'scorpion', hp: 4, speed: 1.6, size: 24, drops: { iron: 1, string: 1 }, region: REGION.SWAMP, count: 2, hunts: true },
  ant:      { emoji: '🐜', ko: '개미',   en: 'ant',      hp: 2, speed: 2.2, size: 20, drops: { wood: 1 },            region: REGION.SWAMP, count: 3 },
  bat:      { emoji: '🦇', ko: '박쥐',   en: 'bat',      hp: 2, speed: 2.4, size: 22, drops: { string: 1 },          region: REGION.SWAMP, count: 3 },
  // 🌼 초원 (초식동물)
  rabbit:   { emoji: '🐰', ko: '토끼',   en: 'rabbit',   hp: 2, speed: 2.6, size: 22, drops: { apple: 1 },           region: REGION.MEADOW, count: 3, calm: true },
  sheep:    { emoji: '🐑', ko: '양',     en: 'sheep',    hp: 3, speed: 1.8, size: 26, drops: { string: 2 },          region: REGION.MEADOW, count: 3, calm: true },
  cow:      { emoji: '🐄', ko: '소',     en: 'cow',      hp: 4, speed: 1.5, size: 28, drops: { milk: 2 },            region: REGION.MEADOW, count: 2, calm: true },
  chicken:  { emoji: '🐔', ko: '닭',     en: 'hen',      hp: 2, speed: 2.0, size: 22, drops: { egg: 2 },             region: REGION.MEADOW, count: 3, calm: true },
  pig:      { emoji: '🐖', ko: '돼지',   en: 'pig',      hp: 3, speed: 1.7, size: 26, drops: { apple: 1, grape: 1 }, region: REGION.MEADOW, count: 2, calm: true },
  deer:     { emoji: '🦌', ko: '사슴',   en: 'deer',     hp: 3, speed: 2.6, size: 28, drops: { wood: 1 },            region: REGION.MEADOW, count: 2, calm: true },
};
const BOSS = { emoji: '🐉', ko: '용', en: 'dragon', hp: 12, speed: 1.4, size: 56, drops: {}, boss: true };

const FACING = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
// 맵 만드는 방법이 바뀌면 +1 (예전 저장의 바뀐 칸은 버린다)
const WORLD_GEN = 2;

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
// net.js 는 한 주소로만 불러온다 (주소가 다르면 Firebase 가 두 번 시작되어 오류)
const NET_URL = './net.js?v=20';

// 이 탭에서 하던 여럿이 하기 { mode: 'host'|'guest', code }. 새로고침하면 시작 화면 없이 그 방으로 저절로 다시 간다.
// sessionStorage 라 창을 닫았다 새로 열면 지워져서 시작 화면이 나온다
const Session = {
  KEY: 'bc.session',
  get() { try { return JSON.parse(sessionStorage.getItem(this.KEY)); } catch { return null; } },
  set(v) { try { sessionStorage.setItem(this.KEY, JSON.stringify(v)); } catch { /* 저장 불가 */ } },
  clear() { try { sessionStorage.removeItem(this.KEY); } catch { /* 저장 불가 */ } },
};

// room: 지난번 방 번호 { host: 내가 만든 방, join: 들어간 방 } (새로고침해도 같은 번호로)
const KEYS = { room: 'bc.room', settings: 'bc.settings', stats: 'bc.stats', log: 'bc.log', csv: 'bc.wordsCsv', look: 'bc.look', name: 'bc.name', world: 'bc.world' };

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

  // 소리가 같은 모음은 하나로 (ㅐ/ㅔ 를 구분해 말하지 않아서 "게"를 "개"로 알아듣는다)
  const SAME_SOUND = { 'ㅐ': 'ㅔ', 'ㅒ': 'ㅖ', 'ㅗㅐ': 'ㅜㅔ', 'ㅗㅣ': 'ㅜㅔ' };

  // "나무" → "ㄴㅏㅁㅜ", 겹받침/이중모음도 쪼갠다
  function toJamo(s) {
    let out = '';
    for (const ch of s) {
      if (!isHangul(ch)) { out += ch; continue; }
      const idx = ch.charCodeAt(0) - 0xAC00, jung = JUNG[Math.floor((idx % 588) / 28)];
      out += CHO[Math.floor(idx / 588)] + (SAME_SOUND[jung] || jung) + JONG[idx % 28];
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
    // 한 글자 단어: 인식 결과 안에 소리가 같은 글자가 있으면 통과 ("게" → "개야")
    if (single && Array.from(c).some(ch => toJamo(ch) === toJamo(t))) return { score: 1, how: 'single-char' };
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

  // 버튼을 누르거나 닫을 때 '톡'
  click() { this.tone(700, 0.06, { type: 'triangle', to: 1000, vol: 0.1 }); },
  pickup() { this.tone(660, 0.08); this.tone(990, 0.14, { delay: 0.07 }); },
  success() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, { type: 'triangle', delay: i * 0.09 })); },
  soft() { this.tone(330, 0.25, { to: 260, vol: 0.1 }); },
  swing() { this.tone(240, 0.12, { type: 'triangle', to: 120, vol: 0.06 }); },
  door() { this.tone(392, 0.12, { type: 'triangle' }); this.tone(523, 0.18, { type: 'triangle', delay: 0.1 }); },
  hit() { this.tone(180, 0.1, { type: 'square', to: 90, vol: 0.08 }); },
  hurt() { this.tone(440, 0.2, { type: 'triangle', to: 220, vol: 0.1 }); },
  defeat() { [392, 523, 659].forEach((f, i) => this.tone(f, 0.12, { type: 'square', vol: 0.06, delay: i * 0.06 })); },
  // 사사사사: 작고 짧은 화이트 노이즈 발소리. 높은 쪽을 깎아 낮게, 다른 소리보다 훨씬 작게, 자주
  step(left) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t0 = ctx.currentTime;
    if (!this.noise) {
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource(), low = ctx.createBiquadFilter(), gain = ctx.createGain();
    src.buffer = this.noise;
    low.type = 'lowpass';
    low.frequency.value = left ? 1200 : 1500;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(CONFIG.STEP_VOL, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07);
    src.connect(low).connect(gain).connect(ctx.destination);
    src.start(t0);
    src.stop(t0 + 0.09);
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
    // 맞춘 뒤에는 아무 곳이나 누르면(아무 키나) 칭찬 말을 끊고 바로 게임으로
    const skip = new Promise(resolve => {
      const since = performance.now();
      const onInput = e => {
        if (performance.now() - since < 250) return;
        e.preventDefault();
        e.stopPropagation();
        resolve();
      };
      addEventListener('pointerdown', onInput, true);
      addEventListener('keydown', onInput, true);
      this.stopSkip = () => {
        removeEventListener('pointerdown', onInput, true);
        removeEventListener('keydown', onInput, true);
      };
    });
    const skipped = await Promise.race([Promise.all([praise, delay(CONFIG.SUCCESS_SHOW_MS)]), skip.then(() => true)]);
    this.stopSkip();
    if (skipped && 'speechSynthesis' in window) speechSynthesis.cancel();
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
  sel: 0, // 키보드로 가리키는 것: 레시피 번호, RECIPES.length 는 🚪 닫기

  init() {
    this.el = { overlay: $('#craft-overlay'), list: $('#recipes') };
    $('#btn-craft-close').addEventListener('click', () => this.close());
    // 카드 아무 데나 누르면 만든다 (못 만들면 '삐')
    this.el.list.addEventListener('click', e => {
      const card = e.target.closest('[data-recipe]');
      if (!card) return;
      const r = RECIPES[Number(card.dataset.recipe)];
      if (this.canMake(r)) this.make(r); else Sfx.soft();
    });
    addEventListener('keydown', e => { if (this.open) this.onKey(e); });
  },

  // 키보드: 화살표(WASD)로 고르고 스페이스/엔터로 만들기 또는 닫기, Q/Esc 닫기
  onKey(e) {
    // 제작대가 받은 키는 게임 쪽(공격, Q 고르는 칸)으로 넘기지 않는다 (닫히자마자 공격/고르는 칸이 열리지 않게)
    e.stopImmediatePropagation();
    const n = RECIPES.length + 1;
    const step = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 }[e.code];
    const vert = { ArrowUp: -1, KeyW: -1, ArrowDown: 1, KeyS: 1 }[e.code];
    if (step || vert) {
      e.preventDefault();
      this.sel = step ? (this.sel + step + n) % n : this.below(vert);
      this.markSel();
      Sfx.click();
    } else if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) {
      e.preventDefault();
      Sfx.click();
      if (this.sel === RECIPES.length) this.close();
      else if (this.canMake(RECIPES[this.sel])) this.make(RECIPES[this.sel]);
      else Sfx.soft();
    } else if (e.code === 'Escape' || e.code === 'KeyQ') {
      e.preventDefault();
      Sfx.click();
      this.close();
    }
  },

  // 가리킬 수 있는 것: 레시피들 + 🚪 닫기 (sel 번호 순서)
  targets() { return [...this.el.list.querySelectorAll('.recipe'), $('#btn-craft-close')]; },

  // ↑↓: 화면에서 바로 위/아래 줄에 있는 것 중 가로로 가장 가까운 것 (없으면 그대로)
  below(dir) {
    const boxes = this.targets().map(el => el.getBoundingClientRect());
    const cur = boxes[this.sel], cy = cur.top + cur.height / 2, cx = cur.left + cur.width / 2;
    let best = this.sel, bestScore = Infinity;
    boxes.forEach((b, i) => {
      const dy = (b.top + b.height / 2 - cy) * dir;
      if (i === this.sel || dy < 10) return;
      const score = dy * 3 + Math.abs(b.left + b.width / 2 - cx);
      if (score < bestScore) { bestScore = score; best = i; }
    });
    return best;
  },

  markSel() {
    const all = this.targets();
    all.forEach((el, i) => el.classList.toggle('sel', i === this.sel));
    if (all[this.sel] && this.open) all[this.sel].scrollIntoView({ block: 'nearest' });
  },

  has(type, n) { return (Game.inventory[type] || 0) >= n; },
  unlocked(r) { return Game.kills >= r.unlock; },
  canMake(r) {
    return this.unlocked(r) && !Game.weapons.has(r.result) &&
      Object.entries(r.needs).every(([type, n]) => this.has(type, n));
  },
  // 집 위 🔨 알림은 새 무기를 만들 수 있을 때만 (블록은 자주 만들 수 있어서 알림을 띄우지 않는다)
  canMakeAny() { return RECIPES.some(r => WEAPONS[r.result] && this.canMake(r)); },

  show() {
    this.open = true;
    // 처음엔 만들 수 있는 첫 무기, 없으면 🚪 닫기를 가리킨다
    const ready = RECIPES.findIndex(r => this.canMake(r));
    this.sel = ready >= 0 ? ready : RECIPES.length;
    this.render();
    this.el.overlay.classList.remove('hidden');
    return new Promise(res => { this.resolve = res; });
  },

  // 레시피마다 작은 카드 (그림 이름 / 재료 그림+개수 / 오른쪽 위 표시: 🔨 만들 수 있음, ✅ 있음, 🔒 잠김).
  // 무기 / 블록으로 한 줄씩, 많으면 다음 줄로
  render() {
    const card = (r, i) => {
      const w = WEAPONS[r.result] || ITEMS[r.result], weapon = !!WEAPONS[r.result];
      const owned = Game.weapons.has(r.result), ready = this.canMake(r), locked = !this.unlocked(r);
      const needs = locked
        ? `<span class="lock">👾 ${Game.kills}/${r.unlock}</span>`
        : Object.entries(r.needs).map(([type, n]) => {
          const def = ITEMS[type], have = Math.min(Game.inventory[type] || 0, n);
          return `<span class="need${have >= n ? ' ok' : ''}" title="${itemNames(def).main}">${def.emoji}<b>${have}/${n}</b></span>`;
        }).join('');
      const mark = owned ? '✅' : locked ? '🔒' : ready ? '🔨' : '';
      return `<div class="recipe${owned ? ' owned' : ''}${ready ? ' ready' : ''}${locked ? ' locked' : ''}" data-recipe="${i}">
        <div class="recipe-result"><span class="e">${iconHtml(w)}</span><span class="n">${itemNames(w).main}</span>
          <span class="power">${weapon ? '⭐'.repeat(w.power) : `x${r.count}`}</span></div>
        <div class="recipe-needs">${needs}</div>
        ${mark ? `<span class="mark">${mark}</span>` : ''}
      </div>`;
    };
    const lang = Store.settings.lang === 'en';
    // sel 번호가 RECIPES 순서와 같도록 무기가 RECIPES 앞쪽에 있다
    const row = (icon, title, weapon) => `<div class="recipe-row"><div class="recipe-group"><span>${icon}</span>${title}</div>` +
      `<div class="recipe-cards">${RECIPES.map((r, i) => (!!WEAPONS[r.result] === weapon ? card(r, i) : '')).join('')}</div></div>`;
    this.el.list.innerHTML = row('⚔️', lang ? 'Weapons' : '무기', true) + row('🧱', lang ? 'Blocks' : '블록', false);
    this.markSel();
  },

  make(r) {
    if (!r || !this.canMake(r)) return;
    for (const [type, n] of Object.entries(r.needs)) Game.inventory[type] -= n;
    const w = WEAPONS[r.result] || ITEMS[r.result], { main } = itemNames(w);
    if (WEAPONS[r.result]) {
      Game.weapons.add(r.result);
      Game.picked = Game.lastWeapon = r.result;  // 새로 만든 무기를 바로 든다
    } else {
      Game.inventory[r.result] = (Game.inventory[r.result] || 0) + r.count;  // 블록은 가방에 (손에 든 것은 그대로)
    }
    console.log(`[Craft] ${w.ko} 제작`);
    Sfx.success();
    burst();
    toast(`${iconHtml(w)} ${main}!`);
    if (Store.settings.lang === 'en') Speech.speak(`${w.en}!`, 'en');
    else Speech.speak(`${josa(w.ko, '을', '를')} 만들었어요!`, 'ko');
    Game.renderInventory();
    this.sel = RECIPES.indexOf(r); // 방금 만든 것을 계속 가리킨다 (마우스로 눌러 만들어도)
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
const TILE = {
  GRASS: 0, TREE: 1, WATER: 2, SAND: 3, ROCK: 4, FLOWER: 5, HOUSE: 6, DOOR: 7, PATH: 8,
  BRICK: 9, GATE: 10, BRIDGE: 11, TORCH: 12, // 놓아서 생기는 칸 (GATE 는 집 문(DOOR)과 다른 내가 놓는 문)
};
const BLOCKING = new Set([TILE.TREE, TILE.WATER, TILE.ROCK, TILE.HOUSE, TILE.BRICK, TILE.TORCH]);
const MONSTER_BLOCKING = new Set([...BLOCKING, TILE.GATE]); // 문은 몬스터만 막는다
const ARROW_BLOCKING = new Set([TILE.TREE, TILE.ROCK, TILE.HOUSE, TILE.BRICK, TILE.GATE, TILE.TORCH]);
const CHUNK = 16; // 그림 조각 크기 (칸)
const MINI_COLORS = ['#7ccf6f', '#2e7d32', '#3b8de0', '#e9d68f', '#8d939b', '#f48fb1', '#c0392b', '#c0392b', '#c8a06a',
  '#b5523b', '#8d5a2b', '#a0703f', '#ffb300'];
// 캐기: 칸 → 나오는 것, 맨손 횟수, 도구 횟수(tools 를 들었을 때), 캔 뒤 칸
const DIG = {
  [TILE.FLOWER]: { gives: ['flower'], hand: 1 },
  [TILE.TREE]: { gives: ['tree', 'wood'], hand: 'TREE_HITS', tool: 1, tools: ['axe'] },
  [TILE.ROCK]: { gives: ['rock', 'stone'], hand: 'ROCK_HITS', tool: 'ROCK_HITS_TOOL', tools: ['axe', 'sword'] },
  [TILE.BRICK]: { gives: ['brick'], hand: 'ROCK_HITS', tool: 'ROCK_HITS_TOOL', tools: ['axe', 'sword'] },
  [TILE.GATE]: { gives: ['gate'], hand: 'TREE_HITS', tool: 1, tools: ['axe'] },
  [TILE.BRIDGE]: { gives: ['bridge'], hand: 1, after: TILE.WATER },
  [TILE.TORCH]: { gives: ['torch'], hand: 1 },
};
// 손에 들 수 있는 것: 무기 또는 놓을 수 있는 블록
const holdable = id => !!WEAPONS[id] || !!(ITEMS[id] && (ITEMS[id].tile || ITEMS[id].kind === 'food'));
const holdEmoji = id => (WEAPONS[id] || ITEMS[id] || WEAPONS.hand).emoji;

// 맵 칸 그림 한 칸짜리 (블록 아이템 그림). 한 번 그려서 저장
const tileIcons = {};
function tileIcon(name) {
  if (!tileIcons[name]) {
    const c = document.createElement('canvas');
    c.width = c.height = T;
    World.drawTile(c.getContext('2d'), 0, 0, TILE[name]);
    tileIcons[name] = { canvas: c, url: c.toDataURL() };
  }
  return tileIcons[name];
}

// 화면(HTML)에 쓰는 아이템 그림: 블록은 맵 칸 그림, 나머지는 이모지
function iconHtml(def) {
  if (def.tile) return `<img class="tile-icon" src="${tileIcon(def.tile).url}" alt="">`;
  return def.fix ? `<span class="emo-${def.fix}">${def.emoji}</span>` : def.emoji;
}

const World = {
  w: 0,
  h: 0,
  tiles: null,
  reachable: null,
  house: { x: 0, y: 0 },
  door: { x: 0, y: 0 },
  spawn: { x: 0, y: 0 },
  base: null, // 만들었을 때의 맵 (바뀐 칸만 방에 기록하므로 원래 값이 필요하다)
  chunks: new Map(), // 그림 조각: 'cx,cy' → 캔버스 (맵이 커서 보이는 조각만 그린다)
  mini: null, // 작은 지도 그림 (한 칸 = 1px)
  regions: null, // 칸마다 구역 번호 (REGION)
  regionCenters: [], // 구역마다 가운데 칸 (동물이 구역 밖으로 나가면 이쪽으로 돌아온다)
  torches: [], // 🔥 횃불 위치 (px, 칸 가운데)

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

    // 네 구역: 가운데 십자 경계를 구불구불하게 (왼쪽 위 숲, 오른쪽 위 호수, 왼쪽 아래 늪, 오른쪽 아래 초원)
    const ph = Array.from({ length: 4 }, () => randFloat(0, Math.PI * 2));
    const midX = y => W / 2 + Math.sin(y * 0.09 + ph[0]) * 4 + Math.sin(y * 0.23 + ph[1]) * 2;
    const midY = x => H / 2 + Math.sin(x * 0.08 + ph[2]) * 4 + Math.sin(x * 0.21 + ph[3]) * 2;
    const reg = this.regions = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) reg[y * W + x] = (x >= midX(y) ? 1 : 0) + (y >= midY(x) ? 2 : 0);
    this.regionCenters = [[W / 4, H / 4], [W * 3 / 4, H / 4], [W / 4, H * 3 / 4], [W * 3 / 4, H * 3 / 4]]
      .map(([x, y]) => ({ x: Math.floor(x), y: Math.floor(y) }));
    // 그 구역 안의 아무 칸 (가장자리 2칸은 빼고)
    const pointIn = r => {
      for (let i = 0; i < 200; i++) {
        const x = randInt(2, W - 3), y = randInt(2, H - 3);
        if (reg[y * W + x] === r) return { x, y };
      }
      return this.regionCenters[r];
    };
    const pond = (r, rx, ry) => {
      const { x, y } = pointIn(r);
      blob(TILE.SAND, x, y, rx + 1.2, ry + 1.2);
      blob(TILE.WATER, x, y, rx, ry);
    };

    // 🏞️ 호수: 큰 호수 여러 개. 사이에 걸어갈 땅이 남게 서로 겹치지 않는다 (다리를 놓으면 건너갈 수 있다)
    const lakes = [];
    for (let i = 0; i < 300 && lakes.length < 16; i++) {
      const { x, y } = pointIn(REGION.LAKE), rx = randFloat(3.5, 8), ry = randFloat(3, 6.5);
      if (Math.hypot(x - W / 2, y - H / 2) < 12) continue; // 집 앞은 비운다
      if (lakes.some(l => Math.abs(l.x - x) < l.rx + rx + 3.5 && Math.abs(l.y - y) < l.ry + ry + 3.5)) continue;
      lakes.push({ x, y, rx, ry });
      blob(TILE.SAND, x, y, rx + 1.2, ry + 1.2);
      blob(TILE.WATER, x, y, rx, ry);
    }
    // 다른 구역의 연못 (🍄 늪은 작은 웅덩이가 많다)
    for (let i = 0; i < 2; i++) pond(REGION.MEADOW, randFloat(2, 4), randFloat(1.5, 3));
    pond(REGION.FOREST, randFloat(2, 3.5), randFloat(1.5, 3));
    for (let i = 0; i < 12; i++) pond(REGION.SWAMP, randFloat(1, 2.5), randFloat(1, 2));

    // 나무 / 바위 / 꽃: 🌲 숲은 나무가 빽빽, 🍄 늪은 바위가 많고, 🌼 초원은 꽃밭
    const trees = [55, 12, 26, 8], rocks = [12, 8, 22, 5], flowers = [0.03, 0.05, 0.015, 0.16];
    trees.forEach((n, r) => { for (let i = 0; i < n; i++) { const p = pointIn(r); blob(TILE.TREE, p.x, p.y, randFloat(0.8, 3.2), randFloat(0.8, 3.2)); } });
    rocks.forEach((n, r) => { for (let i = 0; i < n; i++) { const p = pointIn(r); blob(TILE.ROCK, p.x, p.y, randFloat(0.5, 1.6), randFloat(0.5, 1.6)); } });
    for (let i = 0; i < t.length; i++) if (t[i] === TILE.GRASS && rng() < flowers[reg[i]]) t[i] = TILE.FLOWER;

    // 집에서 구역마다 가운데까지 구불구불한 숲길 (나무/바위만 치운다. 동물을 찾아가기 쉽게)
    for (const c of this.regionCenters) {
      const wob = randFloat(0, Math.PI * 2);
      for (let s = 0; s <= 1; s += 0.01) {
        const x = Math.round(W / 2 + (c.x - W / 2) * s + Math.sin(s * 9 + wob) * 3);
        const y = Math.round(H / 2 + (c.y - H / 2) * s + Math.cos(s * 7 + wob) * 3);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const i = (y + dy) * W + x + dx;
          if (t[i] === TILE.TREE || t[i] === TILE.ROCK) t[i] = TILE.GRASS;
        }
      }
    }

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

    this.base = t.slice();
    this.edited();
  },

  // 바뀐 칸만 (base 와 다른 칸): 저장/방에 올리기용 { 칸 번호: 값 }
  edits() {
    const out = {};
    for (let i = 0; i < this.tiles.length; i++) if (this.tiles[i] !== this.base[i]) out[i] = this.tiles[i];
    return out;
  },

  // 저장해 둔 바뀐 칸을 한 번에 (칸마다 setTile 하면 느리다)
  applyEdits(edits) {
    for (const [k, v] of Object.entries(edits || {})) {
      const i = Number(k);
      if (i >= 0 && i < this.tiles.length && Number.isInteger(v) && MINI_COLORS[v]) this.tiles[i] = v;
    }
    this.edited();
  },

  // 맵이 크게 바뀐 뒤: 갈 수 있는 곳, 횃불 목록, 그림을 새로
  edited() {
    this.floodFill(this.door.x, this.door.y + 2);
    this.findTorches();
    this.chunks.clear();
    this.renderMini();
  },

  findTorches() {
    this.torches = [];
    for (let i = 0; i < this.tiles.length; i++) {
      if (this.tiles[i] === TILE.TORCH) this.torches.push({ x: (i % this.w) * T + T / 2, y: Math.floor(i / this.w) * T + T / 2 });
    }
  },

  // 맵 한 칸이 바뀜 (캐기/놓기, 다른 사람이 바꾼 것 포함): 그 칸의 그림, 작은 지도, 갈 수 있는 곳을 새로
  setTile(i, v) {
    if (!(i >= 0 && i < this.tiles.length) || !Number.isInteger(v) || this.tiles[i] === v) return;
    this.tiles[i] = v;
    const x = i % this.w, y = Math.floor(i / this.w);
    this.chunks.delete(`${Math.floor(x / CHUNK)},${Math.floor(y / CHUNK)}`);
    this.miniPixel(x, y);
    this.floodFill(this.door.x, this.door.y + 2);
    this.findTorches();
    Items.computeSpots();
  },

  // 캘 수 있는 칸 (맵 테두리 나무는 안 된다)
  diggable(tx, ty) {
    if (tx <= 0 || ty <= 0 || tx >= this.w - 1 || ty >= this.h - 1) return false;
    return !!DIG[this.tile(tx, ty)];
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
  region(tx, ty) { return this.regions[clamp(ty, 0, this.h - 1) * this.w + clamp(tx, 0, this.w - 1)]; },
  regionAtPx(x, y) { return this.region(Math.floor(x / T), Math.floor(y / T)); },

  // 물고기가 있을 수 있는 곳: 몸이 모두 물(또는 다리 밑)
  canSwim(x, y, r) {
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
      const tt = this.tileAtPx(x + dx, y + dy);
      if (tt !== TILE.WATER && tt !== TILE.BRIDGE) return false;
    }
    return true;
  },

  canStand(x, y, r = CONFIG.PLAYER_RADIUS * T, blocking = BLOCKING) {
    for (const [dx, dy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
      if (blocking.has(this.tileAtPx(x + dx, y + dy))) return false;
    }
    return true;
  },

  // ---------- 픽셀 그림 (조각마다 한 번 그려서 저장. 칸이 바뀌면 그 조각만 다시) ----------
  chunk(cx, cy) {
    const key = `${cx},${cy}`;
    let c = this.chunks.get(key);
    if (c) return c;
    c = document.createElement('canvas');
    c.width = c.height = CHUNK * T;
    const g = c.getContext('2d');
    g.translate(-cx * CHUNK * T, -cy * CHUNK * T);
    for (let y = cy * CHUNK; y < Math.min(this.h, (cy + 1) * CHUNK); y++) {
      for (let x = cx * CHUNK; x < Math.min(this.w, (cx + 1) * CHUNK); x++) this.drawTile(g, x, y, this.tile(x, y), this.region(x, y));
    }
    this.drawHouse(g); // 조각 밖은 잘린다
    this.chunks.set(key, c);
    return c;
  },

  // 작은 지도 (한 칸 = 1px)
  renderMini() {
    const c = this.mini = document.createElement('canvas');
    c.width = this.w;
    c.height = this.h;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) this.miniPixel(x, y);
  },

  miniPixel(x, y) {
    if (!this.mini) return;
    const g = this.mini.getContext('2d'), tt = this.tile(x, y), gr = GROUND[this.region(x, y)];
    // 풀/나무/물/모래는 구역 색으로 (작은 지도에서 네 구역이 보이게)
    const own = { [TILE.GRASS]: gr.grass[0], [TILE.FLOWER]: gr.grass[2], [TILE.TREE]: gr.leaf[0], [TILE.WATER]: gr.water[0], [TILE.SAND]: gr.sand[0] }[tt];
    g.fillStyle = own || MINI_COLORS[tt] || '#5cb85c';
    g.fillRect(x, y, 1, 1);
  },

  // region: 구역 땅 색 (없으면 기본 색. 블록 그림)
  drawTile(g, x, y, type, region) {
    const gr = GROUND[region] || GROUND.DEFAULT;
    const px = (gx, gy, color, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(x * T + gx * P, y * T + gy * P, w * P, h * P); };
    const fill = color => { g.fillStyle = color; g.fillRect(x * T, y * T, T, T); };
    const specks = (n, colors, seed) => {
      for (let i = 0; i < n; i++) {
        px(Math.floor(hash(x, y, seed + i) * 8), Math.floor(hash(x, y, seed + i + 50) * 8),
          colors[Math.floor(hash(x, y, seed + i + 99) * colors.length)]);
      }
    };
    const grass = () => { fill(gr.grass[0]); specks(6, gr.grass.slice(1), 1); };

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
        px(1, 0, gr.leaf[0], 6, 5);
        px(0, 1, gr.leaf[0], 8, 3);
        for (let i = 0; i < 5; i++) px(1 + Math.floor(hash(x, y, 20 + i) * 6), Math.floor(hash(x, y, 30 + i) * 4) + 1, gr.leaf[1]);
        px(2, 1, gr.leaf[2]);
        break;
      case TILE.WATER:
        fill(gr.water[0]);
        for (let i = 0; i < 2; i++) px(Math.floor(hash(x, y, 40 + i) * 6), Math.floor(hash(x, y, 45 + i) * 8), gr.water[1], 2, 1);
        break;
      case TILE.SAND: fill(gr.sand[0]); specks(5, gr.sand.slice(1), 60); break;
      case TILE.ROCK:
        grass();
        px(0, 1, '#8d939b', 8, 7);
        px(0, 1, '#a7adb5', 8, 1);
        specks(6, ['#6f757d', '#7d838b'], 70);
        break;
      case TILE.PATH: fill('#c8a06a'); specks(5, ['#b48a55', '#d6b07c'], 80); break;
      case TILE.BRICK:
        fill('#b5523b');
        for (let r = 0; r < 4; r++) {
          px(0, r * 2 + 1, '#e8d5b0', 8, 0.5);
          const off = r % 2 ? 0 : 2;
          px(off, r * 2, '#e8d5b0', 0.5, 1); px(off + 4, r * 2, '#e8d5b0', 0.5, 1);
        }
        specks(4, ['#a1452f', '#c4644a'], 90);
        break;
      case TILE.GATE:
        grass();
        px(1, 0, '#5d3a1a', 6, 8);
        px(1.5, 0.5, '#8d5a2b', 5, 7.5);
        px(3.9, 0.5, '#6d4321', 0.3, 7.5);
        px(1.5, 3, '#6d4321', 5, 0.4);
        px(5.2, 4, '#f1c40f', 0.8, 0.8);
        break;
      case TILE.BRIDGE:
        fill(gr.water[0]);
        px(0, 0.5, '#5d4037', 8, 1);
        px(0, 6.5, '#5d4037', 8, 1);
        for (let k = 0; k < 4; k++) px(k * 2, 1.5, '#a0703f', 1.6, 5);
        break;
      case TILE.TORCH:
        grass();
        px(3.5, 3.5, '#6d4c41', 1, 4);
        px(3, 1.5, '#ff9800', 2, 2);
        px(3.5, 0.5, '#ffeb3b', 1, 2);
        px(3.25, 2.5, '#fff59d', 0.5, 0.5);
        break;
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
  pending: new Map(), // 여럿이 할 때 손님: 주웠다고 알린 아이템 id → 시각 (답이 올 때까지 숨김)
  version: 0, // 바뀔 때마다 +1 (여럿이 할 때 바뀐 경우에만 보낸다)
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
        Multi.send('pick', 'H', it.id);
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
  // 길 막힘 판정용 몸 크기 (용은 맞는 범위보다 작게 해서 한 칸 틈도 지나간다)
  bodyRadius(m) { return (m.def.boss ? 0.42 : 0.3) * T; },

  // 집 주변과 🔥 횃불 둘레
  safeZone(x, y) {
    if (Math.hypot(x - (World.door.x * T + T / 2), y - (World.door.y * T + T / 2)) < CONFIG.SAFE_RADIUS * T) return true;
    return World.torches.some(t => Math.hypot(x - t.x, y - t.y) < CONFIG.TORCH_RADIUS * T);
  },

  // 먹이를 주면 따라오는 동물 (물고기는 물 밖으로 못 나와서 안 된다)
  tameable(m) { return !!m.def.calm && !m.def.swim; },

  // 안전지대 안에 있던 몬스터(옆에 횃불을 놓은 경우)는 빠져나갈 때까지 안전지대를 무시한다.
  // 초식동물은 사람처럼 문도 지나가고 안전지대(집)에도 들어간다. 물고기는 물에서만
  canStand(m, x, y) {
    if (m.def.swim) return World.canSwim(x, y, this.bodyRadius(m));
    if (m.def.calm) return World.canStand(x, y, this.bodyRadius(m));
    if (!this.safeZone(m.x, m.y) && this.safeZone(x, y)) return false;
    return World.canStand(x, y, this.bodyRadius(m), MONSTER_BLOCKING);
  },

  // 집에서 멀고 플레이어와도 먼 곳. region: 그 구역 안만 (-1 이면 어디든), swim: 물 칸
  spots(minFromHome, region = -1, swim = false) {
    let list = Items.spots;
    if (swim) {
      list = [];
      for (let i = 0; i < World.tiles.length; i++) if (World.tiles[i] === TILE.WATER) list.push({ x: i % World.w, y: Math.floor(i / World.w) });
    }
    return list.filter(s =>
      (region < 0 || World.region(s.x, s.y) === region) &&
      Math.hypot(s.x - World.door.x, s.y - World.door.y) >= minFromHome &&
      !this.safeZone(s.x * T + T / 2, s.y * T + T / 2) &&
      !Multi.nearPlayer(s.x * T, s.y * T, 7 * T));
  },

  spawn(type, spot, extra) {
    const def = type === 'boss' ? BOSS : MONSTERS[type];
    const m = {
      id: this.nextId++, type, def, x: spot.x * T + T / 2, y: spot.y * T + T / 2, hp: def.hp,
      dirX: 0, dirY: 0, wanderT: 0, hitT: 0, biteT: 0, knock: { x: 0, y: 0, t: 0 },
      phase: Math.random() * Math.PI * 2, faceRight: false,
      home: def.boss ? -1 : def.region, owner: null,
      hopT: 0, emote: '', emoteT: 0, happyT: 0, playT: 0, spot: null, ...extra,
    };
    this.list.push(m);
    return m;
  },

  // 그 동물이 사는 구역에 한 마리
  spawnType(type) {
    const def = MONSTERS[type];
    const spots = this.spots(CONFIG.SAFE_RADIUS + 3, def.region, def.swim);
    if (spots.length) this.spawn(type, spots[Math.floor(Math.random() * spots.length)]);
  },

  fill() {
    for (const [type, def] of Object.entries(MONSTERS)) for (let i = 0; i < def.count; i++) this.spawnType(type);
  },

  // 저장해 둔 내 동물: 집 앞에서 나를 따라온다
  spawnPet(type) {
    if (MONSTERS[type] && this.tameable({ def: MONSTERS[type] })) this.spawn(type, { x: World.door.x, y: World.door.y + 2 }, { owner: Multi.sid });
  },

  // 내가 데리고 있는 동물 (저장용)
  myPets() { return this.list.filter(m => m.owner === Multi.sid).map(m => m.type); },

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
    for (const p of Multi.activePeers()) if (!this.safeZone(p.x, p.y)) list.push(p);
    return list;
  },

  // 몬스터 움직임 (방장/혼자 기기만)
  update(dt) {
    const people = this.targets();
    // 육식동물이 노리는 초식동물 (안전지대 안은 못 들어가서 집에 있으면 안전하다)
    const prey = this.list.filter(m => this.tameable(m) && !this.safeZone(m.x, m.y));
    // 초식동물/물고기가 무서워하는 것: 놀고 있는 사람 + 육식동물
    const scary = [...(Game.state === 'play' ? [Player] : []), ...Multi.activePeers(), ...this.list.filter(m => m.def.hunts)];
    for (const m of [...this.list]) {
      m.hitT = Math.max(0, m.hitT - dt);
      m.biteT = Math.max(0, m.biteT - dt);
      m.hopT = Math.max(0, m.hopT - dt);
      m.emoteT = Math.max(0, m.emoteT - dt);
      m.happyT = Math.max(0, m.happyT - dt);
      let v;
      if (m.knock.t > 0) {
        m.knock.t -= dt;
        v = m.knock;
      } else {
        v = m.def.calm ? this.calmMove(m, dt, scary) : this.chase(m, dt, m.def.hunts ? [...people, ...prey] : people);
        if (Math.abs(v.x) > 1) m.faceRight = v.x > 0;
      }
      const nx = m.x + v.x * dt;
      if (this.canStand(m, nx, m.y)) m.x = nx; else m.wanderT = 0;
      const ny = m.y + v.y * dt;
      if (this.canStand(m, m.x, ny)) m.y = ny; else m.wanderT = 0;
      if (m.def.hunts) this.bite(m, prey);
    }

    const now = performance.now();
    for (const q of this.respawnQueue.filter(q => q.at <= now)) {
      this.respawnQueue.splice(this.respawnQueue.indexOf(q), 1);
      this.spawnType(q.type);
    }
  },

  // 가장 가까운 것 { t, dx, dy, d }
  nearest(m, list) {
    let best = null;
    for (const t of list) {
      if (t === m) continue;
      const dx = t.x - m.x, dy = t.y - m.y, d = Math.hypot(dx, dy);
      if (!best || d < best.d) best = { t, dx, dy, d };
    }
    return best;
  },

  // 몬스터/육식동물: 가까이 오면 쫓아가고, 아니면 돌아다닌다
  chase(m, dt, targets) {
    const n = this.nearest(m, targets), speed = m.def.speed * T;
    if (n && n.d < (m.def.boss ? CONFIG.BOSS_AGGRO_RANGE : CONFIG.AGGRO_RANGE) * T && n.d > 1) {
      return { x: n.dx / n.d * speed, y: n.dy / n.d * speed };
    }
    return this.wander(m, dt, m.def.boss ? 0.8 : 0.5);
  },

  // 초식동물/물고기: 먹이를 받았으면 주인을 따라가고, 아니면 무서운 게 가까이 오면 도망간다
  calmMove(m, dt, scary) {
    const speed = m.def.speed * T;
    if (m.owner) {
      const o = m.owner === Multi.sid ? Player : Multi.peers.get(m.owner);
      if (!o || (o !== Player && !o.seen)) m.owner = null; // 주인이 나갔다
      else return this.petMove(m, dt, o);
    }
    const n = this.nearest(m, scary);
    if (n && n.d < CONFIG.FLEE_RANGE * T && n.d > 1) return { x: -n.dx / n.d * speed, y: -n.dy / n.d * speed };
    return this.wander(m, dt, 0.4);
  },

  // 따라온 동물: 주인 둘레에 저마다 자리를 잡고, 몇 초마다 자리를 바꾸며 서성인다. 가끔 콩 뛰며 💕 🎵.
  // 주인이 멀어지면 서둘러 따라오고, 다른 동물과 겹치면 서로 비켜 선다
  petMove(m, dt, o) {
    const dx0 = o.x - m.x, dy0 = o.y - m.y, d0 = Math.hypot(dx0, dy0);
    if (d0 > CONFIG.PET_TELEPORT * T) { m.x = o.x; m.y = o.y; m.spot = null; return { x: 0, y: 0 }; }
    const pets = this.list.filter(p => p.owner === m.owner), k = pets.indexOf(m);
    const happy = m.happyT > 0;
    m.playT -= dt;
    if (!m.spot || m.playT <= 0) {
      // 저마다 다른 방향 (동물 수만큼 둘레를 나눈다) + 조금씩 흔들기
      m.playT = randFloat(1.5, 3.5);
      const a = (k / pets.length) * Math.PI * 2 + randFloat(-0.7, 0.7);
      const [near, far] = CONFIG.PET_PLAY, r = (happy ? near : randFloat(near, far)) * T;
      m.spot = { x: Math.cos(a) * r, y: Math.sin(a) * r };
    }
    let vx = 0, vy = 0;
    const tx = o.x + m.spot.x - m.x, ty = o.y + m.spot.y - m.y, d = Math.hypot(tx, ty);
    if (d > 6) {
      // 주인과 멀면 서둘러 (사람보다 조금 빠르게까지), 가까우면 어슬렁어슬렁
      const s = d0 > CONFIG.PET_PLAY[1] * T + T
        ? Math.min(CONFIG.PLAYER_SPEED * T * 1.1, Math.max(m.def.speed * T, d0 * 2))
        : m.def.speed * T * 0.55;
      vx = tx / d * Math.min(s, d * 4);
      vy = ty / d * Math.min(s, d * 4);
    } else {
      m.faceRight = o.x > m.x; // 멈춰 있을 때는 주인을 바라본다
      // 애교: 가끔 콩 뛰며 하트/음표. 신났을 때는 계속 콩콩
      if (m.hopT <= 0 && Math.random() < (happy ? 1 : dt * 0.35)) {
        m.hopT = 0.4;
        if (happy || Math.random() < 0.6) this.emote(m, happy ? (Math.random() < 0.5 ? '😍' : '💕') : ['💕', '🎵', '✨', '😊'][Math.floor(Math.random() * 4)]);
      }
    }
    // 다른 동물과 겹치지 않게 서로 밀어낸다
    for (const p of this.list) {
      if (p === m || p.def.swim) continue;
      const ox = m.x - p.x, oy = m.y - p.y, od = Math.hypot(ox, oy), min = 0.75 * T;
      if (od > 0.01 && od < min) { vx += ox / od * (min - od) * 4; vy += oy / od * (min - od) * 4; }
    }
    return { x: vx, y: vy };
  },

  // 머리 위에 잠깐 뜨는 그림 (💕 🎵 😍). 손님 기기에도 보이게 몬스터 정보에 실어 보낸다
  emote(m, icon, sec = 1.2) {
    if (m.emoteT > 0.4 && m.emote === icon) return;
    m.emote = icon;
    m.emoteT = sec;
  },

  // 내 동물에게 먹이를 또 줌: 체력이 차고 신나서 콩콩 뛴다 (방장/혼자 기기)
  cheer(m) {
    m.hp = m.def.hp;
    m.happyT = CONFIG.PET_HAPPY_SEC;
    m.hopT = 0;
    m.spot = null;
    this.emote(m, '😍', 1.6);
  },

  // 가끔 방향을 바꿔 돌아다닌다. 사는 구역 밖으로 나왔으면 구역 가운데 쪽으로 돌아간다
  wander(m, dt, k) {
    m.wanderT -= dt;
    if (m.wanderT <= 0) {
      m.wanderT = randFloat(1.2, 3);
      let a = Math.random() * Math.PI * 2, go = m.def.boss || Math.random() < 0.6;
      const c = m.home >= 0 && World.regionAtPx(m.x, m.y) !== m.home && World.regionCenters[m.home];
      if (c) {
        a = Math.atan2((c.y + 0.5) * T - m.y, (c.x + 0.5) * T - m.x) + randFloat(-0.6, 0.6);
        go = true;
      }
      m.dirX = go ? Math.cos(a) : 0;
      m.dirY = go ? Math.sin(a) : 0;
    }
    const speed = m.def.speed * T * k;
    return { x: m.dirX * speed, y: m.dirY * speed };
  },

  // 육식동물이 초식동물에 닿으면 문다. 따라다니던 동물도 쓰러질 수 있다
  bite(m, prey) {
    if (m.biteT > 0) return;
    const p = prey.find(a => this.list.includes(a) && Math.hypot(a.x - m.x, a.y - m.y) < this.radius(m) + this.radius(a) + 4);
    if (!p) return;
    m.biteT = CONFIG.BITE_SEC;
    p.hp--;
    p.hitT = 0.25;
    const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy) || 1;
    p.knock = { x: dx / d * 5 * T, y: dy / d * 5 * T, t: 0.15 };
    Floaters.add(p.x, p.y - p.def.size * 0.6, '💥', 16);
    if (Math.hypot(p.x - Player.x, p.y - Player.y) < 8 * T) Sfx.hit();
    if (p.hp > 0) return;
    this.list.splice(this.list.indexOf(p), 1);
    for (let i = 0; i < 3; i++) Floaters.add(p.x + randFloat(-12, 12), p.y - randFloat(0, 16), '💨', 14);
    this.respawnQueue.push({ at: performance.now() + CONFIG.MONSTER_RESPAWN_MS, type: p.type });
    console.log(`[Monsters] ${m.def.ko}가 ${p.def.ko} 잡음`);
    if (p.owner === Multi.sid) Game.onPetLost(p.def);
    else if (p.owner) Multi.send('petGone', p.owner, p.type);
  },

  // 먹이를 맞은 초식동물이 그 사람을 따라온다 (방장/혼자 기기). 됐으면 true
  tame(m, sid) {
    if (!this.tameable(m) || m.owner) return false;
    m.owner = sid;
    m.hp = m.def.hp; // 배불러서 기운이 난다
    for (let i = 0; i < 3; i++) Floaters.add(m.x + randFloat(-10, 10), m.y - m.def.size * 0.6 - randFloat(0, 10), '💕', 14);
    return true;
  },

  // 내 캐릭터가 몬스터에 닿으면 다친다 (각자 기기에서 자기 캐릭터만 확인). 초식동물/물고기는 안 다치게 한다
  touch() {
    for (const m of this.list) {
      if (m.def.calm) continue;
      if (Math.hypot(Player.x - m.x, Player.y - m.y) < this.radius(m) + CONFIG.PLAYER_RADIUS * T + 4) {
        Game.hurt(m);
        return;
      }
    }
  },

  // 내 공격: 활은 화살을 쏘고, 나머지는 앞쪽을 휘두른다. 다른 사람 캐릭터도 맞는다
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
      if (!m.owner && Math.hypot(m.x - cx, m.y - cy) < CONFIG.ATTACK_RANGE * T + this.radius(m)) this.damage(m, power);
    }
    Multi.hitPeers(cx, cy, CONFIG.ATTACK_RANGE * T);
  },

  // 앞쪽 휘두르는 곳에 몬스터나 다른 사람이 있는지 (있으면 캐지 않고 때린다)
  anyInFront() {
    const [fx, fy] = FACING[Player.dir];
    const cx = Player.x + fx * 0.5 * T, cy = Player.y + fy * 0.5 * T, r = CONFIG.ATTACK_RANGE * T;
    return this.list.some(m => !m.owner && Math.hypot(m.x - cx, m.y - cy) < r + this.radius(m)) ||
      Multi.activePeers().some(p => Math.hypot(p.x - cx, p.y - cy) < r + CONFIG.PLAYER_RADIUS * T);
  },

  // 손에 든 먹이를 앞으로 던진다 (화살처럼 날아간다)
  throwFood(type) {
    const [fx, fy] = FACING[Player.dir];
    this.arrows.push({ x: Player.x + fx * 10, y: Player.y - 8 + fy * 10, fx, fy, left: CONFIG.THROW_RANGE * T, food: type });
  },

  // 내가 쏜 화살 / 던진 먹이 (각자 기기에서 움직인다)
  updateArrows(dt) {
    for (const a of [...this.arrows]) {
      const step = CONFIG.ARROW_SPEED * T * dt * (a.food ? 0.6 : 1);
      a.x += a.fx * step;
      a.y += a.fy * step;
      a.left -= step;
      const tt = World.tileAtPx(a.x, a.y + 8);
      let done = a.left <= 0 || ARROW_BLOCKING.has(tt);
      if (a.food) {
        // 먹이: 아직 주인 없는 초식동물에 맞으면 따라온다. 못 맞히면 떨어진 자리에 놓인다 (다시 주울 수 있다)
        const target = !done && this.list.find(m => this.tameable(m) && (!m.owner || m.owner === Multi.sid) &&
          Math.hypot(m.x - a.x, m.y - (a.y + 8)) < this.radius(m) + 10);
        if (target) {
          this.feed(target);
          this.arrows.splice(this.arrows.indexOf(a), 1);
        } else if (done) {
          this.arrows.splice(this.arrows.indexOf(a), 1);
          this.dropFood(a);
        }
        continue;
      }
      const target = !done && this.list.find(m => !m.owner && Math.hypot(m.x - a.x, m.y - (a.y + 8)) < this.radius(m) + 8);
      if (target) { this.damage(target, a.power); done = true; }
      else if (!done && Multi.hitPeers(a.x, a.y + 8, 8)) done = true;
      if (done) this.arrows.splice(this.arrows.indexOf(a), 1);
    }
  },

  // 먹이가 동물에 맞음: 처음이면 따라오고, 내 동물이면 좋아한다. 손님 기기는 방장에게 알리고 답('tamed'/'yum')을 기다린다
  feed(m) {
    if (Multi.isGuest) { Multi.send('feed', 'H', m.id); return; }
    if (m.owner === Multi.sid) { this.cheer(m); Game.onPetHappy(m.def); } else if (this.tame(m, Multi.sid)) Game.onPetTamed(m.def);
  },

  // 못 맞힌 먹이: 날아온 길을 되짚어 설 수 있는 곳에 떨어뜨린다 (물이나 나무 위에 놓이지 않게)
  dropFood(a) {
    let x = a.x, y = a.y + 8;
    for (let i = 0; i < 40 && !World.canStand(x, y, 6); i++) { x -= a.fx * 6; y -= a.fy * 6; }
    if (!World.canStand(x, y, 6)) { x = Player.x; y = Player.y; }
    if (Multi.isGuest) Multi.send('drop', 'H', a.food, Math.round(x), Math.round(y));
    else Items.add(a.food, x, y, { dropped: true });
  },

  // 내가 몬스터를 때림. 손님 기기는 방장에게 알리고, 맞는 모습만 먼저 보여준다
  damage(m, power) {
    if (!Multi.isGuest) { this.hit(m, power, Player.x, Player.y); return; }
    Multi.send('hitM', 'H', m.id, power, Math.round(Player.x), Math.round(Player.y));
    m.hitT = 0.25;
    Sfx.hit();
    Floaters.add(m.x, m.y - m.def.size * 0.6, '💥', 16);
  },

  // 몬스터 체력을 깎는다 (방장/혼자 기기). byOther: 때린 다른 사람 → 잡았으면 true, 카드는 그 사람 기기에서
  hit(m, dmg, fromX, fromY, byOther = null) {
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
      this.respawnQueue.push({ at: performance.now() + CONFIG.MONSTER_RESPAWN_MS, type: m.type });
    }
    console.log(`[Monsters] ${m.def.ko} 처치${byOther ? ` (${byOther.name})` : ''}`);
    if (!byOther) Game.onMonsterDefeated(m);
  },
};

// ============================================================
// Cloud — 캐릭터 이름별 가방을 Firebase 에 저장한다. 다른 기기에서도 같은 이름으로 들어오면 이어서 한다.
//         연결이 안 되면(인터넷 없음, 보안 규칙 없음) 이 기기 저장만 쓴다
// ============================================================
// 이름 → 저장 칸 이름 (Firebase 가 못 쓰는 . # $ [ ] / 는 _ 로, 영어는 소문자로)
const bagKey = name => (name || '').normalize('NFC').trim().toLowerCase().replace(/[.#$[\]/\u0000-\u001f\u007f]/g, '_');

const Cloud = {
  net: null, // 연결되면 net.js
  key: '',
  sent: '', // 마지막으로 올린 가방 (바뀐 경우에만 올린다)

  async load(name) {
    this.key = bagKey(name);
    try {
      const net = await import(NET_URL);
      const bag = await Promise.race([net.loadBag(this.key), delay(6000).then(() => { throw new Error('timeout'); })]);
      this.net = net;
      console.log(`[Cloud] "${this.key}" 가방 ${bag ? '있음' : '없음'}`);
      return { bag };
    } catch (err) {
      console.warn('[Cloud] 연결 안 됨, 이 기기 저장만 씀', err);
      return null;
    }
  },

  save(bag) {
    if (!this.net) return;
    const json = JSON.stringify(bag);
    if (json === this.sent) return;
    this.sent = json;
    this.net.saveBag(this.key, bag).catch(err => {
      this.sent = '';
      console.warn('[Cloud] 가방 저장 실패', err);
    });
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

  unstuck() {
    const cx = Math.floor(this.x / T), cy = Math.floor(this.y / T);
    for (let d = 1; d <= 20; d++) {
      let best = null;
      for (let ty = cy - d; ty <= cy + d; ty++) {
        for (let tx = cx - d; tx <= cx + d; tx++) {
          if (Math.max(Math.abs(tx - cx), Math.abs(ty - cy)) !== d) continue;
          const x = tx * T + T / 2, y = ty * T + T / 2;
          if (!this.canStand(x, y)) continue;
          const dist = Math.hypot(x - this.x, y - this.y);
          if (!best || dist < best.dist) best = { x, y, dist };
        }
      }
      if (best) { this.x = best.x; this.y = best.y; this.knock.t = 0; return; }
    }
  },

  update(dt) {
    this.invulnT = Math.max(0, this.invulnT - dt);
    this.hitT = Math.max(0, this.hitT - dt);
    // 설 수 없는 곳에 갇혔으면 (다른 사람이 발밑 다리를 캔 경우 등) 가장 가까운 땅으로
    if (!this.canStand(this.x, this.y)) this.unstuck();
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
// Multi — 원격 여럿이 하기. 모두 같은 규칙으로 논다 (체력, 가방, 무기, 단어 카드는 각자 기기에).
//         방을 만든 기기(host)가 세상(아이템, 몬스터, 보스)을 돌리고, 들어온 기기(guest)는
//         줍기/때리기를 이벤트로 알린다. 캐고 놓은 맵 칸은 누구나 방에 바로 기록한다. 통신은 net.js (Firebase)
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
const STATUS_ICONS = { card: '📖', craft: '🔨', faint: '💫' };

// 다른 기기의 캐릭터: 받은 위치(tx, ty)로 부드럽게 따라간다
function makeRemote() {
  return {
    x: 0, y: 0, tx: 0, ty: 0, dir: 'down', moving: false, walkT: 0, swingT: 0, invulnT: 0, hitT: 0, seen: false,
    name: '', hearts: CONFIG.MAX_HEARTS, st: 'play', held: 'hand', lk: 0, lastSeq: 0, lastSeen: 0,
  };
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
  sid: Math.random().toString(36).slice(2, 8), // 이 기기 접속 id
  beat: 0,
  events: [], // 보낼 이벤트 [seq, 시각, 종류, 받는 사람, ...값]
  eventSeq: 0,
  itemsVersion: -1,
  monsterMap: new Map(), // 손님 기기: 방장에게 받은 몬스터
  stale: new Map(), // 소식이 끊긴 사람: 접속 id → 마지막 h (그 값 그대로면 무시)
  peers: new Map(), // 같은 방의 다른 사람들: 접속 id → 캐릭터 (이름표, 상태, 무기, 화살까지)

  get isHost() { return this.mode === 'host'; },
  get isGuest() { return this.mode === 'guest'; },
  get online() { return this.mode !== 'solo'; },

  // 내 모양 / 다른 사람 모양 (나와 같은 모양이면 다음 모양으로 보여줘서 구분되게)
  myLook() { return LOOKS[Game.lookIndex]; },
  peerLook(p) {
    const i = p.lk % LOOKS.length;
    return LOOKS[i === Game.lookIndex ? (i + 1) % LOOKS.length : i];
  },

  visiblePeers() { return [...this.peers.values()].filter(p => p.seen); },
  // 놀고 있는 사람 (카드/제작/기절 중이면 몬스터도 안 쫓고 맞지도 않는다)
  activePeers() { return this.visiblePeers().filter(p => p.st === 'play'); },

  // 아이템/몬스터를 새로 놓을 때 사람 근처는 피한다
  nearPlayer(x, y, d) {
    if (Math.hypot(x - Player.x, y - Player.y) < d) return true;
    return this.visiblePeers().some(p => Math.hypot(x - p.x, y - p.y) < d);
  },

  // 다른 사람을 쓰러뜨렸을 때 카드용 (이모지가 없으니 아무 단어나 나온다)
  peerDef(p) {
    const name = p.name || '?';
    return { emoji: '', ko: name, en: name, boss: false, drops: {} };
  },

  // 방 번호: 왼쪽 위에 작게
  showBadge(code) {
    const b = $('#room-badge');
    b.textContent = `👥 ${code}`;
    b.classList.remove('hidden');
  },

  async startHost() {
    const Net = await import(NET_URL);
    const last = Store.get(KEYS.room, {}) || {};
    this.net = await Net.host(Game.seed, this.sid, last.host);
    Store.set(KEYS.room, { ...last, host: this.net.code });
    Session.set({ mode: 'host', code: this.net.code });
    const edits = World.edits();
    if (Object.keys(edits).length) await this.net.putTiles(edits);
    this.mode = 'host';
    this.listen();
    this.showBadge(this.net.code);
    console.log('[Multi] 방 만들기', this.net.code);
  },

  async startGuest(code) {
    const Net = await import(NET_URL);
    this.net = await Net.join(code, this.sid);
    this.mode = 'guest';
    // 같은 시드로 같은 맵. 바뀐 칸, 아이템, 몬스터는 방에서 받는다
    World.generate(this.net.seed);
    Player.reset();
    Items.computeSpots();
    Items.list = [];
    Items.respawnQueue = [];
    Monsters.list = [];
    Monsters.respawnQueue = [];
    this.listen();
    this.net.onWorld(w => this.onWorld(w));
    this.net.onItems(list => this.onItems(list));
    this.net.onRoom(h => (h ? this.onRoomBack(h) : this.onRoomGone()));
    Store.set(KEYS.room, { ...(Store.get(KEYS.room, {}) || {}), join: code });
    Session.set({ mode: 'guest', code });
    this.showBadge(code);
    console.log('[Multi] 참가', code);
  },

  listen() {
    this.net.onPlayers(all => this.onPlayers(all));
    this.net.onTiles((i, v) => World.setTile(i, v));
  },

  onRoomGone() {
    if (!this.roomGone) toast('📴');
    this.roomGone = true;
    for (const sid of [...this.peers.keys()]) this.leave(sid);
  },

  // 방장이 같은 번호로 방을 다시 열었다 (새로고침, 새 버전): 그 방장의 맵으로 다시 맞추고 이어서 논다.
  // 바뀐 칸은 방장이 다시 올려서 onTiles 로 온다
  onRoomBack(h) {
    if (!this.roomGone) return; // 처음 들어갈 때
    this.roomGone = false;
    World.generate(h.seed);
    Items.computeSpots();
    this.monsterMap.clear();
    Monsters.list = [];
    toast('📶');
    console.log('[Multi] 방이 다시 열려서 이어서', this.net.code);
  },

  // 이벤트는 받는 쪽이 놓치지 않게 잠깐 동안 매번 같이 보낸다 (받는 쪽은 번호로 한 번만 처리)
  // to: 받는 사람 접속 id, 'H' 는 방장
  send(kind, to, ...args) {
    if (!this.online) return;
    this.events.push([++this.eventSeq, performance.now(), kind, to, ...args]);
  },

  // 맵 한 칸 바꾸기 (캐기/놓기). 여럿이 할 때는 방에 먼저 기록하고, 다른 사람이 먼저 바꿨으면 false
  async editTile(i, expect, next) {
    if (World.tiles[i] !== expect) return false;
    if (!this.online) { World.setTile(i, next); return true; }
    try {
      const ok = await this.net.editTile(i, World.base[i], expect, next);
      if (ok) World.setTile(i, next);
      return ok;
    } catch (err) {
      console.warn('[Multi] 칸 바꾸기 실패', err);
      return false;
    }
  },

  // 내 공격이 다른 사람에게 닿았는지. 맞으면 그 사람 기기에 알린다 (하트는 그 기기에서 깎는다)
  hitPeers(x, y, r) {
    let hit = false;
    for (const p of this.activePeers()) {
      if (p.invulnT > 0 || Math.hypot(p.x - x, p.y - y) >= r + CONFIG.PLAYER_RADIUS * T) continue;
      this.send('hitP', p.sid);
      p.hitT = CONFIG.HIT_FLASH_SEC;
      p.invulnT = CONFIG.INVULN_SEC; // 같은 공격으로 여러 번 맞히지 않게
      // 그 기기에서 밀려난 위치가 오기 전에 이 화면에서도 바로 뒤로 밀어 보여준다
      const dx = p.x - Player.x, dy = p.y - Player.y, d = Math.hypot(dx, dy) || 1;
      const push = CONFIG.KNOCKBACK * T * 0.15;
      if (World.canStand(p.x + dx / d * push, p.y + dy / d * push)) { p.x += dx / d * push; p.y += dy / d * push; }
      Sfx.hit();
      Floaters.add(p.x, p.y - 30, '💥', 16);
      hit = true;
    }
    return hit;
  },

  tick(dt) {
    if (!this.online) return;
    const now = performance.now();
    for (const p of this.peers.values()) {
      followRemote(p, dt);
      if (p.seen && now - p.lastSeen > CONFIG.NET_TIMEOUT_MS) this.timeout(p);
    }
    if (this.isGuest) {
      for (const m of Monsters.list) {
        followRemote(m, dt);
        m.hopT = Math.max(0, (m.hopT || 0) - dt);
        m.emoteT = Math.max(0, (m.emoteT || 0) - dt);
        if (m.emoteT <= 0) m.emote = '';
      }
    }
    this.sendT -= dt * 1000;
    if (this.sendT > 0 || this.roomGone) return;
    this.sendT = CONFIG.NET_SEND_MS;
    const fail = err => console.warn('[Multi] 전송 실패', err);
    this.net.sendMe(this.myPacket()).catch(fail);
    if (this.isHost) this.sendWorld().catch(fail);
  },

  leave(sid) {
    const p = this.peers.get(sid);
    if (!p) return;
    if (p.seen) toast(`👋 ${p.name}`);
    this.peers.delete(sid);
  },

  // 소식이 끊긴 사람 (h 가 더 바뀌지 않음): 방에 남은 캐릭터는 방장이 지우고, 그때까지는 다시 나타나지 않게 무시한다
  timeout(p) {
    this.stale.set(p.sid, p.beat);
    this.leave(p.sid);
    if (this.isHost) this.net.removePlayer(p.sid).catch(() => {});
  },

  // 모두가 똑같이 보내는 내 캐릭터 정보
  myPacket() {
    const r = Math.round, now = performance.now();
    this.events = this.events.filter(ev => now - ev[1] < CONFIG.NET_EVENT_KEEP_MS);
    // h: 가만히 서 있어도 값이 바뀌게 해서 다른 사람 쪽에서 '나갔다'고 보지 않게 한다
    this.beat = (this.beat + 1) % 1000;
    return {
      h: this.beat,
      n: Game.playerName,
      lk: Game.lookIndex,
      st: Game.state,
      p: [r(Player.x), r(Player.y), DIRS.indexOf(Player.dir), Player.moving ? 1 : 0,
        Player.swingT > 0 ? 1 : 0, Player.invulnT > 0 ? 1 : 0, Player.hitT > 0 ? 1 : 0],
      hp: Game.hearts,
      w: Game.held,
      a: Monsters.arrows.map(a => [r(a.x), r(a.y), a.fx, a.fy, a.food || 0]),
      ev: this.events.map(([seq, , kind, ...args]) => [seq, kind, ...args]),
    };
  },

  // ---------- host: 세상 보내기 ----------
  sendWorld() {
    const r = Math.round;
    if (Items.version !== this.itemsVersion) {
      this.itemsVersion = Items.version;
      this.net.sendItems(Items.list.map(it => [it.id, it.type, r(it.x), r(it.y)]))
        .catch(err => console.warn('[Multi] 아이템 전송 실패', err));
    }
    return this.net.sendWorld({
      h: this.beat,
      m: Monsters.list.map(m => [m.id, m.type, r(m.x), r(m.y), m.hp, m.faceRight ? 1 : 0, m.hitT > 0 ? 1 : 0, m.owner || 0,
        m.hopT > 0 ? 1 : 0, m.emoteT > 0 ? m.emote : 0]),
    });
  },

  // 방 안 모든 사람 정보 (내 것은 빼고)
  onPlayers(all) {
    for (const [sid, d] of Object.entries(all)) {
      if (sid === this.sid || !d || !d.p || this.stale.get(sid) === d.h) continue;
      this.stale.delete(sid);
      this.onPeer(sid, d);
    }
    for (const sid of [...this.peers.keys()]) if (!all[sid]) this.leave(sid);
  },

  onPeer(sid, d) {
    let p = this.peers.get(sid);
    const pos = d.p;
    const evs = (d.ev || []).filter(Boolean);
    if (!p) {
      // 새로 들어옴: 위치를 바로 맞추고, 그 전 이벤트는 무시
      p = { ...makeRemote(), isPlayer: true, sid, x: pos[0], y: pos[1], arrows: [] };
      p.lastSeq = evs.reduce((max, ev) => Math.max(max, ev[0]), 0);
      this.peers.set(sid, p);
      toast(`👋 ${d.n || ''}`);
    }
    p.seen = true;
    // 살아 있는지는 h(보낼 때마다 바뀌는 수)로 본다. 다른 사람 소식에 같이 실려 온 옛 값은 치지 않는다
    if (p.beat !== d.h) { p.beat = d.h; p.lastSeen = performance.now(); }
    p.name = String(d.n || '').slice(0, CONFIG.NAME_MAX);
    p.lk = d.lk || 0;
    p.st = d.st;
    p.tx = pos[0];
    p.ty = pos[1];
    p.dir = DIRS[pos[2]] || 'down';
    p.moving = !!pos[3];
    if (pos[4] && p.swingT <= 0) p.swingT = 0.25;
    if (pos[5]) p.invulnT = Math.max(p.invulnT, 0.2);
    if (pos[6] && p.hitT <= 0) p.hitT = CONFIG.HIT_FLASH_SEC;
    p.hearts = Number.isInteger(d.hp) ? d.hp : CONFIG.MAX_HEARTS;
    p.held = holdable(d.w) ? d.w : 'hand';
    p.arrows = (d.a || []).filter(Boolean).map(([x, y, fx, fy, food]) => ({ x, y, fx, fy, food: ITEMS[food] ? food : null }));
    for (const ev of evs.sort((a, b) => a[0] - b[0])) {
      if (ev[0] <= p.lastSeq) continue;
      p.lastSeq = ev[0];
      const [, kind, to, ...args] = ev;
      if (to === this.sid || (to === 'H' && this.isHost)) this.handle(kind, args, p);
    }
  },

  handle(kind, args, from) {
    if (kind === 'pick' && this.isHost) {
      // 주웠다고 함 → 아직 있으면 주고, 없으면(다른 사람이 먼저 주움) 무시
      const it = Items.list.find(i => i.id === args[0]);
      if (it) { Items.take(it); this.send('got', from.sid, it.type); }
    } else if (kind === 'got') {
      if (ITEMS[args[0]]) Game.addItem(args[0]);
    } else if (kind === 'hitM' && this.isHost) {
      const [id, power, x, y] = args;
      const m = Monsters.list.find(mm => mm.id === id);
      if (m && Monsters.hit(m, power, x, y, from)) this.send('kill', from.sid, m.type);
    } else if (kind === 'kill') {
      const def = args[0] === 'boss' ? BOSS : MONSTERS[args[0]];
      if (!def) return;
      Sfx.defeat();
      Game.onMonsterDefeated({ def });
    } else if (kind === 'feed' && this.isHost) {
      const m = Monsters.list.find(mm => mm.id === args[0]);
      if (m && m.owner === from.sid) { Monsters.cheer(m); this.send('yum', from.sid, m.type); }
      else if (m && Monsters.tame(m, from.sid)) this.send('tamed', from.sid, m.type);
    } else if (kind === 'tamed') {
      if (MONSTERS[args[0]]) Game.onPetTamed(MONSTERS[args[0]]);
    } else if (kind === 'yum') {
      if (MONSTERS[args[0]]) Game.onPetHappy(MONSTERS[args[0]]);
    } else if (kind === 'petGone') {
      if (MONSTERS[args[0]]) Game.onPetLost(MONSTERS[args[0]]);
    } else if (kind === 'drop' && this.isHost) {
      const [type, x, y] = args;
      if (ITEMS[type] && ITEMS[type].kind === 'food') Items.add(type, x, y, { dropped: true });
    } else if (kind === 'hitP') {
      Game.hurt(from);
    } else if (kind === 'ko') {
      // 내가 그 사람을 쓰러뜨림 → 몬스터를 잡은 것처럼 단어 카드
      Sfx.defeat();
      for (let i = 0; i < 4; i++) Floaters.add(from.x + randFloat(-14, 14), from.y - randFloat(0, 20), '✨', 14);
      Game.onMonsterDefeated({ def: this.peerDef(from) });
    }
  },

  // ---------- guest: 몬스터 + 아이템 받기 ----------
  onWorld(w) {
    if (!w) return;
    const seen = new Set();
    const hadBoss = !!Monsters.boss;
    for (const [id, type, x, y, hp, face, hit, owner, hop, emote] of (w.m || []).filter(Boolean)) {
      seen.add(id);
      let m = this.monsterMap.get(id);
      if (!m) {
        m = { id, type, def: type === 'boss' ? BOSS : MONSTERS[type], x, y, phase: id };
        this.monsterMap.set(id, m);
      }
      Object.assign(m, { tx: x, ty: y, hp, faceRight: !!face, owner: owner || null });
      if (hop && !(m.hopT > 0)) m.hopT = 0.4;
      if (emote && m.emote !== emote) { m.emote = String(emote).slice(0, 4); m.emoteT = 1.2; }
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
      if (Game.pickerOpen) { e.preventDefault(); if (!e.repeat || e.code.startsWith('Arrow')) Game.pickerKey(e.code); return; }
      if (KEYMAP[e.code]) { this.keys.add(e.code); e.preventDefault(); }
      if (e.code === 'KeyQ' && !e.repeat) { Game.toggleWeaponPicker(); Sfx.click(); }
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
    $('#btn-weapon').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Game.toggleWeaponPicker(); });
    // 고르는 칸 바깥을 누르면 닫는다
    addEventListener('pointerdown', e => { if (!e.target.closest('#weapon-picker')) Game.closeWeaponPicker(!e.target.closest('button')); });
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
    if (!World.tiles) return;

    const viewW = this.cssW / this.scale, viewH = this.cssH / this.scale;
    const mapW = World.w * T, mapH = World.h * T;
    this.camX = mapW <= viewW ? (mapW - viewW) / 2 : clamp(Player.x - viewW / 2, 0, mapW - viewW);
    this.camY = mapH <= viewH ? (mapH - viewH) / 2 : clamp(Player.y - viewH / 2, 0, mapH - viewH);

    const s = this.scale * this.dpr;
    ctx.setTransform(s, 0, 0, s, -this.camX * s, -this.camY * s);
    ctx.imageSmoothingEnabled = false;
    // 화면에 보이는 그림 조각만
    const span = CHUNK * T;
    for (let cy = Math.max(0, Math.floor(this.camY / span)); cy * span < Math.min(mapH, this.camY + viewH); cy++) {
      for (let cx = Math.max(0, Math.floor(this.camX / span)); cx * span < Math.min(mapW, this.camX + viewW); cx++) {
        ctx.drawImage(World.chunk(cx, cy), cx * span, cy * span);
      }
    }
    this.drawTarget(time);

    // y 순서대로 그려서 앞뒤가 자연스럽게
    const drawables = Items.list.filter(it => !Items.pending.has(it.id)).map(it => ({ y: it.y, draw: () => this.drawItem(it, time) }));
    for (const m of Monsters.list) drawables.push({ y: m.y, draw: () => this.drawMonster(m, time) });
    const peers = Multi.visiblePeers(), showHearts = Multi.online;
    drawables.push({ y: Player.y, draw: () => this.drawCharacter(Player, Multi.myLook(), Game.held, Game.playerName, true, showHearts ? Game.hearts : null) });
    for (const p of peers) {
      drawables.push({ y: p.y, draw: () => {
        this.drawCharacter(p, Multi.peerLook(p), p.held, p.name, false, p.hearts);
        const icon = STATUS_ICONS[p.st];
        if (icon) this.drawStatus(p, icon, time);
      } });
    }
    drawables.sort((a, b) => a.y - b.y).forEach(d => d.draw());
    Monsters.arrows.forEach(a => this.drawArrow(a));
    for (const p of peers) p.arrows.forEach(a => this.drawArrow(a));
    this.drawFloaters();
    this.drawCraftHint(time);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawSwampDark();
    this.drawEdgeArrow(World.door.x * T + T / 2, World.door.y * T, '🏠', Craft.canMakeAny() ? '🔨' : '');
    const boss = Monsters.boss;
    if (boss) this.drawEdgeArrow(boss.x, boss.y, BOSS.emoji, '');
    for (const p of peers) this.drawEdgeArrow(p.x, p.y, '🧑', '', p.name);
    this.drawMinimap(peers, boss);
  },

  // 🍄 늪에 들어가면 화면이 어두워지고 내 둘레와 🔥 횃불 둘레만 밝다 (천천히 바뀐다)
  drawSwampDark() {
    const home = Math.hypot(Player.x - (World.door.x * T + T / 2), Player.y - (World.door.y * T + T / 2)) < CONFIG.SAFE_RADIUS * T;
    const want = Game.state !== 'title' && World.regionAtPx(Player.x, Player.y) === REGION.SWAMP && !home ? 1 : 0; // 집 앞은 밝게
    this.dark = (this.dark || 0) + (want - (this.dark || 0)) * 0.04;
    if (this.dark < 0.01) return;
    // 어둠은 따로 그린 다음 횃불 자리를 지워서 (destination-out) 화면에 얹는다
    const c = this.darkCanvas || (this.darkCanvas = document.createElement('canvas'));
    if (c.width !== this.canvas.width || c.height !== this.canvas.height) { c.width = this.canvas.width; c.height = this.canvas.height; }
    const g = c.getContext('2d'), k = this.scale, now = performance.now() / 1000;
    const sx = wx => (wx - this.camX) * k, sy = wy => (wy - this.camY) * k;
    g.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, this.cssW, this.cssH);
    const px = sx(Player.x), py = sy(Player.y - 10);
    const dark = g.createRadialGradient(px, py, T * k * 1.2, px, py, T * k * 3.8);
    dark.addColorStop(0, `rgba(20,10,40,${0.12 * this.dark})`);
    dark.addColorStop(1, `rgba(20,10,40,${0.62 * this.dark})`);
    g.fillStyle = dark;
    g.fillRect(0, 0, this.cssW, this.cssH);
    // 화면 안(조금 밖까지)의 횃불: 둘레 TORCH_RADIUS 칸이 밝다 (살짝 일렁인다)
    const reach = (CONFIG.TORCH_RADIUS + 1) * T;
    const lit = World.torches.filter(t => t.x > this.camX - reach && t.x < this.camX + this.cssW / k + reach &&
      t.y > this.camY - reach && t.y < this.camY + this.cssH / k + reach);
    g.globalCompositeOperation = 'destination-out';
    for (const t of lit) {
      const x = sx(t.x), y = sy(t.y), r = CONFIG.TORCH_RADIUS * T * k * (1 + Math.sin(now * 7 + t.x) * 0.03);
      const hole = g.createRadialGradient(x, y, r * 0.3, x, y, r);
      hole.addColorStop(0, 'rgba(0,0,0,1)');
      hole.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = hole;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const ctx = this.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(c, 0, 0);
    ctx.restore();
    // 횃불 빛: 따뜻한 주황빛을 살짝 더한다
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const t of lit) {
      const x = sx(t.x), y = sy(t.y), r = CONFIG.TORCH_RADIUS * T * k;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, `rgba(255,150,40,${0.28 * this.dark})`);
      glow.addColorStop(1, 'rgba(255,150,40,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  },

  // 앞칸 표시: 캘 수 있으면 흰 테두리, 블록을 들고 있으면 놓을 자리 (놓을 수 있으면 초록, 없으면 빨강)
  drawTarget(time) {
    if (Game.state !== 'play') return;
    const ctx = this.ctx, block = Game.heldBlock;
    const spot = block ? Game.placeTile() : Game.digTile();
    const t = spot || Game.frontTile();
    let color = null;
    if (block) color = spot ? 'rgba(76,175,80,.9)' : 'rgba(229,57,53,.7)';
    else if (spot && !Monsters.anyInFront()) color = `rgba(255,255,255,${0.55 + Math.sin(time * 6) * 0.25})`;
    if (!color) return;
    if (block && spot) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(tileIcon(ITEMS[block].tile).canvas, t.x * T, t.y * T);
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(t.x * T + 1, t.y * T + 1, T - 2, T - 2);
  },

  // 오른쪽 위 작은 지도: 맵 전체 + 지금 보이는 곳(흰 네모) + 나(파랑)/다른 사람(빨강)/보스
  drawMinimap(peers, boss) {
    const c = $('#minimap');
    if (!World.mini || c.classList.contains('hidden')) return;
    const w = c.clientWidth, h = c.clientHeight;
    if (!w) return;
    if (c.width !== Math.round(w * this.dpr)) { c.width = Math.round(w * this.dpr); c.height = Math.round(h * this.dpr); }
    const g = c.getContext('2d'), k = (w * this.dpr) / World.w;
    g.imageSmoothingEnabled = false;
    g.drawImage(World.mini, 0, 0, c.width, c.height);
    g.strokeStyle = 'rgba(255,255,255,.9)';
    g.lineWidth = Math.max(1, this.dpr);
    g.strokeRect(this.camX / T * k, this.camY / T * k, this.cssW / this.scale / T * k, this.cssH / this.scale / T * k);
    const dot = (x, y, color, r) => {
      g.fillStyle = color;
      g.beginPath();
      g.arc(x / T * k, y / T * k, r * this.dpr, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#fff';
      g.stroke();
    };
    // 구역 그림 (어디에 어떤 동물이 사는지)
    g.globalAlpha = 0.9;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `${Math.round(14 * this.dpr)}px ${FONT_EMOJI}`;
    REGIONS.forEach((r, i) => {
      const c = World.regionCenters[i];
      if (c) g.fillText(r.emoji, (c.x + 0.5) * k, (c.y + 0.5) * k);
    });
    g.globalAlpha = 1;
    // 내 동물 (분홍 점)
    for (const m of Monsters.list) if (m.owner === Multi.sid) dot(m.x, m.y, '#ec407a', 2);
    if (boss) dot(boss.x, boss.y, '#6a1b9a', 3.5);
    for (const p of peers) dot(p.x, p.y, '#e53935', 3);
    dot(Player.x, Player.y, '#1565c0', 3.5);
  },

  drawMonster(m, time) {
    const ctx = this.ctx, s = m.def.size;
    // 콩 뛰기 (애교): 0.4초 동안 위로 솟았다 내려온다
    const hop = m.hopT > 0 ? Math.sin(Math.PI * (1 - m.hopT / 0.4)) * 10 : 0;
    const bob = Math.sin(time * 6 + m.phase) * 1.5 - hop;
    ctx.fillStyle = m.def.swim ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.22)';
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

    // 체력 막대: 처음엔 빨간 칸이 가득, 맞을 때마다 오른쪽 칸부터 비어 회색이 된다
    const max = m.def.hp, cw = m.def.boss ? 6 : 8, ch = 6, w = max * cw, top = m.y - s * 0.15 - s * 0.62 - 10;
    const left = m.x - w / 2, hp = Math.max(0, Math.ceil(m.hp));
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(left - 2, top - 2, w + 2, ch + 4);
    for (let i = 0; i < max; i++) {
      ctx.fillStyle = i >= hp ? '#e0e0e0' : m.owner ? '#43a047' : '#e53935';
      ctx.fillRect(left + i * cw, top, cw - 2, ch);
    }
    // 머리 위 그림 (💕 🎵 😍): 떠오르며 사라진다
    if (m.emoteT > 0 && m.emote) {
      const k = Math.min(1, m.emoteT / 0.4);
      ctx.save();
      ctx.globalAlpha = k;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `16px ${FONT_EMOJI}`;
      ctx.fillText(m.emote, m.x, top - 12 - (1.2 - Math.min(1.2, m.emoteT)) * 10);
      ctx.restore();
    }
    // 먹이를 받아 따라오는 동물: 체력 막대 옆에 💕 (내 동물은 크게)
    if (m.owner) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${m.owner === Multi.sid ? 12 : 9}px ${FONT_EMOJI}`;
      ctx.fillText('💕', left + w + 9, top + ch / 2);
    }

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
    if (a.food) {
      // 던진 먹이: 빙글빙글 돌며 날아간다
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(performance.now() / 80);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `14px ${FONT_EMOJI}`;
      ctx.fillText(ITEMS[a.food].emoji, 0, 0);
      ctx.restore();
      return;
    }
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

  // 8칸 x 13칸 픽셀 캐릭터. e: 위치/방향/걷기/휘두르기 상태, look: 옷 색, held: 손에 든 것 (무기/블록),
  // label: 머리 위 이름, mine: 내 캐릭터면 이름을 파란색으로
  drawCharacter(e, look, held, label, mine, hearts) {
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

    // 손에 든 것 (휘두르면 앞으로 돌아간다)
    if (held && held !== 'hand') {
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
      const block = ITEMS[held] && ITEMS[held].tile, fix = WEAPONS[held] && WEAPONS[held].fix;
      ctx.translate(0, -4);
      if (fix === 'flip') ctx.scale(-1, 1);
      if (fix === 'turn') ctx.rotate(Math.PI);
      if (block) ctx.drawImage(tileIcon(block).canvas, -8, -8, 16, 16);
      else ctx.fillText(holdEmoji(held), 0, 0);
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
      // 여럿이 할 때: 이름 위에 남은 하트
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

  // 다른 사람이 카드/제작/기절 중이면 머리 위(이름표 위)에 표시
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

  // 집/보스/다른 사람이 화면 밖에 있으면 가장자리에 그 방향 화살표 (label: 아래에 이름)
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
  state: 'loading', // loading → title → play ↔ card / craft / faint
  tapMode: false,
  tapReason: '',
  inventory: {},
  weapons: new Set(),
  picked: null, // 고른 것 (무기 또는 블록). 블록을 다 놓으면 lastWeapon 으로 돌아간다
  lastWeapon: null, // 마지막으로 고른 무기 (없으면 가진 무기 중 제일 센 것)
  pickRows: [], // 고르는 칸의 줄 (종류별)
  pickPos: { r: 0, c: 0 }, // 고르는 칸에서 키보드로 가리키는 칸
  dig: { i: -1, n: 0 }, // 캐는 중인 칸과 친 횟수
  busy: false, // 칸 바꾸기 답을 기다리는 중
  hearts: CONFIG.MAX_HEARTS,
  lookIndex: 0,
  playerName: '',
  kills: 0,
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

    // 저장해 둔 세상이 있으면 이어서 (맵 + 바뀐 칸 + 가방), 없으면 새 세상
    const save = Store.get(KEYS.world, null);
    this.seed = save && Number.isInteger(save.seed) ? save.seed : Math.floor(Math.random() * 1e9);
    World.generate(this.seed);
    if (save) this.loadSave(save);
    Player.reset();
    Items.fill();
    Monsters.fill();
    for (const type of (save && save.pets) || []) Monsters.spawnPet(type);
    this.renderInventory();
    this.renderHearts();
    this.initMultiPanel();
    this.initLook();
    this.initName();
    this.initSave(!!save);

    this.state = 'title';
    const btn = $('#btn-start');
    btn.disabled = false;
    btn.addEventListener('click', () => this.start());
    requestAnimationFrame(t => this.loop(t));
    this.keepAliveInBackground();
    this.initFullscreen();
    this.initBag();
    this.initClickSound();
    this.initHome();
    this.autoResume();
  },

  // 모든 버튼에 '톡' 소리 (공격 버튼은 휘두르는 소리가 따로 있어서 뺀다)
  initClickSound() {
    addEventListener('pointerdown', e => {
      const b = e.target.closest && e.target.closest('button, .inv-slot.weapon');
      if (!b || b.disabled || b.id === 'btn-action') return;
      Sfx.unlock();
      Sfx.click();
    }, true);
  },

  async start() {
    if (!this.prepare()) return;
    Session.clear(); // 혼자 하기: 새로고침해도 방으로 가지 않는다
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
    await Promise.all([this.checkMic(), this.syncBag()]);
    $('#title').classList.add('hidden');
    $('#minimap').classList.remove('hidden');
    document.body.classList.add('playing');
    this.renderInventory();
    this.renderHearts();
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

  // ---------- 저장: 이 기기의 세상(맵 + 바뀐 칸) + 가방 ----------
  // 여럿이 할 때 방장은 자기 세상을 그대로 방으로 열고, 손님은 가방만 저장한다 (손님의 세상은 그대로)
  loadSave(save) {
    // 맵 만드는 방법이 바뀌기 전 저장이면 바뀐 칸은 버린다 (다른 맵에 붙으면 엉망이 된다). 가방은 그대로
    if (save.gen === WORLD_GEN) World.applyEdits(save.edits);
    else console.log('[Save] 맵이 새로 바뀌어서 예전에 바꾼 칸은 버림');
    this.applyBag(save.bag);
    Monsters.kills = save.monsterKills || 0;
    Monsters.nextBossAt = save.nextBossAt || CONFIG.BOSS_AFTER_KILLS;
    console.log(`[Save] 불러옴: 바뀐 칸 ${Object.keys(save.edits || {}).length}개`);
  },

  // 가방 (아이템, 무기, 손에 든 것, 잡은 수) 을 지금 것으로 바꾼다
  applyBag(bag = {}) {
    this.inventory = {};
    this.weapons = new Set();
    this.unlockShown = new Set();
    for (const [type, n] of Object.entries(bag.inventory || {})) if (ITEMS[type] && n > 0) this.inventory[type] = n;
    for (const id of bag.weapons || []) if (WEAPONS[id]) this.weapons.add(id);
    this.picked = holdable(bag.picked) ? bag.picked : null;
    this.lastWeapon = WEAPONS[bag.lastWeapon] ? bag.lastWeapon : null;
    this.kills = bag.kills || 0;
    for (const r of RECIPES) if (r.unlock > 0 && this.kills >= r.unlock) this.unlockShown.add(r.result);
    this.bagJson = JSON.stringify(this.bagItems());
    this.bagT = bag.t || 0;
  },

  bagItems() {
    return { inventory: this.inventory, weapons: [...this.weapons], picked: this.picked, lastWeapon: this.lastWeapon, kills: this.kills };
  },

  // 가방 + 누구 것인지(owner: 이름) + 마지막으로 바뀐 때(t). 바뀌었을 때만 t 를 새로
  bagData() {
    const items = this.bagItems(), json = JSON.stringify(items);
    if (json !== this.bagJson) { this.bagJson = json; this.bagT = Date.now(); }
    return { ...items, owner: bagKey(this.playerName), t: this.bagT };
  },

  // 시작할 때: 서버에 같은 이름의 가방이 있으면 이어서 한다 (이 기기 가방이 그 이름 것이고 더 나중 것이면 이 기기 것).
  // 서버에 없으면 이 기기 가방이 그 이름 것(또는 이름 없는 예전 저장)일 때만 가져가고, 다른 이름 것이면 빈 가방으로
  async syncBag() {
    const local = (Store.get(KEYS.world, null) || {}).bag || {};
    const key = bagKey(this.playerName), mine = !local.owner || local.owner === key;
    const cloud = await Cloud.load(this.playerName);
    if (!cloud) return; // 연결 안 됨: 이 기기 가방 그대로
    const remote = cloud.bag;
    if (remote && !(mine && (local.t || 0) > (remote.t || 0))) {
      this.applyBag(remote);
      console.log('[Cloud] 서버 가방으로 이어서');
    } else if (!remote && !mine) {
      this.applyBag({});
      console.log('[Cloud] 새 이름: 빈 가방');
    }
    Cloud.save(this.bagData());
  },

  writeSave() {
    if (this.state === 'loading' || this.state === 'title' || this.state === 'starting') return;
    const old = Store.get(KEYS.world, null) || {};
    const bag = this.bagData();
    Cloud.save(bag);
    if (Multi.isGuest) { Store.set(KEYS.world, { ...old, bag }); return; }
    Store.set(KEYS.world, {
      gen: WORLD_GEN, seed: this.seed, edits: World.edits(), bag, pets: Monsters.myPets(),
      monsterKills: Monsters.kills, nextBossAt: Monsters.nextBossAt,
    });
  },

  // 시작 화면의 🌱 새 세상: 한 번 누르면 ❗ 로 바뀌고, 3초 안에 한 번 더 누르면 지우고 새로 시작
  initSave(hasSave) {
    setInterval(() => this.writeSave(), CONFIG.SAVE_MS);
    addEventListener('pagehide', () => this.writeSave());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.writeSave(); });
    const btn = $('#btn-new');
    btn.classList.toggle('hidden', !hasSave);
    let armed = 0;
    btn.addEventListener('click', () => {
      if (performance.now() - armed < 3000) {
        try { localStorage.removeItem(KEYS.world); } catch { /* 저장 불가 */ }
        location.reload();
        return;
      }
      armed = performance.now();
      btn.textContent = '❗';
      btn.classList.add('armed');
      setTimeout(() => { btn.textContent = '🌱'; btn.classList.remove('armed'); }, 3000);
    });
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
    // 들어갈 방 번호: 주소의 ?join=1234, 없으면 지난번에 들어갔던 방 (새로고침해도 ▶ 한 번이면 다시 들어간다)
    const code = new URLSearchParams(location.search).get('join') || (Store.get(KEYS.room, {}) || {}).join;
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

  // 왼쪽 위 🏠: 한 번 묻고 처음 화면(이름 입력)으로. 저장하고 방에서 나간 다음 새로 불러온다
  initHome() {
    const box = $('#home-confirm'), yes = $('#btn-home-yes'), no = $('#btn-home-no');
    let back = null, sel = 1; // 처음엔 ❌ 를 가리킨다 (실수로 나가지 않게)
    const mark = () => { yes.classList.toggle('sel', sel === 0); no.classList.toggle('sel', sel === 1); };
    const close = () => {
      box.classList.add('hidden');
      if (this.state === 'menu') this.state = back;
    };
    const go = () => {
      this.writeSave();
      Session.clear();
      location.reload();
    };
    $('#btn-home').addEventListener('click', () => {
      if (this.state !== 'play') return;
      back = this.state;
      this.state = 'menu';
      Input.reset();
      this.closeWeaponPicker(false);
      $('#home-confirm-text').textContent = Store.settings.lang === 'en' ? 'Go back to the start?' : '처음 화면으로 갈까요?';
      sel = 1;
      mark();
      box.classList.remove('hidden');
    });
    yes.addEventListener('click', go);
    no.addEventListener('click', close);
    // 키보드: ←→ 고르기, 스페이스/엔터, Esc/Q 는 ❌
    addEventListener('keydown', e => {
      if (box.classList.contains('hidden')) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) { sel = 1 - sel; mark(); Sfx.click(); }
      else if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) { Sfx.click(); if (sel === 0) go(); else close(); }
      else if (e.code === 'Escape' || e.code === 'KeyQ') { Sfx.click(); close(); }
    }, true);
  },

  // 새로고침 전에 여럿이 하기 중이었으면 시작 화면 없이 그 방으로 바로 (방장은 같은 번호로 다시 열고,
  // 손님은 방이 열릴 때까지 기다린다). 소리는 브라우저 규칙상 첫 키/터치 뒤부터 난다
  async autoResume() {
    const s = Session.get();
    if (!s || !/^\d{4}$/.test(s.code || '') || !$('#name-input').value.trim()) return;
    addEventListener('pointerdown', () => { Sfx.unlock(); Speech.unlock(); }, { once: true, capture: true });
    addEventListener('keydown', () => { Sfx.unlock(); Speech.unlock(); }, { once: true, capture: true });
    $('#mp-panel').classList.remove('hidden');
    if (s.mode === 'host') { await this.startHost(); return; }
    $('#mp-code').value = s.code;
    for (let i = 0; i < 40 && this.state === 'title'; i++) {
      await this.startGuest(s.code);
      if (this.state !== 'title') return;
      this.mpMsg(`⏳ ${s.code}`); // 방이 아직 안 열림 (방장도 새로고침 중): 잠깐 뒤 다시
      await delay(3000);
    }
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

  // 여럿이 할 때 이 탭이 안 보이면(다른 탭/앱) 화면 그리기가 멈춘다. 그래도 다른 사람과 통신은 계속한다
  keepAliveInBackground() {
    setInterval(() => {
      if (document.hidden && Multi.online) this.step(performance.now());
    }, 250);
  },

  update(dt) {
    const playing = this.state === 'play';
    if (playing) Player.update(dt);
    else Player.moving = false;
    // 세상(아이템, 몬스터)은 방장/혼자 기기가 돌린다. 혼자 할 때는 카드/제작 중에 멈추고,
    // 여럿이 할 때는 다른 사람이 계속 놀 수 있게 계속 돌린다. 손님 기기는 받아서 그리기만 한다
    if (!Multi.isGuest && (playing || Multi.isHost)) {
      Items.respawn();
      Monsters.update(dt);
    }
    if (playing || Multi.online) Monsters.updateArrows(dt);
    if (this.state !== 'play') return; // 화살로 처치해서 상태가 바뀌었을 수 있다
    Items.pickup();
    this.checkRegion(dt);
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
    if (this.state === 'play' && Player.swingT <= 0.1) {
      Player.swingT = 0.25;
      if (this.heldBlock) { this.place(); return; }
      if (this.heldFood) { this.throwFood(); return; }
      Sfx.swing();
      const t = this.digTile();
      if (t && !Monsters.anyInFront()) this.digAt(t.x, t.y);
      else Monsters.attack();
    }
  },

  // 내가 서 있는 칸 기준 바라보는 쪽 옆칸
  frontTile() {
    const [fx, fy] = FACING[Player.dir];
    return { x: Math.floor(Player.x / T) + fx, y: Math.floor(Player.y / T) + fy };
  },

  // 캘 칸: 바라보는 옆칸, 아니면 밟고 있는 꽃
  // 사람이 서 있는 다리는 캐지 않는다 (캐면 물이 되어 갇힌다)
  digTile() {
    const f = this.frontTile(), me = { x: Math.floor(Player.x / T), y: Math.floor(Player.y / T) };
    return [f, me].find(t => World.diggable(t.x, t.y) && !(DIG[World.tile(t.x, t.y)].after === TILE.WATER && this.someoneOn(t.x, t.y))) || null;
  },

  // 그 칸에 나나 다른 사람의 몸이 걸쳐 있는지
  someoneOn(tx, ty) {
    const r = CONFIG.PLAYER_RADIUS * T, x0 = tx * T, y0 = ty * T;
    return [Player, ...Multi.visiblePeers()].some(p => p.x + r > x0 && p.x - r < x0 + T && p.y + r > y0 && p.y - r < y0 + T);
  },

  // 놓을 칸: 내 칸 기준 4방향 중 바라보는 쪽 → 양옆 → 뒤 순서로 놓을 수 있는 첫 칸 (없으면 null)
  placeTile() {
    const [fx, fy] = FACING[Player.dir];
    const tx = Math.floor(Player.x / T), ty = Math.floor(Player.y / T);
    for (const [dx, dy] of [[fx, fy], [fy, fx], [-fy, -fx], [-fx, -fy]]) {
      if (this.canPlace(tx + dx, ty + dy)) return { x: tx + dx, y: ty + dy };
    }
    return null;
  },

  // 캐기: 꽃은 한 번, 나무는 맨손 TREE_HITS 번 (도끼는 한 번), 바위는 맨손 ROCK_HITS 번 (도끼/칼은 ROCK_HITS_TOOL 번).
  // 다 캐면 그 칸은 풀밭이 되고 가방으로
  async digAt(tx, ty) {
    const i = ty * World.w + tx, tt = World.tiles[i];
    if (this.dig.i !== i) this.dig = { i, n: 0 };
    this.dig.n++;
    const dig = DIG[tt], num = v => (typeof v === 'string' ? CONFIG[v] : v);
    const need = dig.tools && dig.tools.includes(this.weapon) ? num(dig.tool) : num(dig.hand);
    Sfx.hit();
    Floaters.add(tx * T + T / 2, ty * T + T / 4, this.dig.n < need ? '💥' : '✨', 16);
    if (this.dig.n < need || this.busy) return;
    this.dig = { i: -1, n: 0 };
    this.busy = true;
    const ok = await Multi.editTile(i, tt, dig.after ?? TILE.GRASS);
    this.busy = false;
    if (ok) dig.gives.forEach(type => this.addItem(type));
  },

  // 놓을 수 있는 칸: 풀밭/모래이고, 사람/몬스터/아이템이 없고, 집 문 앞이 아닌 곳
  canPlace(tx, ty) {
    if (tx <= 0 || ty <= 0 || tx >= World.w - 1 || ty >= World.h - 1) return false;
    const tt = World.tile(tx, ty), def = ITEMS[this.heldBlock], next = def && TILE[def.tile];
    // 다리는 물 위에만, 나머지는 풀밭/모래에만
    if (next === TILE.BRIDGE ? tt !== TILE.WATER : tt !== TILE.GRASS && tt !== TILE.SAND) return false;
    if (tx === World.door.x && ty > World.door.y && ty <= World.door.y + 4) return false;
    const x0 = tx * T, y0 = ty * T;
    const overlaps = (x, y, r) => x + r > x0 && x - r < x0 + T && y + r > y0 && y - r < y0 + T;
    const pr = CONFIG.PLAYER_RADIUS * T;
    // 길을 막는 것(나무, 바위, 벽돌, 횃불, 문)은 다른 사람/몬스터 자리에는 못 놓는다. 내 몸이 살짝 걸치는 건 놓은 뒤 내 칸 가운데로 옮긴다
    if (MONSTER_BLOCKING.has(next)) {
      if (Multi.visiblePeers().some(p => overlaps(p.x, p.y, pr))) return false;
      if (Monsters.list.some(m => overlaps(m.x, m.y, Monsters.radius(m)))) return false;
    }
    return !Items.list.some(it => it.tx === tx && it.ty === ty);
  },

  async place() {
    const block = this.heldBlock, t = this.placeTile();
    if (this.busy || !t) { Sfx.soft(); return; }
    const i = t.y * World.w + t.x, next = TILE[ITEMS[block].tile];
    this.inventory[block]--;
    this.busy = true;
    const ok = await Multi.editTile(i, World.tiles[i], next);
    this.busy = false;
    if (!ok) this.inventory[block]++;
    else {
      if (!this.inventory[block]) this.picked = this.lastWeapon;
      Sfx.pickup();
      Floaters.add(t.x * T + T / 2, t.y * T, '✨', 14);
      if (BLOCKING.has(next) && !World.canStand(Player.x, Player.y)) {
        Player.x = Math.floor(Player.x / T) * T + T / 2;
        Player.y = Math.floor(Player.y / T) * T + T / 2;
      }
    }
    this.renderInventory();
  },

  // 손에 든 먹이를 던진다. 다 던지면 원래 무기로
  throwFood() {
    const food = this.heldFood;
    this.inventory[food]--;
    if (!this.inventory[food]) this.picked = this.lastWeapon;
    Sfx.swing();
    Monsters.throwFood(food);
    this.renderInventory();
  },

  onPetTamed(def) {
    Sfx.pickup();
    toast(`💕 ${def.emoji} ${itemNames(def).main}`);
    if (Store.settings.lang === 'en') Speech.speak(`The ${def.en} likes you!`, 'en');
    else Speech.speak(`${josa(def.ko, '이', '가')} 따라와요!`, 'ko');
  },

  onPetHappy(def) {
    Sfx.pickup();
    toast(`😍 ${def.emoji} ${itemNames(def).main}`);
    if (Store.settings.lang === 'en') Speech.speak(`The ${def.en} loves it!`, 'en');
    else Speech.speak(`${josa(def.ko, '이', '가')} 좋아해요!`, 'ko');
  },

  onPetLost(def) {
    Sfx.hurt();
    toast(`💔 ${def.emoji} ${itemNames(def).main}`);
  },

  // 구역에 들어서면 이름을 잠깐 보여준다 (경계에서 왔다 갔다 해도 계속 뜨지 않게 0.8초 머물러야)
  checkRegion(dt) {
    // 집 앞(안전지대)은 네 구역이 만나는 곳이라 빼고, 나갈 때마다 다시 알려준다
    if (Monsters.safeZone(Player.x, Player.y)) { this.regionNow = this.regionShown = -1; return; }
    const r = World.regionAtPx(Player.x, Player.y);
    if (r !== this.regionNow) { this.regionNow = r; this.regionT = 0; }
    this.regionT += dt;
    if (this.regionT > 0.8 && this.regionShown !== r) {
      this.regionShown = r;
      toast(`${REGIONS[r].emoji} ${itemNames(REGIONS[r]).main}`);
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
      await this.showCards(1, m.def.emoji);
    }
    this.handlingDefeats = false;

    // 새로 열린 레시피 알림
    for (const r of RECIPES) {
      if (r.unlock > 0 && this.kills >= r.unlock && !this.unlockShown.has(r.result)) {
        this.unlockShown.add(r.result);
        const w = WEAPONS[r.result];
        toast(`🔓 ${iconHtml(w)} ${itemNames(w).main}`);
      }
    }
    this.state = 'play';
  },

  // m: 몬스터 또는 다른 사람 캐릭터(isPlayer). 맞으면 빨갛게 번쩍이며 때린 쪽 반대로 밀린다
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
      if (m.isPlayer) Multi.send('ko', m.sid); // 쓰러뜨린 사람 기기에 단어 카드
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

  // 위쪽 가방(아이템) 칸: 🎒 버튼을 눌렀을 때만 보인다 (폰에서 화면을 덜 가리게). PC 는 처음부터 펼침
  initBag() {
    this.setBag(!document.body.classList.contains('touch'));
    $('#btn-bag').addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      this.setBag($('#inventory').classList.contains('hidden'));
    });
  },

  setBag(open) {
    $('#inventory').classList.toggle('hidden', !open);
    $('#btn-bag').classList.toggle('on', open);
  },

  renderHearts() {
    let html = '';
    for (let i = 0; i < CONFIG.MAX_HEARTS; i++) html += i < this.hearts ? '❤️' : '🤍';
    $('#hearts').textContent = html;
  },

  // 고른 무기. 블록을 골랐거나 아직 안 골랐으면 가진 무기 중 제일 센 것
  get weapon() {
    if (this.picked === 'hand' || this.weapons.has(this.picked)) return this.picked;
    let best = 'hand';
    for (const id of this.weapons) if (WEAPONS[id].power > WEAPONS[best].power) best = id;
    return best;
  },

  // 손에 든 블록 (없으면 null)
  get heldBlock() {
    const def = ITEMS[this.picked];
    return def && def.tile && this.inventory[this.picked] > 0 ? this.picked : null;
  },

  // 손에 든 먹이 (없으면 null). ✋ 를 누르면 던진다
  get heldFood() {
    const def = ITEMS[this.picked];
    return def && def.kind === 'food' && this.inventory[this.picked] > 0 ? this.picked : null;
  },

  // 손에 든 것 (블록, 먹이 또는 무기)
  get held() { return this.heldBlock || this.heldFood || this.weapon; },

  // 고를 수 있는 것을 종류별로 (무기 / 블록 / 먹이). 빈 종류는 뺀다
  pickGroups() {
    const has = id => this.inventory[id] > 0;
    return [
      { icon: '⚔️', ko: '무기', en: 'Weapons', ids: Object.keys(WEAPONS).filter(id => id === 'hand' || this.weapons.has(id)) },
      { icon: '🧱', ko: '블록', en: 'Blocks', ids: Object.keys(ITEMS).filter(id => ITEMS[id].tile && has(id)) },
      { icon: '🍎', ko: '먹이', en: 'Food', ids: Object.keys(ITEMS).filter(id => ITEMS[id].kind === 'food' && has(id)) },
    ].filter(g => g.ids.length);
  },

  // 고를 수 있는 것 전부: 가진 무기 + 가방에 있는 블록, 먹이
  ownedWeapons() { return this.pickGroups().flatMap(g => g.ids); },

  setWeapon(id) {
    this.picked = id;
    if (WEAPONS[id]) this.lastWeapon = id;
    this.closeWeaponPicker(false);
    this.renderInventory();
    const def = WEAPONS[id] || ITEMS[id];
    toast(`${iconHtml(def)} ${itemNames(def).main}`);
  },

  get pickerOpen() { return !$('#weapon-picker').classList.contains('hidden'); },

  // 고르는 칸: 오른쪽 아래 작은 동그라미(또는 위 무기 칸, Q 키)를 누르면 열린다. 종류마다 한 줄
  toggleWeaponPicker() {
    const picker = $('#weapon-picker');
    if (this.pickerOpen) return this.closeWeaponPicker(false);
    if (this.state !== 'play') return;
    Input.reset();
    picker.innerHTML = '';
    this.pickRows = this.pickGroups();
    this.pickPos = { r: 0, c: 0 };
    this.pickRows.forEach((g, r) => {
      const row = document.createElement('div');
      row.className = 'pick-row';
      row.innerHTML = `<div class="pick-label"><span>${g.icon}</span>${itemNames(g).main}</div>`;
      const items = document.createElement('div');
      items.className = 'pick-items';
      g.ids.forEach((id, c) => {
        if (id === this.held) this.pickPos = { r, c };
        const btn = document.createElement('button');
        const def = WEAPONS[id] || ITEMS[id];
        btn.className = `big-btn weapon-choice${id === this.held ? ' on' : ''}`;
        btn.dataset.pick = `${r},${c}`;
        btn.innerHTML = ITEMS[id] ? `${iconHtml(def)}<b>${this.inventory[id]}</b>` : iconHtml(def);
        btn.setAttribute('aria-label', def.en);
        btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.setWeapon(id); });
        items.appendChild(btn);
      });
      row.appendChild(items);
      picker.appendChild(row);
    });
    picker.classList.remove('hidden');
    this.markPick();
  },

  // 키보드로 가리키는 칸 표시 (굵은 주황 테두리)
  markPick() {
    const at = `${this.pickPos.r},${this.pickPos.c}`;
    $('#weapon-picker').querySelectorAll('.weapon-choice').forEach(b => b.classList.toggle('sel', b.dataset.pick === at));
  },

  // 고르는 칸이 열려 있을 때 키: ←→(A/D) 줄 안에서, ↑↓(W/S) 다른 종류 줄로, Enter/Space 들기, Q/Esc 닫기
  pickerKey(code) {
    const rows = this.pickRows, p = this.pickPos;
    const dx = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 }[code];
    const dy = { ArrowUp: -1, KeyW: -1, ArrowDown: 1, KeyS: 1 }[code];
    if (dx) {
      const n = rows[p.r].ids.length;
      p.c = (p.c + dx + n) % n;
    } else if (dy) {
      p.r = (p.r + dy + rows.length) % rows.length;
      p.c = Math.min(p.c, rows[p.r].ids.length - 1);
    } else if (code === 'Enter' || code === 'Space') {
      Sfx.click();
      this.setWeapon(rows[p.r].ids[p.c]);
      return;
    } else if (code === 'KeyQ' || code === 'Escape') {
      this.closeWeaponPicker();
      return;
    } else return;
    this.markPick();
    Sfx.click();
  },

  // 버튼으로 닫을 때는 버튼 소리가 이미 나니까 sound=false
  closeWeaponPicker(sound = true) {
    const picker = $('#weapon-picker');
    if (picker.classList.contains('hidden')) return;
    picker.classList.add('hidden');
    if (sound) Sfx.click();
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
    toast(`${iconHtml(def)} ${main}${sub ? ` <small>${sub}</small>` : ''} +1`);
    this.renderInventory(type);
  },

  renderInventory(bumpType) {
    const inv = $('#inventory');
    inv.innerHTML = '';
    // 손에 든 것 (✋ 버튼 그림도 같이 바꾼다)
    const w = WEAPONS[this.held] || ITEMS[this.held];
    $('#btn-action').innerHTML = iconHtml(w);
    $('#btn-weapon').innerHTML = iconHtml(w);
    const choices = this.ownedWeapons().length > 1;
    $('#btn-weapon').classList.toggle('hidden', !choices);
    if (choices) {
      const { main, sub } = itemNames(w);
      const slot = document.createElement('div');
      slot.className = 'inv-slot weapon';
      slot.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.toggleWeaponPicker(); });
      slot.innerHTML = `<span class="e">${iconHtml(w)}</span><span class="names"><span class="n">${main}</span>` +
        `${sub ? `<span class="s">${sub}</span>` : ''}</span>`;
      inv.appendChild(slot);
    }
    const owned = Object.keys(ITEMS).filter(type => this.inventory[type] > 0);
    if (!owned.length) {
      if (!choices) inv.innerHTML = '<div class="inv-empty">🎒</div>';
      return;
    }
    for (const type of owned) {
      const def = ITEMS[type], { main, sub } = itemNames(def);
      const slot = document.createElement('div');
      slot.className = `inv-slot${type === bumpType ? ' bump' : ''}`;
      slot.innerHTML = `<span class="e">${iconHtml(def)}</span><span class="names"><span class="n">${main}</span>` +
        `${sub ? `<span class="s">${sub}</span>` : ''}</span><b>${this.inventory[type]}</b>`;
      inv.appendChild(slot);
    }
  },
};

// 콘솔 디버깅용: BC.Judge.judge('나무', ['나모']), BC.Game.enterHome() 등
window.BC = { CONFIG, Store, Words, Judge, Speech, Card, Craft, World, Items, Monsters, Player, Multi, Game };

Game.init();
