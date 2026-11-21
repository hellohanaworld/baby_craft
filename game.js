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
  STAGE_W: 120,           // 한 탄(스테이지)의 넓이 (칸)
  MAP_W: 240,             // 옆으로 이어 붙인 탄 수 × STAGE_W (1탄 + 2탄)
  STAGE_H: 90,            // 1탄 / 2탄의 높이 (칸)
  MAP_H: 150,             // STAGE_H + 3탄 높이 (3탄 🧭 절벽 미로는 2탄 아래)
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
  LUCK_FOR_BOSS: 4,       // 2탄: 🍀 네잎클로버를 모두 합쳐 이만큼 찾으면 🦅 독수리 등장
  LUCKY_COUNT: 16,        // 2탄 들판에 숨어 있는 네잎클로버 수 (토끼가 먹으면 다른 곳에 다시 난다)

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

const FONT_UI = '"Malgun Gothic","Apple SD Gothic Neo","Noto Sans KR",sans-serif,"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji"';
const FONT_EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
// 옛 윈도우 10 이모지 글꼴에 없는 새 이모지 → index.html 의 Noto 이모지 웹 글꼴 (이 글자들만 받는다). 캔버스는 글꼴을 저절로 받지 않아서 미리 받아 둔다
const EMOJI_FALLBACK = '🪵🪨🪓🟫🤍🦛🦘🧱🧵🛡🦔🥩';
try { document.fonts.load(`20px "Noto Color Emoji"`, EMOJI_FALLBACK).catch(() => {}); } catch { /* 미지원 */ }

// 게임 아이템. 종류(kind)는 다섯 가지 + 맵의 하트:
//   material 재료 (제작대에서만 쓴다) / block 블록 (tile: 땅에 놓으면 되는 맵 칸) / food 음식 (먹으면 ❤️ heal, 던지면 좋아하는 동물이 따라온다)
//   potion 물약 (마시면 특별한 힘: heal / speed / light 초) / wear 옷 (slot: 입는 곳. 꾸미기) / gear 방패 (slot 에 들면 두 번에 한 번 막아 준다)
// 그림은 모두 픽셀 그림 (icon: PIXEL_ICONS, 블록은 맵 칸 그림). emoji 는 말풍선/알림 글자에만 쓴다
// weight: 맵에 저절로 떨어져 있는 비율 (0 이면 안 생긴다)
const ITEMS = {
  // 🪵 재료
  wood:    { emoji: '🪵', ko: '통나무', en: 'log',     kind: 'material', weight: 4, icon: 'LOG' },
  stone:   { emoji: '🪨', ko: '돌',     en: 'stone',   kind: 'material', weight: 3, icon: 'STONE' },
  string:  { emoji: '🧵', ko: '실',     en: 'string',  kind: 'material', weight: 1, icon: 'SPOOL' },
  leather: { emoji: '🟫', ko: '가죽',   en: 'leather', kind: 'material', weight: 0, icon: 'LEATHER' },
  thorn:   { emoji: '📍', ko: '가시',   en: 'spike',   kind: 'material', weight: 0, icon: 'THORN' },
  clover:  { emoji: '🍀', ko: '네잎클로버', en: 'four-leaf clover', kind: 'material', weight: 0, icon: 'LUCKY' }, // 2탄 들판에서 뽑는다
  gem:     { emoji: '💎', ko: '보석',   en: 'jewel',   kind: 'material', weight: 0, icon: 'GEM' }, // 3탄 미로 끝 보물 상자
  // 🍎 음식 (likes: MONSTERS 의 좋아하는 음식)
  apple:   { emoji: '🍎', ko: '사과',   en: 'apple',   kind: 'food', weight: 2, heal: 1, icon: 'APPLE' },
  carrot:  { emoji: '🥕', ko: '당근',   en: 'carrot',  kind: 'food', weight: 2, heal: 1, icon: 'CARROT' },
  meat:    { emoji: '🍖', ko: '고기',   en: 'meat',    kind: 'food', weight: 0, heal: 2, icon: 'MEAT' },
  fish:    { emoji: '🐟', ko: '생선',   en: 'fish',    kind: 'food', weight: 0, heal: 2, icon: 'FISH' },
  honey:   { emoji: '🍯', ko: '꿀',     en: 'honey',   kind: 'food', weight: 0, heal: 1, icon: 'HONEY' }, // 2탄 벌. 물약 재료
  cake:    { emoji: '🎂', ko: '케이크', en: 'cake',    kind: 'food', weight: 0, heal: 5, icon: 'CAKE' }, // 모든 동물이 좋아한다
  // ⚗️ 물약
  redpot:  { emoji: '⚗️', ko: '빨간 물약', en: 'red potion',    kind: 'potion', weight: 0, heal: 3, icon: 'POTION_R' },
  bluepot: { emoji: '⚗️', ko: '파란 물약', en: 'blue potion',   kind: 'potion', weight: 0, speed: 30, icon: 'POTION_B' }, // 30초 빨리 달리기
  yellowpot: { emoji: '⚗️', ko: '노란 물약', en: 'yellow potion', kind: 'potion', weight: 0, light: 60, icon: 'POTION_Y' }, // 60초 어두운 곳이 밝다
  // 👕 옷 (꾸미기) / 🛡️ 방패
  hat:     { emoji: '🤠', ko: '가죽 모자', en: 'leather hat',    kind: 'wear', slot: 'head', weight: 0, icon: 'HAT' },
  crown:   { emoji: '👑', ko: '왕관',      en: 'crown',          kind: 'wear', slot: 'head', weight: 0, icon: 'CROWN' },
  vest:    { emoji: '🦺', ko: '가죽 갑옷', en: 'leather armor',  kind: 'wear', slot: 'body', weight: 0, icon: 'VEST' },
  boots:   { emoji: '👢', ko: '장화',      en: 'boots',          kind: 'wear', slot: 'feet', weight: 0, icon: 'BOOTS' },
  shield:  { emoji: '🛡️', ko: '방패',      en: 'shield',         kind: 'gear', weight: 0, icon: 'SHIELD' }, // 가방에 있으면 맞을 때 두 번에 한 번 막는다
  // 🧱 블록: 꽃은 캐서, 묘목은 나무를 캐면 같이 나온다 (심으면 자라서 나무), 나머지는 제작대에서
  flower:  { emoji: '🌷', ko: '꽃',     en: 'flower',  kind: 'block', tile: 'FLOWER',  weight: 0 },
  sapling: { emoji: '🌱', ko: '묘목',   en: 'sapling', kind: 'block', tile: 'SAPLING', weight: 0 },
  brick:   { emoji: '🧱', ko: '벽돌',   en: 'brick',   kind: 'block', tile: 'BRICK',   weight: 0 },
  gate:    { emoji: '🚪', ko: '문',     en: 'door',    kind: 'block', tile: 'GATE',    weight: 0 }, // 사람은 지나가고 몬스터는 못 지나간다
  bridge:  { emoji: '🌉', ko: '다리',   en: 'bridge',  kind: 'block', tile: 'BRIDGE',  weight: 0 }, // 물 위에만 놓는다
  torch:   { emoji: '🔥', ko: '횃불',   en: 'torch',   kind: 'block', tile: 'TORCH',   weight: 0 }, // 둘레에 몬스터가 못 온다
  fence:   { emoji: '🌵', ko: '가시 울타리', en: 'spike fence', kind: 'block', tile: 'THORN', weight: 0 }, // 막고, 부딪친 사나운 동물은 따끔
  // 맵에 떠 있는 ❤️ (HEART_COUNT 개). 다쳤을 때만 주워서 바로 먹는다 (가방에 넣지 않는다)
  heart:   { emoji: '❤️', ko: '하트',   en: 'heart',   kind: 'heart', weight: 0 },
};
// 가방 판: 바꾸면 모든 가방을 비우고 새로 시작한다 (아이템 체계가 바뀌었을 때)
const BAG_V = 2;

// 무기 (power 가 클수록 강하다)
const WEAPONS = {
  hand:  { emoji: '✋', ko: '손',   en: 'hand',  power: 1 },
  axe:   { emoji: '🪓', ko: '도끼', en: 'axe',   power: 2, icon: 'AXE' },
  bow:   { emoji: '🏹', ko: '활',   en: 'bow',   power: 3, icon: 'BOW' },
  sword: { emoji: '🗡️', ko: '칼',   en: 'sword', power: 4, icon: 'SWORD' },
};

// 제작대 레시피 (1탄 집 안, 2탄 ⛺ 텐트, 3탄 ⚒️ 대장간). unlock: 몬스터를 이만큼 잡아야 열린다.
// 무기/방패/옷은 한 번만, 블록/음식/물약은 몇 번이든 (count 개씩).
// 줄(무기 → 옷 → 블록 → 음식 → 물약) 순서대로 적는다 (키보드로 고르는 번호가 화면 순서와 같게)
const RECIPES = [
  { result: 'axe',    needs: { wood: 2, stone: 1 },            unlock: 0 },
  { result: 'bow',    needs: { wood: 1, string: 2 },           unlock: 1 },
  { result: 'sword',  needs: { stone: 2, wood: 1, leather: 1 }, unlock: 2 }, // 돌 칼날 + 가죽 손잡이
  { result: 'shield', needs: { wood: 2, leather: 2 },          unlock: 1 },
  { result: 'hat',    needs: { leather: 2 },                   unlock: 0 },
  { result: 'vest',   needs: { leather: 3, string: 1 },        unlock: 0 },
  { result: 'boots',  needs: { leather: 2, string: 1 },        unlock: 0 },
  { result: 'crown',  needs: { gem: 3 },                       unlock: 0 },
  { result: 'brick',  needs: { stone: 2 },                     unlock: 0, count: 2 },
  { result: 'gate',   needs: { wood: 2 },                      unlock: 0, count: 1 },
  { result: 'bridge', needs: { wood: 1 },                      unlock: 0, count: 2 },
  { result: 'torch',  needs: { wood: 1, stone: 1 },            unlock: 0, count: 2 },
  { result: 'fence',  needs: { thorn: 2, wood: 1 },            unlock: 0, count: 2 },
  { result: 'cake',   needs: { apple: 2, honey: 1 },           unlock: 0, count: 1 },
  { result: 'redpot', needs: { apple: 1, honey: 1 },           unlock: 0, count: 1 },
  { result: 'bluepot', needs: { clover: 1, honey: 1 },         unlock: 0, count: 1 },
  { result: 'yellowpot', needs: { gem: 1, honey: 1 },          unlock: 0, count: 1 },
];
// 제작대 줄: 무기(+방패) / 옷 / 블록(+재료) / 음식 / 물약
const recipeGroup = r => {
  if (WEAPONS[r.result] || ITEMS[r.result].kind === 'gear') return 'weapon';
  return { wear: 'wear', food: 'food', potion: 'potion' }[ITEMS[r.result].kind] || 'block';
};

// 지도 네 구역 (집은 가운데, 경계는 구불구불하게 이어진다). 구역마다 땅 색과 사는 동물이 다르다
const REGION = { FOREST: 0, LAKE: 1, SWAMP: 2, MEADOW: 3, CLOVER: 4, MAZE: 5 };
// 어두운 구역: 🍄 늪, 🧭 절벽 미로 (내 둘레와 🔥 횃불 둘레만 밝다)
const DARK_REGIONS = new Set([REGION.SWAMP, REGION.MAZE]);
const REGIONS = [
  { emoji: '🌲', ko: '무서운 숲', en: 'Dark Forest' }, // 왼쪽 위: 나무가 빽빽, 육식동물
  { emoji: '🏞️', ko: '호수',     en: 'Lakes' },       // 오른쪽 위: 큰 호수, 물고기
  { emoji: '🍄', ko: '어두운 늪', en: 'Dark Swamp' },  // 왼쪽 아래: 어둡고 축축, 벌레
  { emoji: '🌼', ko: '초원',     en: 'Meadow' },      // 오른쪽 아래: 꽃밭, 초식동물
  { emoji: '🍀', ko: '클로버 들판', en: 'Clover Field' }, // 2탄: 클로버밭 사이에 네잎클로버가 숨어 있다
  { emoji: '🧭', ko: '절벽 미로', en: 'Cliff Maze' },   // 3탄: 절벽 사이 길을 따라가면 끝에 보물 상자
];
// 땅 색 (풀 + 점, 물, 모래, 나뭇잎). DEFAULT 는 블록 그림 같은 구역 없는 그림
const GROUND = {
  DEFAULT: { grass: ['#5cb85c', '#4fa64f', '#6fcb6a'], water: ['#3b8de0', '#74b9f0'], sand: ['#e9d68f', '#d8c27a', '#f3e3a6'], leaf: ['#2e7d32', '#43a047', '#66bb6a'] },
  [REGION.FOREST]: { grass: ['#4a9a48', '#3f8a3e', '#56a854'], water: ['#3b8de0', '#74b9f0'], sand: ['#e0cc85', '#cfb972', '#ead99c'], leaf: ['#1b5e20', '#2e7d32', '#43a047'] },
  [REGION.LAKE]:   { grass: ['#5cb87a', '#4fa66c', '#6fcb8a'], water: ['#3b8de0', '#74b9f0'], sand: ['#e9d68f', '#d8c27a', '#f3e3a6'], leaf: ['#2e7d32', '#43a047', '#66bb6a'] },
  [REGION.SWAMP]:  { grass: ['#4e6b48', '#435d3e', '#6b5a7a'], water: ['#4d7468', '#6b9488'], sand: ['#7d6b4c', '#6d5c40', '#8c7a58'], leaf: ['#33502f', '#3f6339', '#55744a'] },
  [REGION.MEADOW]: { grass: ['#7ccc5c', '#6dbd4e', '#8fd96b'], water: ['#3b8de0', '#74b9f0'], sand: ['#f0df9a', '#e0cd85', '#f8ebb5'], leaf: ['#2e7d32', '#43a047', '#66bb6a'] },
  [REGION.CLOVER]: { grass: ['#86d36a', '#78c55c', '#9be07f'], water: ['#42a5f5', '#90caf9'], sand: ['#f3e5ab', '#e6d592', '#faf0c4'], leaf: ['#388e3c', '#4caf50', '#81c784'] },
  // 미로 바닥은 밝은 흙길 (작은 지도에서 어두운 절벽과 잘 구별되게)
  [REGION.MAZE]:   { grass: ['#d9c49a', '#cbb489', '#e6d4ae'], water: ['#42a5f5', '#90caf9'], sand: ['#efe0b8', '#e2d1a3', '#f7ecd0'], leaf: ['#388e3c', '#4caf50', '#81c784'] },
};

// 동물 (이름도 글자로 같이 보여준다. emoji 가 words.csv 와 같으면 잡은 뒤 그 단어 카드가 나온다)
//   drops: 잡으면 나오는 것 (동물에 맞게: 사냥하는 짐승은 고기/가죽, 거미/양은 실, 고슴도치/복어/전갈은 가시, 벌은 꿀, 물고기/게는 생선)
//   region: 사는 구역 (거기서 생기고, 쫓아가지 않을 때는 그 구역 안을 돌아다닌다), count: 몇 마리
//   hunts: 육식동물 (사람과 초식동물을 쫓는다), calm: 먼저 공격하지 않고 다가가면 도망간다,
//   likes: 좋아하는 음식 (그 음식이나 🎂 케이크를 맞으면 따라온다. 다른 음식은 고개를 젓는다)
//   (먹이를 맞으면 그 사람을 따라다닌다), swim: 물에서만 다닌다, ghost: 반투명하게 떠다니는 그림
const MONSTERS = {
  // 🌲 무서운 숲
  wolf:     { emoji: '🐺', ko: '늑대',   en: 'wolf',     hp: 4, speed: 2.0, size: 26, drops: { meat: 1, leather: 1 }, region: REGION.FOREST, count: 3, hunts: true },
  fox:      { emoji: '🦊', ko: '여우',   en: 'fox',      hp: 4, speed: 1.9, size: 26, drops: { meat: 1, leather: 1 }, region: REGION.FOREST, count: 3, hunts: true },
  bear:     { emoji: '🐻', ko: '곰',     en: 'bear',     hp: 6, speed: 1.5, size: 28, drops: { meat: 2, leather: 1 }, region: REGION.FOREST, count: 2, hunts: true },
  tiger:    { emoji: '🐯', ko: '호랑이', en: 'tiger',    hp: 7, speed: 1.8, size: 28, drops: { meat: 2, leather: 2 }, region: REGION.FOREST, count: 2, hunts: true },
  // 🏞️ 호수
  fish:     { emoji: '🐟', ko: '물고기', en: 'fish',     hp: 2, speed: 1.6, size: 22, drops: { fish: 1 },           region: REGION.LAKE, count: 8, calm: true, swim: true },
  blowfish: { emoji: '🐡', ko: '복어',   en: 'blowfish', hp: 3, speed: 1.2, size: 22, drops: { thorn: 1 },         region: REGION.LAKE, count: 4, calm: true, swim: true },
  hippo:    { emoji: '🦛', ko: '하마',   en: 'hippo',    hp: 5, speed: 1.3, size: 28, drops: { meat: 2, leather: 1 }, region: REGION.LAKE, count: 2 },
  crab:     { emoji: '🦀', ko: '게',     en: 'crab',     hp: 3, speed: 1.5, size: 22, drops: { fish: 1 },           region: REGION.LAKE, count: 3 },
  // 🍄 어두운 늪
  spider:   { emoji: '🕷️', ko: '거미',   en: 'spider',   hp: 3, speed: 1.6, size: 24, drops: { string: 2 },        region: REGION.SWAMP, count: 4, hunts: true },
  scorpion: { emoji: '🦂', ko: '전갈',   en: 'scorpion', hp: 4, speed: 1.6, size: 24, drops: { thorn: 1 },         region: REGION.SWAMP, count: 2, hunts: true },
  ant:      { emoji: '🐜', ko: '개미',   en: 'ant',      hp: 2, speed: 2.2, size: 20, drops: { apple: 1 },         region: REGION.SWAMP, count: 3 },
  bat:      { emoji: '🦇', ko: '박쥐',   en: 'bat',      hp: 2, speed: 2.4, size: 22, drops: { leather: 1 },       region: REGION.SWAMP, count: 3 },
  // 🌼 초원 (초식동물)
  rabbit:   { emoji: '🐰', ko: '토끼',   en: 'rabbit',   hp: 2, speed: 2.6, size: 22, drops: { meat: 1 },          region: REGION.MEADOW, count: 3, calm: true, likes: 'carrot' },
  sheep:    { emoji: '🐑', ko: '양',     en: 'sheep',    hp: 3, speed: 1.8, size: 26, drops: { string: 2 },        region: REGION.MEADOW, count: 3, calm: true, likes: 'apple' },
  cow:      { emoji: '🐄', ko: '소',     en: 'cow',      hp: 4, speed: 1.5, size: 28, drops: { meat: 1, leather: 1 }, region: REGION.MEADOW, count: 2, calm: true, likes: 'apple' },
  chicken:  { emoji: '🐔', ko: '닭',     en: 'hen',      hp: 2, speed: 2.0, size: 22, drops: { meat: 1 },          region: REGION.MEADOW, count: 3, calm: true, likes: 'carrot' },
  pig:      { emoji: '🐖', ko: '돼지',   en: 'pig',      hp: 3, speed: 1.7, size: 26, drops: { meat: 2 },          region: REGION.MEADOW, count: 2, calm: true, likes: 'apple' },
  deer:     { emoji: '🦌', ko: '사슴',   en: 'deer',     hp: 3, speed: 2.6, size: 28, drops: { meat: 1, leather: 1 }, region: REGION.MEADOW, count: 2, calm: true, likes: 'apple' },
  // 🍀 2탄 클로버 들판. eats: 네잎클로버를 찾아가서 먹는다 (먹으면 세잎클로버가 된다). 먹이를 주면 따라다니며 네잎클로버를 찾아 준다
  bunny:    { emoji: '🐇', ko: '토끼',   en: 'rabbit',   hp: 2, speed: 2.0, size: 24, drops: { meat: 1 },          region: REGION.CLOVER, count: 6, calm: true, eats: true, likes: 'carrot' },
  snail:    { emoji: '🐌', ko: '달팽이', en: 'snail',    hp: 2, speed: 0.8, size: 22, drops: { stone: 1 },         region: REGION.CLOVER, count: 3, calm: true, likes: 'carrot' }, // 달팽이 껍데기 → 돌
  hedgehog: { emoji: '🦔', ko: '고슴도치', en: 'hedgehog', hp: 4, speed: 1.7, size: 24, drops: { thorn: 2 },         region: REGION.CLOVER, count: 4, hunts: true },
  snake:    { emoji: '🐍', ko: '뱀',     en: 'snake',    hp: 4, speed: 1.9, size: 26, drops: { leather: 1 },       region: REGION.CLOVER, count: 3, hunts: true },
  bee:      { emoji: '🐝', ko: '벌',     en: 'bee',      hp: 2, speed: 2.6, size: 20, drops: { honey: 1 },         region: REGION.CLOVER, count: 4 },
  // 2탄 보스: 네잎클로버를 LUCK_FOR_BOSS 개 찾으면 나온다
  eagle:    { emoji: '🦅', ko: '독수리', en: 'eagle',    hp: 12, speed: 1.6, size: 52, drops: {},                    region: REGION.CLOVER, count: 0, boss: true },
  // 🧭 3탄 절벽 미로: 어두운 미로에 사는 것들
  ghost:    { emoji: '👻', ko: '유령',   en: 'ghost',    hp: 4, speed: 1.5, size: 28, drops: { string: 1 },        region: REGION.MAZE, count: 5, hunts: true, ghost: true },
  rat:      { emoji: '🐀', ko: '쥐',     en: 'rat',      hp: 2, speed: 2.4, size: 22, drops: { carrot: 1 },        region: REGION.MAZE, count: 5, hunts: true },
  lizard:   { emoji: '🦎', ko: '도마뱀', en: 'lizard',   hp: 3, speed: 2.0, size: 24, drops: { leather: 1 },       region: REGION.MAZE, count: 4 },
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
const NET_URL = './net.js?v=28';
// 게임 버전 (index.html 의 game.js?v= 와 같게). 서버가 방 정보에 적어 두면, 더 옛 버전 기기는 새로고침해서 새 버전으로
const GAME_V = 80;

// 지금은 모두 한 방에서 논다: ▶ 를 누르면 이 방으로 (열려 있으면 들어가고, 없으면 내가 연다).
// 방 만들기 / 번호 넣기 버튼은 남겨 두되 누를 수 없게 해 둔다. null 로 바꾸면 예전처럼 방을 골라서 논다
// 주소에 ?room=1234 를 붙이면 그 방으로 (테스트할 때 노는 사람들 방에 섞이지 않게)
const ONE_ROOM = (new URLSearchParams(location.search).get('room') || '').match(/^\d{4}$/)?.[0] || '1111';

// 서버로 켜기: index.html?server=1111 (server/ 폴더의 실행 스크립트가 화면 없는 크롬으로 연다).
// 캐릭터 없이 그 채널의 세상(동물, 아이템, 보스, 바뀐 칸)을 돌리고, 사람 기기는 모두 손님으로 들어온다
const SERVER_CH = (new URLSearchParams(location.search).get('server') || '').match(/^\d{4}$/)?.[0] || null;

// 채널 기본 맵의 시드: 채널 번호마다 늘 같은 맵 (방에 세상이 없을 때만 쓴다)
function channelSeed(code) {
  let h = 2166136261;
  for (const c of `baby-craft-${code}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return h % 1e9;
}

// 이 탭에서 하던 여럿이 하기 { mode: 'host'|'guest', code }. 새로고침하면 시작 화면 없이 그 방으로 저절로 다시 간다.
// sessionStorage 라 창을 닫았다 새로 열면 지워져서 시작 화면이 나온다
const Session = {
  KEY: 'bc.session',
  get() { try { return JSON.parse(sessionStorage.getItem(this.KEY)); } catch { return null; } },
  set(v) { try { sessionStorage.setItem(this.KEY, JSON.stringify(v)); } catch { /* 저장 불가 */ } },
  clear() { try { sessionStorage.removeItem(this.KEY); } catch { /* 저장 불가 */ } },
  // 게임이 스스로 새로고침할 때만 (새 버전, 새 맵) 그 방으로 바로 다시 간다. 사람이 F5 하면 시작 화면 (같은 컴퓨터로 다른 사람이 들어올 수 있게)
  reload() {
    try { sessionStorage.setItem('bc.resume', '1'); } catch { /* 저장 불가 */ }
    location.reload();
  },
  takeResume() {
    try { const v = sessionStorage.getItem('bc.resume'); sessionStorage.removeItem('bc.resume'); return v === '1'; } catch { return false; }
  },
};

// 이 탭의 이름 / 모양 (sessionStorage: 새로고침해도 남고, 탭마다 따로). 한 기기에서 여러 탭으로 놀아도 F5 하면 그 탭 사람으로.
// 새 탭은 이 기기에서 마지막으로 쓴 것(localStorage)으로 시작
const TabStore = {
  get(key, fallback) {
    try { const v = sessionStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) { try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* 저장 불가 */ } },
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

  // ---------- 소리 나는 대로 (글자는 달라도 소리가 같으면 같게) ----------
  // 받침 대표음 (닭 → 닥, 꽃 → 꼳, 잎 → 입)
  const REP = {
    'ㄱ': 'ㄱ', 'ㄲ': 'ㄱ', 'ㅋ': 'ㄱ', 'ㄱㅅ': 'ㄱ', 'ㄹㄱ': 'ㄱ', 'ㄴ': 'ㄴ', 'ㄴㅈ': 'ㄴ', 'ㄴㅎ': 'ㄴ',
    'ㄷ': 'ㄷ', 'ㅅ': 'ㄷ', 'ㅆ': 'ㄷ', 'ㅈ': 'ㄷ', 'ㅊ': 'ㄷ', 'ㅌ': 'ㄷ', 'ㅎ': 'ㄷ',
    'ㄹ': 'ㄹ', 'ㄹㅂ': 'ㄹ', 'ㄹㅅ': 'ㄹ', 'ㄹㅌ': 'ㄹ', 'ㄹㅎ': 'ㄹ', 'ㅁ': 'ㅁ', 'ㄹㅁ': 'ㅁ',
    'ㅂ': 'ㅂ', 'ㅍ': 'ㅂ', 'ㅂㅅ': 'ㅂ', 'ㄹㅍ': 'ㅂ', 'ㅇ': 'ㅇ',
  };
  const TENSE = { 'ㄱ': 'ㄲ', 'ㄷ': 'ㄸ', 'ㅂ': 'ㅃ', 'ㅅ': 'ㅆ', 'ㅈ': 'ㅉ' };
  const ASPIRATE = { 'ㄱ': 'ㅋ', 'ㄷ': 'ㅌ', 'ㅂ': 'ㅍ', 'ㅈ': 'ㅊ', 'ㅅ': 'ㅆ' };
  const NASAL = { 'ㄱ': 'ㅇ', 'ㄷ': 'ㄴ', 'ㅂ': 'ㅁ' };
  // 한 글자 단어는 예사소리/된소리/거센소리를 하나로 본다 (아이가 "게"를 "께"처럼 말해도)
  const PLAIN = { 'ㄲ': 'ㄱ', 'ㅋ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅌ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅍ': 'ㅂ', 'ㅉ': 'ㅈ', 'ㅊ': 'ㅈ', 'ㅆ': 'ㅅ' };

  function syllable(ch) {
    const idx = ch.charCodeAt(0) - 0xAC00;
    return { c: CHO[Math.floor(idx / 588)], v: JUNG[Math.floor((idx % 588) / 28)], f: JONG[idx % 28] };
  }

  // 모음: ㅐ/ㅔ, ㅒ/ㅖ, ㅚ/ㅙ/ㅞ 는 소리가 같고, 자음 뒤 ㅖ 는 ㅔ (계 → 게), 자음 뒤 ㅢ 는 ㅣ (희 → 히)
  function vowel(c, v) {
    if (v === 'ㅐ') v = 'ㅔ';
    if (v === 'ㅒ') v = 'ㅖ';
    if (v === 'ㅗㅣ' || v === 'ㅗㅐ') v = 'ㅜㅔ';
    if (v === 'ㅖ' && c !== 'ㅇ' && c !== 'ㄹ') v = 'ㅔ';
    if (v === 'ㅡㅣ' && c !== 'ㅇ') v = 'ㅣ';
    return v;
  }

  // 한 덩어리(띄어 쓰지 않은 글자들)를 소리 나는 대로: 연음, ㅎ 탈락/거센소리, 비음화, 유음화, 된소리, 구개음화
  function pronounce(chars) {
    const syl = chars.map(syllable);
    for (let i = 0; i < syl.length; i++) {
      const s = syl[i], n = syl[i + 1];
      if (!s.f) continue;
      if (!n) { s.f = REP[s.f] || ''; continue; }
      if (n.c === 'ㅇ') {
        // 받침이 다음 글자 첫소리로 넘어간다 (복어 → 보거, 옷이 → 오시). ㅎ 은 없어진다 (좋아 → 조아)
        if (s.f === 'ㅎ') s.f = '';
        else if (s.f.length === 2) {
          const [first, second] = s.f;
          if (second === 'ㅎ') s.f = first;
          else { s.f = first; n.c = second; }
        } else if (s.f !== 'ㅇ') { n.c = s.f; s.f = ''; }
        if (n.v === 'ㅣ' && (n.c === 'ㄷ' || n.c === 'ㅌ')) n.c = n.c === 'ㄷ' ? 'ㅈ' : 'ㅊ'; // 굳이 → 구지
        continue;
      }
      // ㅎ 이 만나면 거센소리 (좋다 → 조타, 입학 → 이팍)
      if (s.f.endsWith('ㅎ') && ASPIRATE[n.c] && n.c !== 'ㅅ') { n.c = ASPIRATE[n.c]; s.f = s.f.length === 2 ? s.f[0] : ''; continue; }
      if (n.c === 'ㅎ' && (NASAL[REP[s.f]] || s.f === 'ㅈ')) { n.c = ASPIRATE[s.f === 'ㅈ' ? 'ㅈ' : REP[s.f]]; s.f = ''; continue; }
      s.f = REP[s.f] || '';
      if (NASAL[s.f] && (n.c === 'ㄴ' || n.c === 'ㅁ')) s.f = NASAL[s.f]; // 국물 → 궁물
      if (n.c === 'ㄹ') {
        if (s.f === 'ㄴ') s.f = 'ㄹ'; // 신라 → 실라
        else if (s.f !== 'ㄹ') { n.c = 'ㄴ'; if (NASAL[s.f]) s.f = NASAL[s.f]; } // 종로 → 종노
      }
      if (s.f === 'ㄹ' && n.c === 'ㄴ') n.c = 'ㄹ'; // 설날 → 설랄
      if (NASAL[s.f] && TENSE[n.c]) n.c = TENSE[n.c]; // 늑대 → 늑때
    }
    return syl.map(x => x.c + vowel(x.c, x.v) + x.f).join('');
  }

  // "나무" → "ㄴㅏㅁㅜ" (소리 나는 대로, 겹받침/이중모음도 쪼갠다)
  function toJamo(s) {
    let out = '', run = [];
    const flush = () => { if (run.length) out += pronounce(run); run = []; };
    for (const ch of s) {
      if (isHangul(ch)) run.push(ch);
      else { flush(); out += ch; }
    }
    flush();
    return out;
  }

  const plain = j => Array.from(j).map(ch => PLAIN[ch] || ch).join('');

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
    // 글자는 달라도 소리가 같다 (닥 → 닭, 계 → 게)
    if (toJamo(c) === toJamo(t)) return { score: 1, how: 'same-sound' };
    const single = Array.from(t).length === 1 && isHangul(t);
    // 한 글자 단어: 인식 결과 안에 소리가 같은 글자가 있으면 통과 ("게" → "개야")
    if (single && Array.from(c).some(ch => plain(toJamo(ch)) === plain(toJamo(t)))) return { score: 1, how: 'single-char' };
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

  return { judge, normalize, toJamo, similarity, pronounce: s => toJamo(normalize(s)) };
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
  jump() { this.tone(330, 0.16, { type: 'triangle', to: 660, vol: 0.07 }); },
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
      // 카드가 듣는 중에 안내 음성이 나오면 마이크를 잠깐 끈다 (게임 목소리를 아이 말로 듣지 않게). 음성이 끝나면 다시 켜진다
      if (Card.listener) { Card.stopListening(); Card.scheduleListen(300); }
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
    // 안내 음성이 나오는 중이면 (용을 잡자마자 "황금 나무가 생겼어요" 등) 끝난 뒤 다시
    if (Speech.speaking && this.active && !this.passed && !this.listener) { this.scheduleListen(300); return; }
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
  // 무기 / 방패는 한 번만
  owned(r) {
    const def = ITEMS[r.result];
    return Game.weapons.has(r.result) || (def && ['gear', 'wear'].includes(def.kind) && (this.has(r.result, 1) || Game.equip[def.slot] === r.result));
  },
  canMake(r) {
    return this.unlocked(r) && !this.owned(r) &&
      Object.entries(r.needs).every(([type, n]) => this.has(type, n));
  },
  // 집 위 🔨 알림은 새 무기(방패)나 옷을 만들 수 있을 때만 (블록은 자주 만들 수 있어서 알림을 띄우지 않는다)
  canMakeAny() { return RECIPES.some(r => ['weapon', 'wear'].includes(recipeGroup(r)) && this.canMake(r)); },

  // place: 위에 보이는 곳 그림 (🏠 집 / ⛺ 텐트 / ⚒️ 대장간)
  show(place = '🏠') {
    this.open = true;
    $('.craft-title').textContent = `${place} 🔨`;
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
      const owned = this.owned(r), ready = this.canMake(r), locked = !this.unlocked(r);
      // 아직 한 번도 얻지 못한 재료가 들어가면 ??? (어디서 나오는지 찾아보게)
      const secret = !owned && Object.keys(r.needs).some(t => !Game.seen.has(t));
      if (secret) {
        return `<div class="recipe secret" data-recipe="${i}">
          <div class="recipe-result"><span class="e secret-icon">${iconHtml(w)}</span><span class="n">???</span></div>
          <div class="recipe-needs">${Object.keys(r.needs).map(t => `<span class="need">${Game.seen.has(t) ? iconHtml(ITEMS[t]) : '❓'}</span>`).join('')}</div>
        </div>`;
      }
      const needs = locked
        ? `<span class="lock">👾 ${Game.kills}/${r.unlock}</span>`
        : Object.entries(r.needs).map(([type, n]) => {
          const def = ITEMS[type], have = Math.min(Game.inventory[type] || 0, n);
          return `<span class="need${have >= n ? ' ok' : ''}" title="${itemNames(def).main}">${iconHtml(def)}<b>${have}/${n}</b></span>`;
        }).join('');
      const mark = owned ? '✅' : locked ? '🔒' : ready ? '🔨' : '';
      return `<div class="recipe${owned ? ' owned' : ''}${ready ? ' ready' : ''}${locked ? ' locked' : ''}" data-recipe="${i}">
        <div class="recipe-result"><span class="e">${iconHtml(w)}</span><span class="n">${itemNames(w).main}</span>
          <span class="power">${weapon ? '⭐'.repeat(w.power) : r.count ? `x${r.count}` : ''}</span></div>
        <div class="recipe-needs">${needs}</div>
        ${mark ? `<span class="mark">${mark}</span>` : ''}
      </div>`;
    };
    const lang = Store.settings.lang === 'en';
    // sel 번호가 RECIPES 순서와 같도록 RECIPES 는 줄 순서대로 적혀 있다
    const row = (icon, title, group) => `<div class="recipe-row"><div class="recipe-group"><span>${icon}</span>${title}</div>` +
      `<div class="recipe-cards">${RECIPES.map((r, i) => (recipeGroup(r) === group ? card(r, i) : '')).join('')}</div></div>`;
    this.el.list.innerHTML = row('⚔️', lang ? 'Weapons' : '무기', 'weapon') + row('👕', lang ? 'Clothes' : '옷', 'wear') +
      row('🧱', lang ? 'Blocks' : '블록', 'block') + row('🍖', lang ? 'Food' : '음식', 'food') + row('⚗️', lang ? 'Potions' : '물약', 'potion');
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
      Game.inventory[r.result] = (Game.inventory[r.result] || 0) + (r.count || 1);  // 블록/음식/방패/옷은 가방에 (손에 든 것은 그대로, 옷은 바로 입는다)
      if (ITEMS[r.result].kind === 'wear' && !Game.equip[ITEMS[r.result].slot]) Game.wear(r.result, false); // 그 곳이 비어 있으면 바로 입는다
      // 물약은 손에 든 것이 무기면 바로 손에 (다치면 ✋ 로 마신다)
      if (ITEMS[r.result].kind === 'potion' && !Game.heldBlock && !Game.heldFood && !Game.heldPotion) Game.picked = r.result;
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
  CLOVER: 13, LUCKY: 14, // 2탄: 세잎클로버 / 네잎클로버 (지나갈 수 있다. 네잎클로버만 뽑는다)
  LOCK_TREE: 15, GOLD_TREE: 16, // 탄 사이 테두리의 잠긴 나무 → 보스를 잡으면 황금 나무 (캐면 다음 탄으로 가는 길)
  THORN: 17, // 놓아서 생기는 가시 울타리 (막고, 부딪친 사나운 동물은 따끔)
  CLIFF: 18, CHEST: 19, // 3탄: 미로 벽 절벽 (캘 수 없다) / 미로 끝 보물 상자
  STATION: 20, // 2탄 ⛺ 텐트 / 3탄 ⚒️ 대장간 제작대 (부딪치면 제작대가 열린다. 그림은 칸 위로 크게)
  SAPLING: 21, // 심은 묘목 (조금 지나면 나무로 자란다. 자라다가 사람이 끼지 않게 막는 칸)
};
const BLOCKING = new Set([TILE.TREE, TILE.WATER, TILE.ROCK, TILE.HOUSE, TILE.BRICK, TILE.TORCH, TILE.LOCK_TREE, TILE.GOLD_TREE, TILE.THORN, TILE.CLIFF, TILE.CHEST, TILE.STATION, TILE.SAPLING]);
const MONSTER_BLOCKING = new Set([...BLOCKING, TILE.GATE]); // 문은 몬스터만 막는다
const ARROW_BLOCKING = new Set([TILE.TREE, TILE.ROCK, TILE.HOUSE, TILE.BRICK, TILE.GATE, TILE.TORCH, TILE.LOCK_TREE, TILE.GOLD_TREE, TILE.CLIFF, TILE.CHEST, TILE.STATION]);
const CHUNK = 16; // 그림 조각 크기 (칸)
const MINI_COLORS = ['#7ccf6f', '#2e7d32', '#3b8de0', '#e9d68f', '#8d939b', '#f48fb1', '#c0392b', '#c0392b', '#c8a06a',
  '#b5523b', '#8d5a2b', '#a0703f', '#ffb300',
  '#5fbf4f', '#5fbf4f', '#2e7d32', '#ffd54f', '#33691e', '#5d4037', '#ffb300', '#e65100', '#66bb6a']; // 네잎클로버는 작은 지도에서 세잎클로버와 같은 색 (찾는 재미)
// 캐기: 칸 → 나오는 것, 맨손 횟수, 도구 횟수(tools 를 들었을 때), 캔 뒤 칸
const DIG = {
  [TILE.FLOWER]: { gives: ['flower'], hand: 1 },
  [TILE.TREE]: { gives: ['wood', 'wood', 'sapling'], hand: 'TREE_HITS', tool: 1, tools: ['axe'] }, // 통나무 2 + 묘목 (심으면 다시 나무)
  [TILE.ROCK]: { gives: ['stone', 'stone'], hand: 'ROCK_HITS', tool: 'ROCK_HITS_TOOL', tools: ['axe', 'sword'] },
  [TILE.SAPLING]: { gives: ['sapling'], hand: 1 },
  [TILE.BRICK]: { gives: ['brick'], hand: 'ROCK_HITS', tool: 'ROCK_HITS_TOOL', tools: ['axe', 'sword'] },
  [TILE.GATE]: { gives: ['gate'], hand: 'TREE_HITS', tool: 1, tools: ['axe'] },
  [TILE.BRIDGE]: { gives: ['bridge'], hand: 1, after: TILE.WATER },
  [TILE.TORCH]: { gives: ['torch'], hand: 1 },
  [TILE.THORN]: { gives: ['fence'], hand: 'TREE_HITS', tool: 1, tools: ['axe'] },
  [TILE.LUCKY]: { gives: ['clover'], hand: 1, after: TILE.CLOVER }, // 뽑으면 세잎클로버가 남는다
  [TILE.GOLD_TREE]: { gives: [], hand: 'TREE_HITS', tool: 1, tools: ['axe'] }, // 나오는 것 없이 길만 열린다
};
// 땅 (풀밭, 모래, 물, 흙 길): 움직일 수 없다. 캐지도 못하고 아이템도 안 나온다. 블록은 풀밭/모래 위에만 놓는다
const PLACE_ON = new Set([TILE.GRASS, TILE.SAND]);
const LAND = new Set([TILE.GRASS, TILE.SAND, TILE.WATER, TILE.PATH]);
// 땅이 바뀐 칸은 원래 맵대로 되돌린다 (땅을 캐고 놓던 때 바뀐 칸: 흙 자국, 옮긴 물/모래/풀)
function fixLand(i, v) {
  const base = World.base[i];
  if (v === base || !LAND.has(v)) return v;
  if (v === TILE.GRASS && !LAND.has(base)) return v; // 나무/바위/꽃을 캔 자리 (원래대로 풀밭)
  return LAND.has(base) ? base : TILE.GRASS;
}
// 손에 들 수 있는 것: 무기 또는 놓을 수 있는 블록
// 아래 주머니 4칸: 손에 들 것을 종류마다 한 칸 (1~4 키)
const POUCH = [
  { key: 'weapon', icon: '⚔️', ko: '무기', en: 'Weapons' },
  { key: 'block',  icon: '🧱', ko: '블록', en: 'Blocks' },
  { key: 'food',   icon: '🍎', ko: '음식', en: 'Food' },
  { key: 'potion', icon: '⚗️', ko: '물약', en: 'Potions' },
];
// 어느 주머니 칸에 들어가는지 (손에 들 수 없으면 null)
const pouchOf = id => WEAPONS[id] ? 'weapon' : !ITEMS[id] ? null : ITEMS[id].tile ? 'block' : ['food', 'potion'].includes(ITEMS[id].kind) ? ITEMS[id].kind : null;

// 가방에서 아이템을 누르면 나오는 한 줄 설명
function itemDesc(id) {
  const d = WEAPONS[id] || ITEMS[id];
  if (WEAPONS[id]) return tr(`힘 ${'⭐'.repeat(d.power)} · 손에 들고 ✋ 로 휘둘러요`, `Power ${'⭐'.repeat(d.power)} · Hold it and press ✋`);
  if (d.tile) return id === 'sapling' ? tr('땅에 심으면 나무로 자라요', 'Plant it and it grows into a tree')
    : tr('손에 들고 ✋ 로 앞에 놓아요', 'Hold it and press ✋ to place it');
  if (d.kind === 'food') {
    const fans = [...new Set(Object.values(MONSTERS).filter(m => m.likes === id).map(m => m.emoji))].join('');
    const who = id === 'cake' ? tr(' · 모든 동물이 좋아해요', ' · Every animal loves it') : fans ? tr(` · 좋아하는 동물 ${fans}`, ` · Loved by ${fans}`) : '';
    return tr(`먹으면 ❤️ +${d.heal}`, `Eat: ❤️ +${d.heal}`) + who;
  }
  if (d.kind === 'potion') {
    if (d.heal) return tr(`마시면 ❤️ +${d.heal}`, `Drink: ❤️ +${d.heal}`);
    if (d.speed) return tr(`마시면 ${d.speed}초 동안 빨리 달려요 🏃`, `Drink: run fast for ${d.speed}s 🏃`);
    return tr(`마시면 ${d.light}초 동안 어두운 곳이 밝아요 💡`, `Drink: bright for ${d.light}s 💡`);
  }
  if (d.kind === 'wear') return tr('입으면 캐릭터에 보여요', 'Wear it to show on your character');
  if (d.kind === 'gear') return tr('가방에 있으면 두 번에 한 번 막아 줘요', 'Blocks every other hit while in your bag');
  return tr('제작대에서 만들 때 써요', 'Used at the crafting table');
}

const holdable = id => !!WEAPONS[id] || !!(ITEMS[id] && (ITEMS[id].tile || ['food', 'potion'].includes(ITEMS[id].kind)));
// 옷 입는 곳 (Q 고르는 칸 맨 위 줄). 입은 옷은 가방에서 빠지고, 벗으면 가방으로 돌아간다
const WEAR_SLOTS = [
  { slot: 'head', ko: '머리', en: 'Head' },
  { slot: 'body', ko: '몸통', en: 'Body' },
  { slot: 'feet', ko: '다리', en: 'Legs' },
];
// 입은 옷 id 목록 (그림 / 다른 사람에게 보내기)
const wornList = equip => WEAR_SLOTS.map(w => equip[w.slot]).filter(id => ITEMS[id] && ITEMS[id].kind === 'wear');
const holdEmoji = id => (WEAPONS[id] || ITEMS[id] || WEAPONS.hand).emoji;

// 맞는 이모지가 없는 재료의 픽셀 그림 (8x8 칸, 글자 하나 = 한 칸 색)
const PIXEL_ICONS = {
  // 가죽: 펼친 짐승 가죽 (가장자리 바느질 점)
  LEATHER: { rows: ['.dd..dd.', 'dmmmmmmd', '.mlmmsm.', '.mmmmmm.', '.msmmlm.', '.mmmmmm.', 'dmmmmmmd', '.dd..dd.'],
    colors: { d: '#6d4321', m: '#a8723f', l: '#c8935a', s: '#e6c08a' } },
  // 가시: 끝이 하얀 뾰족한 가시 묶음
  THORN: { rows: ['....w...', '...wd...', '.w.dd..w', '.wddd.wd', 'wdddd.dd', 'dddddddd', '.bbbbbb.', '........'],
    colors: { w: '#f5f5f5', d: '#8d6e63', b: '#5d4037' } },
  // 물약: 코르크 마개 + 유리병 (물약마다 색)
  POTION_R: potionIcon('#e53935', '#ff8a80'),
  POTION_B: potionIcon('#1e88e5', '#90caf9'),
  POTION_Y: potionIcon('#fdd835', '#fff9c4'),
  // 재료
  LOG: { rows: ['........', '.kkbbbbb', 'kyykbbbd', 'kyrykbbd', 'kyykbbbd', '.kkbbbbb', '..dddddd', '........'],
    colors: { k: '#6d4c41', y: '#e6c08a', r: '#a1887f', b: '#8d5a2b', d: '#5d3a1a' } },
  STONE: { rows: ['........', '..ggg...', '.glggg..', 'gllgggg.', 'ggggggdg', '.gggddd.', '..dddd..', '........'],
    colors: { l: '#e0e0e0', g: '#9e9e9e', d: '#616161' } },
  SPOOL: { rows: ['.bbbbbb.', '..wwww..', '.wwwwww.', '.wlwwlw.', '.wwwwww.', '..wwww..', '.bbbbbb.', '........'],
    colors: { b: '#8d6e63', w: '#f5f5f5', l: '#bdbdbd' } },
  GEM: { rows: ['........', '.cccccc.', 'cllcccdc', '.cllccd.', '..cccd..', '...cd...', '........', '........'],
    colors: { l: '#e1f5fe', c: '#4fc3f7', d: '#0277bd' } },
  // 음식
  APPLE: { rows: ['....s...', '..rrsll.', '.rrrrrr.', 'rwrrrrrr', 'rrrrrrrr', 'rrrrrrrd', '.rrrrrd.', '..rr.r..'],
    colors: { s: '#6d4c41', l: '#43a047', w: '#ffcdd2', r: '#e53935', d: '#b71c1c' } },
  CARROT: { rows: ['.....g.g', '....gggg', '....oog.', '...oooo.', '..oolo..', '.oooo...', '.oo.....', 'o.......'],
    colors: { g: '#43a047', o: '#fb8c00', l: '#ffcc80' } },
  MEAT: { rows: ['........', '...mmmm.', '..mmmmmm', '..mlmmmm', '..mmmmmd', '.wbmmmd.', 'ww.bb...', 'w.......'],
    colors: { m: '#b5651d', l: '#e0a060', d: '#7b3f10', b: '#8d6e63', w: '#fafafa' } },
  FISH: { rows: ['........', '........', '.bbbb..b', 'bwbbbbbb', 'bblllbbb', '.bbbb..b', '........', '........'],
    colors: { b: '#42a5f5', l: '#bbdefb', w: '#0d47a1' } },
  HONEY: { rows: ['..bbbb..', '.yyyyyy.', '.ylyyyy.', '.yyyyyy.', '.yybbyy.', '.yyyyyy.', '..yyyy..', '........'],
    colors: { b: '#8d6e63', y: '#ffb300', l: '#ffe082' } },
  CAKE: { rows: ['...r....', '...w....', '.pppppp.', '.wwwwww.', '.pppppp.', '.yyyyyy.', '.yyyyyy.', '........'],
    colors: { r: '#e53935', w: '#fafafa', p: '#f48fb1', y: '#ffe0b2' } },
  // 무기 / 방패 / 왕관
  AXE: { rows: ['....ggg.', '...gggll', '...ggggl', '....bgg.', '...bb...', '..bb....', '.bb.....', 'bb......'],
    colors: { g: '#90a4ae', l: '#eceff1', b: '#8d5a2b' } },
  SWORD: { rows: ['......ww', '.....wwg', '....wwg.', '...wwg..', 'hhwwg...', '.hhg....', '.bhh....', 'b..h....'],
    colors: { w: '#eceff1', g: '#90a4ae', h: '#fbc02d', b: '#6d4c41' } },
  BOW: { rows: ['..bb.s..', '.b...s..', 'b....s..', 'b.aaaaaw', 'b....s..', '.b...s..', '..bb.s..', '........'],
    colors: { b: '#8d5a2b', s: '#eeeeee', a: '#a1887f', w: '#90a4ae' } },
  SHIELD: { rows: ['.bbbbbb.', 'bwwyywwb', 'bwwyywwb', 'byyyyyyb', 'bwwyywwb', '.bwyywb.', '..bwwb..', '...bb...'],
    colors: { b: '#5d4037', w: '#a8723f', y: '#ffca28' } },
  CROWN: { rows: ['........', 'y..yy..y', 'yy.yy.yy', 'yyyyyyyy', 'yryybyry', 'yyyyyyyy', '........', '........'],
    colors: { y: '#fdd835', r: '#e53935', b: '#1e88e5' } },
  // 옷
  HAT: { rows: ['........', '..dddd..', '.dmmmmd.', '.mmmmmm.', '.bbbbbb.', 'dmmmmmmd', 'dddddddd', '........'],
    colors: { d: '#6d4321', m: '#a8723f', b: '#4e342e' } },
  VEST: { rows: ['.mm..mm.', 'mmm..mmm', 'mmmllmmm', 'mmmllmmm', 'mmmllmmm', 'mmmllmmm', 'mmmmmmmm', '.dddddd.'],
    colors: { d: '#6d4321', m: '#a8723f', l: '#e6c08a' } },
  BOOTS: { rows: ['........', '.mm..mm.', '.mm..mm.', '.ll..ll.', '.mm..mm.', 'mmm.mmm.', 'ddd.ddd.', '........'],
    colors: { d: '#4e342e', m: '#8d5a2b', l: '#e6c08a' } },
  CAPE: { rows: ['.yyyyyy.', 'rrrrrrrr', 'rrrrrrrr', 'rrrrrrrr', '.rrrrrd.', '.rrrrrd.', '..rrdd..', '........'],
    colors: { y: '#fdd835', r: '#d32f2f', d: '#9a1b1b' } },
  WREATH: { rows: ['........', '..gpgy..', '.g....g.', 'p......y', 'g......g', '.y....p.', '..gpgg..', '........'],
    colors: { g: '#43a047', p: '#f06292', y: '#fdd835' } },
};
function potionIcon(liquid, light) {
  return { rows: ['...cc...', '...ww...', '..wllw..', '.wlhllw.', '.wllllw.', '.wllllw.', '..wwww..', '........'],
    colors: { c: '#8d6e63', w: '#b3e5fc', l: liquid, h: light } };
}

// 맵 칸 그림 한 칸짜리 (블록 아이템 그림, 네잎클로버) 또는 픽셀 그림 (PIXEL_ICONS). 한 번 그려서 저장
const tileIcons = {};
function tileIcon(name) {
  if (!tileIcons[name]) {
    const c = document.createElement('canvas');
    c.width = c.height = T;
    const g = c.getContext('2d'), pix = PIXEL_ICONS[name];
    if (pix) {
      pix.rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (pix.colors[ch]) { g.fillStyle = pix.colors[ch]; g.fillRect(x * P, y * P, P, P); }
      }));
    } else World.drawTile(g, 0, 0, TILE[name]);
    tileIcons[name] = { canvas: c, url: c.toDataURL() };
  }
  return tileIcons[name];
}

// 화면(HTML)에 쓰는 아이템 그림: 블록은 맵 칸 그림, icon 이 있으면 그 그림, 나머지는 이모지
function iconHtml(def) {
  if (def.tile || def.icon) return `<img class="tile-icon" src="${tileIcon(def.tile || def.icon).url}" alt="">`;
  return def.fix ? `<span class="emo-${def.fix}">${def.emoji}</span>` : def.emoji;
}

const World = {
  recent: [], // 최근에 바뀐 칸 { i, from, to, at, mine } (🤝 놀아주기가 본다)
  mine: new Map(), // 내가 바꾸려고 한 칸 → 시각
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

  // 탄(스테이지)마다 STAGE_W 칸씩 오른쪽으로 이어 붙인다. 1탄은 예전 맵 그대로 (같은 시드면 같은 맵, 저장해 둔 바뀐 칸도 그대로).
  // 탄 사이 테두리 나무 한 줄 가운데 하나가 🔒 잠긴 나무: 그 탄의 보스를 잡으면 ✨ 황금 나무가 되어 캘 수 있다
  // 3탄은 2탄 아래에 붙인다 (맵이 아래로 길어져도 칸 번호 = y * W + x 라서 1탄/2탄의 바뀐 칸은 그대로)
  build() {
    const SW = CONFIG.STAGE_W, SH = CONFIG.STAGE_H;
    this.h = CONFIG.MAP_H;
    const W = this.w = CONFIG.MAP_W; // 칸 번호 = y * W + x (모든 탄을 합친 넓이)
    const t = this.tiles = new Uint8Array(W * this.h);
    this.buildStage1(t, W, SH, SW);
    this.buildStage2(t, W, SH, SW);
    this.buildStage3(t, W, SH, SW);
    this.buildStations(t, W);
    this.base = t.slice();
    this.edited();
  },

  // 1탄: 🌲 숲 / 🏞️ 호수 / 🍄 늪 / 🌼 초원, 가운데 집 (예전 맵. 난수를 쓰는 순서도 그대로여야 같은 맵이 나온다)
  buildStage1(t, W, H, SW) {
    const set = (x, y, v) => { if (x >= 0 && y >= 0 && x < SW && y < H) t[y * W + x] = v; };

    const blob = (type, cx, cy, rx, ry) => {
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) {
        for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
          if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + rng() * 0.3) set(x, y, type);
        }
      }
    };

    // 네 구역: 가운데 십자 경계를 구불구불하게 (왼쪽 위 숲, 오른쪽 위 호수, 왼쪽 아래 늪, 오른쪽 아래 초원)
    const ph = Array.from({ length: 4 }, () => randFloat(0, Math.PI * 2));
    const midX = y => SW / 2 + Math.sin(y * 0.09 + ph[0]) * 4 + Math.sin(y * 0.23 + ph[1]) * 2;
    const midY = x => H / 2 + Math.sin(x * 0.08 + ph[2]) * 4 + Math.sin(x * 0.21 + ph[3]) * 2;
    const reg = this.regions = new Uint8Array(W * this.h);
    for (let y = 0; y < H; y++) for (let x = 0; x < SW; x++) reg[y * W + x] = (x >= midX(y) ? 1 : 0) + (y >= midY(x) ? 2 : 0);
    this.regionCenters = [[SW / 4, H / 4], [SW * 3 / 4, H / 4], [SW / 4, H * 3 / 4], [SW * 3 / 4, H * 3 / 4]]
      .map(([x, y]) => ({ x: Math.floor(x), y: Math.floor(y) }));
    // 그 구역 안의 아무 칸 (가장자리 2칸은 빼고)
    const pointIn = r => {
      for (let i = 0; i < 200; i++) {
        const x = randInt(2, SW - 3), y = randInt(2, H - 3);
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
      if (Math.hypot(x - SW / 2, y - H / 2) < 12) continue; // 집 앞은 비운다
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
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < SW; x++) {
        const i = y * W + x;
        if (t[i] === TILE.GRASS && rng() < flowers[reg[i]]) t[i] = TILE.FLOWER;
      }
    }

    // 집에서 구역마다 가운데까지 구불구불한 숲길 (나무/바위만 치운다. 동물을 찾아가기 쉽게)
    for (const c of this.regionCenters) {
      const wob = randFloat(0, Math.PI * 2);
      for (let s = 0; s <= 1; s += 0.01) {
        const x = Math.round(SW / 2 + (c.x - SW / 2) * s + Math.sin(s * 9 + wob) * 3);
        const y = Math.round(H / 2 + (c.y - H / 2) * s + Math.cos(s * 7 + wob) * 3);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const i = (y + dy) * W + x + dx;
          if (t[i] === TILE.TREE || t[i] === TILE.ROCK) t[i] = TILE.GRASS;
        }
      }
    }

    // 테두리 나무
    for (let x = 0; x < SW; x++) { set(x, 0, TILE.TREE); set(x, H - 1, TILE.TREE); }
    for (let y = 0; y < H; y++) { set(0, y, TILE.TREE); set(SW - 1, y, TILE.TREE); }

    // 집 (가운데, 3x3) + 문 + 길
    const hx = Math.floor(SW / 2) - 1, hy = Math.floor(H / 2) - 2;
    for (let y = hy - 3; y <= hy + 6; y++) for (let x = hx - 4; x <= hx + 6; x++) set(x, y, TILE.GRASS);
    for (let y = hy; y < hy + 3; y++) for (let x = hx; x < hx + 3; x++) set(x, y, TILE.HOUSE);
    set(hx + 1, hy + 2, TILE.DOOR);
    for (let y = hy + 3; y <= hy + 5; y++) set(hx + 1, y, TILE.PATH);
    this.house = { x: hx, y: hy };
    this.door = { x: hx + 1, y: hy + 2 };
    this.spawn = { x: (hx + 1) * T + T / 2, y: (hy + 4) * T + T / 2 };
  },

  // 2탄 🍀 클로버 들판: 1탄 오른쪽. 들판 곳곳 클로버밭 사이에 네잎클로버가 숨어 있다.
  // 1탄 오른쪽 테두리 가운데쯤 ✨ 황금 나무 하나 (처음부터 캘 수 있다), 거기서 들판 가운데까지 길
  buildStage2(t, W, H, SW) {
    const X0 = SW, X1 = 2 * SW; // 2탄 칸: X0 ~ X1-1 (왼쪽 테두리는 1탄의 오른쪽 테두리 X0-1)
    const set = (x, y, v) => { if (x >= X0 && y >= 0 && x < X1 && y < H) t[y * W + x] = v; };
    const get = (x, y) => t[y * W + x];
    for (let y = 0; y < H; y++) for (let x = X0; x < X1; x++) this.regions[y * W + x] = REGION.CLOVER;
    this.regionCenters[REGION.CLOVER] = { x: X0 + SW / 2, y: Math.floor(H / 2) };
    const blob = (type, cx, cy, rx, ry) => {
      for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) {
        for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
          if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + rng() * 0.3) set(x, y, type);
        }
      }
    };
    const point = () => ({ x: randInt(X0 + 3, X1 - 4), y: randInt(3, H - 4) });

    // 연못 몇 개, 나무숲 조금, 바위 조금, 꽃, 그리고 클로버밭 가득
    for (let i = 0; i < 5; i++) {
      const p = point(), rx = randFloat(2.5, 5), ry = randFloat(2, 4);
      blob(TILE.SAND, p.x, p.y, rx + 1.2, ry + 1.2);
      blob(TILE.WATER, p.x, p.y, rx, ry);
    }
    for (let i = 0; i < 22; i++) { const p = point(); blob(TILE.TREE, p.x, p.y, randFloat(0.8, 2.6), randFloat(0.8, 2.6)); }
    for (let i = 0; i < 8; i++) { const p = point(); blob(TILE.ROCK, p.x, p.y, randFloat(0.5, 1.4), randFloat(0.5, 1.4)); }
    for (let i = 0; i < 70; i++) {
      const p = point(), rx = randFloat(1.5, 4.5), ry = randFloat(1.2, 3.5);
      for (let y = Math.floor(p.y - ry - 1); y <= p.y + ry + 1; y++) {
        for (let x = Math.floor(p.x - rx - 1); x <= p.x + rx + 1; x++) {
          if (x < X0 || x >= X1 || y < 0 || y >= H || get(x, y) !== TILE.GRASS) continue;
          if (((x - p.x) / rx) ** 2 + ((y - p.y) / ry) ** 2 <= 1 + rng() * 0.3) set(x, y, TILE.CLOVER);
        }
      }
    }
    for (let y = 0; y < H; y++) for (let x = X0; x < X1; x++) if (get(x, y) === TILE.GRASS && rng() < 0.05) set(x, y, TILE.FLOWER);

    // 1탄 → 2탄 문: 1탄 오른쪽 테두리 가운데쯤, 1탄 쪽에 물이 없는 줄
    let gy = Math.floor(H / 2), best = Infinity;
    for (let y = Math.floor(H / 2) - 10; y <= Math.floor(H / 2) + 10; y++) {
      let bad = Math.abs(y - H / 2) * 0.1;
      for (let x = X0 - 14; x < X0 - 1; x++) for (let dy = -1; dy <= 1; dy++) if (t[(y + dy) * W + x] === TILE.WATER || t[(y + dy) * W + x] === TILE.HOUSE) bad += 10;
      if (bad < best) { best = bad; gy = y; }
    }
    // 길: 1탄 안쪽에서 문까지, 문에서 2탄 들판 가운데까지 (나무/바위만 치운다, 물은 다리로)
    const clear = (x, y) => {
      if (x <= 0 || y <= 0 || y >= H - 1 || x === X0 - 1 || x >= X1 - 1) return;
      const i = y * W + x;
      if (t[i] === TILE.TREE || t[i] === TILE.ROCK) t[i] = TILE.GRASS;
      else if (t[i] === TILE.WATER) t[i] = TILE.BRIDGE;
    };
    for (let x = X0 - 14; x < X0 - 1; x++) for (let dy = -1; dy <= 1; dy++) clear(x, gy + dy);
    const c = this.regionCenters[REGION.CLOVER], wob = randFloat(0, Math.PI * 2);
    for (let s = 0; s <= 1; s += 0.005) {
      const x = Math.round(X0 + (c.x - X0) * s), y = Math.round(gy + (c.y - gy) * s + Math.sin(s * 8 + wob) * 4 * Math.min(1, s * 4));
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) clear(x + dx, y + dy);
    }
    // 보스를 안 잡아도 넘어갈 수 있게 처음부터 ✨ 황금 나무 (캐면 길이 열린다)
    t[gy * W + X0 - 1] = TILE.GOLD_TREE;
    this.stageGates = [{ x: X0 - 1, y: gy }];

    // 테두리 나무 (위, 아래, 오른쪽)
    for (let x = X0; x < X1; x++) { set(x, 0, TILE.TREE); set(x, H - 1, TILE.TREE); }
    for (let y = 0; y < H; y++) set(X1 - 1, y, TILE.TREE);

    // 네잎클로버: 클로버밭 칸 가운데 몇 개 (뽑거나 토끼가 먹으면 다른 클로버 칸에 다시 난다)
    this.cloverTiles = [];
    for (let y = 0; y < H; y++) for (let x = X0; x < X1; x++) if (get(x, y) === TILE.CLOVER) this.cloverTiles.push(y * W + x);
    for (let k = 0; k < CONFIG.LUCKY_COUNT && this.cloverTiles.length; k++) {
      t[this.cloverTiles[Math.floor(rng() * this.cloverTiles.length)]] = TILE.LUCKY;
    }

    // 2탄 → 3탄 문: 아래 테두리 가운데 ✨ 황금 나무 (처음부터 캘 수 있다), 들판 가운데에서 거기까지 길
    // (위의 맵은 그대로 두려고 맨 끝에서 만든다: 난수 순서가 바뀌면 이미 바뀐 칸들과 맵이 어긋난다)
    const bx = X0 + Math.floor(SW / 2), wob2 = randFloat(0, Math.PI * 2);
    for (let s = 0; s <= 1; s += 0.005) {
      const x = Math.round(c.x + (bx - c.x) * s + Math.sin(s * 7 + wob2) * 3 * Math.min(1, (1 - s) * 4)), y = Math.round(c.y + (H - 2 - c.y) * s);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) clear(x + dx, y + dy);
    }
    t[(H - 1) * W + bx] = TILE.GOLD_TREE;
    this.stageGates.push({ x: bx, y: H - 1 });
  },

  // 3탄 🧭 절벽 미로: 2탄 아래 (2탄 아래 테두리의 황금 나무가 입구). 벽은 캘 수 없는 절벽, 길은 3칸 너비.
  // 고리가 없는 미로라서 한쪽 벽(오른쪽 벽)만 손으로 짚고 따라가면 언젠가는 끝의 🎁 보물 상자에 닿는다
  buildStage3(t, W, SH, SW) {
    const X0 = SW, X1 = 2 * SW, Y0 = SH, Y1 = this.h; // 3탄 칸: X0 ~ X1-1, Y0 ~ Y1-1 (위 테두리는 2탄 아래 테두리 Y0-1)
    for (let y = Y0; y < Y1; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        // 1탄 아래 (아무도 못 가는 곳)는 숲, 3탄은 절벽으로 채운 다음 길을 판다
        if (x < X0) { t[i] = TILE.TREE; this.regions[i] = REGION.FOREST; } else { t[i] = TILE.CLIFF; this.regions[i] = REGION.MAZE; }
      }
    }
    // 방 한 칸 = 길 3x3 + 벽 1줄. 벽 줄: x = MX + 4k, y = Y0 - 1 + 4k (맨 위 벽은 2탄 아래 테두리 나무)
    const MX = X0 + 1, CW = Math.floor((X1 - MX - 1) / 4), CH = Math.floor((Y1 - Y0) / 4);
    const open = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) t[y * W + x] = TILE.GRASS; };
    const cellX = c => MX + 4 * c + 1, cellY = r => Y0 + 4 * r;
    // 입구: 2탄 → 3탄 황금 나무 바로 아래 방
    const gate = this.stageGates[1], c0 = Math.floor((gate.x - MX) / 4), seen = new Uint8Array(CW * CH);
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    // 길 파기: 이미 판 방 둘레의 벽 중 아무거나 하나씩 튼다 (갈림길과 짧은 막다른 길이 많고, 진짜 길은 너무 길지 않다)
    const edges = [];
    const add = (c, r) => {
      seen[r * CW + c] = 1;
      open(cellX(c), cellY(r), 3, 3);
      for (const [dx, dy] of dirs) {
        const nc = c + dx, nr = r + dy;
        if (nc >= 0 && nr >= 0 && nc < CW && nr < CH && !seen[nr * CW + nc]) edges.push([c, r, nc, nr]);
      }
    };
    add(c0, 0);
    while (edges.length) {
      const k = Math.floor(rng() * edges.length), [c, r, nc, nr] = edges[k];
      edges[k] = edges[edges.length - 1];
      edges.pop();
      if (seen[nr * CW + nc]) continue;
      // 두 방 사이 벽을 튼다
      if (nc !== c) open(cellX(Math.max(c, nc)) - 1, cellY(r), 1, 3);
      else open(cellX(c), cellY(Math.max(r, nr)) - 1, 3, 1);
      add(nc, nr);
    }
    // 보물 상자: 입구에서 가장 먼 방 (막다른 방) 가운데
    const dist = new Int32Array(CW * CH).fill(-1), q = [[c0, 0]];
    dist[c0] = 0;
    let far = [c0, 0];
    for (let qi = 0; qi < q.length; qi++) {
      const [c, r] = q[qi];
      if (dist[r * CW + c] > dist[far[1] * CW + far[0]]) far = [c, r];
      for (const [dx, dy] of dirs) {
        const nc = c + dx, nr = r + dy;
        if (nc < 0 || nr < 0 || nc >= CW || nr >= CH || dist[nr * CW + nc] >= 0) continue;
        // 벽이 트였는지: 두 방 사이 벽 칸 가운데가 길이면
        const wx = dx ? cellX(Math.max(c, nc)) - 1 : cellX(c) + 1, wy = dy ? cellY(Math.max(r, nr)) - 1 : cellY(r) + 1;
        if (t[wy * W + wx] !== TILE.GRASS) continue;
        dist[nr * CW + nc] = dist[r * CW + c] + 1;
        q.push([nc, nr]);
      }
    }
    this.mazeGoal = { x: cellX(far[0]) + 1, y: cellY(far[1]) + 1 };
    t[this.mazeGoal.y * W + this.mazeGoal.x] = TILE.CHEST;
    this.mazeStart = { x: gate.x, y: Y0 + 1 }; // 보물을 찾으면 여기(입구)로 돌아온다
    this.mazeForge = { x: cellX(c0), y: cellY(0) }; // 입구 방 왼쪽 위 구석 (벽에 붙어 있어서 오른쪽 벽 따라가기를 막지 않는다)
  },

  // 탄마다 제작대 하나 (1탄은 집 안): 2탄 ⛺ 클로버 텐트 (들판 가운데 길 옆), 3탄 ⚒️ 대장간 (미로 입구 방 구석).
  // 난수를 쓰지 않는다 (맵 만들기 맨 끝)
  buildStations(t, W) {
    const c = this.regionCenters[REGION.CLOVER], ok = (x, y) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const v = t[(y + dy) * W + x + dx];
        if (BLOCKING.has(v) || v === TILE.LUCKY || v === TILE.BRIDGE) return false;
      }
      return t[y * W + x] === TILE.GRASS;
    };
    let tent = null;
    for (let r = 0; r <= 10 && !tent; r++) {
      for (let dy = -r; dy <= r && !tent; dy++) for (let dx = -r; dx <= r && !tent; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) === r && ok(c.x + 3 + dx, c.y - 2 + dy)) tent = { x: c.x + 3 + dx, y: c.y - 2 + dy };
      }
    }
    this.stations = [];
    for (const [at, kind] of [[tent, 'tent'], [this.mazeForge, 'forge']]) {
      if (!at) continue;
      t[at.y * W + at.x] = TILE.STATION;
      this.stations.push({ ...at, kind });
    }
  },

  // 몇 탄인지 (0 = 1탄, 1 = 2탄 (1탄 오른쪽), 2 = 3탄 (2탄 아래))
  stageAt(tx, ty) {
    if (ty >= CONFIG.STAGE_H) return 2;
    return clamp(Math.floor(tx / CONFIG.STAGE_W), 0, Math.ceil(this.w / CONFIG.STAGE_W) - 1);
  },
  stageAtPx(x, y) { return this.stageAt(Math.floor(x / T), Math.floor(y / T)); },
  // 작은 지도에 보여 줄 그 탄의 칸 범위 (2탄은 왼쪽 테두리, 3탄은 위 테두리도 같이 보여서 네 테두리가 다 보인다)
  stageRect(st) {
    const SW = CONFIG.STAGE_W, SH = CONFIG.STAGE_H;
    if (st === 2) return { x: SW, y: SH - 1, w: SW, h: this.h - SH + 1 };
    return { x: st * SW - (st ? 1 : 0), y: 0, w: SW + (st ? 1 : 0), h: SH };
  },

  // 바뀐 칸만 (base 와 다른 칸): 저장/방에 올리기용 { 칸 번호: 값 }
  edits() {
    const out = {};
    for (let i = 0; i < this.tiles.length; i++) if (this.tiles[i] !== this.base[i]) out[i] = this.tiles[i];
    return out;
  },

  // 예전 넓이(oldW)로 저장한 칸 번호 → 지금 넓이 칸 번호 (탄이 늘어 맵이 넓어져도 1탄의 바뀐 칸은 같은 자리에)
  remapEdits(edits, oldW) {
    if (!edits || oldW === this.w) return edits;
    const out = {};
    for (const [k, v] of Object.entries(edits)) {
      const i = Number(k), x = i % oldW, y = Math.floor(i / oldW);
      if (x < this.w && y < this.h) out[y * this.w + x] = v;
    }
    return out;
  },

  // 저장해 둔 바뀐 칸을 한 번에 (칸마다 setTile 하면 느리다)
  applyEdits(edits) {
    for (const [k, v] of Object.entries(edits || {})) {
      const i = Number(k);
      if (i >= 0 && i < this.tiles.length && Number.isInteger(v) && MINI_COLORS[v]) this.tiles[i] = fixLand(i, v);
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
    // ⚒️ 대장간 불도 어두운 미로를 밝힌다
    for (const st of this.stations || []) if (st.kind === 'forge' && this.tile(st.x, st.y) === TILE.STATION) this.torches.push({ x: st.x * T + T / 2, y: st.y * T + T / 2 });
  },
  // 그 탄의 제작대 (그 칸이 그대로일 때만)
  stationIn(stage) { return (this.stations || []).find(st => this.stageAt(st.x, st.y) === stage && this.tile(st.x, st.y) === TILE.STATION); },

  // 맵 한 칸이 바뀜 (캐기/놓기, 다른 사람이 바꾼 것 포함): 그 칸의 그림, 작은 지도, 갈 수 있는 곳을 새로
  setTile(i, v) {
    if (!(i >= 0 && i < this.tiles.length) || !Number.isInteger(v) || this.tiles[i] === v) return;
    const now = performance.now();
    this.recent.push({ i, from: this.tiles[i], to: v, at: now, mine: now - (this.mine.get(i) || -1e9) < 5000 });
    if (this.recent.length > 40) this.recent.shift();
    this.tiles[i] = v;
    const x = i % this.w, y = Math.floor(i / this.w);
    this.chunks.delete(`${Math.floor(x / CHUNK)},${Math.floor(y / CHUNK)}`);
    this.miniPixel(x, y);
    this.floodFill(this.door.x, this.door.y + 2);
    this.findTorches();
    Items.computeSpots();
    if (v === TILE.GOLD_TREE) Game.onGateGold(x, y);
    if (this.recent[this.recent.length - 1].from === TILE.GOLD_TREE) Game.onGateOpen(x, y);
  },

  // 캘 수 있는 칸 (맵 테두리 나무는 안 된다)
  diggable(tx, ty) {
    if (tx <= 0 || ty <= 0 || tx >= this.w - 1 || ty >= this.h - 1) return false;
    if (tx % CONFIG.STAGE_W === CONFIG.STAGE_W - 1 && this.tile(tx, ty) !== TILE.GOLD_TREE) return false; // 탄 사이 테두리
    if (ty === CONFIG.STAGE_H - 1 && this.tile(tx, ty) !== TILE.GOLD_TREE) return false; // 2탄과 3탄 사이 (1탄 아래) 테두리
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
    const own = { [TILE.GRASS]: gr.grass[0], [TILE.FLOWER]: gr.grass[2], [TILE.TREE]: gr.leaf[0], [TILE.LOCK_TREE]: gr.leaf[0], [TILE.WATER]: gr.water[0], [TILE.SAND]: gr.sand[0] }[tt];
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
      case TILE.LOCK_TREE: // 잠긴 나무는 다른 테두리 나무와 똑같이 보인다
      case TILE.GOLD_TREE: {
        const leaf = type === TILE.GOLD_TREE ? ['#f9a825', '#ffd54f', '#fff59d'] : gr.leaf;
        grass();
        px(3, 5, '#795548', 2, 3);
        px(1, 0, leaf[0], 6, 5);
        px(0, 1, leaf[0], 8, 3);
        for (let i = 0; i < 5; i++) px(1 + Math.floor(hash(x, y, 20 + i) * 6), Math.floor(hash(x, y, 30 + i) * 4) + 1, leaf[1]);
        px(2, 1, leaf[2]);
        if (type === TILE.GOLD_TREE) { px(6, 0, '#fff'); px(1, 3, '#fff'); px(5, 3, '#fffde7'); }
        if (type === TILE.LOCK_TREE) {
          // 자물쇠 (용을 잡으면 열린다): 회색 고리 + 노란 몸통 + 열쇠 구멍
          px(2.5, 3, '#424242', 3, 0.5); px(2.5, 3, '#424242', 0.5, 2); px(5, 3, '#424242', 0.5, 2);
          px(2, 4.5, '#5d4037', 4, 3.5); px(2.5, 5, '#fbc02d', 3, 2.5); px(2.5, 5, '#fff59d', 3, 0.5);
          px(3.75, 5.75, '#3e2723', 0.5, 1.25);
        }
        break;
      }
      case TILE.CLOVER:
      case TILE.LUCKY: {
        // 클로버밭: 풀 위에 작은 세잎이 깔리고, 가운데 큰 클로버 하나 (세잎 ♣ / 네잎 은 잎이 넷).
        // 잎은 하트 모양 (바깥 끝이 오목, 밝은 점 하나), 반 칸(0.5) 픽셀. 잎 아래 가장자리는 진하게 (그림자)
        grass();
        const clover = (cx, cy, leaf, dirs, gap, mid, dark, light) => {
          const cells = new Map(), h = leaf.length - 1, w = (leaf[0].length - 1) / 2;
          for (const [ux, uy] of dirs) {
            leaf.forEach((row, r) => [...row].forEach((ch, c) => {
              if (ch === '.') return;
              const ax = c - w, ay = r - h - gap; // 위로 향한 잎 기준 (끝이 가운데 쪽)
              const rx = uy ? ax * -uy : -ay * ux, ry = uy ? ay * -uy : ax * ux;
              cells.set(`${rx},${ry}`, ch);
            }));
          }
          for (const [k, ch] of cells) {
            const [rx, ry] = k.split(',').map(Number);
            const color = ch === 'l' ? light : cells.has(`${rx},${ry + 1}`) ? mid : dark;
            px(cx + rx * 0.5, cy + ry * 0.5, color, 0.5, 0.5);
          }
          px(cx, cy, dark, 0.5, 0.5);
        };
        const UP = [0, -1], DOWN = [0, 1], LEFT = [-1, 0], RIGHT = [1, 0];
        // 밭처럼: 구석에 작은 세잎 하나
        const sx = hash(x, y, 13) > 0.5 ? 1 : 6.5, sy = hash(x, y, 15) > 0.5 ? 1 : 7;
        clover(sx, sy, ['m.m', '.m.'], [UP, LEFT, RIGHT], 0, '#5cb860', '#43a047', '#81c784');
        // 가운데 큰 클로버: 세잎과 네잎은 크기/색이 똑같고 잎 수만 다르다 (잘 봐야 찾는다). 하트 잎 + 가운데 연한 무늬
        const cx = 3.5 + Math.round(hash(x, y, 11)) * 0.5, cy = 3.5 + Math.round(hash(x, y, 12)) * 0.5;
        const LEAF = ['.mm.mm.', 'mlmmmmm', 'mmmmmmm', '.mmmmm.', '..mmm..', '...m...'];
        const lucky = type === TILE.LUCKY;
        // 줄기: 세잎은 아래로, 네잎은 아래 잎에 가려서 옆으로 비스듬히
        if (lucky) { px(cx + 1.5, cy + 1.5, '#2e7d32', 0.5, 0.5); px(cx + 2, cy + 2, '#2e7d32', 0.5, 0.5); }
        else { px(cx, cy + 0.5, '#2e7d32', 0.5, 1.5); px(cx + 0.5, cy + 2, '#2e7d32', 0.5, 1.5); }
        clover(cx, cy, LEAF, lucky ? [UP, RIGHT, DOWN, LEFT] : [UP, LEFT, RIGHT], 1, '#43a047', '#2e7d32', '#a5d6a7');
        // 가끔 흰 토끼풀 꽃 (세잎클로버 칸에만)
        if (!lucky && hash(x, y, 21) < 0.15) {
          const fx = hash(x, y, 22) > 0.5 ? 6.5 : 0.5, fy = 6;
          px(fx - 0.5, fy, '#f5f5f5', 1.5, 1); px(fx, fy - 0.5, '#f5f5f5', 0.5, 2); px(fx, fy + 0.5, '#f8bbd0', 0.5, 0.5);
        }
        break;
      }
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
      case TILE.THORN: {
        // 가시 울타리: 짙은 가시덤불 + 하얀 가시
        grass();
        px(1, 2, '#33691e', 6, 5); px(0, 3, '#33691e', 8, 3); px(2, 1, '#33691e', 4, 1);
        px(2, 3, '#558b2f', 2, 1); px(5, 4, '#558b2f', 1, 1); px(3, 5, '#558b2f', 2, 1);
        for (const [tx, ty] of [[1.5, 1.5], [6, 1.5], [0, 2.5], [7.5, 3], [-0.25, 5.5], [7.5, 6], [2, 7], [5.5, 7]]) px(tx, ty, '#f5f5f5', 0.5, 0.5);
        for (const [tx, ty] of [[3, 2.5], [5.5, 3], [1.5, 4.5], [4, 4.5], [6, 5.5]]) px(tx, ty, '#d7ccc8', 0.5, 0.5);
        break;
      }
      case TILE.CLIFF: {
        // 절벽: 위는 울퉁불퉁한 바위 땅, 아래가 길이면 깎아지른 절벽 면 (어두운 줄무늬)
        fill('#8d7b6b');
        specks(7, ['#7a6a5b', '#a1907f', '#6f6052'], 41);
        const open = v => v !== TILE.CLIFF && v !== TILE.TREE;
        if (open(this.tile(x, y - 1))) px(0, 0, '#b3a291', 8, 1);
        if (open(this.tile(x, y + 1))) {
          px(0, 5, '#5d4037', 8, 3);
          px(0, 5, '#795548', 8, 0.5);
          for (let i = 0; i < 3; i++) px(Math.floor(hash(x, y, 60 + i) * 8), 5.5, '#3e2723', 0.5, 2.5);
        }
        if (open(this.tile(x - 1, y))) px(0, 0, '#6f6052', 0.5, 8);
        if (open(this.tile(x + 1, y))) px(7.5, 0, '#6f6052', 0.5, 8);
        break;
      }
      case TILE.STATION: grass(); break; // 텐트/대장간 그림은 Render.drawStation (칸 위로 크게)
      case TILE.SAPLING: {
        // 묘목: 흙 둔덕 + 가는 줄기 + 잎 두 장
        grass();
        px(2.5, 6, '#6d4c41', 3, 1.2); px(3, 5.6, '#8d6e63', 2, 0.6);
        px(3.75, 2.5, '#558b2f', 0.5, 3.4);
        px(1.75, 2, '#66bb6a', 2, 1.2); px(4.25, 1.2, '#43a047', 2, 1.2); px(2.25, 2, '#a5d6a7', 0.75, 0.5);
        break;
      }
      case TILE.CHEST: {
        // 보물 상자: 나무 상자 + 금테 + 자물쇠, 반짝
        grass();
        px(1, 6.5, 'rgba(0,0,0,.2)', 6, 1);
        px(1, 3, '#8d5a2b', 6, 4); px(1, 2, '#a86d36', 6, 1.5); px(1.5, 1.5, '#a86d36', 5, 0.5);
        px(1, 3.5, '#ffca28', 6, 0.5); px(1, 2, '#ffca28', 0.5, 5); px(6.5, 2, '#ffca28', 0.5, 5);
        px(3.5, 3, '#fff59d', 1, 1.5); px(3.75, 3.75, '#5d4037', 0.5, 0.5);
        px(6, 0.5, '#fff'); px(0.5, 1.5, '#fffde7', 0.5, 0.5);
        break;
      }
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
      if (Buddy.on && Buddy.friend() && !Buddy.mayTake(it)) continue; // 🤝 놀아주기: 아이에게 양보
      if (it.type === 'heart' && Game.hearts >= CONFIG.MAX_HEARTS) continue; // ❤️ 는 다쳤을 때만 줍는다
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
  luck: 0, // 2탄: 모두가 찾은 🍀 네잎클로버 수 (🦅 독수리 등장 조건)
  nextEagleAt: CONFIG.LUCK_FOR_BOSS,
  topUpT: 0,
  regrowT: 0,

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
    // 탄마다 동물은 따로: 야생 동물은 다른 탄으로 넘어가지 않는다 (내 동물은 나를 따라 넘어간다)
    if (!m.owner && World.stageAtPx(x, y) !== World.stageAtPx(m.x, m.y)) return false;
    if (m.def.swim) return World.canSwim(x, y, this.bodyRadius(m));
    if (m.def.calm) return World.canStand(x, y, this.bodyRadius(m));
    if (!this.safeZone(m.x, m.y) && this.safeZone(x, y)) return false;
    return World.canStand(x, y, this.bodyRadius(m), MONSTER_BLOCKING);
  },

  // 집에서 멀고 플레이어와도 먼 곳. region: 그 구역 안만 (-1 이면 어디든, -2 면 1탄 안 어디든), swim: 물 칸
  spots(minFromHome, region = -1, swim = false) {
    let list = Items.spots;
    if (swim) {
      list = [];
      for (let i = 0; i < World.tiles.length; i++) if (World.tiles[i] === TILE.WATER) list.push({ x: i % World.w, y: Math.floor(i / World.w) });
    }
    return list.filter(s =>
      (region === -1 || (region === -2 ? World.stageAt(s.x, s.y) === 0 : World.region(s.x, s.y) === region)) &&
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
    const spots = this.spots(CONFIG.SAFE_RADIUS + 5, -2); // 용은 1탄에만
    if (!spots.length) return;
    // 집에서 가장 먼 곳
    const far = spots.reduce((a, b) =>
      Math.hypot(b.x - World.door.x, b.y - World.door.y) > Math.hypot(a.x - World.door.x, a.y - World.door.y) ? b : a);
    this.spawn('boss', far);
    const { main } = itemNames(BOSS);
    console.log('[Monsters] 보스 등장');
    if (World.stageAtPx(Player.x, Player.y) !== 0) return; // 1탄 용 알림은 1탄에 있는 사람만
    Sfx.boss();
    toast(`${BOSS.emoji} ${main}!`);
    if (Store.settings.lang === 'en') Speech.speak(`A ${BOSS.en}!`, 'en');
    else Speech.speak(`${josa(BOSS.ko, '이', '가')} 나타났어요!`, 'ko');
  },

  get boss() { return this.list.find(m => m.def.boss); },
  // 그 탄의 보스 (stage: 0 = 1탄 용, 1 = 2탄 독수리). 화면 가장자리 화살표와 작은 지도에는 내가 있는 탄의 보스만
  bossIn(stage) { return this.list.find(m => m.def.boss && World.stageAtPx(m.x, m.y) === stage); },

  // 가시 울타리 칸에 붙어 있는지
  nearThorn(m) {
    const r = this.bodyRadius(m) + T * 0.2;
    return [[r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dy]) => World.tile(Math.floor((m.x + dx) / T), Math.floor((m.y + dy) / T)) === TILE.THORN);
  },

  // 2탄: 🍀 네잎클로버를 찾았다 (방장/혼자 기기). 모두 합쳐 LUCK_FOR_BOSS 개마다 🦅 독수리
  addLuck() {
    this.luck++;
    if (this.luck >= this.nextEagleAt && !this.list.some(m => m.type === 'eagle')) this.spawnEagle();
  },

  spawnEagle() {
    const spots = this.spots(CONFIG.SAFE_RADIUS + 5, REGION.CLOVER);
    if (!spots.length) return;
    this.spawn('eagle', spots[Math.floor(Math.random() * spots.length)]);
    console.log('[Monsters] 2탄 보스 독수리 등장');
    this.announceBoss('eagle');
    Multi.send('boss2', '*');
  },

  announceBoss(type) {
    const def = MONSTERS[type] || BOSS;
    if (World.stageAtPx(Player.x, Player.y) !== (def === BOSS ? 0 : 1)) return; // 그 탄에 있는 사람만
    Sfx.boss();
    toast(`${def.emoji} ${itemNames(def).main}!`);
    if (Store.settings.lang === 'en') Speech.speak(`A ${def.en}!`, 'en');
    else Speech.speak(`${josa(def.ko, '이', '가')} 나타났어요!`, 'ko');
  },

  // 방장/혼자 기기에서 가끔: 모자란 동물 채우기 (2탄이 열리면 2탄 동물이 생긴다), 네잎클로버 다시 나기
  upkeep(dt) {
    this.topUpT -= dt;
    if (this.topUpT <= 0) {
      this.topUpT = 5;
      for (const [type, def] of Object.entries(MONSTERS)) {
        const have = this.list.filter(m => m.type === type).length + this.respawnQueue.filter(q => q.type === type).length;
        for (let i = have; i < def.count; i++) this.spawnType(type);
      }
    }
    this.regrowT -= dt;
    if (this.regrowT <= 0 && World.cloverTiles && World.cloverTiles.length) {
      this.regrowT = 8;
      const lucky = World.cloverTiles.filter(i => World.tiles[i] === TILE.LUCKY).length;
      if (lucky < CONFIG.LUCKY_COUNT) {
        const i = World.cloverTiles[Math.floor(Math.random() * World.cloverTiles.length)];
        const x = (i % World.w) * T + T / 2, y = Math.floor(i / World.w) * T + T / 2;
        if (World.tiles[i] === TILE.CLOVER && !Multi.nearPlayer(x, y, 5 * T)) Multi.editTile(i, TILE.CLOVER, TILE.LUCKY); // 보는 앞에서는 안 난다
      }
    }
    // 🌱 심은 묘목: 5초마다 하나씩 1/6 로 나무가 된다 (평균 30초쯤)
    this.growT -= dt;
    if (!(this.growT > 0)) {
      this.growT = 5;
      World.tiles.forEach((tt, i) => {
        if (tt === TILE.SAPLING && Math.random() < 1 / 6) Multi.editTile(i, TILE.SAPLING, TILE.TREE);
      });
    }
  },

  // 가장 가까운 네잎클로버 칸 (r 칸 안) { i, x, y } (px, 칸 가운데)
  nearLucky(x, y, r) {
    const cx = Math.floor(x / T), cy = Math.floor(y / T);
    let best = null, bd = Infinity;
    for (let ty = cy - r; ty <= cy + r; ty++) {
      for (let tx = cx - r; tx <= cx + r; tx++) {
        if (World.tile(tx, ty) !== TILE.LUCKY) continue;
        const d = Math.hypot(tx - cx, ty - cy);
        if (d < bd) { bd = d; best = { i: ty * World.w + tx, x: tx * T + T / 2, y: ty * T + T / 2 }; }
      }
    }
    return best;
  },

  // 🐇 토끼: 네잎클로버를 찾아가서 한 잎 먹는다 (세잎클로버가 된다). 먹은 뒤 잠깐 쉰다
  eatMove(m, dt) {
    m.lookT = (m.lookT || 0) - dt;
    if (m.lookT <= 0) {
      m.lookT = 1;
      m.food = (m.restT || 0) > performance.now() ? null : this.nearLucky(m.x, m.y, 8);
    }
    const f = m.food;
    if (!f || World.tiles[f.i] !== TILE.LUCKY) { m.food = null; return null; }
    const dx = f.x - m.x, dy = f.y - m.y, d = Math.hypot(dx, dy);
    if (d < 0.45 * T) {
      Multi.editTile(f.i, TILE.LUCKY, TILE.CLOVER);
      m.food = null;
      m.restT = performance.now() + 6000;
      m.hopT = 0.4;
      this.emote(m, '😋', 1.4);
      Floaters.add(m.x, m.y - 26, '🍀', 16);
      return { x: 0, y: 0 };
    }
    const speed = m.def.speed * T * 0.7;
    return { x: dx / d * speed, y: dy / d * speed };
  },

  // 따라오는 🐇 토끼: 주인 둘레에 네잎클로버가 있으면 그 위에 앉아서 🍀 (먹지 않고 알려 준다)
  sniffMove(m, dt, o) {
    m.lookT = (m.lookT || 0) - dt;
    if (m.lookT <= 0) {
      m.lookT = 1;
      m.sniff = this.nearLucky(o.x, o.y, 6);
    }
    const f = m.sniff;
    if (!f || World.tiles[f.i] !== TILE.LUCKY) { m.sniff = null; return null; }
    const dx = f.x - m.x, dy = f.y - m.y, d = Math.hypot(dx, dy);
    if (d < 0.45 * T) {
      m.faceRight = o.x > m.x;
      if (m.hopT <= 0 && Math.random() < dt * 1.2) { m.hopT = 0.4; this.emote(m, '🍀', 1.2); }
      return { x: 0, y: 0 };
    }
    const speed = m.def.speed * T;
    return { x: dx / d * speed, y: dy / d * speed };
  },

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
      // 🌵 가시 울타리에 닿은 사나운 동물 / 보스는 따끔 (1.5초마다 1). 카드는 안 나온다
      m.thornT = Math.max(0, (m.thornT || 0) - dt);
      if ((m.def.hunts || m.def.boss) && !m.owner && !m.thornT && this.nearThorn(m)) {
        m.thornT = 1.5;
        Floaters.add(m.x, m.y - m.def.size * 0.6, '🌵', 14);
        if (this.hit(m, 1, m.x - v.x, m.y - v.y, { name: '🌵' })) continue;
      }
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
      else return (m.def.eats && this.sniffMove(m, dt, o)) || this.petMove(m, dt, o);
    }
    const n = this.nearest(m, scary);
    if (n && n.d < CONFIG.FLEE_RANGE * T && n.d > 1) return { x: -n.dx / n.d * speed, y: -n.dy / n.d * speed };
    return (m.def.eats && this.eatMove(m, dt)) || this.wander(m, dt, 0.4);
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

  // 따라오는 동물을 다른 사람에게 준다 (방장/혼자 기기). 받은 사람 기기에 알린다
  give(m, from, to) {
    if (!m || m.owner !== from || !to || to === from) return false;
    m.owner = to;
    m.spot = null;
    this.emote(m, '💕', 1.6);
    if (to === Multi.sid) Game.onPetGift(m.def);
    else Multi.send('gift', to, m.type);
    return true;
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
  // target: 🤝 놀아주기가 던질 때 겨눈 동물 (날아가며 그쪽으로 휜다)
  throwFood(type, target) {
    const [fx, fy] = FACING[Player.dir];
    this.arrows.push({ x: Player.x + fx * 10, y: Player.y - 8 + fy * 10, fx, fy, left: CONFIG.THROW_RANGE * T, food: type, target });
  },

  // 내가 쏜 화살 / 던진 먹이 (각자 기기에서 움직인다)
  updateArrows(dt) {
    for (const a of [...this.arrows]) {
      if (a.target && this.list.includes(a.target)) {
        const dx = a.target.x - a.x, dy = a.target.y - (a.y + 8), d = Math.hypot(dx, dy) || 1;
        a.fx = dx / d;
        a.fy = dy / d;
      }
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
          this.arrows.splice(this.arrows.indexOf(a), 1);
          if (this.likes(target, a.food)) this.feed(target);
          else this.refuse(target, a);
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

  // 좋아하는 음식인지 (🎂 케이크는 모두 좋아한다)
  likes(m, food) { return food === 'cake' || !m.def.likes || m.def.likes === food; },

  // 좋아하지 않는 음식: 고개를 젓고, 먹이는 그 자리에 떨어진다. 무엇을 좋아하는지 알려 준다
  refuse(m, a) {
    Sfx.soft();
    Floaters.add(m.x, m.y - m.def.size * 0.6, '🙅', 16);
    const like = ITEMS[m.def.likes];
    if (Buddy.on) return this.dropFood(a);
    const ko = `${josa(m.def.ko, '은', '는')} ${josa(like.ko, '을', '를')} 좋아해요`, en = `The ${m.def.en} likes ${like.en}`;
    toast(`${m.def.emoji} ${tr(ko, en)} ${iconHtml(like)}`);
    if (Store.settings.lang === 'en') Speech.speak(en, 'en'); else Speech.speak(ko, 'ko');
    this.dropFood(a);
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
    if (m.type === 'eagle') {
      // 2탄 보스: 네잎클로버를 또 모으면 다시 나온다
      this.nextEagleAt = this.luck + CONFIG.LUCK_FOR_BOSS;
      Game.onStageClear(2);
      Multi.send('clear', '*', 2);
    } else if (m.def.boss) {
      // 보스가 쓰러지면 몇 마리 더 잡은 뒤 다시 나온다
      this.bossSpawned = false;
      this.nextBossAt = this.kills + CONFIG.BOSS_AFTER_KILLS;
      // 1탄 용: 테두리의 잠긴 나무가 ✨ 황금 나무로 (2탄 가는 길). 칸이 바뀌면 모두의 기기에 알림이 뜬다
      const g = World.stageGates && World.stageGates[0];
      if (g && World.tile(g.x, g.y) === TILE.LOCK_TREE) Multi.editTile(g.y * World.w + g.x, TILE.LOCK_TREE, TILE.GOLD_TREE);
    } else {
      if (m.def.region < REGION.CLOVER) this.kills++; // 용은 1탄 동물을 잡은 수로만 나온다
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

  emote: '',
  emoteT: 0,
  jumpT: 0,
  sayText: '',
  sayT: 0,
  saySeq: 0,

  update(dt) {
    this.invulnT = Math.max(0, this.invulnT - dt);
    this.hitT = Math.max(0, this.hitT - dt);
    this.emoteT = Math.max(0, this.emoteT - dt);
    this.jumpT = Math.max(0, this.jumpT - dt);
    this.sayT = Math.max(0, this.sayT - dt);
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
    const speed = CONFIG.PLAYER_SPEED * T * (Game.buffLeft('speed') > 0 ? 1.5 : 1); // 🏃 파란 물약
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
const STATION_EMOJI = { tent: '⛺', forge: '⚒️' };

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

  // key: 이 창 표시 (새로고침해도 같아서 내 방을 다시 열 수 있다. 다른 창/기기는 다르다)
  roomKey() {
    let key = null;
    try { key = sessionStorage.getItem('bc.roomKey'); } catch { /* 저장 불가 */ }
    if (!key) {
      key = Math.random().toString(36).slice(2, 10);
      try { sessionStorage.setItem('bc.roomKey', key); } catch { /* 저장 불가 */ }
    }
    return key;
  },

  // 👥 방 만들기 (모두 한 방이 아닐 때): 내 세상으로 방을 연다
  async startHost(want) {
    const Net = await import(NET_URL);
    const last = Store.get(KEYS.room, {}) || {};
    this.net = await Net.host(Game.seed, this.sid, want || last.host, this.roomKey());
    Store.set(KEYS.room, { ...last, host: this.net.code });
    Session.set({ mode: 'host', code: this.net.code });
    this.mode = 'host';
    await this.uploadWorld();
    this.listen();
    // 옛 연결이 늦게 방을 지웠으면 다시 연다 (바뀐 칸, 아이템도 다시 올린다)
    this.net.onRoom(async h => {
      if (h || this.mode !== 'host') return;
      console.log('[Multi] 방이 지워져서 다시 연다', this.net.code);
      await this.net.reopen();
      await this.uploadWorld();
      this.itemsVersion = -1;
    });
    this.showBadge(this.net.code);
    console.log('[Multi] 방 만들기', this.net.code);
  },

  // ---------- 서버 (index.html?server=1111): 채널의 세상을 돌린다. 방장 없이, 사람 기기는 모두 손님 ----------
  // 채널마다 세상이 하나: 방(rooms/{채널}/world, t)에 남아 있으면 이어서, 없으면 채널 기본 맵으로 새로
  async startServer(code) {
    const Net = await import(NET_URL);
    this.isServer = true;
    const kept = await Net.loadWorld(code);
    if (!kept.world && Object.keys(kept.tiles).length) {
      // 세상은 안 적혀 있지만 방에 맵이 있다 (예전 방장 방식): 그 방장의 시드와 바뀐 칸으로
      const h = await Net.peek(code);
      if (h && Number.isInteger(h.seed)) kept.world = { seed: h.seed, w: World.w };
    }
    const world = kept.world && Number.isInteger(kept.world.seed) ? kept.world : { seed: channelSeed(code), w: World.w };
    this.useRoomWorld(world, kept.world ? kept.tiles : {});
    this.net = await Net.serve(code, Game.seed, this.sid, this.roomKey(), GAME_V);
    this.mode = 'host';
    await this.uploadWorld();
    this.listen();
    // 서버가 채널 주인: 방 정보가 지워지거나 (예전 버전 기기가 나가며 방을 통째로 지움) 다른 기기가 차지하면 되찾는다
    this.net.onRoom(async h => {
      if (h && h.key === this.roomKey()) return;
      if (h && h.srv && h.srv === h.key) {
        // 다른 서버가 이 채널을 맡았다 (서버를 두 군데서 켬): 서로 뺏지 않게 이쪽이 물러난다
        console.warn('[Server] 다른 서버가 채널을 맡아서 멈춤', code);
        this.mode = 'solo';
        await this.net.release().catch(() => {});
        return;
      }
      console.log('[Server] 방 정보 되찾기', code);
      await this.net.reopen();
      await this.uploadWorld();
      this.itemsVersion = -1;
    });
    console.log(`[Server] 채널 ${code} 시작 (시드 ${Game.seed})`);
  },

  // 내 세상(바뀐 칸 + 보스 진행)을 방에 올린다
  async uploadWorld() {
    const edits = World.edits();
    if (Object.keys(edits).length) await this.net.putTiles(edits);
    this.worldJson = '';
    this.saveRoomWorld();
  },

  // 서버: 보스 진행이 바뀌었으면 방에 적어 둔다 (서버를 다시 켜도 이어서)
  saveRoomWorld() {
    if (!this.isServer || !this.net) return;
    const s = { luck: Monsters.luck, nextEagleAt: Monsters.nextEagleAt, kills: Monsters.kills, nextBossAt: Monsters.nextBossAt };
    const world = { seed: Game.seed, w: World.w, s };
    const json = JSON.stringify(world);
    if (json === this.worldJson) return;
    this.worldJson = json;
    this.net.saveWorld(world).catch(err => { this.worldJson = ''; console.warn('[Server] 세상 저장 실패', err); });
  },

  // 방에 남아 있던 세상으로 바꾼다. 동물과 아이템은 새로
  useRoomWorld(world, tiles) {
    Game.seed = world.seed;
    World.generate(world.seed);
    World.applyEdits(World.remapEdits(tiles, world.w || World.w));
    const s = world.s || {};
    Monsters.luck = s.luck || 0;
    Monsters.nextEagleAt = s.nextEagleAt || CONFIG.LUCK_FOR_BOSS;
    Monsters.kills = s.kills || 0;
    Monsters.nextBossAt = s.nextBossAt || CONFIG.BOSS_AFTER_KILLS;
    Monsters.bossSpawned = false;
    Items.computeSpots();
    Items.list = [];
    Items.respawnQueue = [];
    Items.fill();
    Monsters.list = [];
    Monsters.respawnQueue = [];
    Monsters.fill();
    console.log(`[Server] 세상 불러옴 (바뀐 칸 ${Object.keys(tiles).length}개)`);
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
    this.net.onRoom(h => {
      if (!h) { this.onRoomGone(); return; }
      this.hostKey = h.key;
      if (this.tooOld(h)) return;
      this.onRoomBack(h);
    });
    Store.set(KEYS.room, { ...(Store.get(KEYS.room, {}) || {}), join: code });
    Session.set({ mode: 'guest', code });
    this.showBadge(code);
    console.log('[Multi] 참가', code);
  },

  listen() {
    this.net.onPlayers(all => this.onPlayers(all));
    this.net.onTiles((i, v) => (v === null ? this.onTileGone(i) : World.setTile(i, fixLand(i, v))));
  },

  // 방에서 맵 칸 기록이 지워졌다 (예전 버전 방장 창이 방을 지우거나 자기 맵으로 덮어씀).
  // 서버: 내가 가진 칸으로 다시 적는다 (모아서 한 번에). 손님: 원래 맵으로 (서버가 다시 적으면 그 값으로) → 모든 기기가 같은 맵
  onTileGone(i) {
    if (!(i >= 0 && i < World.tiles.length)) return;
    if (!this.isServer) { World.setTile(i, World.base[i]); return; }
    if (World.tiles[i] === World.base[i]) return;
    this.restoring ||= {};
    this.restoring[i] = World.tiles[i];
    clearTimeout(this.restoreTimer);
    this.restoreTimer = setTimeout(() => {
      const edits = this.restoring;
      this.restoring = null;
      console.log(`[Server] 지워진 칸 다시 적기 (${Object.keys(edits).length}개)`);
      this.net.restoreTiles(edits).catch(err => console.warn('[Server] 칸 다시 적기 실패', err));
    }, 300);
  },

  // 모두 한 방: 서버가 연 채널에 손님으로 들어간다. 서버가 아직 안 켜져 있으면 켜질 때까지 기다린다
  async startShared() {
    const Net = await import(NET_URL);
    for (let i = 0; ; i++) {
      if (await Net.peek(ONE_ROOM)) {
        try {
          await this.startGuest(ONE_ROOM);
          Session.set({ mode: 'shared', code: ONE_ROOM });
          return;
        } catch (err) {
          if (err.message !== 'no-room') throw err; // 그 사이에 서버가 꺼졌다: 다시 기다린다
        }
      }
      if (i === 0) {
        console.log('[Multi] 서버를 기다리는 중', ONE_ROOM);
        Game.mpMsg(Store.settings.lang === 'en' ? '🖥️ Waiting for the server…' : '🖥️ 서버가 켜지길 기다리는 중…');
      }
      await delay(3000);
    }
  },

  // 서버(또는 방장)가 꺼졌다: 다시 켜지면 onRoomBack 으로 이어서 논다
  onRoomGone() {
    if (!this.roomGone) toast('📴');
    this.roomGone = true;
    for (const sid of [...this.peers.keys()]) this.leave(sid);
  },

  // 서버가 더 새 버전이다 (게임을 고쳤는데 이 기기는 예전 창 그대로): 새로고침해서 새 버전으로. 그래도 옛 버전이면 (캐시) 한 번만
  tooOld(h) {
    if (!(h.v > GAME_V)) return false;
    try {
      if (sessionStorage.getItem('bc.reloadV') === String(h.v)) return false;
      sessionStorage.setItem('bc.reloadV', String(h.v));
    } catch { return false; }
    console.log(`[Multi] 서버가 새 버전 (${h.v}): 새로고침`);
    Game.writeSave();
    Session.reload();
    return true;
  },

  // 서버가 다시 켜졌다 (같은 채널): 같은 맵이면 그대로 이어서, 다른 맵이면 새로 불러온다 (바뀐 칸은 방에 남아 있다)
  onRoomBack(h) {
    if (!this.roomGone) return; // 처음 들어갈 때, 또는 서버가 방 정보를 되찾은 것
    this.roomGone = false;
    if (h.seed !== this.net.seed) {
      Game.writeSave();
      Session.reload();
      return;
    }
    this.monsterMap.clear();
    Monsters.list = [];
    toast('📶');
    console.log('[Multi] 서버가 다시 켜져서 이어서', this.net.code);
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
    World.mine.set(i, performance.now());
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
    if (Buddy.on) return false; // 🤝 놀아주기 중에는 다른 사람을 때리지 않는다
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
      p.emoteT = Math.max(0, (p.emoteT || 0) - dt);
      p.jumpT = Math.max(0, (p.jumpT || 0) - dt);
      p.sayT = Math.max(0, (p.sayT || 0) - dt);
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
      wr: wornList(Game.equip),
      st: Game.state,
      p: [r(Player.x), r(Player.y), DIRS.indexOf(Player.dir), Player.moving ? 1 : 0,
        Player.swingT > 0 ? 1 : 0, Player.invulnT > 0 ? 1 : 0, Player.hitT > 0 ? 1 : 0, Player.jumpT > 0 ? 1 : 0],
      hp: Game.hearts,
      w: Game.held,
      em: Player.emoteT > 0 ? Player.emote : 0,
      say: Player.sayT > 0 ? [Player.saySeq, Player.sayText] : 0,
      a: Monsters.arrows.map(a => [r(a.x), r(a.y), a.fx, a.fy, a.food || 0]),
      ev: this.events.map(([seq, , kind, ...args]) => [seq, kind, ...args]),
      ...(this.isServer ? { srv: 1 } : {}),
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
      k: this.roomKey(), // 누가 보냈는지: 손님은 방 주인(서버)이 보낸 몬스터만 쓴다
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
    if (d.srv) {
      // 서버: 캐릭터는 없고 이벤트(카드, 길들이기 답 등)만 받는다
      if (!p) { p = { sid, server: true, lastSeq: evs.reduce((max, ev) => Math.max(max, ev[0]), 0) }; this.peers.set(sid, p); }
      for (const ev of evs.sort((x, y) => x[0] - y[0])) {
        if (ev[0] <= p.lastSeq) continue;
        p.lastSeq = ev[0];
        const [, kind, to, ...args] = ev;
        if (to === this.sid || to === '*') this.handle(kind, args, p);
      }
      return;
    }
    if (!p) {
      // 새로 들어옴: 위치를 바로 맞추고, 그 전 이벤트는 무시
      p = { ...makeRemote(), isPlayer: true, sid, x: pos[0], y: pos[1], arrows: [] };
      p.lastSeq = evs.reduce((max, ev) => Math.max(max, ev[0]), 0);
      p.saySeq = d.say ? d.say[0] : 0; // 들어오기 전에 한 말은 읽지 않는다
      this.peers.set(sid, p);
      toast(`👋 ${d.n || ''}`);
    }
    p.seen = true;
    // 살아 있는지는 h(보낼 때마다 바뀌는 수)로 본다. 다른 사람 소식에 같이 실려 온 옛 값은 치지 않는다
    if (p.beat !== d.h) { p.beat = d.h; p.lastSeen = performance.now(); }
    p.name = String(d.n || '').slice(0, CONFIG.NAME_MAX);
    p.lk = d.lk || 0;
    p.wear = Array.isArray(d.wr) ? d.wr.filter(id => ITEMS[id] && ITEMS[id].kind === 'wear').slice(0, 4) : [];
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
    if (d.em && d.em !== p.emote) { p.emote = String(d.em).slice(0, 4); p.emoteT = 1.6; }
    if (!d.em) p.emote = '';
    if (pos[7] && !p.wasJump) p.jumpT = JUMP_SEC;
    p.wasJump = !!pos[7];
    // 말풍선: 새 말이면 띄우고, 가까이 있으면 읽어 준다
    if (Array.isArray(d.say) && d.say[0] !== p.saySeq) {
      p.saySeq = d.say[0];
      p.sayText = String(d.say[1] || '').slice(0, SAY_MAX);
      p.sayT = SAY_SEC;
      if (p.sayText && Game.state === 'play' && Social.voiceOn) Speech.speak(p.sayText, sayLang(p.sayText));
    }
    p.arrows = (d.a || []).filter(Boolean).map(([x, y, fx, fy, food]) => ({ x, y, fx, fy, food: ITEMS[food] ? food : null }));
    for (const ev of evs.sort((a, b) => a[0] - b[0])) {
      if (ev[0] <= p.lastSeq) continue;
      p.lastSeq = ev[0];
      const [, kind, to, ...args] = ev;
      if (to === this.sid || to === '*' || (to === 'H' && this.isHost)) this.handle(kind, args, p); // '*': 모두에게
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
      // 못 맞힌 먹이, 다른 사람에게 준 선물 (블록/먹이)
      const [type, x, y] = args;
      if (ITEMS[type] && (ITEMS[type].kind === 'food' || ITEMS[type].kind === 'block')) Items.add(type, x, y, { dropped: true });
    } else if (kind === 'luck' && this.isHost) {
      Monsters.addLuck();
    } else if (kind === 'boss2') {
      Monsters.announceBoss('eagle');
    } else if (kind === 'clear') {
      Game.onStageClear(args[0]);
    } else if (kind === 'givePet' && this.isHost) {
      Monsters.give(Monsters.list.find(mm => mm.id === args[0]), from.sid, String(args[1] || ''));
    } else if (kind === 'gift') {
      if (MONSTERS[args[0]]) Game.onPetGift(MONSTERS[args[0]]);
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
    // 방 주인이 아닌 기기 (방장인 줄 아는 예전 버전 창)가 보낸 몬스터는 버린다. 섞이면 몬스터가 깜빡깜빡
    if (!w || w.k !== this.hostKey) return;
    const seen = new Set();
    const hadBoss = Monsters.list.some(m => m.type === 'boss');
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
    if (!hadBoss && Monsters.list.some(m => m.type === 'boss') && World.stageAtPx(Player.x, Player.y) === 0) {
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
      if (Game.bagOpen) { e.preventDefault(); if (!e.repeat || e.code.startsWith('Arrow')) Game.bagKey(e.code); return; }
      if (Game.helpOpen) { e.preventDefault(); if (['Escape', 'Slash', 'Enter', 'Space'].includes(e.code)) Game.setHelp(false); return; }
      if (e.code === 'Slash' && !e.repeat && Game.state === 'play') { e.preventDefault(); Game.setHelp(true); return; }
      if (Game.talkOpen) { e.preventDefault(); if (!e.repeat || e.code.startsWith('Arrow')) Game.talkKey(e.code); return; }
      if (e.code === 'KeyJ' && !e.repeat) Social.jump();
      if (e.code === 'KeyC' && !e.repeat) { Game.toggleTalk(); Sfx.click(); }
      if (e.code === 'KeyB' && !e.repeat && Game.state === 'play') { Game.setBag(true); Sfx.click(); }
      // 1~4: 아래 주머니 칸 (무기 / 블록 / 음식 / 물약)
      const digit = ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(e.code);
      if (digit >= 0 && !e.repeat && Game.state === 'play') Game.pouchTap(digit);
      if (e.code === 'KeyM' && !e.repeat) Game.setBigMap(!Game.bigMap);
      if (e.code === 'Escape' && Game.bigMap) Game.setBigMap(false);
      if (KEYMAP[e.code]) { this.keys.add(e.code); e.preventDefault(); }
      if (e.code === 'KeyQ' && !e.repeat && Game.state === 'play') Game.pouchNext();
      // Enter: 놀고 있을 때는 💬 말풍선 칸을 열고 바로 ✏️ 쓰기 칸에 글자를 쓴다 (카드/시작 화면에서는 예전처럼 ✅ / 시작)
      if (e.code === 'Enter' && Game.state === 'play') {
        e.preventDefault();
        if (!e.repeat) { Game.toggleTalk(true); Sfx.click(); }
      } else if (e.code === 'Space' || e.code === 'Enter') {
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
    $('#btn-jump').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Social.jump(); });
    $('#btn-talk').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); Game.toggleTalk(); });
    // 가방 / 말하기 칸 바깥을 누르면 닫는다
    addEventListener('pointerdown', e => {
      if (!e.target.closest('#bag-panel')) Game.closeBag(!e.target.closest('button'));
      if (!e.target.closest('#talk-panel')) Game.closeTalk(!e.target.closest('button'));
    });
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
    if (!x && !y && Buddy.on) return Buddy.vec;
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
    const myWear = wornList(Game.equip);
    drawables.push({ y: Player.y, draw: () => this.drawCharacter(Player, Multi.myLook(), Game.held, Game.playerName, true, showHearts ? Game.hearts : null, myWear) });
    for (const p of peers) {
      drawables.push({ y: p.y, draw: () => {
        this.drawCharacter(p, Multi.peerLook(p), p.held, p.name, false, p.hearts, p.wear || []);
        const icon = STATUS_ICONS[p.st];
        if (icon) this.drawStatus(p, icon, time);
      } });
    }
    for (const st of World.stations || []) {
      if (World.tile(st.x, st.y) === TILE.STATION && Math.abs(st.x * T - this.camX - viewW / 2) < viewW && Math.abs(st.y * T - this.camY - viewH / 2) < viewH) {
        drawables.push({ y: st.y * T + T * 0.9, draw: () => this.drawStation(st, time) });
      }
    }
    drawables.sort((a, b) => a.y - b.y).forEach(d => d.draw());
    Monsters.arrows.forEach(a => this.drawArrow(a));
    for (const p of peers) p.arrows.forEach(a => this.drawArrow(a));
    this.drawFloaters();
    this.drawCraftHint(time);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawSwampDark();
    this.drawEdgeArrow(World.door.x * T + T / 2, World.door.y * T, '🏠', Craft.canMakeAny() ? '🔨' : '');
    const boss = Monsters.bossIn(World.stageAtPx(Player.x, Player.y));
    if (boss) this.drawEdgeArrow(boss.x, boss.y, boss.def.emoji, '');
    const stNow = World.stageAtPx(Player.x, Player.y), bench = World.stationIn(stNow);
    if (bench) this.drawEdgeArrow(bench.x * T + T / 2, bench.y * T, STATION_EMOJI[bench.kind], Craft.canMakeAny() ? '🔨' : '');
    for (const g of World.stageGates || []) {
      if (World.tile(g.x, g.y) === TILE.GOLD_TREE && World.stageAt(g.x, g.y) === stNow) this.drawEdgeArrow(g.x * T + T / 2, g.y * T, '✨', '🌳');
    }
    for (const p of peers) this.drawEdgeArrow(p.x, p.y, '🧑', '', p.name);
    this.drawMinimap(peers, boss);
  },

  // 🍄 늪 / 🧭 미로에 들어가면 화면이 어두워지고 내 둘레와 🔥 횃불 둘레만 밝다 (천천히 바뀐다)
  drawSwampDark() {
    const home = Math.hypot(Player.x - (World.door.x * T + T / 2), Player.y - (World.door.y * T + T / 2)) < CONFIG.SAFE_RADIUS * T;
    const want = Game.state !== 'title' && DARK_REGIONS.has(World.regionAtPx(Player.x, Player.y)) && !home && Game.buffLeft('light') <= 0 ? 1 : 0; // 집 앞, 💡 노란 물약은 밝게
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

  // 오른쪽 위 작은 지도: 내가 있는 탄 + 지금 보이는 곳(흰 네모) + 나(파랑)/다른 사람(빨강)/보스.
  // 누르면 화면 가운데에 크게 (Game.bigMap. 3탄 미로는 지나온 길이 하늘색 발자국으로 보인다)
  drawMinimap(peers, boss) {
    const c = $('#minimap');
    if (!World.mini || c.classList.contains('hidden')) return;
    const st = World.stageAtPx(Player.x, Player.y), R = World.stageRect(st), big = Game.bigMap;
    // 탄마다 가로세로 비율이 달라서 (3탄은 납작하다) 높이를 넓이에 맞춘다
    let cw;
    if (big) cw = Math.round(Math.min(innerWidth * 0.94, (innerHeight * 0.86) * R.w / R.h, 1100));
    c.style.width = big ? `${cw}px` : '';
    const w = c.clientWidth;
    if (!w) return;
    const h = Math.round(w * R.h / R.w);
    if (c.style.height !== `${h}px`) c.style.height = `${h}px`;
    if (c.width !== Math.round(w * this.dpr) || c.height !== Math.round(h * this.dpr)) { c.width = Math.round(w * this.dpr); c.height = Math.round(h * this.dpr); }
    const ox = R.x, oy = R.y, z = big ? 2 : 1; // z: 크게 볼 때 점/그림 크기
    const g = c.getContext('2d'), k = (w * this.dpr) / R.w;
    g.imageSmoothingEnabled = false;
    g.drawImage(World.mini, ox, oy, R.w, R.h, 0, 0, c.width, c.height);
    if (st === 2 && World.trail) {
      g.globalAlpha = 0.75;
      g.drawImage(World.trail, ox, oy, R.w, R.h, 0, 0, c.width, c.height);
      g.globalAlpha = 1;
    }
    g.strokeStyle = 'rgba(255,255,255,.9)';
    g.lineWidth = Math.max(1, this.dpr);
    g.strokeRect((this.camX / T - ox) * k, (this.camY / T - oy) * k, this.cssW / this.scale / T * k, this.cssH / this.scale / T * k);
    const dot = (x, y, color, r) => {
      g.fillStyle = color;
      g.beginPath();
      g.arc((x / T - ox) * k, (y / T - oy) * k, r * z * this.dpr, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#fff';
      g.stroke();
    };
    // 구역 그림 (어디에 어떤 동물이 사는지)
    g.globalAlpha = 0.9;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `${Math.round(14 * z * this.dpr)}px ${FONT_EMOJI}`;
    REGIONS.forEach((r, i) => {
      const c = World.regionCenters[i];
      if (c && World.stageAt(c.x, c.y) === st) g.fillText(r.emoji, (c.x + 0.5 - ox) * k, (c.y + 0.5 - oy) * k);
    });
    // 다음 탄 가는 나무: 🔒 잠김 / ✨ 황금 나무, 3탄 미로 끝 🎁 보물 상자
    g.font = `${Math.round(11 * z * this.dpr)}px ${FONT_EMOJI}`;
    const mark = (x, y, emoji) => {
      if (x < ox || x >= ox + R.w || y < oy || y >= oy + R.h) return;
      const m = 7 * z * this.dpr;
      g.fillText(emoji, clamp((x + 0.5 - ox) * k, m, c.width - m), clamp((y + 0.5 - oy) * k, m, c.height - m));
    };
    for (const gt of World.stageGates || []) {
      const tt = World.tile(gt.x, gt.y);
      if (tt === TILE.LOCK_TREE || tt === TILE.GOLD_TREE) mark(gt.x, gt.y, tt === TILE.LOCK_TREE ? '🔒' : '✨');
    }
    const goal = World.mazeGoal;
    if (goal && World.tile(goal.x, goal.y) === TILE.CHEST) mark(goal.x, goal.y, '🎁');
    const bench = World.stationIn(st);
    if (bench) mark(bench.x, bench.y, STATION_EMOJI[bench.kind]);
    g.globalAlpha = 1;
    // 내 동물 (분홍 점)
    for (const m of Monsters.list) if (m.owner === Multi.sid) dot(m.x, m.y, '#ec407a', 2);
    if (boss) dot(boss.x, boss.y, '#6a1b9a', 3.5);
    for (const p of peers) dot(p.x, p.y, '#e53935', 3);
    dot(Player.x, Player.y, '#1565c0', 3.5);
  },

  // 2탄 ⛺ 클로버 텐트 / 3탄 ⚒️ 대장간: 한 칸 자리에 칸보다 크게 그린다 (위에 🔨 표시가 둥실)
  drawStation(st, time) {
    const ctx = this.ctx, cx = st.x * T + T / 2, by = st.y * T + T;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath();
    ctx.ellipse(cx, by - 2, T * 0.75, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    const tri = (x1, y1, x2, y2, x3, y3, color) => {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.closePath(); ctx.fill();
    };
    if (st.kind === 'tent') {
      // 초록/하양 줄무늬 텐트 + 열린 입구 + 꼭대기 🍀 깃발
      const w = T * 0.8, top = by - T * 1.45;
      tri(cx - w, by, cx + w, by, cx, top, '#2e7d32');
      for (let i = -2; i <= 2; i += 2) tri(cx + (i - 0.5) * w / 3, by, cx + (i + 0.5) * w / 3, by, cx, top, '#f1f8e9');
      tri(cx - w * 0.32, by, cx + w * 0.32, by, cx, by - T * 0.75, '#4e342e');
      ctx.fillStyle = '#6d4c41';
      ctx.fillRect(cx - 1, top - 12, 2, 13);
      ctx.fillStyle = '#43a047';
      ctx.fillRect(cx + 1, top - 12, 9, 6);
    } else {
      // 돌 화덕: 돌 벽돌 + 아치 안 일렁이는 불 + 굴뚝 연기, 앞에 모루
      const w = T * 0.62, top = by - T * 1.1;
      ctx.fillStyle = '#757575';
      ctx.fillRect(cx - w, top, w * 2, by - top);
      ctx.fillStyle = '#9e9e9e';
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) ctx.fillRect(cx - w + 2 + c * (w * 2 / 3) + (r % 2) * 5, top + 2 + r * 9, w * 2 / 3 - 7, 6);
      ctx.fillStyle = '#616161';
      ctx.fillRect(cx + w * 0.3, top - 12, 8, 13);
      const flick = Math.sin(time * 14 + st.x) * 2;
      ctx.fillStyle = '#3e2723';
      ctx.beginPath(); ctx.arc(cx, by - 9, 9, Math.PI, 0); ctx.lineTo(cx + 9, by - 2); ctx.lineTo(cx - 9, by - 2); ctx.fill();
      tri(cx - 7, by - 3, cx + 7, by - 3, cx + flick * 0.5, by - 17 - flick, '#ff6f00');
      tri(cx - 4, by - 3, cx + 4, by - 3, cx - flick * 0.3, by - 12, '#ffd54f');
      for (let i = 0; i < 3; i++) {
        const k = ((time * 0.6 + i / 3) % 1);
        ctx.fillStyle = `rgba(200,200,200,${0.5 * (1 - k)})`;
        ctx.beginPath(); ctx.arc(cx + w * 0.3 + 4 + Math.sin(k * 6 + i) * 3, top - 14 - k * 22, 3 + k * 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    // 제작대 표시: 🔨 (새 무기/옷을 만들 수 있으면 통통 뛴다)
    const ready = Craft.canMakeAny(), hop = ready ? Math.abs(Math.sin(time * 4)) * 5 : Math.sin(time * 2) * 1.5;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.font = `${ready ? 16 : 12}px ${FONT_EMOJI}`;
    ctx.fillText('🔨', cx, by - T * (st.kind === 'tent' ? 1.95 : 1.65) - hop);
    ctx.restore();
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
    if (m.def.ghost) { ctx.globalAlpha = 0.72; ctx.translate(0, Math.sin(time * 2.5 + m.phase) * 4); } // 유령: 반투명, 둥실둥실
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
    if (def.icon) ctx.drawImage(tileIcon(def.icon).canvas, it.x - 11, it.y - 15 + bob, 22, 22);
    else ctx.fillText(def.emoji, it.x, it.y - 4 + bob);

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
  // wear: 입은 옷 id 목록 (wornList)
  drawCharacter(e, look, held, label, mine, hearts, wear = []) {
    // 점프: 몸만 위로 (그림자는 땅에)
    const jumpH = e.jumpT > 0 ? Math.sin(Math.PI * (1 - e.jumpT / JUMP_SEC)) * 14 : 0;
    const ctx = this.ctx, { dir } = e, y = e.y - jumpH;
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
    ctx.ellipse(x, e.y + 6, 9 - jumpH * 0.2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const SKIN = '#f1c27d', { hair: HAIR, shirt: SHIRT, pants: PANTS } = look;
    const worn = new Set(wear), SHOE = worn.has('boots') ? '#6d4321' : '#555';
    // 다리
    box(2, 9 + step, 2, 3, PANTS); box(2, 12 + step, 2, 1, SHOE);
    box(4, 9 - step, 2, 3, PANTS); box(4, 12 - step, 2, 1, SHOE);
    if (worn.has('boots')) { box(2, 11 + step, 2, 1, '#8d5a2b'); box(4, 11 - step, 2, 1, '#8d5a2b'); }
    // 몸통 + 팔 (가죽 옷: 몸통과 소매가 가죽, 가운데 끈)
    const BODY = worn.has('vest') ? '#a8723f' : SHIRT;
    box(1, 5, 6, 4, BODY);
    box(0, 5 - step * 0.5, 1, 3, BODY); box(0, 8 - step * 0.5, 1, 1, SKIN);
    box(7, 5 + step * 0.5, 1, 3, BODY); box(7, 8 + step * 0.5, 1, 1, SKIN);
    if (worn.has('vest')) {
      if (dir !== 'up') { box(3.5, 5, 1, 4, SHIRT); box(3.5, 6, 1, 0.4, '#e6c08a'); box(3.5, 7.4, 1, 0.4, '#e6c08a'); }
      box(1, 8.4, 6, 0.6, '#6d4321');
    }
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
    const headWear = { crown: { type: 'crown' }, hat: { type: 'leather' } }[wear.find(id => ITEMS[id].slot === 'head')];
    const hat = headWear || look.hat;
    this.drawHat(box, hat, dir);

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
      const hd = WEAPONS[held] || ITEMS[held], block = hd && (hd.tile || hd.icon); // 픽셀 그림 (손은 이모지)
      ctx.translate(0, -4);
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
      const ly = top - (hat ? 12 : 7);
      ctx.strokeText(label, x, ly);
      ctx.fillText(label, x, ly);
      // 여럿이 할 때: 이름 위에 남은 하트
      if (hearts != null) {
        ctx.fillStyle = '#000';
        ctx.font = `7px ${FONT_EMOJI}`;
        for (let i = 0; i < CONFIG.MAX_HEARTS; i++) ctx.fillText(i < hearts ? '❤️' : '🤍', x + (i - (CONFIG.MAX_HEARTS - 1) / 2) * 8, ly - 10);
      }
      // 머리 위 말풍선 그림 (💪 👍 😊)
      if (e.emoteT > 0 && e.emote) {
        const by = ly - (hearts != null ? 30 : 22) - (1.6 - Math.min(1.6, e.emoteT)) * 4;
        ctx.globalAlpha *= Math.min(1, e.emoteT / 0.3);
        ctx.fillStyle = 'rgba(255,255,255,.95)';
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, by, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.font = `13px ${FONT_EMOJI}`;
        ctx.fillText(e.emote, x, by + 1);
      }
      // 💬 말풍선 (맨 위)
      if (e.sayT > 0 && e.sayText) this.drawSay(x, ly - (hearts != null ? 30 : 22) - (e.emoteT > 0 && e.emote ? 26 : 0), e.sayText, e.sayT);
    }
    ctx.restore();
  },

  // 말풍선: 흰 둥근 칸 + 아래 꼬리. 사라질 때 흐려진다
  drawSay(x, by, text, t) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha *= Math.min(1, t / 0.3);
    ctx.font = `900 13px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 16, h = 22, top = by - h;
    ctx.fillStyle = 'rgba(255,255,255,.97)';
    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, top, w, h, 10); else ctx.rect(x - w / 2, top, w, h);
    ctx.moveTo(x - 5, top + h);
    ctx.lineTo(x, top + h + 6);
    ctx.lineTo(x + 5, top + h);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3e2723';
    ctx.fillText(text, x, top + h / 2 + 1);
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
    } else if (hat.type === 'leather') {
      // 가죽 모자: 넓은 챙 + 진한 띠
      box(-0.5, 0, 9, 1, '#6d4321');
      box(1.5, -2, 5, 2, '#a8723f');
      box(1.5, -0.6, 5, 0.6, '#4e342e');
    } else if (hat.type === 'wreath') {
      // 꽃 화관: 초록 줄기 + 꽃
      box(0.8, 0.4, 6.4, 0.8, '#43a047');
      box(1, -0.2, 1, 1, '#f06292'); box(3.5, -0.4, 1, 1, '#fdd835'); box(6, -0.2, 1, 1, '#f06292');
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
  equip: {}, // 입은 옷/방패: 입는 곳 → id (가방 inventory 에는 없다)
  seen: new Set(), // 한 번이라도 얻은 아이템 (제작대에서 모르는 재료는 ??? 로)
  buffs: { speed: 0, light: 0 }, // 물약 힘이 끝나는 시각 (performance.now)
  weapons: new Set(),
  picked: null, // 고른 것 (무기 또는 블록). 블록을 다 놓으면 lastWeapon 으로 돌아간다
  lastWeapon: null, // 마지막으로 고른 무기 (없으면 가진 무기 중 제일 센 것)
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
    btn.addEventListener('click', () => (ONE_ROOM ? this.startShared() : this.start()));
    if (SERVER_CH) { this.keepAliveInBackground(); this.startServer(SERVER_CH); return; }
    requestAnimationFrame(t => this.loop(t));
    this.keepAliveInBackground();
    this.initFullscreen();
    this.initBag();
    this.initHelp();
    this.initClickSound();
    this.initHome();
    this.initBuddy();
    Social.initVoice();
    Social.initWords();
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
  // 실수로 빠져나가면 다음에 화면을 누를 때 다시 들어간다. 터치 화면(폰/태블릿)만: 노트북은 Esc 로 풀리고 클릭하면 다시 들어가 깜빡인다
  goFullscreen() {
    if (!matchMedia('(pointer: coarse)').matches) return;
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
    document.addEventListener('pointerdown', e => {
      if (e.pointerType === 'touch' && this.wantFullscreen && this.state === 'play') this.goFullscreen();
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
    this.playAt = performance.now(); // 들어온 직전에 받은 칸 변화는 알리지 않는다
  },

  // 캐릭터 이름: 머리 위에 보인다. 이 탭(새로고침해도 그대로)과 이 기기(새 탭의 처음 이름)에 저장
  initName() {
    const input = $('#name-input');
    input.maxLength = CONFIG.NAME_MAX;
    input.value = TabStore.get(KEYS.name, null) || Store.get(KEYS.name, '') || '';
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
    TabStore.set(KEYS.name, name);
    return true;
  },

  // ---------- 저장: 이 기기의 세상(맵 + 바뀐 칸) + 가방 ----------
  // 여럿이 할 때 방장은 자기 세상을 그대로 방으로 열고, 손님은 가방만 저장한다 (손님의 세상은 그대로)
  loadSave(save) {
    // 맵 만드는 방법이 바뀌기 전 저장이면 바뀐 칸은 버린다 (다른 맵에 붙으면 엉망이 된다). 가방은 그대로
    if (save.gen === WORLD_GEN) World.applyEdits(World.remapEdits(save.edits, save.w || 120));
    else console.log('[Save] 맵이 새로 바뀌어서 예전에 바꾼 칸은 버림');
    Monsters.luck = save.luck || 0;
    Monsters.nextEagleAt = save.nextEagleAt || CONFIG.LUCK_FOR_BOSS;
    this.applyBag(save.bag);
    Monsters.kills = save.monsterKills || 0;
    Monsters.nextBossAt = save.nextBossAt || CONFIG.BOSS_AFTER_KILLS;
    console.log(`[Save] 불러옴: 바뀐 칸 ${Object.keys(save.edits || {}).length}개`);
  },

  // 가방 (아이템, 무기, 손에 든 것, 잡은 수) 을 지금 것으로 바꾼다
  applyBag(bag = {}) {
    if (bag.v !== BAG_V) bag = {}; // 아이템 체계가 바뀌었다: 새 가방으로
    this.inventory = {};
    this.weapons = new Set();
    this.unlockShown = new Set();
    for (const [type, n] of Object.entries(bag.inventory || {})) if (ITEMS[type] && n > 0) this.inventory[type] = n;
    for (const id of bag.weapons || []) if (WEAPONS[id]) this.weapons.add(id);
    this.seen = new Set((bag.seen || []).filter(id => ITEMS[id]));
    for (const id of Object.keys(this.inventory)) this.seen.add(id);
    this.equip = {};
    for (const [slot, id] of Object.entries(bag.equip || {})) if (ITEMS[id] && ITEMS[id].slot === slot) this.equip[slot] = id;
    // 예전 가방 (입은 옷을 따로 적기 전): 가방의 옷을 빈 곳에 입힌다
    if (!bag.equip) for (const id of Object.keys(this.inventory)) if (ITEMS[id].kind === 'wear' && !this.equip[ITEMS[id].slot]) this.wear(id, false);
    this.picked = holdable(bag.picked) ? bag.picked : null;
    this.lastWeapon = WEAPONS[bag.lastWeapon] ? bag.lastWeapon : null;
    this.kills = bag.kills || 0;
    for (const r of RECIPES) if (r.unlock > 0 && this.kills >= r.unlock) this.unlockShown.add(r.result);
    this.bagJson = JSON.stringify(this.bagItems());
    this.bagT = bag.t || 0;
  },

  bagItems() {
    return { v: BAG_V, inventory: this.inventory, equip: this.equip, seen: [...this.seen], weapons: [...this.weapons], picked: this.picked, lastWeapon: this.lastWeapon, kills: this.kills };
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
    if (SERVER_CH) { Multi.saveRoomWorld(); return; }
    if (this.state === 'loading' || this.state === 'title' || this.state === 'starting') return;
    const old = Store.get(KEYS.world, null) || {};
    const bag = this.bagData();
    Cloud.save(bag);
    if (Multi.isGuest) { Store.set(KEYS.world, { ...old, bag }); return; }
    Store.set(KEYS.world, {
      gen: WORLD_GEN, seed: this.seed, edits: World.edits(), bag, pets: Monsters.myPets(),
      monsterKills: Monsters.kills, nextBossAt: Monsters.nextBossAt, w: World.w,
      luck: Monsters.luck, nextEagleAt: Monsters.nextEagleAt,
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
    const saved = TabStore.get(KEYS.look, null) ?? Store.get(KEYS.look, null);
    this.lookIndex = Number.isInteger(saved) && saved >= 0 && saved < LOOKS.length
      ? saved : Math.floor(Math.random() * LOOKS.length);
    Store.set(KEYS.look, this.lookIndex);
    TabStore.set(KEYS.look, this.lookIndex);
    Render.drawLookPreview();
    $('#btn-look').addEventListener('click', () => {
      this.lookIndex = (this.lookIndex + 1) % LOOKS.length;
      Store.set(KEYS.look, this.lookIndex);
      TabStore.set(KEYS.look, this.lookIndex);
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
    if (ONE_ROOM) {
      // 지금은 모두 한 방: 버튼은 보이되 회색으로 누를 수 없게, ▶ 만 누르면 된다고 적어 둔다
      for (const el of [$('#btn-multi'), $('#btn-host'), $('#btn-join'), input]) { el.disabled = true; el.classList.add('off'); }
      input.value = ONE_ROOM;
      panel.classList.remove('hidden');
      panel.classList.add('one-room');
      $('#mp-note').textContent = Store.settings.lang === 'en'
        ? `Everyone plays together in room ${ONE_ROOM}. Just press ▶ above.`
        : `모두 ${ONE_ROOM} 방에서 같이 놀아요. 위의 ▶ 만 누르면 돼요.`;
    }
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

  // 서버로 켜기: 캐릭터 없이 채널을 돌린다. 실패하면 (인터넷 끊김 등) 10초 뒤 다시
  async startServer(code) {
    this.state = 'server';
    this.playerName = '🖥️';
    Player.x = Player.y = -1e5; // 동물/아이템 놓을 때 피하지 않게 멀리
    document.title = `Baby Craft 서버 ${code}`;
    $('#title').classList.add('hidden');
    try {
      await Multi.startServer(code);
    } catch (err) {
      console.error('[Server] 시작 실패 → 10초 뒤 다시', err);
      setTimeout(() => location.reload(), 10000);
    }
  },

  // ▶: 모두 한 방으로. 연결이 안 되면 혼자 논다
  async startShared() {
    if (!this.prepare()) return;
    this.mpMsg('⏳');
    try {
      await Multi.startShared();
    } catch (err) {
      console.warn('[Multi] 한 방 연결 실패 → 혼자 하기', err);
      Session.clear();
      toast('📴');
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

  // 🤝: 켤 때 "누구랑 놀아줄까요?" (처음엔 지율이 골라져 있어서 ✅/Enter 한 번이면 된다). 끌 때는 바로
  initBuddy() {
    const box = $('#buddy-pick'), list = $('#buddy-pick-names');
    let names = [], sel = 0, back = null;
    const mark = () => list.querySelectorAll('button').forEach((b, i) => b.classList.toggle('sel', i === sel));
    const close = () => {
      box.classList.add('hidden');
      if (this.state === 'menu') this.state = back;
    };
    const ok = () => {
      close();
      Buddy.toggle(names[sel]);
    };
    $('#btn-buddy').addEventListener('click', () => {
      if (Buddy.on) { Buddy.toggle(); return; }
      if (this.state !== 'play') return;
      back = this.state;
      this.state = 'menu';
      Input.reset();
      this.closeBag(false);
      this.closeTalk(false);
      // 지율 먼저, 그다음 지금 방에 있는 사람들
      names = [...new Set([BUDDY_DEFAULT, ...Multi.visiblePeers().map(p => p.name).filter(Boolean)])];
      sel = 0;
      $('#buddy-pick-text').textContent = tr('누구랑 놀아줄까요?', 'Who should I play with?');
      list.innerHTML = '';
      names.forEach((name, i) => {
        const b = document.createElement('button');
        b.className = 'buddy-name';
        const here = Multi.visiblePeers().some(p => p.name === name);
        b.textContent = here ? name : `${name} 💤`; // 💤: 아직 안 들어옴 (들어오면 그때부터 같이 논다)
        b.addEventListener('click', () => { sel = i; mark(); Sfx.click(); });
        list.appendChild(b);
      });
      mark();
      box.classList.remove('hidden');
    });
    $('#btn-buddy-yes').addEventListener('click', ok);
    $('#btn-buddy-no').addEventListener('click', close);
    // 키보드: ←→ 사람 고르기, Enter/스페이스 = ✅, Esc = ❌
    addEventListener('keydown', e => {
      if (box.classList.contains('hidden')) return;
      e.stopImmediatePropagation();
      e.preventDefault();
      if (['ArrowLeft', 'KeyA', 'ArrowUp', 'KeyW'].includes(e.code)) { sel = (sel - 1 + names.length) % names.length; mark(); Sfx.click(); }
      else if (['ArrowRight', 'KeyD', 'ArrowDown', 'KeyS'].includes(e.code)) { sel = (sel + 1) % names.length; mark(); Sfx.click(); }
      else if ((e.code === 'Space' || e.code === 'Enter') && !e.repeat) { Sfx.click(); ok(); }
      else if (e.code === 'Escape' || e.code === 'KeyQ') { Sfx.click(); close(); }
    }, true);
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
      this.closeBag(false);
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

  // 게임이 스스로 새로고침했고 (새 버전, 새 맵) 그 전에 여럿이 하기 중이었으면 시작 화면 없이 그 방으로 바로 (방장은 같은 번호로 다시 열고,
  // 손님은 방이 열릴 때까지 기다린다). 사람이 F5 하면 시작 화면 (이름은 이 탭 이름이 채워져 있다). 소리는 브라우저 규칙상 첫 키/터치 뒤부터 난다
  async autoResume() {
    const s = Session.get();
    if (!Session.takeResume() || !s || !/^\d{4}$/.test(s.code || '') || !$('#name-input').value.trim()) return;
    addEventListener('pointerdown', () => { Sfx.unlock(); Speech.unlock(); }, { once: true, capture: true });
    addEventListener('keydown', () => { Sfx.unlock(); Speech.unlock(); }, { once: true, capture: true });
    $('#mp-panel').classList.remove('hidden');
    if (ONE_ROOM) { await this.startShared(); return; }
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
  // 크롬은 숨은 탭의 setInterval 을 5분 뒤부터 1분에 한 번만 돌린다 (방장이면 동물이 멈추고 안 쓰러진다).
  // Worker 타이머는 그렇게 느려지지 않아서, Worker 가 0.25초마다 깨워 준다 (안 되면 setInterval)
  keepAliveInBackground() {
    const tick = () => { if ((document.hidden || SERVER_CH) && Multi.online) this.step(performance.now()); };
    try {
      const src = 'setInterval(() => postMessage(0), 250);';
      const worker = new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
      worker.onmessage = tick;
    } catch (err) {
      console.warn('[Game] Worker 안 됨 → setInterval', err);
      setInterval(tick, 250);
    }
  },

  update(dt) {
    const playing = this.state === 'play';
    if (playing && Buddy.on) Buddy.update(dt);
    if (playing) Player.update(dt);
    else Player.moving = false;
    // 세상(아이템, 몬스터)은 방장/혼자 기기가 돌린다. 혼자 할 때는 카드/제작 중에 멈추고,
    // 여럿이 할 때는 다른 사람이 계속 놀 수 있게 계속 돌린다. 손님 기기는 받아서 그리기만 한다
    if (!Multi.isGuest && (playing || Multi.isHost)) {
      Items.respawn();
      Monsters.update(dt);
    }
    if (playing || Multi.online) Monsters.updateArrows(dt);
    // 보스, 모자란 동물, 네잎클로버: 방장/혼자/서버 기기 (여럿이 할 때는 카드 중에도)
    if (!Multi.isGuest && (playing || Multi.isHost)) {
      if (!Monsters.bossSpawned && Monsters.kills >= Monsters.nextBossAt) Monsters.spawnBoss();
      Monsters.upkeep(dt);
    }
    if (this.state !== 'play') return; // 화살로 처치해서 상태가 바뀌었을 수 있다
    Items.pickup();
    this.checkRegion(dt);
    this.checkMaze();
    this.checkStation();
    Monsters.touch();
    if (this.state !== 'play') return; // 다쳐서 기절했을 수 있다
    const onDoor = World.tileAtPx(Player.x, Player.y) === TILE.DOOR;
    if (onDoor && !this.wasOnDoor && !Buddy.on) this.enterHome();
    this.wasOnDoor = onDoor;
  },

  onAction() {
    if (this.state === 'title') { this.start(); return; }
    if (this.state === 'card') { Card.tapPass(); return; }
    if (this.state === 'play' && Player.swingT <= 0.1) {
      Player.swingT = 0.25;
      if (this.heldBlock) { this.place(); return; }
      if (this.heldFood) { this.throwFood(); return; }
      if (this.heldPotion) { this.drink(this.heldPotion); return; }
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

  // 캘 칸: 바라보는 옆칸, 아니면 밟고 있는 꽃/네잎클로버
  // 사람이 서 있는 다리는 캐지 않는다 (캐면 물이 되어 갇힌다)
  digTile() {
    const f = this.frontTile(), me = { x: Math.floor(Player.x / T), y: Math.floor(Player.y / T) };
    if (World.diggable(f.x, f.y) && !(DIG[World.tile(f.x, f.y)].after === TILE.WATER && this.someoneOn(f.x, f.y))) return f;
    // 밟고 있는 칸은 꽃과 네잎클로버만 (발밑 풀밭을 캐지 않게)
    return [TILE.FLOWER, TILE.LUCKY].includes(World.tile(me.x, me.y)) ? me : null;
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
    // 놓았던 블록을 캐면 그 아래 원래 땅 (모래 위에 놓았으면 모래)
    const ok = await Multi.editTile(i, tt, dig.after ?? (World.base[i] === TILE.SAND ? TILE.SAND : TILE.GRASS));
    this.busy = false;
    if (ok) dig.gives.forEach(type => this.addItem(type));
    if (ok && tt === TILE.LUCKY) this.onClover();
  },

  // ---------- 탄(스테이지) ----------
  // 🍀 네잎클로버를 찾았다: 축하 + 단어 카드, 방장에게 알린다 (모두 합쳐 몇 개마다 🦅 독수리)
  onClover() {
    Sfx.success();
    for (let i = 0; i < 5; i++) Floaters.add(Player.x + randFloat(-18, 18), Player.y - randFloat(10, 34), i % 2 ? '✨' : '🍀', 16);
    if (Multi.isGuest) Multi.send('luck', 'H');
    else Monsters.addLuck();
    if (Buddy.on) return;
    if (Store.settings.lang === 'en') Speech.speak('A four-leaf clover!', 'en');
    else Speech.speak('네잎클로버를 찾았어요!', 'ko');
    if (Words.all.some(w => w.emoji === '🍀')) this.showCards(1, '🍀').then(() => { this.state = 'play'; });
  },

  // 1탄 용을 잡아서 테두리 나무 하나가 ✨ 황금 나무가 됐다 (모든 기기)
  onGateGold(x, y) {
    if (this.state === 'title' || this.state === 'loading' || performance.now() - (this.playAt || 0) < 4000) return;
    Sfx.success();
    toast('✨🌳 → 🍀');
    if (Store.settings.lang === 'en') Speech.speak('A golden tree appeared! Chop it to go to the next stage!', 'en');
    else Speech.speak('황금 나무가 생겼어요! 잘라서 다음 탄으로 가요!', 'ko');
  },

  // 황금 나무를 캐서 다음 탄 길이 열렸다 (모든 기기)
  onGateOpen(x, y) {
    if (this.state === 'title' || this.state === 'loading' || performance.now() - (this.playAt || 0) < 4000) return;
    for (let i = 0; i < 6; i++) Floaters.add(x * T + T / 2 + randFloat(-16, 16), y * T + randFloat(-10, 10), '✨', 16);
    const third = y === CONFIG.STAGE_H - 1; // 2탄 아래 테두리 = 3탄 입구
    toast(third ? '🧭 3탄!' : '🍀 2탄!');
    if (Store.settings.lang === 'en') Speech.speak(third ? 'Stage three is open!' : 'Stage two is open!', 'en');
    else Speech.speak(third ? '3탄 절벽 미로가 열렸어요!' : '2탄 클로버 들판이 열렸어요!', 'ko');
  },

  // 그 탄의 보스를 잡았다 (모든 기기)
  onStageClear(n) {
    Sfx.success();
    toast(`🎉 ${n}탄 클리어!`);
    if (Store.settings.lang === 'en') Speech.speak(`Stage ${n} clear!`, 'en');
    else Speech.speak(`${n}탄 클리어! 최고예요!`, 'ko');
  },

  // 놓을 수 있는 칸: 풀밭/모래이고, 사람/몬스터/아이템이 없고, 집 문 앞이 아닌 곳
  canPlace(tx, ty) {
    if (tx <= 0 || ty <= 0 || tx >= World.w - 1 || ty >= World.h - 1) return false;
    const tt = World.tile(tx, ty), def = ITEMS[this.heldBlock], next = def && TILE[def.tile];
    // 다리는 물 위에만, 나머지는 풀밭/모래에만
    if (next === TILE.BRIDGE ? tt !== TILE.WATER : !PLACE_ON.has(tt)) return false;
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
  throwFood(target) {
    const food = this.heldFood;
    this.inventory[food]--;
    if (!this.inventory[food]) this.picked = this.lastWeapon;
    Sfx.swing();
    Monsters.throwFood(food, target);
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

  // 3탄 🧭 미로: 지나온 칸에 발자국 (큰 지도에 하늘색으로), 끝의 🎁 보물 상자 옆에 가면 💎 보석 + 축하, 잠시 뒤 입구로
  checkMaze() {
    const tx = Math.floor(Player.x / T), ty = Math.floor(Player.y / T), goal = World.mazeGoal;
    if (World.stageAt(tx, ty) !== 2 || !goal) return;
    if (!World.trail) {
      World.trail = document.createElement('canvas');
      World.trail.width = World.w;
      World.trail.height = World.h;
    }
    const tg = World.trail.getContext('2d');
    tg.fillStyle = '#29b6f6';
    tg.fillRect(tx, ty, 1, 1);
    const near = Math.hypot(Player.x - (goal.x * T + T / 2), Player.y - (goal.y * T + T / 2)) < T * 1.4;
    if (!near || this.mazeDone) return;
    this.mazeDone = true;
    Sfx.success();
    for (let i = 0; i < 8; i++) Floaters.add(goal.x * T + T / 2 + randFloat(-24, 24), goal.y * T - randFloat(0, 30), i % 2 ? '✨' : '💎', 18);
    toast(tr('🎁 미로 탈출! 🎉', '🎁 You solved the maze! 🎉'));
    if (Store.settings.lang === 'en') Speech.speak('You found the treasure! Great job!', 'en');
    else Speech.speak('보물을 찾았어요! 미로 탈출 성공!', 'ko');
    this.addItem('gem');
    // 축하가 끝나면 미로 입구로 (발자국도 지우고 처음부터 다시 해 볼 수 있게)
    setTimeout(() => {
      this.mazeDone = false;
      if (this.state !== 'play' || World.stageAtPx(Player.x, Player.y) !== 2) return;
      World.trail.getContext('2d').clearRect(0, 0, World.w, World.h);
      Player.x = World.mazeStart.x * T + T / 2;
      Player.y = World.mazeStart.y * T + T / 2;
      for (let i = 0; i < 5; i++) Floaters.add(Player.x + randFloat(-16, 16), Player.y - randFloat(0, 24), '✨', 16);
    }, 3500);
  },

  // 2탄 ⛺ 텐트 / 3탄 ⚒️ 대장간에 몸이 닿으면 제작대 (한 번 열면 떨어졌다가 다시 와야 또 열린다)
  checkStation() {
    const st = World.stationIn(World.stageAtPx(Player.x, Player.y));
    const d = st ? Math.max(Math.abs(Player.x - (st.x * T + T / 2)), Math.abs(Player.y - (st.y * T + T / 2))) : Infinity;
    if (d > T * 1.3) { this.atStation = false; return; }
    if (d > T * 0.85 || this.atStation || Buddy.on) return;
    this.atStation = true;
    this.openStation(st);
  },

  async openStation(st) {
    this.state = 'craft';
    Input.reset();
    Sfx.door();
    toast(`${STATION_EMOJI[st.kind]} ${tr(st.kind === 'tent' ? '클로버 텐트' : '대장간', st.kind === 'tent' ? 'Clover tent' : 'Forge')}`);
    await Craft.show(STATION_EMOJI[st.kind]);
    this.state = 'play';
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
    if (!Social.wordsOn) return; // 📖 단어 OFF: 카드 없이 그냥 논다
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
    if (Buddy.on) {
      if (!m.def.boss) this.kills++;
      Buddy.onKill();
      return;
    }
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
        const w = WEAPONS[r.result] || ITEMS[r.result];
        toast(`🔓 ${iconHtml(w)} ${itemNames(w).main}`);
      }
    }
    this.state = 'play';
  },

  // m: 몬스터 또는 다른 사람 캐릭터(isPlayer). 맞으면 빨갛게 번쩍이며 때린 쪽 반대로 밀린다
  hurt(m) {
    if (this.state !== 'play' || Player.invulnT > 0) return;
    // 🛡️ 방패: 두 번에 한 번 막는다
    if (this.inventory.shield > 0 && (this.shieldBlock = !this.shieldBlock)) {
      Player.invulnT = CONFIG.INVULN_SEC;
      Sfx.click();
      Floaters.add(Player.x, Player.y - 30, '🛡️', 18);
      return;
    }
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
    } else {
      if (this.hearts === 1) this.autoEat();
      if (m.isPlayer && Buddy.on) Buddy.onHit(m);
    }
  },

  // 체력이 1 남으면 가방의 하트나 음식을 자동으로 먹는다
  autoEat() { this.eatOne(); },

  // ---------- 💬 말풍선 칸 (C 키 / 💬 버튼): 말 / 표정 / 하기(먹기, 주기) ----------
  get talkOpen() { return !$('#talk-panel').classList.contains('hidden'); },

  talkRows() {
    const rows = [
      { icon: '✏️', ko: '쓰기', en: 'Write', items: [{ write: true }] },
      { icon: '💬', ko: '말', en: 'Say', items: SAY_WORDS.map(([ko, en]) => ({ html: tr(ko, en), cls: 'say-choice', act: () => Social.say(tr(ko, en)) })) },
      { icon: '😊', ko: '표정', en: 'Face', items: SAY_EMOJI.map(e => ({ html: e, act: () => Social.emote(e) })) },
    ];
    const peer = Social.nearPeer(4), held = this.heldBlock || this.heldFood || this.heldPotion, items = [];
    if (this.hearts < CONFIG.MAX_HEARTS && this.edible()) items.push({ html: '😋', label: tr('먹기', 'Eat'), act: () => this.eatOne() });
    if (peer && held) items.push({ html: `🎁${iconHtml(ITEMS[held])}`, label: tr('주기', 'Give'), act: () => { if (Social.give(peer)) Social.say(tr('선물이야!', 'For you!')); } });
    if (peer && Monsters.list.some(m => m.owner === Multi.sid)) {
      items.push({ html: '🎁🐾', label: tr('동물 주기', 'Give pet'), act: () => { if (Social.givePet(peer)) Social.say(tr('선물이야!', 'For you!')); } });
    }
    if (items.length) rows.push({ icon: '🎁', ko: '하기', en: 'Do', items });
    return rows;
  },

  // write: 열자마자 ✏️ 쓰기 칸에 글자 쓰기 (Enter 로 열 때)
  toggleTalk(write = false) {
    const panel = $('#talk-panel');
    if (this.talkOpen) return this.closeTalk(false);
    if (this.state !== 'play') return;
    this.closeBag(false);
    Input.reset();
    this.talk = { rows: this.talkRows(), r: 0, c: 0 };
    panel.innerHTML = '';
    this.talk.rows.forEach((g, r) => {
      const row = document.createElement('div');
      row.className = 'pick-row';
      row.innerHTML = `<div class="pick-label"><span>${g.icon}</span>${tr(g.ko, g.en)}</div>`;
      const box = document.createElement('div');
      box.className = 'pick-items';
      g.items.forEach((it, c) => {
        if (it.write) { box.appendChild(this.talkWriter(`${r},${c}`)); return; }
        const btn = document.createElement('button');
        btn.className = `big-btn weapon-choice ${it.cls || ''}`;
        btn.dataset.pick = `${r},${c}`;
        btn.innerHTML = it.label ? `${it.html}<i>${it.label}</i>` : it.html;
        btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.chooseTalk(it); });
        box.appendChild(btn);
      });
      row.appendChild(box);
      panel.appendChild(row);
    });
    panel.classList.remove('hidden');
    this.markTalk();
    if (write) $('#talk-panel .talk-input').focus(); // ✏️ 쓰기 칸이 첫 줄 첫 칸 (r 0, c 0)
  },

  // ✏️ 직접 쓰기: 20글자까지 쓰고 Enter 또는 💬 를 누르면 말풍선으로
  talkWriter(pick) {
    const wrap = document.createElement('div');
    wrap.className = 'talk-write';
    wrap.dataset.pick = pick;
    wrap.innerHTML = `<input class="talk-input" maxlength="${SAY_MAX}" enterkeyhint="send" autocomplete="off"
      placeholder="${tr(`${SAY_MAX}글자까지 쓰기`, `Up to ${SAY_MAX} letters`)}"><span class="talk-count">0/${SAY_MAX}</span>
      <button class="big-btn talk-send" aria-label="send">💬</button>`;
    const input = wrap.querySelector('input'), count = wrap.querySelector('.talk-count');
    const send = () => {
      const text = Array.from(input.value.trim()).slice(0, SAY_MAX).join('').trim();
      if (!text) { input.focus(); return; }
      Sfx.click();
      this.closeTalk(false);
      Social.say(text);
    };
    input.addEventListener('input', () => { count.textContent = `${Array.from(input.value).length}/${SAY_MAX}`; });
    // 쓰는 동안에는 게임 키(이동, C, J 등)가 먹지 않게
    input.addEventListener('keydown', e => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); send(); }
      if (e.key === 'Escape') this.closeTalk();
    });
    input.addEventListener('keyup', e => e.stopPropagation());
    input.addEventListener('pointerdown', e => e.stopPropagation());
    wrap.querySelector('.talk-send').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); send(); });
    return wrap;
  },

  chooseTalk(it) {
    if (it.write) { $('#talk-panel .talk-input').focus(); return; } // 키보드로 ✏️ 를 고르면 쓰기 칸으로
    Sfx.click();
    this.closeTalk(false);
    it.act();
  },

  markTalk() {
    const at = `${this.talk.r},${this.talk.c}`;
    $('#talk-panel').querySelectorAll('[data-pick]').forEach(b => b.classList.toggle('sel', b.dataset.pick === at));
  },

  // ←→ 줄 안에서, ↑↓ 다른 줄로, Enter/Space 고르기, C/Esc 닫기
  talkKey(code) {
    const t = this.talk, rows = t.rows;
    const dx = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 }[code];
    const dy = { ArrowUp: -1, KeyW: -1, ArrowDown: 1, KeyS: 1 }[code];
    if (dx) {
      const n = rows[t.r].items.length;
      t.c = (t.c + dx + n) % n;
    } else if (dy) {
      t.r = (t.r + dy + rows.length) % rows.length;
      t.c = Math.min(t.c, rows[t.r].items.length - 1);
    } else if (code === 'Enter' || code === 'Space') {
      this.chooseTalk(rows[t.r].items[t.c]);
      return;
    } else if (code === 'KeyC' || code === 'Escape') {
      this.closeTalk();
      return;
    } else return;
    this.markTalk();
    Sfx.click();
  },

  closeTalk(sound = true) {
    const panel = $('#talk-panel');
    if (panel.classList.contains('hidden')) return;
    if (panel.contains(document.activeElement)) document.activeElement.blur(); // 태블릿 자판 닫기
    panel.classList.add('hidden');
    if (sound) Sfx.click();
  },

  // 가방에서 먹을 것 (하트 먼저)
  edible() {
    return Object.keys(ITEMS).find(type => ITEMS[type].kind === 'food' && this.inventory[type] > 0) ||
      (this.inventory.redpot > 0 ? 'redpot' : null);
  },

  // 하나 먹기 (💬 칸의 😋, 하트가 1 남았을 때 저절로, 🤝 놀아주기). 먹었으면 true
  eatOne() {
    const food = this.edible();
    if (!food || this.hearts >= CONFIG.MAX_HEARTS) return false;
    this.inventory[food]--;
    const def = ITEMS[food];
    const heal = def.heal || 1;
    this.hearts = Math.min(CONFIG.MAX_HEARTS, this.hearts + heal);
    toast(`${iconHtml(def)} ${itemNames(def).main} ❤️+${heal}`);
    Sfx.pickup();
    this.renderInventory();
    this.renderHearts();
    return true;
  },

  onPetGift(def) {
    Sfx.success();
    toast(`🎁 ${iconHtml(def)} ${itemNames(def).main}`);
    if (Store.settings.lang === 'en') Speech.speak(`You got a ${def.en}!`, 'en');
    else Speech.speak(`${josa(def.ko, '을', '를')} 선물 받았어요!`, 'ko');
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
    if (!Buddy.on) await this.showCards(1);
    Player.invulnT = CONFIG.SPAWN_INVULN_SEC;
    this.state = 'play';
  },

  // 위쪽 가방(아이템) 칸: 🎒 버튼을 눌렀을 때만 보인다 (폰에서 화면을 덜 가리게). PC 는 처음부터 펼침
  // ---------- ? 단축키 설명 (작은 지도 아래 ? 버튼 / ? 키) ----------
  get helpOpen() { return !$('#help-panel').classList.contains('hidden'); },

  initHelp() {
    $('#btn-help').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.setHelp(!this.helpOpen); });
    $('#help-panel').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.setHelp(false); });
    // 🗺️ 작은 지도를 누르면 크게 (다시 누르면 작게). 크게 보면서도 움직일 수 있어서 지도를 보며 길을 찾는다
    $('#minimap').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.setBigMap(!this.bigMap); });
  },

  bigMap: false,
  setBigMap(on) {
    if (on && this.state !== 'play') return;
    this.bigMap = on;
    $('#minimap').classList.toggle('big', on);
    Sfx.click();
  },

  setHelp(open) {
    const panel = $('#help-panel');
    if (open) {
      this.closeBag(false);
      this.closeTalk(false);
      Input.reset();
      const rows = [
        ['🚶', '움직이기', 'Move', 'WASD / ← ↑ → ↓', '왼쪽 아래 조이스틱', 'Joystick'],
        ['✋', '때리기 · 캐기 · 놓기 · 먹이 던지기', 'Hit · Dig · Place · Throw food', 'Space', '✋ 큰 버튼', 'Big ✋ button'],
        ['🗡️', '손에 들 것 (무기 · 블록 · 음식 · 물약)', 'Hold (weapon · block · food · potion)', '1 / 2 / 3 / 4', '아래 주머니 4칸', '4 pockets at the bottom'],
        ['🔁', '같은 칸의 다음 것', 'Next in the same pocket', 'Q', '같은 칸 한 번 더', 'Tap the pocket again'],
        ['🦘', '점프', 'Jump', 'J', '🦘 버튼', '🦘 button'],
        ['💬', '말하기 (✏️ 쓰기, 표정, 먹기, 주기)', 'Talk (write, faces, eat, give)', 'C / Enter', '💬 버튼', '💬 button'],
        ['🎒', '가방 (옷 입고 벗기, 아이템 보기)', 'Bag (wear clothes, see items)', 'B', '하트 옆 🎒', '🎒 next to hearts'],
        ['🗺️', '지도 크게 보기 · 작게', 'Big map', 'M', '오른쪽 위 지도 누르기', 'Tap the map'],
        ['📖', '카드 다 읽었어요', 'Card done', 'Space / Enter', '✅ 버튼', '✅ button'],
        ['🚪', '가방 · 말하기 칸 닫기', 'Close a panel', 'Esc', '바깥 누르기', 'Tap outside'],
        ['❓', '이 설명 열기 · 닫기', 'This help', '?', '? 버튼', '? button'],
      ];
      const touch = document.body.classList.contains('touch');
      panel.innerHTML = `<div class="help-card"><h2>${tr('❓ 이렇게 해요', '❓ How to play')}</h2><table>${rows.map(([icon, ko, en, key, tko, ten]) =>
        `<tr><td class="help-icon">${icon}</td><td>${tr(ko, en)}</td><td class="help-keys">${key.split(' / ').map(k => `<kbd>${k}</kbd>`).join(' ')}</td>${touch ? `<td class="help-touch">${tr(tko, ten)}</td>` : ''}</tr>`).join('')}</table>
        <p>${tr('아무 곳이나 누르면 닫혀요', 'Tap anywhere to close')}</p></div>`;
    }
    panel.classList.toggle('hidden', !open);
    $('#btn-help').classList.toggle('on', open);
    Sfx.click();
  },

  initBag() {
    $('#btn-bag').addEventListener('pointerdown', e => {
      e.preventDefault();
      e.stopPropagation();
      this.setBag(!this.bagOpen);
      Sfx.click();
    });
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

  // 손에 든 물약 (없으면 null). ✋ 를 누르면 마신다
  get heldPotion() {
    const def = ITEMS[this.picked];
    return def && def.kind === 'potion' && this.inventory[this.picked] > 0 ? this.picked : null;
  },

  // 손에 든 것 (블록, 먹이, 물약 또는 무기)
  get held() { return this.heldBlock || this.heldFood || this.heldPotion || this.weapon; },

  // 물약 마시기: 빨강 ❤️ (다쳤을 때만, 가득이면 아껴 둔다) / 파랑 🏃 빨리 달리기 / 노랑 💡 어두운 곳이 밝다
  drink(id) {
    const def = ITEMS[id];
    if (def.heal && this.hearts >= CONFIG.MAX_HEARTS) {
      Sfx.soft();
      toast(tr('❤️ 하트가 가득해요! 다치면 마셔요', '❤️ Hearts are full! Drink it when you get hurt'));
      return;
    }
    this.inventory[id]--;
    if (!this.inventory[id]) this.picked = this.lastWeapon;
    if (def.heal) this.hearts = Math.min(CONFIG.MAX_HEARTS, this.hearts + def.heal);
    if (def.speed) this.buffs.speed = performance.now() + def.speed * 1000;
    if (def.light) this.buffs.light = performance.now() + def.light * 1000;
    Sfx.success();
    const fx = def.heal ? '❤️' : def.speed ? '💨' : '💡';
    for (let i = 0; i < 5; i++) Floaters.add(Player.x + randFloat(-14, 14), Player.y - randFloat(14, 36), i % 2 ? '✨' : fx, 14);
    const what = def.heal ? `❤️+${def.heal}` : def.speed ? tr(`🏃 ${def.speed}초 빨리!`, `🏃 Fast for ${def.speed}s!`) : tr(`💡 ${def.light}초 환하게!`, `💡 Bright for ${def.light}s!`);
    toast(`${iconHtml(def)} ${itemNames(def).main} ${what}`);
    this.renderInventory();
    this.renderHearts();
  },
  buffLeft(kind) { return Math.max(0, (this.buffs[kind] - performance.now()) / 1000); },

  // 주머니 칸 하나의 것 (무기는 맨손 + 가진 무기, 나머지는 가방에 있는 것)
  pouchIds(key) {
    if (key === 'weapon') return Object.keys(WEAPONS).filter(id => id === 'hand' || this.weapons.has(id));
    return Object.keys(ITEMS).filter(id => pouchOf(id) === key && this.inventory[id] > 0);
  },
  pouchPick: {}, // 주머니 칸마다 마지막에 든 것

  // 그 칸에서 지금 보여 줄 것 (들고 있으면 그것, 아니면 마지막에 든 것)
  pouchShow(key) {
    const ids = this.pouchIds(key), held = this.held;
    if (pouchOf(held) === key) return held;
    if (ids.includes(this.pouchPick[key])) return this.pouchPick[key];
    return key === 'weapon' ? this.weapon : ids[0] || null;
  },

  // 주머니 칸을 눌렀다 (1~4 키): 그 칸의 것을 든다. 이미 그 칸의 것을 들고 있으면 같은 칸의 다음 것
  pouchTap(k) {
    const p = POUCH[k], ids = this.pouchIds(p.key), cur = this.held;
    if (!ids.length) {
      Sfx.soft();
      toast(`${p.icon} ${tr(`${p.ko} 칸이 비어 있어요`, `No ${p.en.toLowerCase()} yet`)}`);
      return;
    }
    const id = pouchOf(cur) === p.key ? ids[(ids.indexOf(cur) + 1) % ids.length] : this.pouchShow(p.key);
    Sfx.click();
    if (id !== cur) this.setWeapon(id);
  },

  // Q: 지금 든 칸의 다음 것
  pouchNext() { this.pouchTap(Math.max(0, POUCH.findIndex(p => p.key === pouchOf(this.held)))); },

  // 옷 입기: 가방에서 꺼내 입는다 (그 곳에 입고 있던 것은 가방으로)
  wear(id, sound = true) {
    const def = ITEMS[id];
    if (!def || def.kind !== 'wear' || !(this.inventory[id] > 0)) return;
    const old = this.equip[def.slot];
    if (old) this.inventory[old] = (this.inventory[old] || 0) + 1;
    this.inventory[id]--;
    if (!this.inventory[id]) delete this.inventory[id];
    this.equip[def.slot] = id;
    if (sound) { Sfx.success(); toast(`${iconHtml(def)} ${itemNames(def).main} 👕`); }
  },

  // 벗기: 가방으로
  takeOff(slot) {
    const id = this.equip[slot];
    if (!id) return false;
    delete this.equip[slot];
    this.inventory[id] = (this.inventory[id] || 0) + 1;
    Sfx.pickup();
    toast(`${iconHtml(ITEMS[id])} ${itemNames(ITEMS[id]).main} → 🎒`);
    return true;
  },

  setWeapon(id) {
    this.picked = id;
    if (WEAPONS[id]) this.lastWeapon = id;
    if (pouchOf(id)) this.pouchPick[pouchOf(id)] = id;
    this.closeBag(false);
    this.renderInventory();
    const def = WEAPONS[id] || ITEMS[id];
    toast(`${iconHtml(def)} ${itemNames(def).main}`);
  },

  // ---------- 🎒 가방 (B / 하트 옆 🎒): 왼쪽 내 모습 + 입는 곳, 오른쪽 쓰임별 아이템. 누르면 아래에 설명과 버튼 하나 ----------
  get bagOpen() { return !$('#bag-panel').classList.contains('hidden'); },

  setBag(open) {
    if (open === this.bagOpen) return;
    if (open) {
      if (this.state !== 'play') return;
      Input.reset();
      this.closeTalk(false);
      this.bagSel = null;
      this.renderBag();
    }
    $('#bag-panel').classList.toggle('hidden', !open);
    $('#btn-bag').classList.toggle('on', open);
  },

  closeBag(sound = true) {
    if (!this.bagOpen) return;
    this.setBag(false);
    if (sound) Sfx.click();
  },

  renderBag() {
    const panel = $('#bag-panel');
    const has = t => this.inventory[t] > 0, of = kind => Object.keys(ITEMS).filter(t => ITEMS[t].kind === kind && !ITEMS[t].tile && has(t));
    const groups = [
      { icon: '⚔️', ko: '장비', en: 'Gear', ids: [...Object.keys(WEAPONS).filter(id => this.weapons.has(id)), ...of('gear'), ...of('wear')] },
      { icon: '🪵', ko: '재료', en: 'Materials', ids: of('material') },
      { icon: '🧱', ko: '블록', en: 'Blocks', ids: Object.keys(ITEMS).filter(t => ITEMS[t].tile && has(t)) },
      { icon: '🍎', ko: '음식', en: 'Food', ids: of('food') },
      { icon: '⚗️', ko: '물약', en: 'Potions', ids: of('potion') },
    ];
    this.bagCells = [...WEAR_SLOTS.map(w => `slot:${w.slot}`), ...groups.flatMap(g => g.ids)];
    if (!this.bagCells.includes(this.bagSel)) this.bagSel = null;
    const cell = id => {
      const sel = id === this.bagSel ? ' sel' : '';
      if (id.startsWith('slot:')) {
        const w = WEAR_SLOTS.find(x => x.slot === id.slice(5)), on = this.equip[w.slot];
        return `<button class="bag-cell wear-cell${on ? ' on' : ' empty'}${sel}" data-cell="${id}">${on ? iconHtml(ITEMS[on]) : ''}<i>${tr(w.ko, w.en)}</i></button>`;
      }
      const def = WEAPONS[id] || ITEMS[id];
      return `<button class="bag-cell${sel}" data-cell="${id}">${iconHtml(def)}${ITEMS[id] ? `<b>${this.inventory[id]}</b>` : ''}<i>${itemNames(def).main}</i></button>`;
    };
    panel.innerHTML = `<div class="bag-head"><span>🎒 ${tr('가방', 'Bag')}</span><button class="bag-close" aria-label="close">✖</button></div>
      <div class="bag-body">
        <div class="bag-me"><canvas class="bag-look"></canvas><div class="bag-wear">${WEAR_SLOTS.map(w => cell(`slot:${w.slot}`)).join('')}</div></div>
        <div class="bag-items">${groups.map(g => `<div class="bag-group"><div class="bag-group-label"><span>${g.icon}</span>${tr(g.ko, g.en)}</div>` +
          `<div class="bag-cells">${g.ids.length ? g.ids.map(cell).join('') : '<span class="bag-none">·</span>'}</div></div>`).join('')}</div>
      </div>
      <div class="bag-info">${this.bagInfo()}</div>`;
    panel.querySelectorAll('[data-cell]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.bagSelect(b.dataset.cell); }));
    panel.querySelectorAll('[data-act]').forEach(b => b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.bagAct(b.dataset.act); }));
    panel.querySelector('.bag-close').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.closeBag(); });
    // 내 모습 (입은 옷, 손에 든 것까지)
    const c = panel.querySelector('.bag-look'), dpr = Math.min(window.devicePixelRatio || 1, 2), saved = Render.ctx;
    c.width = 72 * dpr;
    c.height = 104 * dpr;
    Render.ctx = c.getContext('2d');
    Render.ctx.setTransform(2.4 * dpr, 0, 0, 2.4 * dpr, 0, 0);
    Render.drawCharacter({ x: 15, y: 34, dir: 'down', moving: false, walkT: 0, swingT: 0 }, Multi.myLook(), this.held, '', false, null, wornList(this.equip));
    Render.ctx = saved;
  },

  // 고른 칸의 아이템 id (입는 곳이면 입은 옷, 비었으면 null)
  bagItem() {
    const sel = this.bagSel;
    return !sel ? null : sel.startsWith('slot:') ? this.equip[sel.slice(5)] || null : sel;
  },

  // 아래 설명 줄: 큰 그림 + 이름 + 하는 일 + 버튼 (입기 / 벗기 / 들기 / 먹기 / 마시기)
  bagInfo() {
    const sel = this.bagSel, id = this.bagItem();
    if (!sel) return `<p class="bag-hint">${tr('👆 아이템을 눌러 보세요', '👆 Tap an item')}</p>`;
    if (!id) {
      const w = WEAR_SLOTS.find(x => x.slot === sel.slice(5));
      return `<p class="bag-hint">${tr(`${w.ko}: 비어 있어요. 옷을 누르고 👕 입기`, `${w.en}: empty. Tap clothes, then 👕 Put on`)}</p>`;
    }
    const def = WEAPONS[id] || ITEMS[id], { main, sub } = itemNames(def), acts = [];
    if (sel.startsWith('slot:')) acts.push(['off', '👕', '벗기', 'Take off']);
    else if (def.kind === 'wear') acts.push(['wear', '👕', '입기', 'Put on']);
    if (!sel.startsWith('slot:') && pouchOf(id)) acts.push(['hold', '✋', '들기', 'Hold']);
    if (def.kind === 'food') acts.push(['eat', '😋', '먹기', 'Eat']);
    if (def.kind === 'potion') acts.push(['drink', '🧪', '마시기', 'Drink']);
    return `<span class="bag-info-icon">${iconHtml(def)}</span>
      <div class="bag-info-text"><b>${main}</b>${sub ? ` <small>${sub}</small>` : ''}<p>${itemDesc(id)}</p></div>
      <div class="bag-acts">${acts.map(([act, icon, ko, en]) => `<button class="big-btn bag-act" data-act="${act}">${icon} ${tr(ko, en)}</button>`).join('')}</div>`;
  },

  // 가방에서 하나 눌렀다: 고르고 이름을 읽어 준다
  bagSelect(id) {
    this.bagSel = id;
    Sfx.click();
    const item = this.bagItem();
    if (item) {
      const def = WEAPONS[item] || ITEMS[item];
      if (Store.settings.lang === 'en') Speech.speak(def.en, 'en'); else Speech.speak(def.ko, 'ko');
    }
    this.renderBag();
  },

  bagAct(act) {
    const id = this.bagItem();
    if (!id) return;
    if (act === 'off') { this.takeOff(this.bagSel.slice(5)); this.bagSel = id; }
    else if (act === 'wear') { this.wear(id); this.bagSel = `slot:${ITEMS[id].slot}`; }
    else if (act === 'hold') { Sfx.click(); this.setWeapon(id); return; }
    else if (act === 'drink') this.drink(id);
    else if (act === 'eat') {
      if (this.hearts >= CONFIG.MAX_HEARTS) { Sfx.soft(); toast(tr('❤️ 하트가 가득해요!', '❤️ Hearts are full!')); return; }
      const def = ITEMS[id];
      this.inventory[id]--;
      if (!this.inventory[id]) delete this.inventory[id];
      this.hearts = Math.min(CONFIG.MAX_HEARTS, this.hearts + def.heal);
      toast(`${iconHtml(def)} ${itemNames(def).main} ❤️+${def.heal}`);
      Sfx.pickup();
      this.renderHearts();
    }
    this.renderInventory();
  },

  // 가방 키보드: ←→↑↓ 고르기, Enter/스페이스 첫 버튼, B/Esc 닫기
  bagKey(code) {
    const cells = this.bagCells || [], i = cells.indexOf(this.bagSel);
    if (code === 'Escape' || code === 'KeyB') { this.closeBag(); return; }
    if (['ArrowRight', 'ArrowDown', 'KeyD', 'KeyS'].includes(code)) this.bagSelect(cells[(i + 1) % cells.length]);
    else if (['ArrowLeft', 'ArrowUp', 'KeyA', 'KeyW'].includes(code)) this.bagSelect(cells[(i - 1 + cells.length) % cells.length]);
    else if (code === 'Enter' || code === 'Space') {
      const btn = $('#bag-panel [data-act]');
      if (btn) this.bagAct(btn.dataset.act); else Sfx.soft();
    }
  },

  addItem(type) {
    const def = ITEMS[type];
    this.seen.add(type);
    if (def.kind === 'heart') {
      this.hearts = Math.min(CONFIG.MAX_HEARTS, this.hearts + CONFIG.HEART_HEAL);
      Sfx.pickup();
      toast(`❤️ +${CONFIG.HEART_HEAL}`);
      this.renderHearts();
      return;
    }
    // 다쳤을 때 음식을 주우면 바로 먹는다
    if (def.kind === 'food' && this.hearts < CONFIG.MAX_HEARTS) {
      this.hearts = Math.min(CONFIG.MAX_HEARTS, this.hearts + (def.heal || 1));
      Sfx.pickup();
      toast(`${iconHtml(def)} ${itemNames(def).main} ❤️+${def.heal || 1}`);
      this.renderHearts();
      return;
    }
    this.inventory[type] = (this.inventory[type] || 0) + 1;
    Sfx.pickup();
    const { main, sub } = itemNames(def);
    toast(`${iconHtml(def)} ${main}${sub ? ` <small>${sub}</small>` : ''} +1`);
    this.renderInventory(type);
  },

  // 손에 든 것이 바뀌거나 가방이 바뀌면: ✋ 버튼 그림, 아래 주머니 4칸, (열려 있으면) 가방
  renderInventory(bumpType) {
    $('#btn-action').innerHTML = iconHtml(WEAPONS[this.held] || ITEMS[this.held]);
    this.renderPouch(bumpType);
    if (this.bagOpen) this.renderBag();
  },

  renderPouch(bump) {
    const el = $('#pouch'), held = this.held;
    el.innerHTML = '';
    POUCH.forEach((p, k) => {
      const ids = this.pouchIds(p.key), id = this.pouchShow(p.key), on = pouchOf(held) === p.key;
      const btn = document.createElement('button');
      btn.className = `pouch-slot${on ? ' on' : ''}${id ? '' : ' empty'}${ids.length > 1 ? ' more' : ''}${bump && pouchOf(bump) === p.key ? ' bump' : ''}`;
      btn.setAttribute('aria-label', p.en);
      btn.innerHTML = (id ? `${iconHtml(WEAPONS[id] || ITEMS[id])}${ITEMS[id] ? `<b>${this.inventory[id]}</b>` : ''}` : `<span class="pouch-empty">${p.icon}</span>`) + `<i>${k + 1}</i>`;
      btn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); this.pouchTap(k); });
      el.appendChild(btn);
    });
  },
};

// ============================================================
// Social — 💬 말풍선 / 🦘 점프 / 🎁 주기 / 😋 먹기: 모든 캐릭터가 쓸 수 있다 (🤝 놀아주기도 같은 것을 쓴다).
//          말풍선은 다른 사람 화면에도 뜨고, 가까이 있으면 소리로 읽어 준다 (글자 읽기 연습)
// ============================================================
const SAY_WORDS = [
  ['안녕!', 'Hi!'], ['같이 가자!', "Let's go!"], ['이리 와!', 'Come here!'], ['고마워!', 'Thank you!'],
  ['최고야!', 'Awesome!'], ['도와줘!', 'Help me!'], ['사랑해!', 'I love you!'], ['내가 지켜줄게!', "I'll protect you!"],
  ['잡아 봐라~', 'Catch me!'], ['선물이야!', 'For you!'],
];
const SAY_EMOJI = ['😊', '😆', '👍', '💕', '👋', '🎉', '😮', '😢'];
const SAY_SEC = 3;
const BUDDY_DEFAULT = '지율'; // 🤝 놀아주기를 켜면 처음 골라져 있는 사람
const SAY_MAX = 20; // 글자 수 (직접 쓰는 말도 20글자까지)
const JUMP_SEC = 0.45;
const tr = (ko, en) => (Store.settings.lang === 'en' ? en : ko);
const sayLang = text => (/[가-힣]/.test(text) ? 'ko' : 'en');

const Social = {
  // 🔊 음성 ON/OFF: 모든 사람의 말풍선을 소리로 읽어 줄지 (이 기기에만 저장, 처음엔 ON)
  voiceOn: Store.get('bc.sayVoice', true) !== false,

  initVoice() {
    const btn = $('#btn-voice');
    const show = () => {
      btn.classList.toggle('on', this.voiceOn);
      btn.innerHTML = `${this.voiceOn ? '🔊' : '🔇'}<span>${tr('음성', 'Voice')} ${this.voiceOn ? 'ON' : 'OFF'}</span>`;
    };
    btn.addEventListener('click', () => {
      this.voiceOn = !this.voiceOn;
      Store.set('bc.sayVoice', this.voiceOn);
      if (!this.voiceOn) window.speechSynthesis?.cancel(); // 읽던 것도 멈춘다
      show();
      toast(this.voiceOn ? '🔊 ON' : '🔇 OFF');
    });
    show();
  },
  // 📖 단어 ON/OFF: 단어 카드를 낼지 (어른은 끄고 논다). 탭마다 기억하고, 새 탭은 이 기기에서 마지막으로 고른 것 (처음엔 ON)
  wordsOn: (TabStore.get('bc.words', null) ?? Store.get('bc.words', true)) !== false,

  initWords() {
    const btn = $('#btn-words');
    const show = () => {
      btn.classList.toggle('on', this.wordsOn);
      btn.innerHTML = `📖<span>${tr('단어', 'Words')} ${this.wordsOn ? 'ON' : 'OFF'}</span>`;
    };
    btn.addEventListener('click', () => {
      this.wordsOn = !this.wordsOn;
      TabStore.set('bc.words', this.wordsOn);
      Store.set('bc.words', this.wordsOn);
      show();
      toast(`📖 ${this.wordsOn ? 'ON' : 'OFF'}`);
    });
    show();
  },
  // voice: 내 기기에서도 읽어 줄지 (🤝 놀아주기가 저절로 하는 말은 내 기기에서는 읽지 않는다)
  say(text, voice = true) {
    Player.sayText = String(text).slice(0, SAY_MAX);
    Player.sayT = SAY_SEC;
    Player.saySeq = (Date.now() % 1e8) + Math.random(); // 다른 사람이 새 말인지 알아보게
    if (voice && Game.state === 'play' && this.voiceOn) Speech.speak(Player.sayText, sayLang(Player.sayText));
  },

  emote(icon) {
    Player.emote = icon;
    Player.emoteT = 1.6;
  },

  jump() {
    if (Player.jumpT > 0 || Game.state !== 'play') return false;
    Player.jumpT = JUMP_SEC;
    Sfx.jump();
    return true;
  },

  // 가까이 있는 사람 (r 칸 안, 가장 가까운)
  nearPeer(r) {
    let best = null, bd = r * T;
    for (const p of Multi.activePeers()) {
      const d = Math.hypot(p.x - Player.x, p.y - Player.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  },

  // 손에 든 블록/먹이 하나를 그 사람 발밑에 놓아 준다 (그 사람이 줍는다)
  give(to) {
    const id = Game.heldBlock || Game.heldFood || Game.heldPotion;
    if (!id || !to) return false;
    const dx = Player.x - to.x, dy = Player.y - to.y, d = Math.hypot(dx, dy) || 1;
    let x = to.x + dx / d * 0.3 * T, y = to.y + dy / d * 0.3 * T;
    if (!World.canStand(x, y, 6)) { x = to.x; y = to.y; }
    Game.inventory[id]--;
    if (!Game.inventory[id]) Game.picked = Game.lastWeapon;
    if (Multi.isGuest) Multi.send('drop', 'H', id, Math.round(x), Math.round(y));
    else Items.add(id, x, y, { dropped: true });
    Floaters.add(to.x, to.y - 36, '🎁', 18);
    Sfx.pickup();
    Game.renderInventory();
    return true;
  },

  // 나를 따라오는 동물 하나를 그 사람에게 (그 사람을 따라간다). 준 동물을 돌려준다
  givePet(to) {
    const m = to && Monsters.list.find(mm => mm.owner === Multi.sid);
    if (!m) return null;
    if (Multi.isGuest) Multi.send('givePet', 'H', m.id, to.sid);
    else Monsters.give(m, Multi.sid, to.sid);
    Floaters.add(m.x, m.y - 30, '🎁', 18);
    Sfx.pickup();
    return m;
  },
};

// 🤝 놀아주기가 아이 곁에 짓는 것. 한 줄이 맵 한 줄 (W: 벽 - 바위/벽돌/나무, T: 나무, f: 꽃, D: 문(있으면), .: 빈칸)
const BUDDY_PROJECTS = {
  house: { emoji: '🏠', plan: [
    'WWWWWW',
    'W.f..W',
    'W..f.W',
    'W....W',
    'WWD.WW',
  ] },
  heart: { emoji: '💚', plan: [ // 하트숲: 아래 끝이 열려 있어서 안으로 들어갈 수 있다
    '.TT.TT.',
    'T..T..T',
    'T.f.f.T',
    '.T.f.T.',
    '..T.T..',
  ] },
  maze: { emoji: '🌀', plan: [ // 위 왼쪽으로 들어가서 아래 오른쪽으로 나온다
    'W.WWWWW',
    'W...W.W',
    'WWW.W.W',
    'W...W.W',
    'W.WWW.W',
    'W.....W',
    'WWWWW.W',
  ] },
  castle: { emoji: '🏰', plan: [ // 탑이 뾰족뾰족한 성 (가운데 문)
    'W.W.W.W',
    'WWWWWWW',
    'W.....W',
    'W..f..W',
    'WWWDWWW',
  ] },
  smile: { emoji: '😊', plan: [ // 나무 동그라미 안에 꽃으로 웃는 얼굴 (아래로 들어간다)
    '.TTTTT.',
    'T.....T',
    'T.f.f.T',
    'T.....T',
    'Tf...fT',
    'T.fff.T',
    '.TT.TT.',
  ] },
  garden: { emoji: '🌸', plan: [ // 꽃 동그라미 (가운데 나무 한 그루)
    '.fff.',
    'f...f',
    'f.T.f',
    'f...f',
    '.f.f.',
  ] },
};
// 칸 글자 → 놓을 수 있는 블록 (앞에 있는 것부터)
const BUDDY_CELL = { W: ['brick', 'sapling'], T: ['sapling'], f: ['flower'], D: ['gate'] }; // 묘목은 자라서 나무
// 캐서 얻는 블록 → 맵 칸
const BUDDY_DIG = { sapling: TILE.TREE, flower: TILE.FLOWER }; // 나무를 캐면 묘목이 나온다

// ============================================================
// Buddy — 🤝 놀아주기: 내 캐릭터가 저절로 아이(가장 가까운 다른 사람) 곁에서 논다.
//         아이 둘레 몬스터 사냥, 초식동물 꼬시기, 꽃/나무 캐서 둘레에 심기, 떨어진 것 줍기, 따라다니며 😊👋.
//         켜져 있는 동안 다른 사람은 절대 맞지 않는다 (Multi.hitPeers). 키/조이스틱을 쓰면 그동안은 내가 움직인다.
//         카드는 띄우지 않고(잡은 수만 센다), 집 문에 닿아도 제작대를 열지 않는다
// ============================================================
const Buddy = {
  on: false,
  vec: { x: 0, y: 0 }, // 이번 프레임에 가고 싶은 쪽 (Input.vector 가 쓴다)
  task: null, // { kind: 'hunt' | 'tame' | 'gather' | 'build' | 'collect' | 'follow', until, ... }
  thinkT: 0,
  chatT: 3,
  restT: 0, // 일 하나를 끝내고 잠깐 따라다니기만 하는 시간
  backT: 0, // 맞거나 때린 뒤 잠깐 물러서는 시간
  eatT: 0,
  said: {}, // 말 → 다시 해도 되는 시각
  reactAt: {}, // 반응 → 다시 해도 되는 시각
  watchFrom: 0, // 이 시각 뒤에 바뀐 것만 반응한다 (켜자마자 옛것에 반응하지 않게)
  kidPets: null,
  nearIds: null,
  killCheck: 0,
  lastKill: 0,
  lastSt: '',
  kidPlaced: null,
  gifted: new Set(), // 내가 아이에게 준 동물 (꼬셨다고 반응하지 않게)
  mazes: [], // 다 지은 미로 (숨바꼭질)
  friendHit: false,
  meHit: false,
  path: [],
  pathKey: '',
  pathT: 0,
  stuck: { x: 0, y: 0, t: 0 },
  home: null, // 혼자일 때 머무는 곳
  project: null, // 짓는 중 { kind, cells: [{ x, y, ch, tries }] }
  projectN: 0, // 다음에 지을 것 (집 → 하트숲 → 미로 차례로)
  projectT: 0, // 다 지은 뒤 다음 것을 시작하기까지 쉬는 시간

  // who: 놀아줄 사람 이름 (그 이름의 사람만 따라다닌다)
  toggle(who) {
    this.on = !this.on;
    this.target = this.on ? who || null : null;
    $('#btn-buddy span').textContent = this.on && this.target ? this.target : tr('놀아주기', 'Play buddy');
    this.task = null;
    this.path = [];
    this.home = { x: Player.x, y: Player.y };
    this.project = null;
    this.projectT = 5;
    this.watchFrom = performance.now() + 2000;
    this.said = {};
    this.reactAt = {};
    $('#btn-buddy').classList.toggle('on', this.on);
    toast(this.on ? `🤝 ${this.target || 'ON'}` : '🤝 OFF');
    if (this.on) this.emote('👋');
    else Game.picked = Game.lastWeapon;
    Game.renderInventory();
  },

  emote(icon) {
    Player.emote = icon;
    Player.emoteT = 1.6;
  },

  // 같이 놀 아이: 가장 가까운, 놀고 있는 다른 사람 (없으면 null)
  friend() {
    let best = null, bd = Infinity;
    for (const p of Multi.visiblePeers()) {
      if (this.target && p.name !== this.target) continue; // 고른 사람만 (없으면 켠 곳 둘레에서 논다)
      const d = Math.hypot(p.x - Player.x, p.y - Player.y);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  },

  // 놀이의 가운데: 아이 (혼자면 켰을 때 있던 곳)
  anchor() { return this.friend() || this.home; },

  dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },

  update(dt) {
    this.vec = { x: 0, y: 0 };
    if (Game.state !== 'play') return;
    const f = this.friend();
    if (f && f.hitT > 0 && !this.friendHit && this.dist(f, Player) < 10 * T) { this.emote('😠'); this.thinkT = 0; }
    this.friendHit = !!(f && f.hitT > 0);
    // 내가 맞았다: 잠깐 물러선다 (사람처럼)
    if (Player.hitT > 0 && !this.meHit) this.backT = randFloat(0.4, 0.8);
    this.meHit = Player.hitT > 0;
    this.backT -= dt;
    this.thinkT -= dt;
    this.restT -= dt;
    this.projectT -= dt;
    if (f) this.watch(f);
    // 먹을 것은 아이에게 양보한다: 떨어진 하트/먹이는 줍지 않고, 내 가방 것도 하트가 2개 이하일 때만 먹는다.
    // 아이가 다쳤으면 (하트 3개 이하) 내 물약/먹이를 갖다 준다
    this.eatT -= dt;
    if (this.eatT <= 0 && (!this.task || !['hunt', 'gift'].includes(this.task.kind))) {
      const gift = f && f.hearts <= 3 && ((Game.inventory.redpot > 0 && 'redpot') ||
        Object.keys(ITEMS).find(id => ITEMS[id].kind === 'food' && Game.inventory[id] > 0));
      if (gift) {
        this.eatT = 8;
        this.start('gift', { item: gift }, 10);
        this.talk('heal', [['이거 먹고 힘내!', 'Here, eat this!'], ['아프지 마! 이거 줄게', "Don't be hurt! For you"]], 8);
      } else if (Game.hearts <= 2 && Game.eatOne()) {
        this.eatT = 6;
        this.emote('😋');
      }
    }
    if (this.thinkT <= 0) { this.thinkT = 0.4; this.think(); }
    if (this.task && performance.now() > this.task.until) {
      const t = this.task;
      if (t.kind === 'tag') Social.say(t.phase === 'chase' ? tr('헥헥, 못 잡겠다~', "Phew, you're fast!") : tr('나 잡아 봐~', 'Catch me~'), false);
      if (t.kind === 'hide' && t.hidden) Social.say(tr('여기 있지롱!', "I'm here!"), false);
      this.done();
    }
    if (this.task) this[this.task.kind](this.task, dt);
    this.checkStuck(dt);
    // 가끔 아이를 보며 😊
    this.chatT -= dt;
    if (this.chatT <= 0) {
      this.chatT = randFloat(5, 9);
      if (f && this.dist(f, Player) < 4 * T && !(this.task && this.task.kind === 'hunt')) {
        if (Math.random() < 0.3) this.talk('chat', [['같이 놀자!', "Let's play!"], ['재밌다!', 'This is fun!'], ['뭐 하고 놀까?', 'What should we do?'], ['사랑해!', 'I love you!']], 25);
        else this.emote(['😊', '👋', '🎵', '😆', '👍'][Math.floor(Math.random() * 5)]);
      }
    }
  },

  done(icon) {
    if (icon) this.emote(icon);
    // 짓는 중에는 쉬지 않고 이어서 (가끔만 아이 곁으로)
    this.restT = this.task && this.task.project ? (Math.random() < 0.4 ? randFloat(2, 4) : 0) : randFloat(2, 5);
    this.task = null;
    this.path = [];
    if (Game.heldBlock || Game.heldFood) { Game.picked = Game.lastWeapon; Game.renderInventory(); }
  },

  start(kind, data, sec) {
    this.task = { kind, ...data, until: performance.now() + sec * 1000 };
    this.path = [];
  },

  // 할 일 고르기: 아이 둘레 몬스터 > 너무 멀면 따라가기 > (쉬는 시간이 아니면) 꼬시기/캐기/심기/줍기 > 따라다니기
  think() {
    const a = this.anchor(), me = Player;
    const t = this.task;
    // 위험: 아이 둘레 몬스터가 먼저 (아이에게 가까운 순), 그다음 나를 쫓는 몬스터
    // (아이에게 가는 길에는 바로 붙은 것만 상대한다)
    const near = this.dist(a, me) < 8 * T ? 4 : 2;
    const threats = Monsters.list.filter(m => !m.def.calm && !m.owner && (this.dist(m, a) < 6 * T || this.dist(m, me) < near * T));
    const threat = threats.sort((x, y) => this.dist(x, a) - this.dist(y, a))[0];
    if (threat) {
      if (!t || t.kind !== 'hunt' || (t.m !== threat && this.dist(threat, a) < this.dist(t.m, a) - T)) {
        const guard = a !== this.home && this.dist(threat, a) < this.dist(threat, me);
        this.start('hunt', { m: threat }, 20);
        this.emote(guard ? '🛡️' : Math.random() < 0.5 ? '💪' : '⚔️');
        if (guard) this.talk('guard', [['내가 지켜줄게!', "I'll protect you!"], ['내 뒤에 있어!', 'Stay behind me!']], 15);
      }
      return;
    }
    // 아이가 멀어지면 하던 일 (캐기/짓기/꼬시기)은 두고 따라간다 (술래잡기/숨바꼭질은 빼고)
    if (t && !['follow', 'tag', 'hide', 'guide'].includes(t.kind) && a !== this.home && this.dist(a, me) > 8 * T) {
      this.done();
      this.start('follow', {}, 4);
      return;
    }
    if (t && t.kind !== 'follow') return;
    // 3탄 🧭 미로: 아이가 미로 안에 있으면 "따라와!" 하고 앞장서서 보물 상자까지 길을 알려 준다
    const kid = this.friend();
    if (kid && World.mazeGoal && this.inMaze(kid) && (this.reactAt.guide || 0) < performance.now()) {
      this.start('guide', {}, 120);
      this.emote('🧭');
      this.talk('guide', [['따라와! 길 알려 줄게', "Follow me! I'll show you the way"]], 20);
      return;
    }
    // 아이 곁에 붙어 있는다 (짓는 중에는 재료를 캐러 조금 더 멀리까지)
    if (this.dist(a, me) > (this.project ? 7 : 4) * T || this.restT > 0) { if (!t) this.start('follow', {}, 4); return; }

    // 짓는 중이면 대부분 그걸 이어서 한다
    if (!this.project && this.projectT <= 0) this.startProject(a);
    if (this.project && Math.random() < 0.6 && this.projectStep(a)) return;

    const choices = [];
    const myPets = Monsters.list.filter(m => m.owner === Multi.sid).length;
    // 좋아하는 음식을 가진 동물만 (없으면 🎂 케이크)
    const liked = m => [m.def.likes, 'cake'].find(id => id && Game.inventory[id] > 0);
    const wild = Monsters.list.filter(m => Monsters.tameable(m) && !m.owner && this.dist(m, a) < 9 * T && liked(m))
      .sort((x, y) => this.dist(x, me) - this.dist(y, me))[0];
    const food = wild && liked(wild);
    if (food && wild && myPets < 3) choices.push(['tame', { m: wild, food }, 12]);
    const dig = (Game.inventory.flower || 0) < 4 && this.findTile(a, [TILE.FLOWER], 6);
    if (dig) choices.push(['gather', { tx: dig.x, ty: dig.y, tile: TILE.FLOWER }, 10]);
    if (Game.inventory.flower > 0 || (Game.inventory.torch > 0 && DARK_REGIONS.has(World.regionAtPx(Player.x, Player.y)))) {
      choices.push(['build', { block: this.pickBlock(), left: randInt(2, 3) }, 14]);
    }
    // 아이 곁에 떨어진 것: 줍지 않고 옆에 가서 👉 (아이가 줍게)
    const f = this.friend();
    const item = f && Items.list.filter(it => this.dist(it, f) < 6 * T && this.dist(it, f) > 1.5 * T)
      .sort((x, y) => this.dist(x, f) - this.dist(y, f))[0];
    if (item) choices.push(['show', { it: item }, 6]);
    // 2탄: 아이 곁 네잎클로버를 찾아서 옆에 가서 👉 (뽑는 건 아이가)
    const lucky = f && Monsters.nearLucky(f.x, f.y, 5);
    if (lucky && this.dist(lucky, f) > 1.2 * T) choices.push(['show', { it: { ...lucky, lucky: true } }, 8], ['show', { it: { ...lucky, lucky: true } }, 8]);
    // 선물: 따라오는 동물 (아이 동물이 3마리보다 적으면), 꽃/먹이가 넉넉하면 하나
    if (f) {
      const kidPets = Monsters.list.filter(m => m.owner === f.sid).length;
      if (myPets > 0 && kidPets < 3) choices.push(['gift', { pet: true }, 10]);
      const extra = Object.keys(ITEMS).find(id => (ITEMS[id].kind === 'food' && Game.inventory[id] >= 3) || (id === 'flower' && Game.inventory[id] >= 6));
      if (extra && Math.random() < 0.5) choices.push(['gift', { item: extra }, 10]);
      // 숨바꼭질: 아이 가까이 지어 둔 미로가 있으면
      const mz = this.mazes.find(z => Math.hypot((z.ox + z.w / 2) * T - f.x, (z.oy + z.h / 2) * T - f.y) < 10 * T);
      if (mz && (this.reactAt.hide || 0) < performance.now()) { choices.push(['hide', { maze: mz }, 45]); }
    }
    if (choices.length && Math.random() < 0.7) {
      const [kind, data, sec] = choices[Math.floor(Math.random() * choices.length)];
      this.start(kind, data, sec);
      this.emote({ tame: '🍎', gather: '🌷', build: '🌷', show: '👀', gift: '🎁', hide: '🙈' }[kind]);
      if (kind === 'hide') this.reactAt.hide = performance.now() + 90000;
      if (kind === 'tame') this.talk('tame', [['친구 데려올게!', "I'll bring a friend!"]], 20);
      if (kind === 'show') this.talk('show', [['여기 있어! 주워 봐!', 'Look! Pick it up!']], 15);
    } else if (!t) this.start('follow', {}, randFloat(3, 6));
  },

  // ---------- 짓기: 집 / 하트숲 / 미로 ----------
  // 아이에게서 3~5칸 떨어진, 거의 다 비어 있는 풀밭을 골라 시작한다 (아이가 서 있는 칸은 넣지 않는다)
  startProject(a) {
    if (World.stageAtPx(a.x, a.y) === 2) { this.projectT = 10; return; } // 3탄 미로: 길을 막지 않게 짓지 않는다
    const kinds = Object.keys(BUDDY_PROJECTS), kind = kinds[this.projectN % kinds.length];
    const plan = BUDDY_PROJECTS[kind].plan, w = plan[0].length, h = plan.length;
    const ax = Math.floor(a.x / T), ay = Math.floor(a.y / T);
    let best = null;
    for (let n = 0; n < 60; n++) {
      const ang = Math.random() * Math.PI * 2, r = randFloat(3, 5);
      const ox = Math.round(ax + Math.cos(ang) * r - w / 2), oy = Math.round(ay + Math.sin(ang) * r - h / 2);
      if (ax >= ox - 1 && ax <= ox + w && ay >= oy - 1 && ay <= oy + h) continue; // 아이 자리와 겹친다
      let ok = 0, bad = 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const tt = World.tile(ox + x, oy + y);
          const free = (tt === TILE.GRASS || tt === TILE.SAND) && !(ox + x === World.door.x && oy + y > World.door.y && oy + y <= World.door.y + 4);
          if (plan[y][x] === '.') {
            if (BLOCKING.has(tt) || tt === TILE.DOOR) bad++;
            // 테두리의 빈칸은 드나드는 곳: 바깥쪽 칸이 막혀 있으면 안 된다
            const out = [[x === 0, -1, 0], [x === w - 1, 1, 0], [y === 0, 0, -1], [y === h - 1, 0, 1]].filter(o => o[0]);
            if (out.some(([, dx, dy]) => BLOCKING.has(World.tile(ox + x + dx, oy + y + dy)))) bad += 3;
          } else if (free) ok++; else bad++;
        }
      }
      if (bad <= 2 && (!best || bad < best.bad)) best = { ox, oy, bad };
      if (best && best.bad === 0) break;
    }
    if (!best) { this.projectT = 10; return; } // 자리가 없다: 잠깐 뒤 다시
    const cells = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (plan[y][x] !== '.') cells.push({ x: best.ox + x, y: best.oy + y, ch: plan[y][x], tries: 0 });
    // 벽/나무 먼저, 꽃/문은 나중에. 가까운 것부터 차례로 이어지게
    cells.sort((p, q) => ('fD'.includes(p.ch) - 'fD'.includes(q.ch)) || (p.y - q.y) || (p.x - q.x));
    this.project = { kind, cells, ox: best.ox, oy: best.oy, w, h };
    this.projectN++;
    this.emote(BUDDY_PROJECTS[kind].emoji);
    this.talk('build', [{ house: ['집 지어 줄게!', "I'll build a house!"], heart: ['하트숲 만들자!', "Let's make a heart forest!"], maze: ['미로 만들어 줄게!', "I'll make a maze!"],
      castle: ['성 지어 줄게!', "I'll build a castle!"], smile: ['웃는 얼굴 만들어 볼까?', "Let's make a smiley face!"], garden: ['꽃밭 만들어 줄게!', "I'll make a flower garden!"] }[kind]], 5);
    console.log('[Buddy] 짓기 시작', kind, best);
  },

  // 다음 칸 하나: 블록이 있으면 놓으러, 없으면 캐러 간다. 할 게 있으면 true
  projectStep(a) {
    const pr = this.project;
    const done = c => {
      const tt = World.tile(c.x, c.y), want = BUDDY_CELL[c.ch].map(id => TILE[ITEMS[id].tile]);
      if (want.includes(TILE.SAPLING)) want.push(TILE.TREE); // 다 자란 나무도 된 것
      return want.includes(tt) || c.tries >= 5;
    };
    const left = pr.cells.filter(c => !done(c));
    if (!left.length) { this.finishProject(); return false; }
    const now = performance.now();
    const fail = c => { c.tries++; c.wait = now + 3000; }; // 아이가 서 있는 등 막혔다: 3초 뒤 다시 (5번까지)
    for (const c of left) {
      if (c.wait > now) continue;
      const ids = BUDDY_CELL[c.ch];
      const block = ids.find(id => Game.inventory[id] > 0);
      // 재료는 몇 개씩 모아 와서 한꺼번에 놓는다 (하나씩 왔다 갔다 하지 않게)
      const need = left.filter(o => BUDDY_CELL[o.ch] === ids).length;
      const have = ids.reduce((n, id) => n + (Game.inventory[id] || 0), 0);
      const canDig = ids.some(id => BUDDY_DIG[id] !== undefined);
      pr.gathering = canDig && (have === 0 || (pr.gathering && have < Math.min(4, need)));
      if (block && !pr.gathering) {
        if (!this.canPlaceAt(block, c.x, c.y)) { fail(c); continue; }
        this.start('build', { block, left: 1, target: { x: c.x, y: c.y }, stand: this.standNear(c.x, c.y), cell: c, project: true }, 12);
        if (!this.task.stand) { fail(c); this.task = null; continue; }
        return true;
      }
      // 재료 캐기 (문은 캘 수 없으니 그냥 빈칸으로 둔다, 꽃은 둘레에 없으면 건너뛴다)
      const tiles = ids.map(id => BUDDY_DIG[id]).filter(v => v !== undefined);
      const spot = tiles.length && this.findTile(a, tiles, 7, true);
      if (!spot && block) { pr.gathering = false; return this.projectStep(a); } // 더 캘 게 없다: 있는 것부터 놓는다
      if (spot) {
        this.start('gather', { tx: spot.x, ty: spot.y, tile: World.tile(spot.x, spot.y), project: true }, 15);
        return true;
      }
      c.tries = 5;
    }
    return false;
  },

  finishProject() {
    const { kind, ox, oy, w, h } = this.project;
    if (kind === 'maze') this.mazes.push({ ox, oy, w, h });
    this.talk('built', [{ house: ['집 다 지었다! 들어가 봐!', 'House done! Go inside!'], heart: ['하트숲 완성!', 'Heart forest done!'], maze: ['미로 완성! 들어가 봐!', 'Maze done! Go in!'],
      castle: ['성 완성! 들어가 봐!', 'Castle done! Go in!'], smile: ['웃는 얼굴 완성! 😊', 'Smiley face done! 😊'], garden: ['꽃밭 완성! 예쁘지?', 'Flower garden done! Pretty?'] }[kind]], 5);
    this.project = null;
    this.projectT = randFloat(25, 45);
    this.emote('🎉');
    Floaters.add(Player.x, Player.y - 40, BUDDY_PROJECTS[kind].emoji, 26);
    Sfx.success();
    console.log('[Buddy] 다 지었다', kind);
  },

  // 내가 지은 칸 (캐지 않는다)
  inProject(x, y) {
    const pr = this.project;
    return pr && x >= pr.ox && x < pr.ox + pr.w && y >= pr.oy && y < pr.oy + pr.h;
  },

  // 심을 블록: 꽃 > 묘목 > (늪/미로처럼 어두우면) 횃불 > 벽돌
  pickBlock() {
    const swamp = DARK_REGIONS.has(World.regionAtPx(Player.x, Player.y));
    const order = swamp ? ['torch', 'flower', 'sapling'] : ['flower', 'sapling', 'torch', 'brick'];
    return order.find(id => Game.inventory[id] > 0) || null;
  },

  // a 둘레 r 칸 안에서 types 인 칸 (갈 수 있는 곳 옆에 있는 것) 중 가까운 것
  // natural: 처음부터 맵에 있던 것만 (사람이 놓은 것, 짓고 있는 곳은 건드리지 않는다)
  findTile(a, types, r, natural = false) {
    const cx = Math.floor(a.x / T), cy = Math.floor(a.y / T);
    let best = null, bd = Infinity;
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (!types.includes(World.tile(x, y)) || !World.diggable(x, y)) continue;
        if (natural && (World.tiles[y * World.w + x] !== World.base[y * World.w + x] || this.inProject(x, y))) continue;
        if (!this.standNear(x, y)) continue;
        const d = Math.hypot(x - cx, y - cy) + Math.random();
        if (d < bd) { bd = d; best = { x, y }; }
      }
    }
    return best;
  },

  // (tx, ty) 옆에 설 수 있는 칸 (내게서 가까운 것)
  standNear(tx, ty) {
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => ({ x: tx + dx, y: ty + dy }))
      .filter(c => this.walkable(c.x, c.y));
    opts.sort((p, q) => Math.hypot(p.x * T - Player.x, p.y * T - Player.y) - Math.hypot(q.x * T - Player.x, q.y * T - Player.y));
    return opts[0] || null;
  },

  walkable(x, y) {
    const tt = World.tile(x, y);
    return !BLOCKING.has(tt) && tt !== TILE.DOOR && World.canStand(x * T + T / 2, y * T + T / 2);
  },

  // ---------- 움직이기: 칸 단위 길 찾기 (나무/물을 돌아간다) ----------
  goTo(x, y, near = 6) {
    const d = Math.hypot(x - Player.x, y - Player.y);
    if (d < near) return true;
    const gx = Math.floor(x / T), gy = Math.floor(y / T), key = `${gx},${gy}`;
    this.pathT -= 1 / 60;
    if (key !== this.pathKey || this.pathT <= 0 || !this.path.length) {
      this.pathKey = key;
      this.pathT = 1;
      this.path = this.findPath(Math.floor(Player.x / T), Math.floor(Player.y / T), gx, gy);
    }
    // 다음 칸 가운데로 (마지막 칸이면 목표 지점으로)
    while (this.path.length > 1) {
      const n = this.path[0];
      if (Math.hypot(n.x * T + T / 2 - Player.x, n.y * T + T / 2 - Player.y) < 5) this.path.shift(); else break;
    }
    const n = this.path.length > 1 ? { x: this.path[0].x * T + T / 2, y: this.path[0].y * T + T / 2 } : { x, y };
    const dx = n.x - Player.x, dy = n.y - Player.y, l = Math.hypot(dx, dy) || 1;
    this.vec = { x: dx / l, y: dy / l };
    return false;
  },

  // 너비 우선 길 찾기 (맵 전체). 못 찾으면 [] → 곧장 간다
  findPath(sx, sy, gx, gy) {
    if (sx === gx && sy === gy) return [];
    const W = World.w, prev = new Map(), q = [[sx, sy]];
    prev.set(sy * W + sx, -1);
    const goalOk = !BLOCKING.has(World.tile(gx, gy));
    for (let qi = 0; qi < q.length; qi++) {
      const [x, y] = q[qi];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = ny * W + nx;
        if (prev.has(k) || nx <= 0 || ny <= 0 || nx >= W - 1 || ny >= World.h - 1) continue;
        const goal = nx === gx && ny === gy;
        if (!(goal && goalOk) && !this.walkable(nx, ny)) continue;
        prev.set(k, y * W + x);
        if (goal) {
          const out = [];
          for (let c = k; c !== sy * W + sx; c = prev.get(c)) out.unshift({ x: c % W, y: Math.floor(c / W) });
          return out;
        }
        q.push([nx, ny]);
      }
    }
    return [];
  },

  // 가려는데 2초 동안 거의 못 움직였으면 그 일은 그만
  checkStuck(dt) {
    const s = this.stuck;
    if (!this.vec.x && !this.vec.y) { s.t = 0; return; }
    if (Math.hypot(Player.x - s.x, Player.y - s.y) > 8) { s.x = Player.x; s.y = Player.y; s.t = 0; return; }
    s.t += dt;
    if (s.t > 2) { s.t = 0; this.done(); }
  },

  face(x, y) {
    const dx = x - Player.x, dy = y - Player.y;
    Player.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  },

  hold(id) {
    if (Game.picked === id) return;
    Game.picked = id;
    Game.renderInventory();
  },

  // ---------- 할 일 ----------
  follow(t) {
    const a = this.anchor();
    if (!t.spot || performance.now() > t.spotAt) {
      const ang = Math.random() * Math.PI * 2, r = randFloat(1.2, 2) * T;
      t.spot = { x: Math.cos(ang) * r, y: Math.sin(ang) * r };
      t.spotAt = performance.now() + randFloat(2500, 4500);
    }
    if (this.goTo(a.x + t.spot.x, a.y + t.spot.y, 10)) {
      this.vec = { x: 0, y: 0 };
      // 사람처럼: 대개 아이를 보다가 가끔 두리번, 가끔 콩
      if (!t.lookAt || performance.now() > t.lookAt) {
        t.lookAt = performance.now() + randFloat(1200, 3000);
        t.look = Math.random() < 0.35 ? DIRS[Math.floor(Math.random() * 4)] : null;
        if (Math.random() < 0.12) Social.jump();
      }
      if (t.look) Player.dir = t.look; else this.face(a.x, a.y);
    }
  },

  // 싸우기: 아이를 노리는 몬스터는 아이와 몬스터 사이로 끼어들어 막는다 (🛡️).
  // 사람처럼: 휘두르는 틈을 두고, 맞으면 잠깐 물러서고, 하트가 적으면 도망친다 (아이가 바로 위험하면 그래도 싸운다)
  hunt(t) {
    const m = t.m, a = this.anchor(), kid = a !== this.home ? a : null;
    if (!Monsters.list.includes(m) || (this.dist(m, a) > 7 * T && this.dist(m, Player) > 4 * T)) {
      if (Monsters.list.includes(m)) { this.done(); return; }
      this.done(kid && this.dist(kid, Player) < 6 * T ? (Math.random() < 0.5 ? '👍' : '😎') : '👍');
      if (kid) this.start('follow', { spot: null }, 3); // 이겼으면 아이 곁으로 돌아가 뽐내기
      return;
    }
    this.hold(Game.lastWeapon);
    const dMe = this.dist(m, Player), dKid = kid ? this.dist(m, kid) : Infinity;
    const kidDanger = dKid < 2.2 * T;
    const strong = m.def.boss || Game.hearts <= 2;

    // 하트가 적으면 (용은 3개 이하): 아이가 당장 위험할 때만 싸운다.
    // 몬스터가 가까우면 반대쪽 (가능하면 아이 쪽)으로 도망치고, 떨어지면 아이 곁에서 몬스터를 지켜본다
    if (Game.hearts <= (m.def.boss ? 3 : 2) && !kidDanger) {
      if (dMe < (t.fleeing ? 5 : 3.5) * T) {
        if (!t.fleeing) {
          t.fleeing = true;
          if (!t.fled) { this.emote(Math.random() < 0.5 ? '😱' : '💦'); this.talk('flee', [['으악! 도망가자!', 'Yikes! Run!']], 15); }
          t.fled = true;
        }
        const ax = Player.x - m.x, ay = Player.y - m.y, l = Math.hypot(ax, ay) || 1;
        let gx = Player.x + ax / l * 4 * T, gy = Player.y + ay / l * 4 * T;
        if (kid) { gx = (gx * 2 + kid.x) / 3; gy = (gy * 2 + kid.y) / 3; }
        this.goTo(gx, gy, 6);
        return;
      }
      t.fleeing = false;
      const c = kid || this.home, ax = c.x - m.x, ay = c.y - m.y, l = Math.hypot(ax, ay) || 1;
      if (this.goTo(c.x + ax / l * 0.9 * T, c.y + ay / l * 0.9 * T, 8)) this.vec = { x: 0, y: 0 };
      this.face(m.x, m.y);
      return;
    }
    t.fleeing = false;

    // 맞았거나 방금 때렸으면 잠깐 물러섰다가 다시
    if (this.backT > 0 && !kidDanger) {
      const ax = Player.x - m.x, ay = Player.y - m.y, l = Math.hypot(ax, ay) || 1;
      this.vec = { x: ax / l, y: ay / l };
      this.face(m.x, m.y);
      return;
    }

    // 닿으면 먼저 친다
    this.face(m.x, m.y);
    const [fx, fy] = FACING[Player.dir];
    const reach = Math.hypot(m.x - (Player.x + fx * 0.5 * T), m.y - (Player.y + fy * 0.5 * T)) < CONFIG.ATTACK_RANGE * T + Monsters.radius(m) - 2;
    if (!reach) {
      // 아이를 노리는데 아직 아이와 거리가 있고 내가 더 멀다: 아이 앞(몬스터 쪽)에 막아선다. 가까우면 곧장 달려든다
      if (kid && dKid < dMe && dKid > 2.5 * T) {
        if (!t.guarded) { t.guarded = true; this.emote('🛡️'); }
        const gx = kid.x - m.x, gy = kid.y - m.y, l = Math.hypot(gx, gy) || 1;
        const k = Math.min(1.6 * T, l * 0.6);
        if (this.goTo(kid.x - gx / l * k, kid.y - gy / l * k, 6)) this.vec = { x: 0, y: 0 }; // 자리 잡고 기다린다
        return;
      }
      if (kid && kidDanger && !t.guarded) { t.guarded = true; this.emote('🛡️'); }
      this.goTo(m.x, m.y, 4);
      return;
    }
    if (Player.swingT <= 0 && performance.now() > (t.nextSwing || 0)) {
      Player.swingT = 0.25;
      t.nextSwing = performance.now() + randFloat(350, 650); // 사람처럼 휘두르는 틈
      Sfx.swing();
      if (Math.random() > 0.15) Monsters.attack(); // 가끔 헛손질
      // 센 몬스터는 치고 빠지기
      if (strong && Math.random() < 0.5) this.backT = randFloat(0.3, 0.5);
    }
  },

  tame(t) {
    const m = t.m;
    if (!Monsters.list.includes(m) || !Game.inventory[t.food]) { this.done(); return; }
    if (m.owner) { this.done(m.owner === Multi.sid ? '💕' : ''); return; }
    // 4칸쯤 떨어져서 던진다 (가까이 가면 도망간다). 던진 먹이는 동물 쪽으로 휘어 날아간다
    if (this.dist(m, Player) < 4.2 * T) {
      this.vec = { x: 0, y: 0 };
      this.face(m.x, m.y);
      if (Player.swingT <= 0.1 && !Monsters.arrows.some(a => a.food)) {
        Player.swingT = 0.25;
        this.hold(t.food);
        Game.throwFood(m);
      }
      return;
    }
    this.goTo(m.x, m.y, 8);
  },

  gather(t) {
    if (!World.diggable(t.tx, t.ty) || World.tile(t.tx, t.ty) !== t.tile) { this.done(t.project ? '' : '😄'); return; }
    const s = t.stand || (t.stand = this.standNear(t.tx, t.ty));
    if (!s) { this.done(); return; }
    if (!this.goTo(s.x * T + T / 2, s.y * T + T / 2, 5)) return;
    this.hold(Game.lastWeapon);
    this.face(t.tx * T + T / 2, t.ty * T + T / 2);
    const f = Game.frontTile();
    if (Player.swingT <= 0.1 && f.x === t.tx && f.y === t.ty) {
      Player.swingT = 0.25;
      Sfx.swing();
      Game.digAt(t.tx, t.ty);
    }
  },

  // 아이 둘레 2칸쯤에 하나씩 심는다
  build(t) {
    if (!Game.inventory[t.block] || t.left <= 0) { this.done(t.project ? '' : '🌷'); return; }
    if (t.project && !this.canPlaceAt(t.block, t.target.x, t.target.y)) { t.cell.tries++; t.cell.wait = performance.now() + 3000; this.done(); return; }
    const a = this.anchor();
    if (!t.target || !this.canPlaceAt(t.block, t.target.x, t.target.y)) {
      t.target = this.buildSpot(a, t.block);
      t.stand = t.target && this.standNear(t.target.x, t.target.y);
      if (!t.target || !t.stand) { this.done(); return; }
    }
    if (!this.goTo(t.stand.x * T + T / 2, t.stand.y * T + T / 2, 5)) return;
    this.hold(t.block);
    this.face(t.target.x * T + T / 2, t.target.y * T + T / 2);
    const spot = Game.placeTile();
    if (Player.swingT <= 0.1 && spot && spot.x === t.target.x && spot.y === t.target.y && !Game.busy) {
      Player.swingT = 0.25;
      Game.place();
      t.left--;
      t.target = null;
    }
  },

  canPlaceAt(block, x, y) {
    const keep = Game.picked;
    Game.picked = block;
    const ok = Game.canPlace(x, y);
    Game.picked = keep;
    return ok;
  },

  buildSpot(a, block) {
    const cx = Math.floor(a.x / T), cy = Math.floor(a.y / T), list = [];
    for (let y = cy - 3; y <= cy + 3; y++) {
      for (let x = cx - 3; x <= cx + 3; x++) {
        const r = Math.hypot(x - cx, y - cy);
        if (r < 1.8 || r > 3.2) continue; // 아이 바로 옆은 비워 둔다 (길을 막지 않게)
        if (Monsters.safeZone(x * T + T / 2, y * T + T / 2) && block !== 'flower') continue; // 집 앞은 꽃만
        if (this.canPlaceAt(block, x, y) && this.standNear(x, y)) list.push({ x, y });
      }
    }
    return list[Math.floor(Math.random() * list.length)] || null;
  },

  // ---------- 아이 따라 하기 / 반응 ----------
  // 말하기 (같은 말은 cool 초 동안 다시 하지 않는다). 내 기기에서는 읽지 않고, 아이 기기에서 읽어 준다
  talk(key, lines, cool = 12) {
    const now = performance.now();
    if ((this.said[key] || 0) > now) return;
    this.said[key] = now + cool * 1000;
    const [ko, en] = lines[Math.floor(Math.random() * lines.length)];
    Social.say(tr(ko, en), false);
  },

  // 아이가 한 일을 알아보고 반응한다: 카드를 끝냄, 동물을 꼬심, 몬스터를 잡음, 캐기, 놓기
  watch(f) {
    const now = performance.now();
    if (now < this.watchFrom) {
      this.kidPets = null;
      this.nearIds = null;
      this.lastSt = f.st;
      return;
    }
    if (this.lastSt === 'card' && f.st === 'play') this.react('card', f);
    this.lastSt = f.st;
    // 아이를 따라가는 동물이 새로 생김 (내가 준 것은 빼고)
    const pets = Monsters.list.filter(m => m.owner === f.sid);
    if (this.kidPets) for (const m of pets) if (!this.kidPets.has(m.id) && !this.gifted.has(m.id)) this.react('tame', f);
    this.kidPets = new Set(pets.map(m => m.id));
    // 아이 곁 몬스터가 없어짐 → 아이가 잡았다 (내가 잡은 것이 아니면)
    const near = Monsters.list.filter(m => !m.def.calm && !m.owner && this.dist(m, f) < 3 * T);
    if (this.nearIds) for (const id of this.nearIds) if (!Monsters.list.some(m => m.id === id)) this.killCheck = now + 1200;
    this.nearIds = new Set(near.map(m => m.id));
    if (this.killCheck && now > this.killCheck) {
      this.killCheck = 0;
      if (now - this.lastKill > 2500) this.react('kill', f);
    }
    // 아이 곁에서 칸이 바뀜 (내가 바꾼 것은 빼고)
    for (const ch of World.recent) {
      if (ch.seen) continue;
      ch.seen = true;
      if (ch.mine || ch.at < this.watchFrom || now - ch.at > 3000) continue;
      const x = ch.i % World.w, y = Math.floor(ch.i / World.w);
      if (Math.hypot(x * T + T / 2 - f.x, y * T + T / 2 - f.y) > 2.5 * T) continue;
      const placed = Object.keys(ITEMS).find(id => ITEMS[id].tile && TILE[ITEMS[id].tile] === ch.to);
      if (placed && (PLACE_ON.has(ch.from) || ch.from === TILE.WATER)) this.react('place', f, { x, y, block: placed });
      else if (ch.from === TILE.TREE || ch.from === TILE.ROCK) this.react('dig', f, { x, y, tile: ch.from });
      else if (ch.from === TILE.FLOWER) this.react('flower', f);
    }
  },

  react(kind, f, at) {
    const t = this.task;
    if (t && ['hunt', 'tag', 'hide', 'eat'].includes(t.kind)) return;
    const now = performance.now();
    if ((this.reactAt[kind] || 0) > now) return;
    this.reactAt[kind] = now + { card: 3, tame: 5, kill: 5, dig: 20, place: 12, flower: 25 }[kind] * 1000;
    const lines = {
      card: [['잘했어!', 'Great job!'], ['우와! 잘 읽네!', 'Great reading!']],
      tame: [['우와! 귀엽다!', 'So cute!'], ['친구 생겼네!', 'A new friend!']],
      kill: [['최고야!', 'Awesome!'], ['멋지다!', 'Cool!']],
      dig: [['같이 캐자!', "Let's dig!"], ['나도 도와줄게!', "I'll help!"]],
      place: [['멋지다!', 'Nice!'], ['나도 놓을래!', 'Me too!']],
      flower: [['꽃 예쁘다!', 'Pretty flower!']],
    }[kind];
    this.talk(kind, lines, 4);
    this.emote({ card: '👏', tame: '🎉', kill: '👍', dig: '💪', place: '👏', flower: '🌷' }[kind]);
    Social.jump();
    if (kind === 'dig') {
      // 같은 것을 아이 곁에서 하나 캐 준다
      const spot = this.findTile(f, [at.tile], 4, true);
      if (spot) { this.start('gather', { tx: spot.x, ty: spot.y, tile: at.tile }, 12); return; }
    }
    if (kind === 'place' && Game.inventory[at.block] > 0) {
      // 아이가 놓은 것 옆에 이어서 놓는다 (방금 놓은 두 칸이 이어지는 쪽으로)
      const last = this.kidPlaced;
      this.kidPlaced = { x: at.x, y: at.y };
      const dirs = last && Math.abs(last.x - at.x) + Math.abs(last.y - at.y) === 1 ? [[at.x - last.x, at.y - last.y]] : [];
      dirs.push(...[[1, 0], [-1, 0], [0, 1], [0, -1]].sort(() => Math.random() - 0.5));
      for (const [dx, dy] of dirs) {
        const x = at.x + dx, y = at.y + dy;
        if (Math.floor(f.x / T) === x && Math.floor(f.y / T) === y) continue;
        if (!this.canPlaceAt(at.block, x, y)) continue;
        const stand = this.standNear(x, y);
        if (stand) { this.start('build', { block: at.block, left: 1, target: { x, y }, stand, project: true, cell: { tries: 0 } }, 10); return; }
      }
    }
    if (kind !== 'flower') this.start('cheer', {}, 2.5);
  },

  // 아이 곁으로 가서 콩콩 (박수)
  cheer(t) {
    const f = this.friend();
    if (!f) { this.done(); return; }
    if (this.dist(f, Player) < 1.8 * T || this.goTo(f.x, f.y, 1.4 * T)) {
      this.vec = { x: 0, y: 0 };
      this.face(f.x, f.y);
      if (Player.jumpT <= 0 && !t.again) { t.again = true; Social.jump(); }
    }
  },

  onKill() {
    this.lastKill = performance.now();
    this.emote('👍');
    this.talk('win', [['물리쳤다!', 'Got it!'], ['이제 괜찮아!', "You're safe!"]], 10);
  },

  // ---------- 술래잡기: 아이가 때리면 "아야!" 하고 도망, 또 맞으면 이번엔 내가 잡으러 간다 ----------
  onHit(from) {
    const f = this.friend();
    if (!f || from.sid !== f.sid) return;
    const t = this.task;
    if (t && t.kind === 'hunt') return;
    if (t && t.kind === 'tag' && t.phase === 'run') {
      this.emote('😵');
      Social.say(tr('잡혔다! 이번엔 내가 잡는다!', 'You got me! My turn!'), false);
      t.phase = 'chase';
      t.until = performance.now() + 8000;
      return;
    }
    if (t && t.kind === 'tag') return;
    this.emote('😆');
    Social.say(tr('아야! 잡아 봐라~', 'Ouch! Catch me~'), false);
    Social.jump();
    this.start('tag', { phase: 'run', ang: Math.random() < 0.5 ? 0.7 : -0.7 }, 10);
  },

  tag(t) {
    const f = this.friend();
    if (!f) { this.done(); return; }
    const d = this.dist(f, Player);
    if (t.phase === 'run') {
      // 아이에게서 3~5칸을 두고 둘레를 돌며 도망 (너무 멀리는 안 간다)
      if (d < 3.5 * T) {
        const a = Math.atan2(Player.y - f.y, Player.x - f.x) + t.ang;
        this.goTo(f.x + Math.cos(a) * 4.5 * T, f.y + Math.sin(a) * 4.5 * T, 8);
      } else {
        this.vec = { x: 0, y: 0 };
        this.face(f.x, f.y);
        if (Player.emoteT <= 0) this.emote(Math.random() < 0.5 ? '😝' : '😆');
      }
      return;
    }
    // 내가 술래: 따라가서 닿으면 잡았다 (때리지 않는다)
    if (this.goTo(f.x, f.y, 0.9 * T)) {
      Social.say(tr('잡았다!', 'Got you!'), false);
      Social.jump();
      this.done('🙌');
    }
  },

  inMaze(p) { return World.regionAtPx(p.x, p.y) === REGION.MAZE; },

  // ---------- 🧭 미로 길 안내: 아이 자리에서 보물 상자까지 길을 찾아, 아이보다 몇 칸 앞에 서서 부른다 ----------
  // 아이가 막다른 길로 가도 길은 아이 자리에서 다시 찾으니까, 나는 언제나 맞는 길 쪽에서 "이쪽이야!" 한다
  guide(t) {
    const f = this.friend(), goal = World.mazeGoal, now = performance.now();
    if (!f || !goal || !this.inMaze(f)) { this.done(); return; }
    // 다 왔다: 상자는 아이가 열게
    if (Math.hypot(f.x - (goal.x * T + T / 2), f.y - (goal.y * T + T / 2)) < 2.5 * T) {
      Social.say(tr('보물 상자다! 열어 봐!', 'Treasure! Open it!'), false);
      Social.jump();
      this.reactAt.guide = now + 60000; // 입구로 돌아간 뒤 잠깐은 혼자 해 보게
      this.done('🎉');
      return;
    }
    // 아이 자리 → 보물 상자 옆 칸까지 길 (아이가 칸을 옮기거나 1초마다 다시)
    const fx = Math.floor(f.x / T), fy = Math.floor(f.y / T), key = `${fx},${fy}`;
    if (key !== t.key || now > (t.routeAt || 0)) {
      const end = this.standNear(goal.x, goal.y) || goal;
      t.route = this.findPath(fx, fy, end.x, end.y);
      t.key = key;
      t.routeAt = now + 1000;
    }
    if (!t.route.length) { this.done(); return; }
    const calls = [['따라와!', 'Follow me!'], ['이쪽이야!', 'This way!'], ['여기야 여기!', 'Over here!']];
    const d = this.dist(f, Player);
    // 내가 아이 길 위에 있는지 (벽은 1칸이라 바로 옆 칸이면 같은 길)
    const bx = Math.floor(Player.x / T), by = Math.floor(Player.y / T);
    const onRoute = t.route.some(c => Math.abs(c.x - bx) + Math.abs(c.y - by) <= 1);
    // 너무 앞섰다: 멈춰서 아이를 보며 부른다
    if (onRoute && d > 5 * T) {
      this.vec = { x: 0, y: 0 };
      this.face(f.x, f.y);
      this.talk('call', calls, 6);
      if (Player.emoteT <= 0) this.emote('👋');
      return;
    }
    // 아이보다 4칸 앞 길 위로
    const n = t.route[Math.min(4, t.route.length - 1)];
    if (this.goTo(n.x * T + T / 2, n.y * T + T / 2, 6)) {
      this.vec = { x: 0, y: 0 };
      this.face(f.x, f.y);
    }
    if (d > 2.5 * T) this.talk('call', calls, 6);
  },

  // ---------- 숨바꼭질: 지어 둔 미로 안쪽에 숨어서 기다린다 ----------
  hide(t) {
    const f = this.friend();
    if (!f) { this.done(); return; }
    if (!t.spot) {
      const plan = BUDDY_PROJECTS.maze.plan, mz = t.maze;
      let best = null;
      for (let y = 1; y < plan.length - 1; y++) {
        for (let x = 1; x < plan[0].length - 1; x++) {
          if (plan[y][x] !== '.' || !this.walkable(mz.ox + x, mz.oy + y)) continue;
          const far = Math.abs(x - 1) + y; // 입구(위 왼쪽)에서 먼 곳
          if (!best || far > best.far) best = { x: mz.ox + x, y: mz.oy + y, far };
        }
      }
      if (!best) { this.done(); return; }
      t.spot = best;
      Social.say(tr('숨바꼭질 하자! 미로에서 찾아봐~', 'Hide and seek! Find me in the maze~'), false);
    }
    if (!t.hidden) {
      if (this.goTo(t.spot.x * T + T / 2, t.spot.y * T + T / 2, 4)) { t.hidden = true; this.emote('🤫'); }
      return;
    }
    this.vec = { x: 0, y: 0 };
    if (this.dist(f, Player) < 1.4 * T) {
      Social.say(tr('찾았다! 잘 찾네!', 'You found me!'), false);
      Social.jump();
      this.done('🎉');
    }
  },

  // ---------- 선물: 따라오는 동물이나 꽃/먹이를 아이에게 ----------
  gift(t) {
    const f = this.friend();
    if (!f) { this.done(); return; }
    if (this.dist(f, Player) > 2 * T) { this.goTo(f.x, f.y, 1.5 * T); return; } // 2칸 안이면 준다
    this.vec = { x: 0, y: 0 };
    this.face(f.x, f.y);
    if (t.pet) {
      const m = Social.givePet(f);
      if (m) this.gifted.add(m.id);
    } else if (Game.inventory[t.item] > 0) {
      this.hold(t.item);
      Social.give(f);
    }
    Social.say(tr('선물이야!', 'For you!'), false);
    Social.jump();
    this.done('🎁');
  },

  // 하트가 아이보다 적을 때: 떨어진 하트/먹이를 하나 주우러 간다
  eat(t) {
    const it = t.it;
    if (!Items.list.includes(it)) { this.done('😋'); this.talk('yum', [['냠냠!', 'Yum!']], 5); return; }
    this.goTo(it.x, it.y, 3);
  },

  // 내가 주워도 되는 것: 없다 (떨어진 것은 모두 아이에게 양보)
  mayTake() { return false; },

  // 떨어진 것 옆에 가서 아이를 보며 👉 (아이가 주우면 😄)
  show(t) {
    const it = t.it, f = this.friend();
    const gone = it.lucky ? World.tiles[it.i] !== TILE.LUCKY : !Items.list.includes(it);
    if (gone || !f) { this.done('😄'); return; }
    if (it.lucky) this.talk('lucky', [['여기 네잎클로버!', 'A lucky clover here!'], ['여기 봐! 잎이 네 개야!', 'Look! Four leaves!']], 10);
    if (this.goTo(it.x + (f.x > it.x ? 0.8 : -0.8) * T, it.y, 8)) {
      this.vec = { x: 0, y: 0 };
      this.face(f.x, f.y);
      if (Player.emoteT <= 0) this.emote('👉');
    }
  },
};

// 콘솔 디버깅용: BC.Judge.judge('나무', ['나모']), BC.Game.enterHome() 등
window.BC = { CONFIG, Store, Words, Judge, Speech, Card, Craft, World, Items, Monsters, Player, Multi, Game, Buddy, Social };

Game.init();
