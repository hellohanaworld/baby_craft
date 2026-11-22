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
  MAP_H: 240,             // STAGE_H + 3탄/4탄 줄(60) + 5탄/6탄 줄(90). 넓이는 그대로라 예전에 바뀐 칸 번호도 그대로
  MAZE_Y: 150,            // 3탄(오른쪽)/4탄(왼쪽) 줄 아래 = 5탄(왼쪽)/6탄(오른쪽) 줄 시작
  VIEW_TILES: 9,          // 화면 짧은 변에 보이는 타일 수
  PLAYER_SPEED: 4.2,      // 타일/초
  PLAYER_RADIUS: 0.3,     // 타일 단위 충돌 반경
  ITEM_COUNT: 150,
  ITEM_RESPAWN_MS: 6000,
  HEART_COUNT: 30,        // 맵에 떠 있는 ❤️ 하트 수 (탄마다 나눈다: Items.spawnOne)
  HEART_RESPAWN_MS: 10000,
  HEART_HEAL: 2,          // ❤️ 하나로 채우는 체력
  PICKUP_RADIUS: 0.7,     // 타일 단위

  // 전투
  MAX_HEARTS: 5,
  HEAR_TILES: 8,           // 💬 다른 사람 말을 소리로 듣는 거리 (칸). 글은 같은 서버 모두 보인다
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
  SENTENCE_EVERY_SEC: 60, // 놀고 있는 시간이 이만큼 지나면 📝 문장 읽기 ("계속하려면 읽어요!")
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
//   potion 물약 (마시면 특별한 힘: heal / speed / light 초) / wear 옷 (slot: 입는 곳. 꾸미기) / gear 방패 (slot 에 들면 다 막아 주고 10번 막으면 부서진다)
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
  shield:  { emoji: '🛡️', ko: '방패',      en: 'shield',         kind: 'gear', slot: 'arm', weight: 0, icon: 'SHIELD' }, // 방패 칸에 끼우면 맞을 때 막는다 (SHIELD_HITS 번 막으면 부서짐)
  // 🧱 블록: 꽃은 캐서, 묘목은 나무를 캐면 같이 나온다 (심으면 자라서 나무), 나머지는 제작대에서
  flower:  { emoji: '🌷', ko: '꽃',     en: 'flower',  kind: 'block', tile: 'FLOWER',  weight: 0 },
  sapling: { emoji: '🌱', ko: '묘목',   en: 'sapling', kind: 'block', tile: 'SAPLING', weight: 0 },
  brick:   { emoji: '🧱', ko: '벽돌',   en: 'brick',   kind: 'block', tile: 'BRICK',   weight: 0 },
  gate:    { emoji: '🚪', ko: '문',     en: 'door',    kind: 'block', tile: 'GATE',    weight: 0 }, // 사람은 지나가고 몬스터는 못 지나간다
  bridge:  { emoji: '🌉', ko: '다리',   en: 'bridge',  kind: 'block', tile: 'BRIDGE',  weight: 0 }, // 물/낭떠러지/바다 위에만 놓는다
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
const REGION = { FOREST: 0, LAKE: 1, SWAMP: 2, MEADOW: 3, CLOVER: 4, MAZE: 5, JUNGLE: 6, CANYON: 7, SEA: 8 };
// 미로 탄 구역 (3탄 ~ 6탄)
const MAZE_REGIONS = new Set([REGION.MAZE, REGION.JUNGLE, REGION.CANYON, REGION.SEA]);
// 어두운 구역: 🍄 늪, 🧭 절벽 미로 (내 둘레와 🔥 횃불 둘레만 밝다)
const DARK_REGIONS = new Set([REGION.SWAMP, REGION.MAZE, REGION.JUNGLE, REGION.CANYON, REGION.SEA]);
const REGIONS = [
  { emoji: '🌲', ko: '무서운 숲', en: 'Dark Forest' }, // 왼쪽 위: 나무가 빽빽, 육식동물
  { emoji: '🏞️', ko: '호수',     en: 'Lakes' },       // 오른쪽 위: 큰 호수, 물고기
  { emoji: '🍄', ko: '어두운 늪', en: 'Dark Swamp' },  // 왼쪽 아래: 어둡고 축축, 벌레
  { emoji: '🌼', ko: '초원',     en: 'Meadow' },      // 오른쪽 아래: 꽃밭, 초식동물
  { emoji: '🍀', ko: '클로버 들판', en: 'Clover Field' }, // 2탄: 클로버밭 사이에 네잎클로버가 숨어 있다
  { emoji: '🧭', ko: '절벽 미로', en: 'Cliff Maze' },   // 3탄: 절벽 사이 길을 따라가면 끝에 보물 상자
  { emoji: '🌴', ko: '정글 미로', en: 'Jungle Maze' },  // 4탄: 동글동글 덤불 사이 길 (3탄보다 길이 길고 구불구불)
  { emoji: '🏔️', ko: '골짜기 미로', en: 'Canyon Maze' }, // 5탄: 낭떠러지 사이 좁은 길 (더 크고 구불구불)
  { emoji: '🌊', ko: '바다 미로', en: 'Sea Maze' },     // 6탄: 섬과 다리. 끊어진 다리는 🌉 다리를 놓아서 건넌다
];
// 구역 색감 (soft-light 로 얹는 색 r, g, b, 세기): 숲은 깊은 초록, 호수는 맑은 파랑, 늪은 보라, 초원은 따뜻한 햇살,
// 절벽은 흙빛, 정글은 눅눅한 초록, 골짜기는 노을, 바다는 청록
const REGION_GRADE = {
  DEFAULT: [255, 236, 190, 0.18],
  [REGION.FOREST]: [40, 110, 70, 0.32], [REGION.LAKE]: [130, 200, 255, 0.28], [REGION.SWAMP]: [110, 70, 150, 0.38],
  [REGION.MEADOW]: [255, 220, 120, 0.3], [REGION.CLOVER]: [210, 255, 150, 0.24], [REGION.MAZE]: [230, 170, 110, 0.26],
  [REGION.JUNGLE]: [60, 170, 100, 0.32], [REGION.CANYON]: [255, 140, 70, 0.34], [REGION.SEA]: [60, 210, 220, 0.3],
};
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
  // 4탄 정글: 이끼 낀 흙길 + 짙은 덤불 / 5탄 골짜기: 붉은 흙길 / 6탄 바다: 섬은 모래 (grass 도 모래색: 상자/제작대 밑), 물은 얕은 청록
  [REGION.JUNGLE]: { grass: ['#9aa65a', '#8a964c', '#aeb86c'], water: ['#3b8de0', '#74b9f0'], sand: ['#d8c98f', '#c9b97c', '#e6d8a3'], leaf: ['#1b5e20', '#2e7d32', '#66bb6a'] },
  [REGION.CANYON]: { grass: ['#d7a77a', '#c8966a', '#e6bb92'], water: ['#3b8de0', '#74b9f0'], sand: ['#e6c49b', '#d6b088', '#f0d4b0'], leaf: ['#6d7a3a', '#7d8b45', '#9aab5a'] },
  [REGION.SEA]:    { grass: ['#f0dc9c', '#e3cc86', '#f8e8b8'], water: ['#26c6da', '#80deea'], sand: ['#f0dc9c', '#e3cc86', '#f8e8b8'], leaf: ['#2e7d32', '#43a047', '#66bb6a'] },
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
  eagle:    { emoji: '🦅', ko: '독수리', en: 'eagle',    hp: 12, speed: 1.6, size: 52, drops: { meat: 2, gem: 1 },   region: REGION.CLOVER, count: 0, boss: true },
  // 🧭 3탄 절벽 미로: 어두운 미로에 사는 것들
  ghost:    { emoji: '👻', ko: '유령',   en: 'ghost',    hp: 4, speed: 1.5, size: 28, drops: { string: 1 },        region: REGION.MAZE, count: 5, hunts: true, ghost: true },
  rat:      { emoji: '🐀', ko: '쥐',     en: 'rat',      hp: 2, speed: 2.4, size: 22, drops: { carrot: 1 },        region: REGION.MAZE, count: 5, hunts: true },
  lizard:   { emoji: '🦎', ko: '도마뱀', en: 'lizard',   hp: 3, speed: 2.0, size: 24, drops: { leather: 1 },       region: REGION.MAZE, count: 4 },
  // 🌴 4탄 정글 미로
  monkey:   { emoji: '🐒', ko: '원숭이', en: 'monkey',   hp: 3, speed: 2.4, size: 24, drops: { apple: 1 },         region: REGION.JUNGLE, count: 4, calm: true, likes: 'apple' },
  leopard:  { emoji: '🐆', ko: '표범',   en: 'leopard',  hp: 5, speed: 2.1, size: 26, drops: { meat: 1, leather: 1 }, region: REGION.JUNGLE, count: 3, hunts: true },
  parrot:   { emoji: '🦜', ko: '앵무새', en: 'parrot',   hp: 2, speed: 2.6, size: 22, drops: { string: 1 },        region: REGION.JUNGLE, count: 3, calm: true },
  // 🏔️ 5탄 골짜기 미로
  goat:     { emoji: '🐐', ko: '염소',   en: 'goat',     hp: 3, speed: 2.0, size: 24, drops: { meat: 1, leather: 1 }, region: REGION.CANYON, count: 4, calm: true, likes: 'carrot' },
  ram:      { emoji: '🐏', ko: '숫양',   en: 'ram',      hp: 5, speed: 1.9, size: 26, drops: { string: 2 },        region: REGION.CANYON, count: 4, hunts: true },
  cavebat:  { emoji: '🦇', ko: '박쥐',   en: 'bat',      hp: 2, speed: 2.6, size: 22, drops: { leather: 1 },       region: REGION.CANYON, count: 4, hunts: true },
  // 🌊 6탄 바다 미로 (상어/문어는 바다에서만)
  shark:    { emoji: '🦈', ko: '상어',   en: 'shark',    hp: 5, speed: 1.8, size: 26, drops: { fish: 2 },          region: REGION.SEA, count: 6, hunts: true, swim: true },
  octopus:  { emoji: '🐙', ko: '문어',   en: 'octopus',  hp: 3, speed: 1.2, size: 24, drops: { string: 2 },        region: REGION.SEA, count: 4, calm: true, swim: true },
  turtle:   { emoji: '🐢', ko: '거북이', en: 'turtle',   hp: 4, speed: 0.9, size: 24, drops: { stone: 1 },         region: REGION.SEA, count: 4, calm: true, likes: 'apple' },
};
const BOSS = { emoji: '🐉', ko: '용', en: 'dragon', hp: 12, speed: 1.4, size: 56, drops: { gem: 2, meat: 2 }, boss: true };

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

// 색 밝기: k < 1 이면 어둡게 (곱하기), k > 1 이면 흰색 쪽으로 (#rgb / #rrggbb). 같은 색은 한 번만 계산
const shadeCache = new Map();
function shade(hex, k) {
  const key = hex + k;
  if (shadeCache.has(key)) return shadeCache.get(key);
  let h = String(hex).replace('#', '');
  if (h.length === 3) h = [...h].map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return hex;
  const out = '#' + [0, 2, 4].map(i => {
    const c = parseInt(h.slice(i, i + 2), 16);
    return Math.round(Math.min(255, k <= 1 ? c * k : c + (255 - c) * (k - 1))).toString(16).padStart(2, '0');
  }).join('');
  shadeCache.set(key, out);
  return out;
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
const GAME_V = 101;

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
const KEYS = { quiz: 'bc.quiz', room: 'bc.room', settings: 'bc.settings', stats: 'bc.stats', log: 'bc.log', csv: 'bc.wordsCsv', look: 'bc.look', name: 'bc.name', world: 'bc.world' };

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
// Sentences — 📝 문장 읽기 (1분마다 "계속하려면 읽어요!"). 띄어쓰기 빼고 8글자까지, 게임과 상관없는 한글 공부 문장.
//             정해 둔 문장 + 낱말 조각을 맞춰 만든 문장 중에서 아무거나 (최근 것은 다시 안 나오게)
// ============================================================
const SENTENCE_MAX = 8;
const SENTENCE_FIXED = [
  '엄마 아빠 사랑해요', '안녕하세요', '고맙습니다', '잘 먹겠습니다', '잘 자요', '좋은 아침이에요',
  '나는 할 수 있어', '우리 같이 놀자', '사이좋게 놀아요', '하늘이 파래요', '꽃이 예뻐요', '해가 떴어요',
  '비가 와요', '눈이 와요', '바람이 불어요', '별이 반짝반짝', '달님 안녕', '밥을 먹어요', '손을 씻어요',
  '이를 닦아요', '책을 읽어요', '물을 마셔요', '신발을 신어요', '옷을 입어요', '그림을 그려요',
  '노래를 불러요', '새가 날아요', '물고기가 헤엄쳐요', '나비가 날아요', '사과가 맛있어요', '우유를 마셔요',
  '오늘은 즐거워', '나는 멋진 아이', '같이 가요', '내가 도와줄게', '미안해 괜찮아', '참 잘했어요',
];
const SENTENCE_PARTS = {
  people: ['엄마', '아빠', '할머니', '할아버지', '친구', '선생님', '형', '누나', '언니', '오빠', '동생'],
  animals: ['강아지', '고양이', '토끼', '오리', '병아리', '곰', '사자', '돼지', '하마'],
  // 사람 + 하는 일 ("엄마가 웃어요"), 사람에게 하는 말 ("아빠 고마워요"), 함께 ("친구랑 놀아요")
  doing: ['웃어요', '노래해요', '춤춰요', '책을 읽어요', '밥을 먹어요', '잠을 자요', '안아 줘요'],
  toYou: ['사랑해요', '고마워요', '안녕', '최고예요', '보고 싶어요'],
  together: ['놀아요', '걸어요', '같이 가요', '노래해요'],
  animalDoing: ['뛰어요', '자요', '먹어요', '놀아요', '귀여워요', '하품해요'],
};
const SENTENCE_EN = ['I love you', 'Good morning', 'Thank you', 'I am happy', 'Let us play', 'I can do it', 'The sky is blue', 'Good night'];

const Sentences = {
  recent: [],
  custom: null, // sentences.txt 에 부모가 적어 둔 문장 (있으면 이것만 나온다)

  // sentences.txt: 한 줄에 한 문장. 빈 줄과 # 으로 시작하는 줄은 건너뛴다. 파일이 없거나 비어 있으면 원래 문장
  async load() {
    try {
      const res = await fetch('sentences.txt', { cache: 'no-cache' });
      if (!res.ok) return;
      const list = (await res.text()).split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
      if (list.length) { this.custom = [...new Set(list)]; this.recent = []; }
      console.log(`[Sentences] sentences.txt 사용: ${list.length}개`);
    } catch (err) { console.log('[Sentences] sentences.txt 없음, 원래 문장 사용', err); }
  },

  all() {
    const P = SENTENCE_PARTS, out = [...SENTENCE_FIXED];
    for (const w of P.people) {
      for (const d of P.doing) out.push(`${josa(w, '이', '가')} ${d}`);
      for (const d of P.toYou) out.push(`${w} ${d}`);
      for (const d of P.together) out.push(`${josa(w, '이랑', '랑')} ${d}`);
    }
    for (const a of P.animals) for (const d of P.animalDoing) out.push(`${josa(a, '이', '가')} ${d}`);
    return [...new Set(out)].filter(s => s.replace(/\s/g, '').length <= SENTENCE_MAX);
  },

  // 카드에 보여 줄 문장 (Card.show 가 받는 단어 모양)
  pick() {
    const en = Store.settings.lang === 'en';
    if (!this.pool) this.pool = this.all();
    // 정해 둔 문장 반, 맞춰 만든 문장 반 (만든 것이 훨씬 많아서 섞기만 하면 정해 둔 문장이 잘 안 나온다)
    const pool = en ? SENTENCE_EN : this.custom ? this.custom : Math.random() < 0.5 ? SENTENCE_FIXED : this.pool.filter(x => !SENTENCE_FIXED.includes(x));
    const choices = pool.filter(s => !this.recent.includes(s));
    const text = choices[Math.floor(Math.random() * choices.length)] || pool[0];
    this.recent = [text, ...this.recent].slice(0, Math.min(20, pool.length - 1));
    return { id: `s:${text}`, word: text, lang: en ? 'en' : 'ko', emoji: '📝', level: 0, alts: [] };
  },
};

// ============================================================
// Quiz — 1분마다 퀴즈를 돌아가며: 1) 📝 한글 문장 → 2) 🔢 산수 (더하기와 곱하기를 번갈아) → 3) 🔤 알파벳 읽기
//        산수와 알파벳은 처음엔 쉽게, 한 번에 맞히면 조금씩 어렵게 (3번 연속 → 한 단계 위, 따라 읽기로 넘기면 한 단계 아래)
// ============================================================
const QUIZ_KINDS = ['sentence', 'math', 'abc'];
const QUIZ_MAX_LV = 5;

// 말한 것에서 숫자 찾기: "24", "이십사", "스물넷" → [24]
function spokenNumbers(text) {
  const s = (text || '').replace(/\s/g, ''), out = [];
  for (const m of s.match(/\d+/g) || []) out.push(Number(m));
  // 한자어 수: 백/십/일~구 (이십사, 백이, 칠)
  const D = { 일: 1, 이: 2, 삼: 3, 사: 4, 오: 5, 육: 6, 륙: 6, 칠: 7, 팔: 8, 구: 9 };
  for (const m of s.matchAll(/(?:([이삼사오육칠팔구])?백)?(?:([이삼사오육칠팔구])?십)?([일이삼사오육륙칠팔구])?/g)) {
    if (!m[0]) continue;
    out.push((m[0].includes('백') ? (m[1] ? D[m[1]] : 1) * 100 : 0) + (m[0].includes('십') ? (m[2] ? D[m[2]] : 1) * 10 : 0) + (m[3] ? D[m[3]] : 0));
  }
  if (/영|공/.test(s)) out.push(0);
  // 고유어 수: 열, 스물, 서른 ... + 하나~아홉 (스물넷, 열둘, 아홉)
  const TENS = { 열: 10, 스물: 20, 스무: 20, 서른: 30, 마흔: 40, 쉰: 50, 예순: 60, 일흔: 70, 여든: 80, 아흔: 90 };
  const ONES = { 하나: 1, 한: 1, 둘: 2, 두: 2, 셋: 3, 세: 3, 석: 3, 넷: 4, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9 };
  const re = new RegExp(`(${Object.keys(TENS).join('|')})?(${Object.keys(ONES).sort((a, b) => b.length - a.length).join('|')})?`, 'g');
  for (const m of s.matchAll(re)) if (m[0]) out.push((TENS[m[1]] || 0) + (ONES[m[2]] || 0));
  return out;
}
// 숫자 뒤 조사 (12는, 3은): 끝소리에 받침이 있으면 '은'
const numJosa = n => (n % 10 === 0 || [1, 3, 6, 7, 8].includes(n % 10) ? '은' : '는');

const ABC_NAMES = {
  a: ['에이', '애이', '에'], b: ['비', '삐'], c: ['씨', '시'], d: ['디', '띠'], e: ['이'], f: ['에프', '애프', '에후'], g: ['지', '쥐'],
  h: ['에이치', '에이취', '에치', '에취'], i: ['아이'], j: ['제이', '재이'], k: ['케이', '캐이'], l: ['엘', '앨'], m: ['엠', '앰'],
  n: ['엔', '앤'], o: ['오'], p: ['피'], q: ['큐'], r: ['알', '아르'], s: ['에스', '애스'], t: ['티'], u: ['유'],
  v: ['브이', '뷔', '부이', '비이'], w: ['더블유', '더블류', '더블', '떠블유', '더유'], x: ['엑스', '액스', '엑쓰', '익스'], y: ['와이', '와'], z: ['지', '제트', '쥐', '즤', '젯', '지이'],
};
// 영어로 알아들었을 때 (B → "bee", C → "see")
const ABC_EN = {
  a: ['ay', 'eh', 'hey'], b: ['be', 'bee'], c: ['see', 'sea', 'si'], d: ['dee', 'the'], e: ['ee'], f: ['ef', 'eff'], g: ['gee', 'ji'],
  h: ['age', 'eich', 'each'], i: ['eye', 'ai'], j: ['jay'], k: ['kay', 'okay', 'ok'], l: ['el', 'elle', 'al'], m: ['em'], n: ['en', 'and'],
  o: ['oh', 'owe'], p: ['pee', 'pea'], q: ['queue', 'cue', 'kyu'], r: ['are', 'our'], s: ['es', 'ess', 'yes'], t: ['tea', 'tee'],
  u: ['you', 'yu'], v: ['vee', 'we'], w: ['double'], x: ['ex', 'axe'], y: ['why'], z: ['zee', 'zed'],
};
// 발음이 서툴러도: 센소리/된소리는 예사소리로 (피 = 비, 티 = 디), ㅐ = ㅔ 로 보고 자모가 60% 넘게 같으면 맞음
const ABC_SOFT = { 'ㄲ': 'ㄱ', 'ㅋ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅌ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅍ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ', 'ㅊ': 'ㅈ', 'ㅐ': 'ㅔ', 'ㅒ': 'ㅖ' };
function abcHeard(heard, ch) {
  const soft = t => Array.from(Judge.toJamo(t)).map(j => ABC_SOFT[j] || j).join('');
  const toks = (heard || '').normalize('NFC').toLowerCase().split(/[\s.,!?~]+/).map(t => t.replace(/[^\p{L}]/gu, '')).filter(Boolean);
  const en = ABC_EN[ch], ko = ABC_NAMES[ch].map(soft);
  const raw = [...toks.slice(0, 3), toks.join('')], cands = [...raw];
  for (const t0 of raw) cands.push(t0.replace(/(이에요|에요|예요|이요|요|이야|야|입니다)$/, '')); // "에이요" → "에이"도 "에"도
  for (const t of new Set(cands.filter(Boolean))) {
    if (t === ch || t === ch + ch || en.includes(t)) return true;
    if (/^[a-z]+$/.test(t)) continue;
    const syl = Array.from(t);
    for (const nm of ko) {
      const n = ABC_NAMES[ch][ko.indexOf(nm)].length;
      if (syl.length > n + 1) continue; // 긴 말 속의 우연은 빼고 (비행기 ≠ B)
      for (let len = Math.max(1, n - 1); len <= n + 1; len++) {
        for (let i = 0; i + len <= syl.length; i++) {
          const js = soft(syl.slice(i, i + len).join(''));
          if (js === nm || 1 - Judge.lev(js, nm) / Math.max(js.length, nm.length) >= 0.6) return true;
        }
      }
    }
  }
  return false;
}
const SHIELD_HITS = 10; // 🛡️ 방패가 버티는 횟수
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const Quiz = {
  get st() {
    if (!this._st) this._st = Object.assign({ turn: 0, add: 1, mul: 1, abc: 1, addN: 0, mulN: 0, abcN: 0, mathOp: 'add' }, Store.get(KEYS.quiz, {}) || {});
    return this._st;
  },
  save() { Store.set(KEYS.quiz, this.st); },

  // 다음 퀴즈 종류 (영어 설정이면 문장만)
  nextKind() {
    if (Store.settings.lang === 'en') return 'sentence';
    const k = QUIZ_KINDS[this.st.turn % QUIZ_KINDS.length];
    this.st.turn = (this.st.turn + 1) % QUIZ_KINDS.length;
    this.save();
    return k;
  },

  // 더하기: 1 (8+5, 12+13 받아올림 없음) → 2 (두 자리 받아올림 없음) → 3 (두 자리 + 한 자리 받아올림) → 4 (두 자리 받아올림, 100 안쪽) → 5 (두 자리끼리 아무거나)
  // 곱하기: 1 (2~3 x 2~3) → 2 (2~5 단, 5까지) → 3 (2~9 단, 5까지) → 4 (구구단) → 5 (11~19 x 2~5)
  makeMath() {
    const st = this.st, op = st.mathOp;
    st.mathOp = op === 'add' ? 'mul' : 'add';
    this.save();
    const lv = st[op];
    let a, b;
    if (op === 'add') {
      const noCarry = (lo, hi) => { do { a = rint(lo, hi); b = rint(lo, hi); } while ((a % 10) + (b % 10) > 9); };
      if (lv <= 1) { if (Math.random() < 0.5) { a = rint(2, 9); b = rint(2, 9); } else noCarry(10, 15); }
      else if (lv === 2) noCarry(10, 39);
      else if (lv === 3) { do { a = rint(11, 49); b = rint(3, 9); } while ((a % 10) + b < 10); }
      else if (lv === 4) { do { a = rint(12, 59); b = rint(12, 39); } while ((a % 10) + (b % 10) < 10 || a + b >= 100); }
      else { a = rint(10, 99); b = rint(10, 99); }
    } else {
      if (lv <= 1) { a = rint(2, 3); b = rint(2, 3); }
      else if (lv === 2) { a = rint(2, 5); b = rint(2, 5); }
      else if (lv === 3) { a = rint(2, 9); b = rint(2, 5); }
      else if (lv === 4) { a = rint(2, 9); b = rint(2, 9); }
      else { a = rint(11, 19); b = rint(2, 5); }
    }
    const ans = op === 'add' ? a + b : a * b, sign = op === 'add' ? '+' : '×', ko = op === 'add' ? '더하기' : '곱하기';
    return {
      id: `q:${op}`, kind: op, word: `${a} ${sign} ${b} = ?`, answer: `${a} ${sign} ${b} = ${ans}`, lang: 'ko', emoji: '🔢', level: lv, alts: [],
      speak: `${a} ${ko} ${b}${numJosa(b)} ${ans}`, ask: `${a} ${ko} ${b}${numJosa(b)}?`, speakLang: 'ko', listen: 'ko',
      check: heard => spokenNumbers(heard).includes(ans),
    };
  },

  // 알파벳: 1 (A~E) → 2 (A~J) → 3 (A~O) → 4 (A~T) → 5 (A~Z), 대문자/소문자 아무거나
  makeAbc() {
    const lv = this.st.abc, n = [5, 10, 15, 20, 26][lv - 1] || 26;
    let ch;
    do { ch = 'abcdefghijklmnopqrstuvwxyz'[rint(0, n - 1)]; } while (ch === this.lastAbc && n > 1);
    this.lastAbc = ch;
    const shown = Math.random() < 0.5 ? ch.toUpperCase() : ch, names = ABC_NAMES[ch];
    return {
      id: 'q:abc', kind: 'abc', word: shown, lang: 'en', emoji: '🔤', level: lv, alts: [],
      speak: names[0], speakLang: 'ko', listen: 'ko',
      check: heard => abcHeard(heard, ch),
    };
  },

  // 맞힌 결과로 난이도 조절
  result(word, res) {
    const key = word.kind, st = this.st;
    if (!key || !(key in st)) return;
    if (res && res.method === 'speech' && res.tries === 0) {
      if (++st[`${key}N`] >= 3) { st[key] = Math.min(QUIZ_MAX_LV, st[key] + 1); st[`${key}N`] = 0; }
    } else if (res && String(res.method).startsWith('follow')) {
      st[key] = Math.max(1, st[key] - 1);
      st[`${key}N`] = 0;
    } else st[`${key}N`] = 0;
    this.save();
    console.log(`[Quiz] ${key} 단계 ${st[key]} (연속 ${st[`${key}N`]})`);
  },
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

  return { judge, normalize, toJamo, similarity, lev: levenshtein, pronounce: s => toJamo(normalize(s)) };
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
  // 아이템을 주웠다: 또르릉 올라가는 세 음 (주머니에 들어간 느낌)
  gain() { [784, 988, 1319].forEach((f, i) => this.tone(f, 0.12, { type: 'triangle', vol: 0.12, delay: i * 0.06 })); },
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

  best: {},        // 말 코드(ko-KR) → 고른 목소리
  badVoices: new Set(), // 못 읽은 목소리 (인터넷 목소리가 끊겼을 때 등): 다음부터 빼고 고른다

  init() {
    if (!('speechSynthesis' in window)) return;
    const load = () => { this.voices = speechSynthesis.getVoices(); this.best = {}; };
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

  // 기기/브라우저마다 가장 자연스러운 목소리를 점수로 고른다
  //  - Edge: "Microsoft SunHi Online (Natural)" 같은 AI 목소리가 제일 좋다 (영어는 아이 목소리 Ana)
  //  - 아이폰/아이패드/맥: 고품질(Premium) > 향상된(Enhanced) 유나, 장난 목소리(Bubbles, Zarvox 등)는 빼고
  //  - 크롬/안드로이드: Google 목소리
  voiceScore(v, code) {
    const n = v.name, lang = v.lang.replace('_', '-').toLowerCase();
    let sc = lang === code.toLowerCase() ? 10 : 0;
    if (/natural|neural/i.test(n)) sc += 100;
    else if (/premium|고품질|프리미엄/i.test(n)) sc += 90;
    else if (/enhanced|향상/i.test(n)) sc += 80;
    else if (/google/i.test(n)) sc += 60;
    else if (/online/i.test(n)) sc += 50;
    else if (/yuna|유나|samantha|ava|allison|susan|zoe/i.test(n)) sc += 40;
    else if (/microsoft/i.test(n)) sc += 10; // 윈도우 기본 목소리 (Heami, Zira: 딱딱하다)
    if (/sunhi|선히|ana\b|jenny|aria|ava/i.test(n)) sc += 6; // 부드러운 목소리 (Ana 는 아이 목소리)
    if (/multilingual/i.test(n)) sc -= 5;
    if (/albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|ralph|kathy|grandpa|grandma|eddy|flo|reed|rocko|sandy|shelley/i.test(n)) sc -= 200;
    if (v.default) sc += 1;
    return sc;
  },

  pickVoice(code) {
    if (this.best[code] && !this.badVoices.has(this.best[code].name)) return this.best[code];
    const prefix = code.slice(0, 2).toLowerCase();
    const vs = this.voices.filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(prefix) && !this.badVoices.has(v.name));
    let best = null, bestSc = -Infinity;
    for (const v of vs) { const sc = this.voiceScore(v, code); if (sc > bestSc) { best = v; bestSc = sc; } }
    if (best) {
      this.best[code] = best;
      console.log(`[Speech] ${code} 목소리: ${best.name} (점수 ${bestSc}, 후보 ${vs.length}개)`);
    }
    return best;
  },

  // AI/고품질 목소리는 원래 소리가 자연스러워서 높낮이를 건드리지 않는다
  isNatural(v) { return !!v && /natural|neural|premium|enhanced|고품질|향상|google|online/i.test(v.name); },

  speak(text, lang, retry = true) {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window)) return resolve();
      if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANG_CODE[lang] || 'ko-KR';
      const voice = this.pickVoice(u.lang);
      if (voice) u.voice = voice;
      const natural = this.isNatural(voice);
      u.rate = natural ? 0.92 : 0.85;
      u.pitch = natural ? 1 : 1.1;
      const t0 = performance.now();
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
      u.onerror = e => {
        // 인터넷 목소리가 바로 실패하면 (오프라인 등) 그 목소리를 빼고 다음으로 좋은 목소리로 한 번 더
        const err = e && e.error;
        if (retry && voice && !done && !['interrupted', 'canceled'].includes(err) && performance.now() - t0 < 3000) {
          console.log(`[Speech] 목소리 실패 (${voice.name}: ${err}), 다른 목소리로`);
          this.badVoices.add(voice.name);
          done = true;
          clearTimeout(timer);
          this.speak(text, lang, false).then(resolve);
          return;
        }
        finish();
      };
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
    e.follow.textContent = `👂 ${FOLLOW_TEXT[word.speakLang || word.lang]}`;
    e.overlay.classList.remove('hidden');
    this.fitWord();
    this.updateUI();
    this.setHint(false);
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
    this.listener = Speech.listen(this.word.listen || this.word.lang, {
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
    // 산수/알파벳 카드는 저마다 답을 확인한다 (보여 주는 글자와 말할 답이 다르다)
    const r = this.word.check
      ? (ok => ({ pass: ok, score: ok ? 1 : 0, how: 'check' }))(alts.some(a => this.word.check(a)))
      : Judge.judge(this.word.word, alts, Store.settings.strictness, this.word.alts, !final);
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
    await Speech.speak(this.word.speak || this.word.word, this.word.speakLang || this.word.lang);
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
    e.reveal.textContent = /^[sq]:/.test(this.word.id || '') ? '' : this.word.emoji || '⭐'; // 퀴즈 (문장/산수/알파벳) 는 그림 없이
    const sl = this.word.speakLang || this.word.lang;
    e.praise.textContent = PRAISE[sl];
    if (this.word.answer != null) e.word.textContent = this.word.answer; // 산수: 맞춘 뒤 답을 보여 준다
    this.fitWord(0.55);
    Sfx.success();
    burst();
    const praise = Speech.speak(`${this.word.speak || this.word.word}! ${PRAISE[sl]}`, sl);
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
      if (ITEMS[r.result].slot && !Game.equip[ITEMS[r.result].slot]) Game.wear(r.result, false); // 그 곳이 비어 있으면 바로 입는다
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
const TILE = {
  GRASS: 0, TREE: 1, WATER: 2, SAND: 3, ROCK: 4, FLOWER: 5, HOUSE: 6, DOOR: 7, PATH: 8,
  BRICK: 9, GATE: 10, BRIDGE: 11, TORCH: 12, // 놓아서 생기는 칸 (GATE 는 집 문(DOOR)과 다른 내가 놓는 문)
  CLOVER: 13, LUCKY: 14, // 2탄: 세잎클로버 / 네잎클로버 (지나갈 수 있다. 네잎클로버만 뽑는다)
  LOCK_TREE: 15, GOLD_TREE: 16, // 탄 사이 테두리의 잠긴 나무 → 보스를 잡으면 황금 나무 (캐면 다음 탄으로 가는 길)
  THORN: 17, // 놓아서 생기는 가시 울타리 (막고, 부딪친 사나운 동물은 따끔)
  CLIFF: 18, CHEST: 19, // 3탄: 미로 벽 절벽 (캘 수 없다) / 미로 끝 보물 상자
  STATION: 20, // 2탄 ⛺ 텐트 / 3탄 ⚒️ 대장간 제작대 (부딪치면 제작대가 열린다. 그림은 칸 위로 크게)
  SAPLING: 21, // 심은 묘목 (조금 지나면 나무로 자란다. 자라다가 사람이 끼지 않게 막는 칸)
  JUNGLE: 22, CHASM: 23, SEA: 24, // 4탄 동글동글 덤불 벽 / 5탄 낭떠러지 / 6탄 깊은 바다. 캘 수 없다 (낭떠러지/바다 위에는 🌉 다리를 놓는다)
  CRACK: 25, BUSH: 26, // 3탄 금 간 바위 벽 / 4탄 얇은 덤불 벽: 부수면 길이 생긴다 (미로 벽의 절반쯤)
};
const BLOCKING = new Set([TILE.TREE, TILE.WATER, TILE.ROCK, TILE.HOUSE, TILE.BRICK, TILE.TORCH, TILE.LOCK_TREE, TILE.GOLD_TREE, TILE.THORN, TILE.CLIFF, TILE.CHEST, TILE.STATION, TILE.SAPLING, TILE.JUNGLE, TILE.CHASM, TILE.SEA, TILE.CRACK, TILE.BUSH]);
const MONSTER_BLOCKING = new Set([...BLOCKING, TILE.GATE]); // 문은 몬스터만 막는다
const ARROW_BLOCKING = new Set([TILE.TREE, TILE.ROCK, TILE.HOUSE, TILE.BRICK, TILE.GATE, TILE.TORCH, TILE.LOCK_TREE, TILE.GOLD_TREE, TILE.CLIFF, TILE.CHEST, TILE.STATION, TILE.JUNGLE, TILE.CRACK, TILE.BUSH]);
const CHUNK = 16; // 그림 조각 크기 (칸)
// ☀️ 해는 왼쪽 위: 키 큰 칸은 오른쪽 아래 땅에 그림자를 드리운다 (둥근 것: 나무/바위/덤불, 네모: 벽/절벽/상자)
const ROUND_CASTERS = new Set([TILE.TREE, TILE.LOCK_TREE, TILE.GOLD_TREE, TILE.ROCK, TILE.BUSH, TILE.JUNGLE]);
const WALL_CASTERS = new Set([TILE.CLIFF, TILE.CRACK, TILE.BRICK, TILE.CHEST]);
const NO_SHADOW_ON = new Set([...ROUND_CASTERS, ...WALL_CASTERS, TILE.HOUSE, TILE.DOOR, TILE.STATION]);
const MINI_COLORS = ['#7ccf6f', '#2e7d32', '#3b8de0', '#e9d68f', '#8d939b', '#f48fb1', '#c0392b', '#c0392b', '#c8a06a',
  '#b5523b', '#8d5a2b', '#a0703f', '#ffb300',
  '#5fbf4f', '#5fbf4f', '#2e7d32', '#ffd54f', '#33691e', '#5d4037', '#ffb300', '#e65100', '#66bb6a',
  '#1b5e20', '#2b1a12', '#0d47a1', '#a1907f', '#558b2f']; // 네잎클로버는 작은 지도에서 세잎클로버와 같은 색 (찾는 재미)
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
  [TILE.CRACK]: { gives: ['stone'], hand: 'TREE_HITS', tool: 1, tools: ['axe', 'sword'] }, // 금 간 바위 벽: 부수면 길
  [TILE.BUSH]: { gives: ['wood'], hand: 'TREE_HITS', tool: 1, tools: ['axe', 'sword'] },   // 얇은 덤불 벽: 베면 길 + 통나무 (다리 재료)
};
// 🌉 다리를 놓을 수 있는 칸: 물, 5탄 낭떠러지, 6탄 깊은 바다 (캐면 원래 칸으로)
const BRIDGE_ON = new Set([TILE.WATER, TILE.CHASM, TILE.SEA]);
// 땅 (풀밭, 모래, 물, 흙 길): 움직일 수 없다. 캐지도 못하고 아이템도 안 나온다. 블록은 풀밭/모래 위에만 놓는다
const PLACE_ON = new Set([TILE.GRASS, TILE.SAND]);
const LAND = new Set([TILE.GRASS, TILE.SAND, TILE.WATER, TILE.PATH]);
// 땅이 바뀐 칸은 원래 맵대로 되돌린다 (땅을 캐고 놓던 때 바뀐 칸: 흙 자국, 옮긴 물/모래/풀)
function fixLand(i, v) {
  const base = World.base[i];
  if (v === base || !LAND.has(v)) return v;
  if (v === TILE.WATER && base === TILE.BRIDGE) return v; // 다리를 캔 자리는 물
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
  if (d.kind === 'gear') return tr('끼우면 두 번에 한 번 막아 줘요', 'Put it on: blocks every other hit');
  return tr('제작대에서 만들 때 써요', 'Used at the crafting table');
}

const holdable = id => !!WEAPONS[id] || !!(ITEMS[id] && (ITEMS[id].tile || ['food', 'potion'].includes(ITEMS[id].kind)));
// 옷 입는 곳 (Q 고르는 칸 맨 위 줄). 입은 옷은 가방에서 빠지고, 벗으면 가방으로 돌아간다
const WEAR_SLOTS = [
  { slot: 'head', ko: '머리', en: 'Head' },
  { slot: 'body', ko: '몸통', en: 'Body' },
  { slot: 'feet', ko: '다리', en: 'Legs' },
  { slot: 'arm', ko: '방패', en: 'Shield' },
];
// 입은 옷 id 목록 (그림 / 다른 사람에게 보내기)
const wornList = equip => WEAR_SLOTS.map(w => equip[w.slot]).filter(id => ITEMS[id] && ['wear', 'gear'].includes(ITEMS[id].kind));
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
// ============================================================
// 아이템 그림 (24 칸 기준 좌표로 그리고, 실제 크기(24 / 16)의 픽셀마다 계산한다 → 어느 크기든 1 칸 = 1 px, 늘린 그림이 아니다)
//   d.rect / d.ell / d.line / d.poly / d.fill(fn): 색 또는 fn(nx, ny, u, v) → 색. 빛은 위 왼쪽에서
// ============================================================
function iconPainter(g, n) {
  const k = n / 24;
  const fill = (test, col) => {
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const u = (i + 0.5) / k, v = (j + 0.5) / k, r = test(u, v);
        if (r === false || r == null) continue;
        const c = typeof col === 'function' ? col(r, u, v) : col;
        if (c) { g.fillStyle = c; g.fillRect(i, j, 1, 1); }
      }
    }
  };
  const segDist = (u, v, x0, y0, x1, y1) => {
    const dx = x1 - x0, dy = y1 - y0, l = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((u - x0) * dx + (v - y0) * dy) / l));
    return { d: Math.hypot(u - x0 - t * dx, v - y0 - t * dy), t };
  };
  const inPoly = (u, v, pts) => {
    let inside = false;
    for (let a = 0, b = pts.length - 1; a < pts.length; b = a++) {
      const [xa, ya] = pts[a], [xb, yb] = pts[b];
      if ((ya > v) !== (yb > v) && u < (xb - xa) * (v - ya) / (yb - ya) + xa) inside = !inside;
    }
    return inside;
  };
  return {
    fill,
    // 사각형: col 이 함수면 (상자 안 위치 0~1) 을 받는다
    rect: (x, y, w, h, col) => fill((u, v) => (u >= x && u < x + w && v >= y && v < y + h ? [(u - x) / w, (v - y) / h] : null), typeof col === 'function' ? r => col(r[0], r[1]) : col),
    // 타원: col 이 함수면 (nx, ny: -1~1, d: 0~1 가운데에서 거리)
    ell: (cx, cy, rx, ry, col) => fill((u, v) => {
      const nx = (u - cx) / rx, ny = (v - cy) / ry, d = nx * nx + ny * ny;
      return d <= 1 ? [nx, ny, d] : null;
    }, typeof col === 'function' ? r => col(r[0], r[1], r[2]) : col),
    // 굵은 선: col 이 함수면 (t: 0~1 선 따라, s: -1~1 가로질러)
    line: (x0, y0, x1, y1, w, col) => fill((u, v) => {
      const { d, t } = segDist(u, v, x0, y0, x1, y1);
      if (d > w / 2) return null;
      const side = Math.sign((x1 - x0) * (v - y0) - (y1 - y0) * (u - x0)) || 1;
      return [t, side * d / (w / 2)];
    }, typeof col === 'function' ? r => col(r[0], r[1]) : col),
    poly: (pts, col) => fill((u, v) => (inPoly(u, v, pts) ? [u, v] : null), typeof col === 'function' ? r => col(r[0], r[1]) : col),
    // 공 모양 명암 (밝음 / 보통 / 어두움)
    ball: (nx, ny, [l, m, d], hi) => {
      const s = nx * 0.55 + ny * 0.8;
      if (hi && (nx + 0.38) ** 2 + (ny + 0.42) ** 2 < 0.045) return hi;
      return s < -0.48 ? l : s > 0.42 ? d : m;
    },
  };
}

const ICON_ART = {
  LOG: d => {
    d.rect(3, 7, 16, 11, (x, y) => (y < 0.18 ? '#b07a45' : y > 0.82 ? '#5d3a1a' : '#8d5a2b'));
    for (const [x, y, w] of [[5, 10, 7], [9, 13, 8], [4, 15, 5], [12, 9, 5]]) d.rect(x, y, w, 1, '#6d4321');
    d.ell(3.5, 12.5, 1.6, 5.5, '#6d4321');
    d.ell(19, 12.5, 3.6, 5.6, '#6d4c41');
    d.ell(19, 12.5, 2.9, 4.8, (nx, ny, r) => (r > 0.55 && r < 0.75 ? '#c8935a' : r < 0.12 ? '#a1887f' : '#e6c08a'));
  },
  STONE: d => {
    d.ell(12, 14, 9.5, 7.5, (nx, ny) => d.ball(nx, ny, ['#e0e0e0', '#a8a8a8', '#6e6e6e']));
    d.poly([[6, 12], [11, 8], [16, 9], [12, 13]], '#c9c9c9');
    d.line(13, 13, 17, 17, 1, '#7a7a7a');
  },
  SPOOL: d => {
    d.rect(7, 6, 10, 12, (x, y) => (Math.floor((x * 10 + y * 12) / 3) % 2 ? '#e8e8e8' : x > 0.8 ? '#bdbdbd' : '#fafafa'));
    for (const y of [3, 18]) { d.rect(5, y, 14, 3, '#8d6e63'); d.rect(5, y, 14, 1, '#a1887f'); d.rect(5, y + 2, 14, 1, '#6d4c41'); }
    d.line(17, 14, 21, 21, 1, '#f5f5f5');
  },
  GEM: d => {
    d.poly([[4, 9], [8, 4], [16, 4], [20, 9], [12, 21]], '#29b6f6');
    d.poly([[4, 9], [8, 4], [12, 9]], '#b3e5fc');
    d.poly([[8, 4], [16, 4], [12, 9]], '#e1f5fe');
    d.poly([[16, 4], [20, 9], [12, 9]], '#4fc3f7');
    d.poly([[4, 9], [12, 9], [12, 21]], '#4fc3f7');
    d.poly([[12, 9], [20, 9], [12, 21]], '#0277bd');
    d.rect(9, 6, 1, 1, '#ffffff');
  },
  APPLE: d => {
    d.ell(8.5, 14, 6.5, 7.5, (nx, ny) => d.ball(nx, ny, ['#ff8a80', '#e53935', '#b71c1c']));
    d.ell(15.5, 14, 6.5, 7.5, (nx, ny) => d.ball(nx * 0.6 + 0.3, ny, ['#ff8a80', '#e53935', '#b71c1c']));
    d.ell(12, 7.5, 2, 1.2, '#8e1b1b');
    d.line(12, 8, 13, 2.5, 1.6, '#6d4c41');
    d.ell(16.5, 4.5, 3.2, 1.7, (nx, ny) => (ny < 0 ? '#66bb6a' : '#2e7d32'));
    d.ell(7.5, 11, 1.4, 2.2, '#ffcdd2');
  },
  CARROT: d => {
    d.poly([[12.5, 5.5], [19, 12], [6, 21.5], [3.5, 19.5]], (u, v) => ((u - v) < -9 ? '#ffb74d' : (u - v) > -3 ? '#e65100' : '#fb8c00'));
    for (const [x, y] of [[8, 15], [11, 12], [6, 18.5], [13, 15]]) d.line(x, y, x + 2, y + 2, 1, '#d84315');
    for (const [x, y] of [[19.5, 1.5], [22, 4], [22.5, 8]]) d.line(16, 8, x, y, 2, '#43a047');
    d.line(16, 8, 20.5, 3, 1, '#2e7d32');
  },
  MEAT: d => {
    d.line(10, 14, 4.5, 19.5, 3, '#f5f5f5');
    d.ell(3.5, 18.5, 2, 2, '#fafafa'); d.ell(5.5, 20.8, 2, 2, '#e0e0e0');
    d.ell(14, 10, 8, 6.8, (nx, ny) => d.ball(nx, ny, ['#e8a868', '#b5651d', '#7b3f10'], '#ffd7a8'));
    d.line(10, 7, 17, 9, 1, '#8d4a16'); d.line(11, 11, 18, 12.5, 1, '#8d4a16');
  },
  FISH: d => {
    d.poly([[17, 12], [23, 6.5], [22, 12], [23, 17.5]], '#1e88e5');
    d.ell(11, 12, 8.5, 5.5, (nx, ny) => (ny > 0.35 ? '#bbdefb' : ny < -0.45 ? '#90caf9' : '#42a5f5'));
    d.poly([[9, 7], [14, 6.5], [12, 8.5]], '#1e88e5');
    d.line(7.5, 9, 7.5, 15, 1, '#1565c0');
    d.ell(5, 11, 1.4, 1.4, '#ffffff'); d.rect(4.5, 10.5, 1, 1, '#0d47a1');
    d.rect(10, 11, 1, 1, '#90caf9'); d.rect(13, 13, 1, 1, '#90caf9'); d.rect(15, 11, 1, 1, '#90caf9');
  },
  HONEY: d => {
    d.ell(12, 15, 8.5, 7, (nx, ny) => d.ball(nx, ny, ['#ffe082', '#ffb300', '#e08600'], '#fff8e1'));
    d.rect(6.5, 6, 11, 3.5, '#8d6e63'); d.rect(6.5, 6, 11, 1, '#a1887f'); d.rect(6.5, 8.5, 11, 1, '#6d4c41');
    d.rect(10.5, 3, 3, 3, '#6d4c41');
    d.line(9, 9.5, 9, 13, 2, '#ffca28');
    d.rect(10, 14, 6, 4, '#fff3e0'); d.rect(10, 17, 6, 1, '#e0c9a6');
  },
  CAKE: d => {
    d.ell(12, 21, 10.5, 1.8, '#cfd8dc');
    d.rect(3.5, 11, 17, 9.5, (x, y) => (y > 0.38 && y < 0.55 ? '#f48fb1' : x > 0.85 ? '#f2cf9f' : '#ffe0b2'));
    d.ell(12, 11, 8.5, 2.8, '#fafafa');
    for (const x of [5, 9, 14, 18]) d.ell(x, 13.5, 1, 1.8, '#fafafa');
    d.rect(11, 3.5, 2, 6.5, (x, y) => (Math.floor(y * 6.5) % 2 ? '#ffffff' : '#e53935'));
    d.ell(12, 2.2, 1.2, 1.8, '#ffca28');
    d.rect(7, 10, 1, 1, '#e53935'); d.rect(16, 10, 1, 1, '#e53935');
  },
  AXE: d => {
    d.line(5, 21, 14.5, 5, 2.6, (t, sd) => (sd < -0.2 ? '#a86d36' : '#7a4a22'));
    // 도끼 머리: 자루에 꽂힌 쐐기 + 둥근 날 (날 끝이 밝다)
    d.poly([[11, 4.5], [15, 2.5], [19, 1.5], [22, 4], [22.5, 9], [20, 12], [16, 11], [12, 8.5]],
      (u, v) => (u > 19.5 ? '#eceff1' : v < 5 ? '#b0bec5' : v > 9.5 ? '#607d8b' : '#90a4ae'));
    d.rect(11.5, 4, 3, 5, '#546e7a');
    d.rect(16, 4, 1, 1, '#eceff1');
  },
  SWORD: d => {
    d.line(7, 17, 20.5, 3.5, 3.8, (t, s) => (s < -0.25 ? '#ffffff' : s > 0.35 ? '#90a4ae' : '#cfd8dc'));
    d.line(8.5, 15.5, 19, 5, 0.9, '#b0bec5');
    d.line(3.5, 13, 11, 20.5, 2.6, '#fbc02d');
    d.line(5.5, 18.5, 2.5, 21.5, 2.6, '#6d4c41');
    d.ell(2.2, 21.8, 1.6, 1.6, '#fbc02d');
  },
  BOW: d => {
    d.fill((u, v) => {
      const r = Math.hypot(u - 2, v - 12), a = Math.atan2(v - 12, u - 2);
      return Math.abs(r - 14) < 1.4 && Math.abs(a) < 1.05 ? r : null;
    }, r => (r < 14 ? '#a86d36' : '#6d4321'));
    d.line(9, 0.5, 9, 23.5, 0.8, '#eeeeee');
    d.line(3, 12, 21, 12, 1.2, '#a1887f');
    d.poly([[23.5, 12], [19.5, 9.5], [19.5, 14.5]], '#90a4ae');
    d.poly([[3, 12], [5.5, 9.5], [6.5, 12], [5.5, 14.5]], '#e53935');
  },
  SHIELD: d => {
    const shape = [[3, 3], [21, 3], [21, 12], [12, 22.5], [3, 12]];
    d.poly(shape, '#4e342e');
    d.poly([[4.5, 4.5], [19.5, 4.5], [19.5, 11.5], [12, 20.5], [4.5, 11.5]], (u) => (Math.floor((u - 4.5) / 3.75) % 2 ? '#a8723f' : '#93612f'));
    d.rect(4.5, 4.5, 15, 1, '#c8935a');
    d.ell(12, 11, 3.4, 3.4, (nx, ny) => d.ball(nx, ny, ['#fff59d', '#ffca28', '#e09b00']));
  },
  CROWN: d => {
    d.poly([[3, 19], [3, 6], [8, 11], [12, 4], [16, 11], [21, 6], [21, 19]], (u, v) => (v > 16 ? '#e0a800' : u < 8 ? '#fff176' : '#fdd835'));
    d.rect(3, 15, 18, 1, '#f9a825');
    d.ell(12, 13, 1.9, 1.9, '#e53935'); d.ell(6.5, 13.5, 1.3, 1.3, '#1e88e5'); d.ell(17.5, 13.5, 1.3, 1.3, '#1e88e5');
    for (const [x, y] of [[3, 5], [12, 3], [21, 5]]) d.ell(x, y, 1.5, 1.5, '#fff59d');
  },
  HAT: d => {
    d.ell(12, 16.5, 11, 3.6, (nx, ny) => (ny < -0.2 ? '#8d5a2b' : '#6d4321'));
    d.fill((u, v) => {
      const nx = (u - 12) / 6.8, ny = (v - 10.5) / 6.5;
      return nx * nx + ny * ny <= 1 && v < 16.5 ? [nx, ny] : null;
    }, ([nx, ny]) => d.ball(nx, ny, ['#c8935a', '#a8723f', '#7a5230']));
    d.rect(5.3, 13, 13.4, 2.4, '#4e342e');
    d.line(10, 5, 12, 7, 1, '#7a5230'); d.line(14, 5, 12, 7, 1, '#7a5230');
  },
  VEST: d => {
    d.poly([[4, 4], [9, 4], [12, 10], [15, 4], [20, 4], [22, 9], [19.5, 10.5], [19.5, 21], [4.5, 21], [4.5, 10.5], [2, 9]],
      (u) => (u < 7 ? '#c8935a' : u > 17 ? '#8d5a2b' : '#a8723f'));
    d.line(12, 10, 12, 21, 1, '#6d4321');
    for (const y of [13, 16, 19]) d.rect(10.5, y, 3, 1, '#e6c08a');
    d.rect(4.5, 19.5, 15, 1.5, '#6d4321');
    d.rect(8, 4, 1, 4, '#e6c08a'); d.rect(15, 4, 1, 4, '#e6c08a');
  },
  BOOTS: d => {
    const boot = (ox, dark) => {
      const c = dark ? ['#6d4321', '#5d3a1a'] : ['#8d5a2b', '#a8723f'];
      d.rect(ox, 4, 6, 13, (x) => (x < 0.25 ? c[1] : c[0]));
      d.ell(ox + 6, 17.5, 4, 3.2, c[0]);
      d.rect(ox, 14.5, 7, 6, c[0]);
      d.rect(ox - 0.5, 3, 7, 2.5, dark ? '#c8a272' : '#e6c08a');
      d.rect(ox, 20, 10, 1.6, '#3e2723');
    };
    boot(12, true);
    boot(2, false);
  },
  LEATHER: d => {
    for (const [x, y] of [[4.5, 5], [19.5, 5], [4.5, 19], [19.5, 19]]) d.ell(x, y, 2.8, 2.6, '#8d5a2b');
    d.ell(12, 12, 9.3, 8.3, (nx, ny) => d.ball(nx, ny, ['#c8935a', '#a8723f', '#7a5230']));
    d.fill((u, v) => {
      const nx = (u - 12) / 7, ny = (v - 12) / 6, r = nx * nx + ny * ny;
      return Math.abs(r - 1) < 0.12 && Math.floor(Math.atan2(ny, nx) * 4) % 2 === 0;
    }, '#e6c08a');
    d.ell(10, 10, 1.6, 1.1, '#d6a56b'); d.ell(14.5, 14, 1.4, 1, '#d6a56b');
  },
  THORN: d => {
    d.rect(2, 19, 20, 3, '#5d4037'); d.rect(2, 19, 20, 1, '#6d4c41');
    for (const [x0, top, x1] of [[3, 7, 9], [8, 2, 16], [15, 8, 21]]) {
      const mid = (x0 + x1) / 2;
      d.poly([[x0, 19.5], [mid, top], [x1, 19.5]], (u) => (u < mid - 0.5 ? '#a1887f' : u > mid + 1 ? '#5d4037' : '#8d6e63'));
      d.poly([[mid - 0.9, top + 2.6], [mid, top], [mid + 0.9, top + 2.6]], '#f5f5f5');
    }
  },
  LUCKY: d => {
    d.line(12, 12, 16, 22.5, 1.6, '#2e7d32');
    // 하트 잎 네 장 (잎마다 동그라미 두 개 + 가운데로 모이는 끝)
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const cx = 12 + dx * 5.6, cy = 11.5 + dy * 5.6, px = -dy, py = dx;
      const col = (nx, ny) => (nx * 0.5 + ny * 0.8 < -0.35 ? '#81c784' : nx * 0.5 + ny * 0.8 > 0.55 ? '#2e7d32' : '#43a047');
      d.poly([[cx + px * 4.2 + dx * 0.6, cy + py * 4.2 + dy * 0.6], [cx - px * 4.2 + dx * 0.6, cy - py * 4.2 + dy * 0.6], [12 + dx * 1.2, 11.5 + dy * 1.2]], '#43a047');
      for (const sg of [-1, 1]) d.ell(cx + px * 2.1 * sg + dx * 0.9, cy + py * 2.1 * sg + dy * 0.9, 2.4, 2.4, col);
    }
    d.ell(12, 11.5, 1.2, 1.2, '#2e7d32');
  },
};
for (const [name, liquid, light] of [['POTION_R', '#e53935', '#ff8a80'], ['POTION_B', '#1e88e5', '#90caf9'], ['POTION_Y', '#fdd835', '#fff9c4']]) {
  ICON_ART[name] = d => {
    d.rect(9.5, 1.5, 5, 3.2, '#8d6e63'); d.rect(9.5, 1.5, 5, 1, '#a1887f');
    d.rect(10, 4.5, 4, 5, '#b3e5fc');
    d.ell(12, 15.5, 8, 7.5, '#b3e5fc');
    d.ell(12, 15.5, 6.8, 6.3, (nx, ny) => (ny < -0.25 ? '#e1f5fe' : d.ball(nx, ny, [light, liquid, shade(liquid, 0.7)])));
    d.ell(8.3, 13, 1, 2.6, '#ffffff');
    d.rect(13, 16, 1, 1, light); d.rect(14, 13.5, 1, 1, light);
  };
}

// 블록 아이템 그림 (가방/주머니/손/땅에 떨어진 것). 맵에 놓은 칸 그림은 World.drawTile
Object.assign(ICON_ART, {
  BLOCK_FLOWER: d => {
    d.line(12, 11, 12, 22, 1.6, '#2e7d32');
    d.ell(8.5, 18, 3.2, 1.4, '#43a047'); d.ell(15.5, 16, 3.2, 1.4, '#66bb6a');
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      d.ell(12 + dx * 3.4, 8 + dy * 3.4, 3.1, 3.1, (nx, ny) => d.ball(nx, ny, ['#ff8a80', '#e74c3c', '#b03a2e']));
    }
    d.ell(12, 8, 2, 2, (nx, ny) => (nx + ny < -0.6 ? '#fffde7' : '#fdd835'));
  },
  BLOCK_SAPLING: d => {
    d.ell(12, 20.5, 7.5, 2.8, (nx, ny) => (ny < -0.3 ? '#8d6e63' : '#6d4c41'));
    d.line(12, 20, 12, 8, 1.7, (t, sd) => (sd < 0 ? '#7cb342' : '#558b2f'));
    d.ell(7.5, 10.5, 4.4, 2.2, (nx, ny) => (ny < -0.2 ? '#a5d6a7' : '#66bb6a'));
    d.ell(16.5, 7, 4.4, 2.2, (nx, ny) => (ny < -0.2 ? '#81c784' : '#43a047'));
  },
  BLOCK_BRICK: d => {
    d.rect(2, 3, 20, 18, '#d9c5a0');
    for (let row = 0; row < 4; row++) {
      const y = 3 + row * 4.5, off = row % 2 ? 0 : 5;
      for (let x = 2 - off; x < 22; x += 10) {
        const x0 = Math.max(2, x + 0.5), x1 = Math.min(22, x + 9.5);
        if (x1 - x0 < 1) continue;
        d.rect(x0, y, x1 - x0, 3.7, (bx, by) => (by < 0.28 ? '#c96a50' : by > 0.72 ? '#8f3f2c' : '#b5523b'));
      }
    }
  },
  BLOCK_GATE: d => {
    d.rect(4, 1.5, 16, 21, '#5d3a1a');
    for (const [x, w] of [[5, 4.6], [9.8, 4.6], [14.6, 4.4]]) d.rect(x, 2.5, w, 19, (bx) => (bx < 0.2 ? '#a86d36' : bx > 0.8 ? '#6d4321' : '#8d5a2b'));
    for (const y of [5, 17]) { d.rect(5, y, 14, 2.2, '#6d4321'); d.rect(6, y + 0.6, 1, 1, '#bdbdbd'); d.rect(17, y + 0.6, 1, 1, '#bdbdbd'); }
    d.rect(16, 11, 1.8, 2.2, '#f1c40f');
  },
  BLOCK_BRIDGE: d => {
    for (let x = 2.5; x < 21; x += 4.6) d.rect(x, 6, 3.8, 12, (bx) => (bx < 0.25 ? '#c08a50' : bx > 0.75 ? '#7a5230' : '#a0703f'));
    for (const y of [4, 17]) { d.rect(1.5, y, 21, 3, '#5d4037'); d.rect(1.5, y, 21, 1, '#795548'); }
    for (const x of [2, 21]) d.rect(x, 2, 1.8, 18, '#4e342e');
  },
  BLOCK_TORCH: d => {
    d.line(12, 22.5, 12, 11, 3, (t, sd) => (sd < 0 ? '#8d6e63' : '#6d4c41'));
    d.rect(9.8, 9, 4.4, 3.2, '#5d4037'); d.rect(9.8, 11, 4.4, 1, '#4e342e');
    d.ell(12, 5.8, 4.2, 5.2, (nx, ny) => (ny < -0.5 ? '#ffb74d' : '#ff9800'));
    d.ell(12, 6.8, 2.4, 3.4, '#ffeb3b');
    d.ell(12, 7.8, 1.1, 1.7, '#fffde7');
  },
  BLOCK_THORN: d => {
    // 맵의 가시 울타리와 같은 모양 (받침 + 가시 네 개)
    for (const [cx, top, hw] of [[4.5, 8, 3.4], [10, 2, 3.6], [15.5, 4.5, 3.6], [20.5, 9, 3.2]]) {
      d.poly([[cx - hw, 19.5], [cx, top], [cx + hw, 19.5]], (u) => (u < cx - 0.6 ? '#a1887f' : u > cx + 0.6 ? '#6d4c41' : '#8d6e63'));
      d.poly([[cx - 0.9, top + 2.4], [cx, top], [cx + 0.9, top + 2.4]], '#f5f5f5');
    }
    d.rect(1, 18.5, 22, 4, '#5d4037'); d.rect(1, 18.5, 22, 1, '#8d6e63'); d.rect(1, 21.5, 22, 1, '#3e2723');
  },
});

// 아이템 그림 크기: 24 (땅, 가방, 주머니) / 16 (손에 든 것, 던진 먹이). 1 칸 = 1 px 로 그려서 맵/캐릭터와 픽셀 크기가 같다.
// 8x8 로 그린 그림을 Scale3x(24) / Scale2x(16) 로 다듬는다 (계단 모서리가 매끈해진다)
const tileIcons = {};
function tileIcon(name, size = 24) {
  const key = `${name}|${size}`;
  if (!tileIcons[key]) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d');
    const tileName = name.startsWith('TILE:') ? name.slice(5) : null;
    if (!tileName && ICON_ART[name]) {
      // 24 칸 기준 그림을 이 크기로 바로 그린다 (늘리지 않는다)
      ICON_ART[name](iconPainter(g, size));
      outlinePixels(g, size);
    } else if (!tileName && PIXEL_ICONS[name]) {
      const pix = PIXEL_ICONS[name], rows = size === 24 ? scale3x(pix.rows) : size === 16 ? scale2x(pix.rows) : pix.rows, u = size / rows.length;
      rows.forEach((row, y) => [...row].forEach((ch, x) => {
        if (pix.colors[ch]) { g.fillStyle = pix.colors[ch]; g.fillRect(x * u, y * u, u, u); }
      }));
      outlinePixels(g, size);
    } else {
      // 블록: 맵 칸 그림(32x32)을 땅 없이 그려서 그림이 있는 곳을 이 크기만큼 잘라 낸다 (1:1, 줄이지 않는다)
      const t = document.createElement('canvas');
      t.width = t.height = T;
      const tg = t.getContext('2d', { willReadFrequently: true });
      World.drawTile(tg, 0, 0, TILE[tileName || name], undefined, true);
      const d = tg.getImageData(0, 0, T, T).data;
      let x0 = T, y0 = T, x1 = -1, y1 = -1;
      for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) if (d[(y * T + x) * 4 + 3] > 40) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      if (x1 < 0) { x0 = y0 = 0; x1 = y1 = T - 1; }
      // 칸 크기(32)면 칸 그대로 (놓을 자리 미리보기), 작으면 그림이 있는 곳 가운데 (키가 크면 위쪽부터)
      const full = size >= T, sx = full ? 0 : Math.round((x0 + x1 + 1) / 2 - size / 2), sy = full ? 0 : y1 - y0 + 1 > size ? y0 : Math.round((y0 + y1 + 1) / 2 - size / 2);
      g.drawImage(t, sx, sy, size, size, 0, 0, size, size);
      if (!full) outlinePixels(g, size);
    }
    tileIcons[key] = { canvas: c, url: c.toDataURL() };
  }
  return tileIcons[key];
}

// 아이템/무기 정의 → 그림 (블록은 BLOCK_ 그림, 없으면 맵 칸을 잘라 낸 것)
function itemIcon(def, size = 24) {
  if (def.icon) return tileIcon(def.icon, size);
  return tileIcon(ICON_ART[`BLOCK_${def.tile}`] ? `BLOCK_${def.tile}` : `TILE:${def.tile}`, size);
}

// 그림 둘레 빈칸에 옆 색을 아주 어둡게 한 테두리 (몬스터 그림과 같은 방식)
function outlinePixels(g, n) {
  const img = g.getImageData(0, 0, n, n), d = img.data, src = new Uint8ClampedArray(d);
  const at = (x, y) => (x < 0 || y < 0 || x >= n || y >= n ? -1 : (y * n + x) * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const i = at(x, y);
      if (src[i + 3]) continue;
      const nb = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].find(j => j >= 0 && src[j + 3]);
      if (nb === undefined) continue;
      d[i] = src[nb] * 0.3; d[i + 1] = src[nb + 1] * 0.3; d[i + 2] = src[nb + 2] * 0.3; d[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

// 화면(HTML)에 쓰는 아이템 그림: 블록은 맵 칸 그림, icon 이 있으면 그 그림, 나머지는 이모지
function iconHtml(def) {
  if (def.tile || def.icon) return `<img class="tile-icon" src="${itemIcon(def).url}" alt="">`;
  return def.fix ? `<span class="emo-${def.fix}">${def.emoji}</span>` : def.emoji;
}

// 8x8 그림을 16x16 으로 (Scale2x: 계단 모서리를 반 칸씩 다듬어 해상도가 두 배인 픽셀 그림처럼)
function scale2x(rows) {
  const h = rows.length, w = rows[0].length, at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? null : rows[y][x]);
  const out = Array.from({ length: h * 2 }, () => []);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = rows[y][x], a = at(x, y - 1) ?? p, b = at(x + 1, y) ?? p, c = at(x - 1, y) ?? p, d = at(x, y + 1) ?? p;
      const ok = a !== d && c !== b;
      out[2 * y][2 * x] = ok && c === a ? a : p;
      out[2 * y][2 * x + 1] = ok && a === b ? b : p;
      out[2 * y + 1][2 * x] = ok && d === c ? c : p;
      out[2 * y + 1][2 * x + 1] = ok && b === d ? d : p;
    }
  }
  return out.map(r => r.join(''));
}

// 8x8 → 24x24 (Scale3x / AdvMAME3x)
function scale3x(rows) {
  const h = rows.length, w = rows[0].length, at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? rows[Math.min(h - 1, Math.max(0, y))][Math.min(w - 1, Math.max(0, x))] : rows[y][x]);
  const out = Array.from({ length: h * 3 }, () => []);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const A = at(x - 1, y - 1), B = at(x, y - 1), C = at(x + 1, y - 1), D = at(x - 1, y), E = rows[y][x], F = at(x + 1, y),
        G = at(x - 1, y + 1), H = at(x, y + 1), I = at(x + 1, y + 1);
      let e = [E, E, E, E, E, E, E, E, E];
      if (B !== H && D !== F) {
        e = [
          D === B ? D : E,
          (D === B && E !== C) || (B === F && E !== A) ? B : E,
          B === F ? F : E,
          (D === B && E !== G) || (D === H && E !== A) ? D : E,
          E,
          (B === F && E !== I) || (H === F && E !== C) ? F : E,
          D === H ? D : E,
          (D === H && E !== I) || (H === F && E !== G) ? H : E,
          H === F ? F : E,
        ];
      }
      for (let k = 0; k < 9; k++) out[y * 3 + Math.floor(k / 3)][x * 3 + (k % 3)] = e[k];
    }
  }
  return out.map(r => r.join(''));
}

// ============================================================
// PixelSprite — 몬스터 그림: 이모지를 작은 칸(16x16, 용은 24x24)으로 줄여 색을 단순하게 하고 까만 테두리를 둘러
//               픽셀 그림처럼 만든다. 이모지마다 한 번만 만들어 둔다 (글꼴을 다 받기 전에는 이모지 그대로)
// ============================================================
const PixelSprite = {
  cache: new Map(),
  ready: false,

  init() {
    try {
      Promise.all([document.fonts.ready, document.fonts.load(`20px "Noto Color Emoji"`, EMOJI_FALLBACK).catch(() => {})])
        .then(() => { this.ready = true; this.cache.clear(); });
      // 웹 글꼴이 늦게 오면 (옛 윈도우 이모지) 다시 만든다
      document.fonts.addEventListener('loadingdone', () => this.cache.clear());
    } catch { this.ready = true; }
  },

  get(emoji, n) {
    if (!this.ready) return null;
    const key = `${emoji}|${n}`;
    if (!this.cache.has(key)) this.cache.set(key, this.make(emoji, n));
    return this.cache.get(key);
  },

  make(emoji, n) {
    const K = 4, S = n * K; // 크게 그린 다음 K x K 칸씩 평균
    const src = document.createElement('canvas');
    src.width = src.height = S;
    const g = src.getContext('2d', { willReadFrequently: true });
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `${S * 0.86}px ${FONT_EMOJI}`;
    g.fillText(emoji, S / 2, S / 2 + S * 0.04);
    const data = g.getImageData(0, 0, S, S).data;
    const M = n + 2, px = new Array(M * M).fill(null); // 둘레 1칸은 테두리 자리
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let r = 0, gg = 0, b = 0, a = 0;
        for (let dy = 0; dy < K; dy++) for (let dx = 0; dx < K; dx++) {
          const i = ((y * K + dy) * S + x * K + dx) * 4, al = data[i + 3];
          r += data[i] * al; gg += data[i + 1] * al; b += data[i + 2] * al; a += al;
        }
        if (a / (K * K) < 110) continue; // 반쯤 비면 빈칸 (가장자리가 또렷하게)
        const q = v => Math.min(255, Math.round(v / a / 28) * 28); // 색을 몇 단계로만
        px[(y + 1) * M + x + 1] = [q(r), q(gg), q(b)];
      }
    }
    const out = document.createElement('canvas');
    out.width = out.height = M;
    const o = out.getContext('2d');
    const img = o.createImageData(M, M);
    for (let y = 0; y < M; y++) {
      for (let x = 0; x < M; x++) {
        const i = y * M + x, c = px[i], j = i * 4;
        if (c) { img.data[j] = c[0]; img.data[j + 1] = c[1]; img.data[j + 2] = c[2]; img.data[j + 3] = 255; continue; }
        // 빈칸인데 옆에 그림이 있으면 테두리 (옆 색을 아주 어둡게)
        const nb = [px[i - 1], px[i + 1], px[i - M], px[i + M]].find(Boolean);
        if (!nb) continue;
        img.data[j] = nb[0] * 0.25; img.data[j + 1] = nb[1] * 0.25; img.data[j + 2] = nb[2] * 0.25; img.data[j + 3] = 255;
      }
    }
    o.putImageData(img, 0, 0);
    return { canvas: out, scale: M / n };
  },
};
PixelSprite.init();

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
    this.buildMazes456(t, W, SH, SW);
    this.crackWalls(t, W);
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
    const X0 = SW, X1 = 2 * SW, Y0 = SH, Y1 = CONFIG.MAZE_Y; // 3탄 칸: X0 ~ X1-1, Y0 ~ Y1-1 (위 테두리는 2탄 아래 테두리 Y0-1)
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


  // 미로 하나 (4탄 ~ 6탄): 방(cell x cell) + 벽(1칸) 격자. 끝에서부터 파 들어가는(DFS) 고리 없는 미로라 길이 길고 구불구불하다.
  // straight: 같은 방향으로 계속 갈 확률 (낮을수록 자주 꺾인다). 돌려주는 것: 방 좌표, 방마다 입구에서 떨어진 거리, 이어진 방
  carveMaze(t, W, o) {
    const P = o.cell + 1, CW = Math.floor((o.x1 - o.ox - o.cell) / P) + 1, CH = Math.floor((o.y1 - o.oy - o.cell) / P) + 1;
    const cellX = c => o.ox + P * c, cellY = r => o.oy + P * r;
    const set = (x, y, v) => { t[y * W + x] = v; };
    const room = (c, r) => { for (let y = 0; y < o.cell; y++) for (let x = 0; x < o.cell; x++) set(cellX(c) + x, cellY(r) + y, o.floor); };
    const links = Array.from({ length: CW * CH }, () => []);
    const join = (c, r, nc, nr) => {
      links[r * CW + c].push(nr * CW + nc);
      links[nr * CW + nc].push(r * CW + c);
      if (nc !== c) { const x = cellX(Math.max(c, nc)) - 1; for (let y = 0; y < o.cell; y++) set(x, cellY(r) + y, o.link); }
      else { const y = cellY(Math.max(r, nr)) - 1; for (let x = 0; x < o.cell; x++) set(cellX(c) + x, y, o.link); }
    };
    const seen = new Uint8Array(CW * CH), dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    const [c0, r0] = o.start;
    const stack = [[c0, r0, -1]];
    seen[r0 * CW + c0] = 1;
    room(c0, r0);
    while (stack.length) {
      const top = stack[stack.length - 1], [c, r, last] = top;
      const next = dirs.map((d, k) => [c + d[0], r + d[1], k]).filter(([nc, nr]) => nc >= 0 && nr >= 0 && nc < CW && nr < CH && !seen[nr * CW + nc]);
      if (!next.length) { stack.pop(); continue; }
      let pick = next.find(n => n[2] === last);
      if (!pick || rng() > o.straight) pick = next[Math.floor(rng() * next.length)];
      const [nc, nr, k] = pick;
      seen[nr * CW + nc] = 1;
      room(nc, nr);
      join(c, r, nc, nr);
      top[2] = k;
      stack.push([nc, nr, k]);
    }
    const dist = new Int32Array(CW * CH).fill(-1), prev = new Int32Array(CW * CH).fill(-1), q = [r0 * CW + c0];
    dist[q[0]] = 0;
    for (let qi = 0; qi < q.length; qi++) for (const n of links[q[qi]]) if (dist[n] < 0) { dist[n] = dist[q[qi]] + 1; prev[n] = q[qi]; q.push(n); }
    return { CW, CH, cellX, cellY, dist, prev, links, P };
  },

  // 4탄 🌴 정글 (3탄 왼쪽) → 5탄 🏔️ 골짜기 (4탄 아래) → 6탄 🌊 바다 (5탄 오른쪽).
  // 탄마다 끝의 🎁 보물 상자를 찾으면 다음 탄 가는 🔒 나무가 ✨ 황금 나무가 된다 (3탄 상자 → 4탄 문)
  buildMazes456(t, W, SH, SW) {
    const MY = CONFIG.MAZE_Y, H = this.h;
    const fill = (x0, y0, x1, y1, v, region) => {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { t[y * W + x] = v; this.regions[y * W + x] = region; }
    };
    const open = (x, y, v) => { t[y * W + x] = v; };
    const gates = this.stageGates;
    this.mazes = [];
    // 3탄: 보물 상자는 그대로, 다음 탄 문은 왼쪽 벽 맨 아래 줄 (상자를 찾으면 그 앞으로 데려다준다)
    const g3y = SH + 4 * 14 + 1;
    this.mazes.push({ stage: 2, goal: this.mazeGoal, start: this.mazeStart, gate: 2, back: { x: SW + 3, y: g3y } });

    // ---- 4탄 🌴 정글: 0~118 x 90~148 (오른쪽 119 줄, 아래 149 줄이 테두리). 방 3x3, 3탄보다 길이 길다
    fill(0, SH, SW, MY, TILE.JUNGLE, REGION.JUNGLE);
    const m4 = this.carveMaze(t, W, { ox: 1, oy: SH, x1: SW - 1, y1: MY - 1, cell: 3, floor: TILE.GRASS, link: TILE.GRASS, straight: 0.55, start: [28, 14] });
    for (let x = m4.cellX(28) + 3; x < SW - 1; x++) open(x, g3y, TILE.GRASS); // 끝 방 오른쪽 벽 ~ 테두리 앞
    open(SW, g3y, TILE.GRASS); open(SW + 1, g3y, TILE.GRASS); // 3탄 쪽 벽
    t[g3y * W + SW - 1] = TILE.LOCK_TREE;
    this.regions[g3y * W + SW] = REGION.MAZE;
    gates.push({ x: SW - 1, y: g3y });
    // 4탄 끝: 아래 줄 방 중에 가장 먼 방 (5탄 방 줄과 맞는 곳). 그 아래 테두리가 5탄 문
    let e4 = -1;
    for (let c = 0; c < m4.CW; c++) {
      const gx = m4.cellX(c) + 1, i = (m4.CH - 1) * m4.CW + c;
      if ((gx - 1) % 3 !== 2 && (e4 < 0 || m4.dist[i] > m4.dist[(m4.CH - 1) * m4.CW + e4])) e4 = c;
    }
    const g4 = { x: m4.cellX(e4) + 1, y: MY - 1 }, goal4 = { x: g4.x, y: m4.cellY(m4.CH - 1) + 1 };
    t[goal4.y * W + goal4.x] = TILE.CHEST;
    t[g4.y * W + g4.x] = TILE.LOCK_TREE;
    gates.push(g4);
    const start4 = { x: SW - 2, y: g3y };
    this.mazes.push({ stage: 3, goal: goal4, start: start4, gate: 3, forge: { x: m4.cellX(28), y: m4.cellY(14) } });

    // ---- 5탄 🏔️ 골짜기: 0~118 x 150~238. 방 2x2 (좁은 길), 방이 2.5배 이상 많고 자주 꺾인다
    fill(0, MY, SW, H, TILE.CHASM, REGION.CANYON);
    const c5 = Math.floor((g4.x - 1) / 3);
    const m5 = this.carveMaze(t, W, { ox: 1, oy: MY, x1: SW - 1, y1: H - 1, cell: 2, floor: TILE.GRASS, link: TILE.GRASS, straight: 0.3, start: [c5, 0] });
    let e5 = -1;
    for (let r = 0; r < m5.CH; r++) { const i = r * m5.CW + m5.CW - 1; if (e5 < 0 || m5.dist[i] > m5.dist[e5 * m5.CW + m5.CW - 1]) e5 = r; }
    const gy5 = m5.cellY(e5), ex5 = m5.cellX(m5.CW - 1);
    for (let x = ex5 + 2; x < SW - 1; x++) open(x, gy5, TILE.GRASS);
    const goal5 = { x: ex5, y: gy5 + 1 };
    t[goal5.y * W + goal5.x] = TILE.CHEST;
    t[gy5 * W + SW - 1] = TILE.LOCK_TREE;
    gates.push({ x: SW - 1, y: gy5 });
    const f5x = m5.cellX(c5) + (g4.x === m5.cellX(c5) ? 1 : 0);
    this.mazes.push({ stage: 4, goal: goal5, start: { x: g4.x, y: MY }, gate: 4, forge: { x: f5x, y: MY + 1 } });

    // ---- 6탄 🌊 바다: 120~239 x 150~239. 섬(2x2 모래) + 다리. 바다는 못 건너고, 끊어진 곳(얕은 물)에만 🌉 다리를 놓는다
    fill(SW, MY, 2 * SW, H, TILE.SEA, REGION.SEA);
    const r6 = Math.floor((gy5 - MY) / 3);
    const m6 = this.carveMaze(t, W, { ox: SW + 1, oy: MY, x1: 2 * SW - 1, y1: H - 1, cell: 2, floor: TILE.SAND, link: TILE.BRIDGE, straight: 0.3, start: [0, r6] });
    open(SW, gy5, TILE.BRIDGE);
    let far = 0;
    for (let i = 0; i < m6.dist.length; i++) if (m6.dist[i] > m6.dist[far]) far = i;
    const fc = far % m6.CW, fr = Math.floor(far / m6.CW), goal6 = { x: m6.cellX(fc), y: m6.cellY(fr) + 1 };
    t[goal6.y * W + goal6.x] = TILE.CHEST;
    // 보물까지 가는 길 위의 다리 몇 개를 끊는다 (얕은 물). 막다른 길에도 몇 개
    const cut = (a, b) => {
      const ca = a % m6.CW, ra = Math.floor(a / m6.CW), cb = b % m6.CW, rb = Math.floor(b / m6.CW);
      if (ca !== cb) { const x = m6.cellX(Math.max(ca, cb)) - 1; for (let y = 0; y < 2; y++) t[(m6.cellY(ra) + y) * W + x] = TILE.WATER; }
      else { const y = m6.cellY(Math.max(ra, rb)) - 1; for (let x = 0; x < 2; x++) t[y * W + m6.cellX(ca) + x] = TILE.WATER; }
    };
    const path = [];
    for (let i = far; i >= 0; i = m6.prev[i]) path.unshift(i);
    const GAPS = 6;
    for (let k = 1; k <= GAPS; k++) {
      const j = Math.floor(path.length * k / (GAPS + 1));
      if (j > 2 && j < path.length) cut(path[j - 1], path[j]);
    }
    const onPath = new Set(path);
    let extra = 0;
    for (let i = 0; i < m6.links.length && extra < 8; i++) {
      if (onPath.has(i) || m6.links[i].length !== 1 || rng() > 0.25) continue;
      cut(i, m6.links[i][0]);
      extra++;
    }
    this.mazes.push({ stage: 5, goal: goal6, start: { x: SW + 1, y: gy5 }, gate: null, forge: { x: SW + 2, y: gy5 + 1 } });
  },

  // 3탄/4탄 미로: 방과 방 사이 벽 토막 중 절반을 부술 수 있는 벽으로 (3탄 금 간 바위, 4탄 얇은 덤불).
  // 벽 토막 = 양옆(또는 위아래)이 다 길인 벽 칸이 이어진 것. 탄 사이 테두리는 그대로
  crackWalls(t, W) {
    const H = this.h, SW = CONFIG.STAGE_W, floor = v => v === TILE.GRASS || v === TILE.SAND || v === TILE.PATH;
    const kinds = [[TILE.CLIFF, TILE.CRACK, REGION.MAZE], [TILE.JUNGLE, TILE.BUSH, REGION.JUNGLE]];
    const border = (x, y) => x % SW === SW - 1 || y === CONFIG.STAGE_H - 1 || y === CONFIG.MAZE_Y - 1 || x <= 0 || y <= 0 || x >= W - 1 || y >= H - 1;
    const done = new Uint8Array(W * H);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x, kind = kinds.find(k => k[0] === t[i] && k[2] === this.regions[i]);
      if (!kind || done[i] || border(x, y)) continue;
      // 가로로 막은 벽 (위아래가 길) 이면 가로로 이어진 칸, 세로로 막은 벽 (양옆이 길) 이면 세로로 이어진 칸
      const ud = floor(t[i - W]) && floor(t[i + W]), lr = floor(t[i - 1]) && floor(t[i + 1]);
      if (!ud && !lr) continue;
      const [dx, dy] = ud ? [1, 0] : [0, 1], seg = [];
      for (let cx = x, cy = y; ; cx += dx, cy += dy) {
        const k = cy * W + cx;
        if (t[k] !== kind[0] || done[k] || border(cx, cy)) break;
        if (ud ? !(floor(t[k - W]) && floor(t[k + W])) : !(floor(t[k - 1]) && floor(t[k + 1]))) break;
        seg.push(k);
      }
      seg.forEach(k => { done[k] = 1; });
      if (rng() < 0.5) seg.forEach(k => { t[k] = kind[1]; });
    }
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
    for (const [at, kind] of [[tent, 'tent'], [this.mazeForge, 'forge'], ...(this.mazes || []).filter(m => m.forge).map(m => [m.forge, 'forge'])]) {
      if (!at) continue;
      t[at.y * W + at.x] = TILE.STATION;
      this.stations.push({ ...at, kind });
    }
  },

  // 몇 탄인지 (0 = 1탄, 1 = 2탄 (1탄 오른쪽), 2 = 3탄 (2탄 아래))
  // 0 1탄 | 1 2탄 (위 줄), 3 4탄 | 2 3탄 (가운데 줄), 4 5탄 | 5 6탄 (아래 줄)
  stageAt(tx, ty) {
    const right = tx >= CONFIG.STAGE_W;
    if (ty >= CONFIG.MAZE_Y) return right ? 5 : 4;
    if (ty >= CONFIG.STAGE_H) return right ? 2 : 3;
    return right ? 1 : 0;
  },
  // 그 탄의 미로 (3탄 ~ 6탄)
  mazeIn(stage) { return (this.mazes || []).find(m => m.stage === stage) || null; },
  stageAtPx(x, y) { return this.stageAt(Math.floor(x / T), Math.floor(y / T)); },
  // 작은 지도에 보여 줄 그 탄의 칸 범위 (2탄은 왼쪽 테두리, 3탄은 위 테두리도 같이 보여서 네 테두리가 다 보인다)
  stageRect(st) {
    const SW = CONFIG.STAGE_W, SH = CONFIG.STAGE_H;
    const MY = CONFIG.MAZE_Y;
    if (st === 2) return { x: SW - 1, y: SH - 1, w: SW + 1, h: MY - SH + 1 };
    if (st === 3) return { x: 0, y: SH - 1, w: SW + 1, h: MY - SH + 1 };
    if (st === 4) return { x: 0, y: MY - 1, w: SW + 1, h: this.h - MY + 1 };
    if (st === 5) return { x: SW - 1, y: MY - 1, w: SW + 1, h: this.h - MY + 1 };
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
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1]]) this.chunks.delete(`${Math.floor((x + dx) / CHUNK)},${Math.floor((y + dy) / CHUNK)}`);
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
    if ((ty === CONFIG.STAGE_H - 1 || ty === CONFIG.MAZE_Y - 1) && this.tile(tx, ty) !== TILE.GOLD_TREE) return false; // 위아래 탄 사이 테두리
    return !!DIG[this.tile(tx, ty)];
  },

  floodFill(sx, sy) {
    const r = this.reachable = new Uint8Array(this.w * this.h);
    const stack = [[sx, sy]];
    while (stack.length) {
      const [x, y] = stack.pop();
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) continue;
      const i = y * this.w + x;
      // 🔒/금 나무(다음 탄으로 가는 문)는 열 수 있으니 지나간다고 본다 (2탄, 3탄에도 하트와 아이템이 생기게)
      if (r[i] || (BLOCKING.has(this.tiles[i]) && this.tiles[i] !== TILE.GOLD_TREE && this.tiles[i] !== TILE.LOCK_TREE)) continue;
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
      if (tt !== TILE.WATER && tt !== TILE.BRIDGE && tt !== TILE.SEA) return false;
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
    // 그림자: 바로 왼쪽 위 조각의 칸이 드리우는 것까지 (칸 하나 밖부터)
    for (let y = Math.max(0, cy * CHUNK - 1); y < Math.min(this.h, (cy + 1) * CHUNK); y++) {
      for (let x = Math.max(0, cx * CHUNK - 1); x < Math.min(this.w, (cx + 1) * CHUNK); x++) this.drawCastShadow(g, x, y);
    }
    this.drawHouse(g); // 조각 밖은 잘린다
    this.chunks.set(key, c);
    return c;
  },

  // 키 큰 칸의 그림자를 오른쪽 / 아래 / 오른쪽 아래 칸의 땅에만 (그 칸이 키 큰 것이면 그리지 않는다)
  drawCastShadow(g, x, y) {
    const t = this.tile(x, y), round = ROUND_CASTERS.has(t);
    if (!round && !WALL_CASTERS.has(t)) return;
    const X = x * T, Y = y * T;
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx >= this.w || ny >= this.h || NO_SHADOW_ON.has(this.tile(nx, ny))) continue;
      g.save();
      g.beginPath();
      g.rect(nx * T, ny * T, T, T);
      g.clip();
      g.fillStyle = 'rgba(16,32,24,.24)';
      if (round) {
        // 줄기 밑에서 오른쪽 아래로 길게 누운 타원
        g.beginPath();
        g.ellipse(X + T * 0.95, Y + T * 0.98, T * 0.62, T * 0.22, 0.42, 0, Math.PI * 2);
        g.fill();
      } else {
        // 벽: 오른쪽 칸 왼쪽 띠 + 아래 칸 위쪽 띠 (계단처럼 2픽셀씩 엷어진다)
        g.fillRect(X + T, Y + 4, 6, T);
        g.fillRect(X + 4, Y + T, T, 5);
        g.fillStyle = 'rgba(16,32,24,.12)';
        g.fillRect(X + T + 6, Y + 6, 3, T);
        g.fillRect(X + 6, Y + T + 5, T, 3);
      }
      g.restore();
    }
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
  // 맵 칸 그림: 32 x 32 픽셀 (1 칸 = 1 px). 칸마다 hash 로 무늬가 조금씩 달라서 반복돼 보이지 않는다
  // bare: 땅(풀/물) 없이 그 위의 것만 (블록 아이템 그림)
  drawTile(g, x, y, type, region, bare = false) {
    const gr = GROUND[region] || GROUND.DEFAULT;
    const X = x * T, Y = y * T;
    const p = (gx, gy, color, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(X + gx, Y + gy, w, h); };
    const px8 = (gx, gy, color, w = 1, h = 1) => p(gx * 4, gy * 4, color, w * 4, h * 4); // 예전 8칸 좌표 (클로버, 자물쇠)
    const fill = color => p(0, 0, color, T, T);
    const r = k => hash(x, y, k);
    const ri = (k, n) => Math.floor(hash(x, y, k) * n);
    const nz = (i, j, k) => hash(x * 37 + i, y * 41 + j, k); // 픽셀마다 다른 값
    const specks = (n, colors, seed, w = 1, h = 1) => {
      for (let i = 0; i < n; i++) p(ri(seed + i, T - w + 1), ri(seed + i + 50, T - h + 1), colors[ri(seed + i + 99, colors.length)], w, h);
    };
    // 둥근 덩어리 (나무 잎, 바위, 덤불): f(dx, dy, d, i, j) 가 색을 돌려주면 칠한다
    const blob = (cx, cy, rx, ry, rough, f, pow = 2) => {
      for (let j = Math.max(0, Math.floor(cy - ry)); j < Math.min(T, Math.ceil(cy + ry)); j++) {
        for (let i = Math.max(0, Math.floor(cx - rx)); i < Math.min(T, Math.ceil(cx + rx)); i++) {
          const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
          const d = Math.abs(dx) ** pow + Math.abs(dy) ** pow + (nz(i, j, 3) - 0.5) * rough;
          if (d < 1) { const col = f(dx, dy, d, i, j); if (col) p(i, j, col); }
        }
      }
    };
    const grass = () => {
      if (bare) return;
      const [g0, g1, g2] = gr.grass, dark = shade(g0, 0.84);
      fill(g0);
      specks(34, [g1, g2, g1], 1);
      // 풀잎: 짙은 세로 줄 + 밝은 끝
      for (let k = 0; k < 5; k++) {
        const bx = ri(200 + k, 30) + 1, by = ri(210 + k, 26) + 3;
        p(bx, by, dark, 1, 3); p(bx + 1, by + 1, dark, 1, 2); p(bx, by - 1, g2);
      }
    };
    const waterBase = () => {
      if (bare) return;
      const [w0, w1] = gr.water;
      fill(w0);
      specks(14, [shade(w0, 0.9)], 140, 2, 1);
      // 물결 (⌒ 모양 밝은 줄)
      for (let k = 0; k < 3; k++) {
        const wx = ri(150 + k, 24), wy = 3 + k * 10 + ri(160 + k, 5);
        p(wx, wy + 1, w1); p(wx + 1, wy, w1, 4, 1); p(wx + 5, wy + 1, w1);
      }
      if (r(170) < 0.5) p(ri(171, 30), ri(172, 30), '#ffffff');
    };

    switch (type) {
      case TILE.GRASS: grass(); break;
      case TILE.FLOWER: {
        grass();
        const fx = 9 + ri(7, 13), fy = 8 + ri(8, 10);
        const color = r(9) > 0.5 ? '#e74c3c' : '#f1c40f', dark = shade(color, 0.75);
        p(fx + 1, fy + 3, '#2e7d32', 1, 7); p(fx + 2, fy + 7, '#43a047', 2, 1); p(fx - 1, fy + 6, '#43a047', 2, 1);
        p(fx - 2, fy, color, 2, 2); p(fx + 2, fy, dark, 2, 2); p(fx, fy - 2, color, 2, 2); p(fx, fy + 2, dark, 2, 2);
        p(fx, fy - 2, shade(color, 1.4)); p(fx, fy, '#fff59d', 2, 2); p(fx + 1, fy + 1, '#fbc02d');
        break;
      }
      case TILE.TREE:
      case TILE.LOCK_TREE: // 잠긴 나무는 다른 테두리 나무와 똑같이 보인다
      case TILE.GOLD_TREE: {
        const leaf = type === TILE.GOLD_TREE ? ['#f9a825', '#ffd54f', '#fff59d'] : gr.leaf;
        const deep = shade(leaf[0], 0.74), edge = shade(leaf[0], 0.6);
        grass();
        p(6, 28, 'rgba(0,0,0,.16)', 20, 3); p(9, 27, 'rgba(0,0,0,.12)', 14, 1);
        // 줄기 (나뭇결)
        p(13, 18, '#795548', 6, 11); p(13, 18, '#5d4037', 1, 11); p(18, 18, '#8d6e63', 1, 11);
        p(12, 28, '#5d4037', 8, 1); p(15, 21 + ri(5, 4), '#5d4037', 1, 3);
        // 잎: 위 왼쪽이 밝고 아래 오른쪽이 어둡다. 가장자리는 울퉁불퉁
        blob(16, 11.5, 15.5, 11.5, 0.22, (dx, dy, d, i, j) => {
          const v = dx * 0.55 + dy * 0.85 + (nz(i, j, 5) - 0.5) * 0.3;
          if (d > 0.84 && dy > -0.2) return edge;
          return v > 0.45 ? deep : v < -0.55 ? leaf[2] : v < -0.1 ? leaf[1] : leaf[0];
        });
        // 잎 뭉치 무늬
        for (let k = 0; k < 6; k++) {
          const lx = 5 + ri(20 + k, 22), ly = 4 + ri(30 + k, 13);
          p(lx, ly, deep, 3, 1); p(lx + 1, ly - 1, leaf[1], 2, 1);
        }
        if (type === TILE.GOLD_TREE) { p(24, 2, '#fff'); p(5, 12, '#fff'); p(20, 13, '#fffde7'); p(11, 5, '#fff', 2, 2); }
        if (type === TILE.LOCK_TREE) {
          // 자물쇠 (용을 잡으면 열린다): 회색 고리 + 노란 몸통 + 열쇠 구멍
          px8(2.5, 3, '#424242', 3, 0.5); px8(2.5, 3, '#424242', 0.5, 2); px8(5, 3, '#424242', 0.5, 2);
          px8(2, 4.5, '#5d4037', 4, 3.5); px8(2.5, 5, '#fbc02d', 3, 2.5); px8(2.5, 5, '#fff59d', 3, 0.5);
          px8(3.75, 5.75, '#3e2723', 0.5, 1.25);
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
            px8(cx + rx * 0.5, cy + ry * 0.5, color, 0.5, 0.5);
          }
          px8(cx, cy, dark, 0.5, 0.5);
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
        if (lucky) { px8(cx + 1.5, cy + 1.5, '#2e7d32', 0.5, 0.5); px8(cx + 2, cy + 2, '#2e7d32', 0.5, 0.5); }
        else { px8(cx, cy + 0.5, '#2e7d32', 0.5, 1.5); px8(cx + 0.5, cy + 2, '#2e7d32', 0.5, 1.5); }
        clover(cx, cy, LEAF, lucky ? [UP, RIGHT, DOWN, LEFT] : [UP, LEFT, RIGHT], 1, '#43a047', '#2e7d32', '#a5d6a7');
        // 가끔 흰 토끼풀 꽃 (세잎클로버 칸에만)
        if (!lucky && hash(x, y, 21) < 0.15) {
          const fx = hash(x, y, 22) > 0.5 ? 6.5 : 0.5, fy = 6;
          px8(fx - 0.5, fy, '#f5f5f5', 1.5, 1); px8(fx, fy - 0.5, '#f5f5f5', 0.5, 2); px8(fx, fy + 0.5, '#f8bbd0', 0.5, 0.5);
        }
        break;
      }
      case TILE.WATER:
        waterBase();
        // 6탄 바다의 얕은 물 = 끊어진 다리: 양쪽에 다리 기둥 (여기에 🌉 다리를 놓아요)
        if (region === REGION.SEA && !bare) {
          const horiz = this.tile(x - 1, y) === TILE.SAND || this.tile(x + 1, y) === TILE.SAND;
          for (const [gx, gy] of horiz ? [[1, 3], [27, 3], [1, 25], [27, 25]] : [[3, 1], [25, 1], [3, 27], [25, 27]]) { p(gx, gy, '#5d4037', 4, 4); p(gx, gy, '#8d6e63', 4, 1); }
        }
        break;
      case TILE.SAND: {
        const [s0, s1, s2] = gr.sand;
        fill(s0);
        specks(40, [s1, s2, s1], 60);
        specks(3, [shade(s0, 0.8)], 64, 2, 1);
        break;
      }
      case TILE.ROCK: {
        grass();
        p(3, 28, 'rgba(0,0,0,.18)', 26, 3);
        blob(16, 17, 15, 13, 0.12, (dx, dy, d) => {
          const v = dx * 0.5 + dy * 0.85;
          if (d > 0.78 && dy > 0.1) return '#5a6068';
          return v < -0.5 ? '#bcc2c9' : v < -0.05 ? '#a2a8b0' : v < 0.5 ? '#8d939b' : '#737981';
        }, 4);
        // 금
        const cx = 8 + ri(70, 10), cy = 10 + ri(71, 6);
        for (let k = 0; k < 5; k++) p(cx + k, cy + Math.floor(k / 2), '#62686f');
        for (let k = 0; k < 8; k++) {
          const sx = 4 + ri(72 + k, 24), sy = 8 + ri(82 + k, 18);
          p(sx, sy, k % 2 ? '#7d838b' : '#9aa0a8');
        }
        break;
      }
      case TILE.PATH:
        fill('#c8a06a');
        specks(40, ['#b48a55', '#d6b07c', '#bf955f'], 80);
        for (let k = 0; k < 3; k++) { const sx = ri(185 + k, 29), sy = ri(188 + k, 29); p(sx, sy, '#a8865a', 3, 2); p(sx, sy, '#e0c08f'); }
        break;
      case TILE.BRICK: {
        fill('#d9c5a0');
        for (let row = 0; row < 4; row++) {
          const by = row * 8, off = row % 2 ? 0 : 8;
          for (let bx = off - 16; bx < T; bx += 16) {
            const base = shade('#b5523b', 0.9 + hash(x * 7 + bx, y * 5 + row, 91) * 0.2);
            const x0 = Math.max(0, bx + 1), x1 = Math.min(T, bx + 16);
            if (x1 <= x0) continue;
            p(x0, by, base, x1 - x0, 7);
            p(x0, by, shade(base, 1.18), x1 - x0, 1);
            p(x0, by + 6, shade(base, 0.8), x1 - x0, 1);
          }
        }
        specks(6, ['#a1452f', '#c4644a'], 90);
        break;
      }
      case TILE.GATE:
        grass();
        p(4, 0, '#5d3a1a', 24, 32);
        for (const [gx, w] of [[5, 7], [13, 7], [21, 6]]) {
          p(gx, 1, '#8d5a2b', w, 30); p(gx, 1, '#a86d36', 1, 30); p(gx + w - 1, 1, '#6d4321', 1, 30);
        }
        for (const by of [5, 23]) { p(5, by, '#6d4321', 22, 3); p(5, by, '#7d4f27', 22, 1); p(7, by + 1, '#bdbdbd'); p(24, by + 1, '#bdbdbd'); }
        p(21, 14, '#f1c40f', 2, 3); p(21, 14, '#fff59d');
        break;
      case TILE.BRIDGE:
        // 5탄 골짜기 다리는 낭떠러지 위, 6탄은 바다 위, 나머지는 물 위
        if (region === REGION.CANYON && !bare) { fill('#2b1a12'); for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) if (nz(i, j, 11) > 0.9) p(i, j, '#3e2a1e'); }
        else if (World.base && World.base[y * this.w + x] === TILE.SEA && !bare) { fill('#1565c0'); specks(18, ['#1976d2', '#0d47a1'], 360, 2, 1); }
        else waterBase();
        for (let k = 0; k < 4; k++) {
          const bx = k * 8;
          p(bx, 5, '#a0703f', 7, 22); p(bx, 5, '#c08a50', 1, 22); p(bx + 6, 5, '#7a5230', 1, 22);
          p(bx + 1, 7, '#3e2723'); p(bx + 5, 7, '#3e2723'); p(bx + 1, 24, '#3e2723'); p(bx + 5, 24, '#3e2723');
        }
        for (const by of [1, 27]) { p(0, by, '#5d4037', 32, 4); p(0, by, '#795548', 32, 1); }
        break;
      case TILE.TORCH:
        grass();
        p(12, 29, 'rgba(0,0,0,.18)', 8, 2);
        p(14, 14, '#6d4c41', 4, 16); p(14, 14, '#8d6e63', 1, 16);
        p(13, 12, '#5d4037', 6, 4); p(13, 13, '#4e342e', 6, 1);
        p(12, 6, '#ff9800', 8, 7); p(13, 4, '#ff9800', 6, 2); p(14, 2, '#ff9800', 4, 2); p(15, 1, '#ffb74d', 2, 1);
        p(14, 6, '#ffeb3b', 4, 6); p(15, 4, '#ffeb3b', 2, 2);
        p(15, 8, '#fffde7', 2, 3);
        break;
      case TILE.THORN: {
        // 가시 울타리: 나무 받침 위에 뾰족한 가시 (끝이 하얗다)
        grass();
        p(1, 29, 'rgba(0,0,0,.18)', 30, 2);
        for (const [cx, top, hw] of [[5, 11, 4], [12, 4, 4.5], [20, 7, 4.5], [27, 12, 4]]) {
          for (let yy = top; yy < 25; yy++) {
            const w = (yy - top) / (25 - top) * hw, x0 = Math.round(cx - w), x1 = Math.round(cx + w);
            for (let xx = Math.max(0, x0); xx <= Math.min(31, x1); xx++) {
              p(xx, yy, xx === x0 || xx === x1 ? '#4e342e' : xx < cx ? '#a1887f' : xx > cx ? '#6d4c41' : '#8d6e63');
            }
          }
          p(cx, top, '#ffffff'); p(cx, top + 1, '#f5f5f5'); p(cx, top + 2, '#d7ccc8');
        }
        p(1, 24, '#5d4037', 30, 5); p(1, 24, '#8d6e63', 30, 1); p(1, 28, '#3e2723', 30, 1);
        for (const x of [4, 15, 26]) p(x, 26, '#3e2723');
        break;
      }
      case TILE.CRACK:
      case TILE.CLIFF: {
        // 절벽: 위는 울퉁불퉁한 바위 땅, 아래가 길이면 깎아지른 절벽 면 (어두운 줄무늬)
        const cracked = type === TILE.CRACK;
        fill(cracked ? '#a1907f' : '#8d7b6b');
        specks(36, ['#7a6a5b', '#a1907f', '#6f6052'], 41);
        specks(4, ['#7a6a5b'], 46, 3, 1);
        const open = v => v !== TILE.CLIFF && v !== TILE.CRACK && v !== TILE.TREE;
        if (open(this.tile(x, y - 1))) { p(0, 0, '#b3a291', 32, 3); p(0, 3, '#9c8b7a', 32, 1); }
        if (open(this.tile(x, y + 1))) {
          p(0, 20, '#5d4037', 32, 12);
          p(0, 20, '#795548', 32, 2);
          for (let i = 0; i < 6; i++) p(ri(60 + i, 32), 22 + ri(66 + i, 3), '#3e2723', 1, 9);
          for (let i = 0; i < 5; i++) p(ri(172 + i, 32), 22 + ri(178 + i, 10), '#6d4c41');
        }
        if (open(this.tile(x - 1, y))) p(0, 0, '#6f6052', 2, 32);
        if (open(this.tile(x + 1, y))) p(30, 0, '#6f6052', 2, 32);
        if (cracked) {
          // 쩍 갈라진 금 (부술 수 있어요): 어두운 지그재그 + 밝은 테두리
          let cx = 15;
          for (let cy = 3; cy < 29; cy++) {
            cx = clamp(cx + (cy % 4 === 0 ? 2 : cy % 4 === 2 ? -2 : 0), 6, 26);
            p(cx, cy, '#2b2118', 2, 1); p(cx + 2, cy, '#d7c8b6');
            if (cy === 12) for (let k = 1; k < 7; k++) p(cx - k, cy + (k >> 1), '#2b2118');
            if (cy === 20) for (let k = 1; k < 7; k++) p(cx + 2 + k, cy + (k >> 1), '#2b2118');
          }
        }
        break;
      }
      case TILE.BUSH:
      case TILE.JUNGLE: {
        // 정글 덤불: 둥근 잎 덩어리. 옆이 길이면 그쪽 모서리를 둥글게 깎아 동글동글하게 (길 쪽으로 이끼 흙이 보인다)
        // 얇은 덤불(BUSH)은 연두색 + 가는 나뭇가지: 베면 길이 생긴다
        grass();
        const thin = type === TILE.BUSH;
        const wall = (dx, dy) => { const v = this.tile(x + dx, y + dy); return v === TILE.JUNGLE || v === TILE.BUSH; };
        const L = wall(-1, 0), R = wall(1, 0), U = wall(0, -1), D = wall(0, 1);
        const leaf = thin ? ['#7cb342', '#9ccc65', '#c5e1a5'] : gr.leaf, deep = shade(leaf[0], 0.72);
        const rad = 11;
        for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
          // 모서리 둥글게: 두 옆이 다 길이면 그 모서리를 원으로 깎는다
          const cx = i < rad && !L && (j < rad ? !U : j >= T - rad ? !D : false) ? rad : i >= T - rad && !R && (j < rad ? !U : j >= T - rad ? !D : false) ? T - rad : null;
          if (cx !== null) {
            const cy = j < rad ? rad : T - rad;
            if (Math.hypot(i + 0.5 - cx, j + 0.5 - cy) > rad) continue;
          }
          const edge = (!L && i < 2) || (!R && i > T - 3) || (!U && j < 2) || (!D && j > T - 3);
          const v = nz(i, j, 7), bump = Math.sin((x * T + i) * 0.45) + Math.cos((y * T + j) * 0.45);
          p(i, j, edge ? deep : bump > 1.1 ? leaf[2] : bump > 0.2 ? leaf[1] : v > 0.85 ? leaf[2] : leaf[0]);
        }
        // 둥근 잎 뭉치 (밝은 동그라미)
        for (let k = 0; k < 3; k++) {
          const bx = 6 + ri(300 + k, 20), by = 6 + ri(310 + k, 20);
          blob(bx, by, 4, 4, 0, (dx, dy) => (dx + dy < -0.6 ? '#a5d6a7' : dx + dy < 0.2 ? leaf[2] : null));
        }
        if (r(320) < 0.25) { const fx = 6 + ri(321, 20), fy = 6 + ri(322, 20); p(fx, fy, '#ec407a', 2, 2); p(fx, fy, '#f8bbd0'); } // 정글 꽃
        if (thin) for (const [sx, sy, len] of [[6, 22, 9], [16, 9, 8], [20, 20, 7]]) for (let k = 0; k < len; k++) p(sx + k, sy - (k >> 1), '#6d4c41'); // 가는 나뭇가지
        break;
      }
      case TILE.CHASM: {
        // 낭떠러지: 깊은 골짜기 (아래로 갈수록 어둡다). 옆이 길이면 그쪽 가장자리는 깎아지른 바위 끝 (🌉 다리를 놓으면 건넌다)
        const open = (dx, dy) => { const v = this.tile(x + dx, y + dy); return v !== TILE.CHASM && v !== TILE.BRIDGE; };
        fill('#2b1a12');
        for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) if (nz(i, j, 11) > 0.9) p(i, j, '#3e2a1e');
        if (r(330) < 0.3) p(4 + ri(331, 22), 6 + ri(332, 20), '#4e342e', 3, 1); // 저 아래 돌
        const rock = ['#b9825a', '#9c6b47', '#7a4f33'];
        if (open(0, -1)) { p(0, 0, rock[0], T, 4); p(0, 4, rock[1], T, 3); p(0, 7, rock[2], T, 2); for (let k = 0; k < 6; k++) p(ri(340 + k, 30), 9, rock[2], 2, 1 + ri(350 + k, 3)); }
        if (open(0, 1)) { p(0, T - 3, rock[0], T, 3); p(0, T - 4, '#1a0f0a', T, 1); }
        if (open(-1, 0)) { p(0, 0, rock[1], 3, T); p(3, 0, rock[2], 1, T); }
        if (open(1, 0)) { p(T - 3, 0, rock[1], 3, T); p(T - 4, 0, rock[2], 1, T); }
        break;
      }
      case TILE.SEA: {
        // 깊은 바다: 짙은 파랑 + 흰 물결 (다리를 못 놓는다. 얕은 물(청록)에만 놓는다)
        fill('#1565c0');
        specks(18, ['#1976d2', '#0d47a1'], 360, 2, 1);
        for (let k = 0; k < 2; k++) {
          const wx = ri(370 + k, 24), wy = 6 + k * 14 + ri(380 + k, 5);
          p(wx, wy + 1, '#90caf9'); p(wx + 1, wy, '#e3f2fd', 4, 1); p(wx + 5, wy + 1, '#90caf9');
        }
        break;
      }
      case TILE.STATION: grass(); break; // 텐트/대장간 그림은 Render.drawStation (칸 위로 크게)
      case TILE.SAPLING: {
        // 묘목: 흙 둔덕 + 가는 줄기 + 잎 두 장
        grass();
        blob(16, 27, 8, 3.5, 0, (dx, dy) => (dy < -0.3 ? '#8d6e63' : '#6d4c41'));
        p(15, 10, '#558b2f', 2, 16); p(15, 10, '#7cb342', 1, 16);
        blob(11, 12, 4.5, 2.5, 0, (dx, dy) => (dy < -0.2 && dx < 0.3 ? '#a5d6a7' : '#66bb6a'));
        blob(21, 8, 4.5, 2.5, 0, (dx, dy) => (dy < -0.2 && dx > -0.3 ? '#81c784' : '#43a047'));
        break;
      }
      case TILE.CHEST: {
        // 보물 상자: 나무 상자 + 금테 + 자물쇠, 반짝
        grass();
        p(4, 27, 'rgba(0,0,0,.22)', 25, 3);
        p(4, 13, '#8d5a2b', 24, 15); p(5, 13, '#a06a35', 1, 15);
        p(4, 19, '#6d4321', 24, 1); p(4, 24, '#6d4321', 24, 1);
        p(5, 6, '#a86d36', 22, 1); p(4, 7, '#a86d36', 24, 6); p(5, 7, '#c08a50', 22, 1);
        p(4, 12, '#ffca28', 24, 2); p(4, 6, '#ffca28', 2, 22); p(26, 6, '#ffca28', 2, 22);
        p(5, 6, '#fff59d', 1, 22); p(27, 6, '#f9a825', 1, 22);
        p(14, 11, '#f9a825', 5, 7); p(15, 12, '#fff59d', 3, 5); p(16, 14, '#5d4037', 1, 2);
        p(25, 2, '#fff'); p(24, 3, '#fff', 3, 1); p(25, 4, '#fff'); p(2, 6, '#fffde7');
        break;
      }
      default: break; // HOUSE, DOOR 는 drawHouse 에서 한 번에 그린다
    }
  },

  drawHouse(g) {
    const X = this.house.x * T, Y = this.house.y * T, W3 = 3 * T;
    const p = (gx, gy, color, w = 1, h = 1) => { g.fillStyle = color; g.fillRect(X + gx, Y + gy, w, h); };
    // 벽 (나무 판자: 4px 마다 이음매, 위가 밝고 아래가 어둡다)
    p(0, 22, '#b5793f', W3, 74);
    for (let yy = 22; yy < 96; yy += 4) { p(0, yy, '#c88a4c', W3, 1); p(0, yy + 3, '#8e5a2b', W3, 1); }
    for (let k = 0; k < 14; k++) p(Math.floor(hash(this.house.x, k, 5) * (W3 - 2)), 24 + Math.floor(hash(k, this.house.y, 6) * 18) * 4, '#9a6533', 2, 1);
    p(0, 22, '#7a4a22', 2, 74); p(W3 - 2, 22, '#7a4a22', 2, 74);
    // 지붕 (기와 줄, 처마 그림자)
    p(-4, 0, '#c0392b', W3 + 8, 27);
    for (let row = 0; row < 4; row++) {
      const yy = 2 + row * 6, off = row % 2 ? 0 : 4;
      p(-4, yy + 5, '#962d22', W3 + 8, 1);
      for (let xx = -4 + off; xx < W3 + 4; xx += 8) p(xx, yy, '#a93226', 1, 5);
    }
    p(-4, 0, '#e74c3c', W3 + 8, 2); p(-4, 2, '#d94435', W3 + 8, 1);
    p(-4, 27, '#7b241c', W3 + 8, 2); p(0, 29, 'rgba(0,0,0,.18)', W3, 3);
    // 창문 (나무 틀 + 십자 + 유리 반짝)
    for (const wx of [6, 2 * T + 6]) {
      p(wx, 37, '#5d4037', 20, 20);
      p(wx + 2, 39, '#9ad7ff', 16, 16);
      p(wx + 2, 39, '#c8ecff', 16, 3); p(wx + 3, 43, '#e3f6ff', 2, 3);
      p(wx + 9, 37, '#5d4037', 2, 20); p(wx, 46, '#5d4037', 20, 2);
      p(wx - 1, 57, '#795548', 22, 2);
    }
    // 문 (판자 + 손잡이)
    const dx = T, dy = 2 * T;
    p(dx + 4, dy - 10, '#4e342e', T - 8, 42);
    p(dx + 6, dy - 8, '#6d4321', T - 12, 40);
    for (const k of [0, 1, 2]) p(dx + 6 + k * 7, dy - 8, '#5d3a1a', 1, 40);
    p(dx + 7, dy - 8, '#7d4f27', 1, 40);
    p(dx + T - 11, dy + 10, '#f1c40f', 3, 3); p(dx + T - 11, dy + 10, '#fff59d');
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
        this.spots.push({ x, y, stage: this.stageOf(x, y) });
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

  // 몇 탄 땅인지 (1탄: 숲/호수/늪/초원, 2탄: 클로버 들판, 3탄: 미로)
  stageOf(tx, ty) { return World.stageAt(tx, ty); },

  spawnOne(type, avoidPlayers) {
    if (!this.spots.length) return;
    // 탄마다 고르게: 1탄 4, 2탄 2, 미로 탄(3~6탄) 1 몫 (넓은 곳에 몰리지 않게). 하트는 하트끼리 센다
    const share = [4, 2, 1, 1, 1, 1], heart = type === 'heart', count = [0, 0, 0, 0, 0, 0];
    for (const it of this.list) if (!it.dropped && (it.type === 'heart') === heart) count[this.stageOf(it.tx, it.ty)]++;
    const stages = [0, 1, 2, 3, 4, 5].filter(n => this.spots.some(sp => sp.stage === n));
    const want = stages.sort((a, b) => count[a] / share[a] - count[b] / share[b])[0];
    const pool = this.spots.filter(sp => sp.stage === want);
    for (let attempt = 0; attempt < 50; attempt++) {
      const s = pool[Math.floor(Math.random() * pool.length)];
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
    Particles.sparkle(it.x, it.y - 6);
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
    // 물속(물고기)이나 막힌 곳이면 주우러 갈 수 있는 가장 가까운 땅으로 (여럿이면 나와 가까운 쪽)
    if (!World.canStand(x, y, 4)) {
      const tx = Math.floor(x / T), ty = Math.floor(y / T);
      for (let r = 1; r <= 8; r++) {
        const spots = [];
        for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
          if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
          const cx = (tx + i) * T + T / 2, cy = (ty + j) * T + T / 2;
          if (World.canStand(cx, cy, 6)) spots.push([cx, cy]);
        }
        if (spots.length) {
          spots.sort((a, b) => Math.hypot(a[0] - Player.x, a[1] - Player.y) - Math.hypot(b[0] - Player.x, b[1] - Player.y));
          [x, y] = spots[0];
          break;
        }
      }
    }
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
      for (let i = 0; i < World.tiles.length; i++) if (World.tiles[i] === TILE.WATER || World.tiles[i] === TILE.SEA) list.push({ x: i % World.w, y: Math.floor(i / World.w) });
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
    Particles.hit(m.x, m.y - m.def.size * 0.2, m.def.boss);
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
    Particles.hit(m.x, m.y - m.def.size * 0.2, m.def.boss);
    if (m.hp > 0) return false;
    this.kill(m, byOther);
    return true;
  },

  kill(m, byOther) {
    this.list.splice(this.list.indexOf(m), 1);
    Sfx.defeat();
    Particles.poof(m.x, m.y - m.def.size * 0.15, m.def.size);
    if (m.def.boss) Render.shake(0.4, 4);
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
// ============================================================
// Particles — 도트 효과: 걸을 때 먼지, 때릴 때 불꽃, 잡으면 연기, 캘 때 부스러기, 반딧불/나뭇잎/꽃잎
// ============================================================
const DUST_COLORS = {
  [TILE.SAND]: ['#e9d68f', '#d8c27a'], [TILE.PATH]: ['#b08a5a', '#c9a776'], [TILE.BRIDGE]: ['#a1887f', '#8d6e63'],
  DEFAULT: ['#d7ccc8', '#bcaaa4', '#e8e0d0'],
};
const CHIP_COLORS = {
  [TILE.TREE]: ['#795548', '#5d4037', '#43a047', '#66bb6a'], [TILE.SAPLING]: ['#66bb6a', '#43a047'],
  [TILE.BUSH]: ['#43a047', '#66bb6a', '#8d6e63'], [TILE.JUNGLE]: ['#2e7d32', '#43a047', '#81c784'],
  [TILE.ROCK]: ['#9e9e9e', '#bdbdbd', '#757575'], [TILE.CRACK]: ['#9e9e9e', '#8d6e63', '#bdbdbd'], [TILE.BRICK]: ['#b5533c', '#8d3a28'],
  [TILE.FLOWER]: ['#e74c3c', '#f1c40f', '#66bb6a'], [TILE.LUCKY]: ['#66bb6a', '#a5d6a7'], [TILE.SAND]: ['#e9d68f', '#d8c27a'],
  DEFAULT: ['#8d6e63', '#a1887f', '#66bb6a'],
};
const Particles = {
  list: [],
  dustT: 0,
  ambT: 0,

  // n 개: speed [최소, 최대], life [최소, 최대], colors, size, gravity, up(처음 위로), angle/spread(방향), glow(빛), sway(흔들흔들)
  add(x, y, n, o) {
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + randFloat(-(o.spread ?? Math.PI), o.spread ?? Math.PI) : randFloat(0, Math.PI * 2);
      const sp = randFloat(o.speed[0], o.speed[1]), j = o.jitter || 0;
      this.list.push({
        x: x + randFloat(-j, j), y: y + randFloat(-j, j), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0),
        g: o.gravity || 0, drag: o.drag ?? 3, t: 0, life: randFloat(o.life[0], o.life[1]), size: o.size || 2,
        color: o.colors[Math.floor(Math.random() * o.colors.length)], glow: !!o.glow, sway: o.sway || 0,
        phase: Math.random() * 6.28, ground: !!o.ground, floor: o.floor ?? null,
      });
    }
    if (this.list.length > 500) this.list.splice(0, this.list.length - 500);
  },

  update(dt) {
    for (const q of this.list) {
      q.t += dt;
      q.vy += q.g * dt;
      const k = Math.max(0, 1 - q.drag * dt);
      q.vx *= k; q.vy *= k;
      q.x += (q.vx + (q.sway ? Math.sin(q.t * 2.6 + q.phase) * q.sway : 0)) * dt;
      q.y += q.vy * dt;
      // 땅에 떨어지면 통 튀고 멈춘다 (부스러기)
      if (q.floor != null && q.y > q.floor) { q.y = q.floor; q.vy *= -0.35; q.vx *= 0.6; }
    }
    this.list = this.list.filter(q => q.t < q.life);
    this.ambient(dt);
  },

  // 도트 한 점씩 (세상 캔버스, 1 월드 px = 1 픽셀). ground: 발밑 먼지는 캐릭터보다 먼저
  draw(ctx, ground) {
    ctx.save();
    for (const q of this.list) {
      if (q.glow || q.ground !== ground) continue;
      const f = q.t / q.life, sz = Math.max(1, Math.round(q.size * (1 - f * 0.5)));
      ctx.globalAlpha = Math.min(1, f * 4 + (q.sway ? 0 : 0.6), (1 - f) * 1.6);
      ctx.fillStyle = q.color;
      ctx.fillRect(Math.round(q.x - sz / 2), Math.round(q.y - sz / 2), sz, sz);
    }
    ctx.restore();
  },

  // 빛나는 것 (반딧불, 반짝이): 어둠 위에 화면 해상도로 더해서 어두운 곳에서도 빛난다
  drawGlow(ctx, sx, sy, k) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const q of this.list) {
      if (!q.glow) continue;
      const f = q.t / q.life, tw = 0.55 + 0.45 * Math.sin(q.t * 7 + q.phase);
      const a = Math.min(1, f * 5, (1 - f) * 3) * tw, x = sx(q.x), y = sy(q.y), r = Math.round(q.size * k * 2.2);
      ctx.globalAlpha = a;
      ctx.drawImage(this.glowSprite(q.color, r), x - r, y - r);
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(255,255,230,${(a * 0.9).toFixed(2)})`;
      const d = Math.max(2, Math.round(k * 0.8));
      ctx.fillRect(Math.round(x - d / 2), Math.round(y - d / 2), d, d);
    }
    ctx.restore();
  },

  // 빛 한 덩이 그림 (색, 반지름마다 한 번 그려 두고 다시 쓴다)
  glowSprite(color, r) {
    const key = `${color}|${r}`, cache = this.glowCache || (this.glowCache = new Map());
    if (!cache.has(key)) {
      const c = document.createElement('canvas');
      c.width = c.height = r * 2;
      const g = c.getContext('2d'), grad = g.createRadialGradient(r, r, 0, r, r, r);
      grad.addColorStop(0, color.replace('A', '1'));
      grad.addColorStop(1, color.replace('A', '0'));
      g.fillStyle = grad;
      g.fillRect(0, 0, r * 2, r * 2);
      cache.set(key, c);
    }
    return cache.get(key);
  },

  // ---------- 효과 모음 ----------
  dust(x, y) {
    const tt = World.tile(Math.floor(x / T), Math.floor(y / T));
    if (tt === TILE.WATER || tt === TILE.SEA) return;
    this.add(x, y, 2, { speed: [6, 16], angle: -Math.PI / 2, spread: 1.4, life: [0.35, 0.6], colors: DUST_COLORS[tt] || DUST_COLORS.DEFAULT, size: 2, jitter: 3, drag: 4, ground: true });
  },
  hit(x, y, boss = false) {
    this.add(x, y, boss ? 14 : 9, { speed: [50, 120], life: [0.18, 0.35], colors: ['#ffffff', '#fff59d', '#ffd54f', '#ffb74d'], size: 2, drag: 6 });
    if (boss) Render.shake(0.18, 2.5);
  },
  hurt(x, y) {
    this.add(x, y, 10, { speed: [40, 90], life: [0.25, 0.45], colors: ['#ff5252', '#ff8a80', '#ffffff'], size: 2, drag: 5 });
    Render.shake(0.22, 2);
  },
  poof(x, y, size = 24) {
    const n = Math.round(10 + size / 3);
    this.add(x, y, n, { speed: [20, 55], up: 12, life: [0.45, 0.8], colors: ['#ffffff', '#eeeeee', '#e0e0e0', '#cfd8dc'], size: 4, jitter: size * 0.25, drag: 3.5 });
    this.add(x, y - 6, 8, { speed: [40, 90], up: 30, life: [0.5, 0.9], colors: ['#fff59d', '#ffd54f', '#ffffff'], size: 2, gravity: 90, drag: 1.5 });
  },
  chips(tx, ty, tt, big = false) {
    const x = tx * T + T / 2, y = ty * T + T / 2;
    this.add(x, y, big ? 16 : 7, { speed: [40, 100], up: 50, life: [0.5, 0.9], colors: CHIP_COLORS[tt] || CHIP_COLORS.DEFAULT, size: big ? 3 : 2, gravity: 260, drag: 1.2, jitter: 6, floor: ty * T + T - 2 });
  },
  sparkle(x, y) {
    this.add(x, y, 8, { speed: [20, 50], up: 20, life: [0.4, 0.7], colors: ['#fffde7', '#fff59d', '#ffffff'], size: 2, drag: 3 });
  },

  // 구역마다 떠다니는 것 (화면 안에서): 어두운 곳 반딧불, 숲 나뭇잎, 초원/클로버 꽃잎, 바다 물보라 반짝
  ambient(dt) {
    if (Game.state !== 'play' && Game.state !== 'card') return;
    this.ambT -= dt;
    if (this.ambT > 0) return;
    const r = World.regionAtPx(Player.x, Player.y), vw = Render.cssW / Render.scale, vh = Render.cssH / Render.scale;
    const rx = () => Render.camX + Math.random() * vw, ry = () => Render.camY + Math.random() * vh;
    const glowing = this.list.filter(q => q.glow).length;
    if (DARK_REGIONS.has(r) && r !== REGION.SEA) {
      this.ambT = 0.35;
      if (glowing < 14) this.add(rx(), ry(), 1, { speed: [4, 12], life: [3, 6], colors: ['rgba(210,255,120,A)', 'rgba(255,240,140,A)'], size: 2, drag: 0.2, sway: 10, glow: true });
    } else if (r === REGION.FOREST) {
      this.ambT = 0.45;
      this.add(rx(), ry(), 1, { speed: [0, 4], angle: Math.PI / 2, spread: 0.3, life: [5, 8], colors: ['#66bb6a', '#9ccc65', '#c5a35a', '#8d6e63'], size: 2, gravity: 0, drag: 0, sway: 14, up: -14 });
    } else if (r === REGION.MEADOW || r === REGION.CLOVER) {
      this.ambT = 0.5;
      this.add(rx(), ry(), 1, { speed: [12, 22], angle: 0.2, spread: 0.2, life: [6, 10], colors: ['#ffffff', '#f8bbd0', '#fff59d', '#f48fb1'], size: 2, drag: 0, sway: 10 });
    } else if (r === REGION.SEA || r === REGION.LAKE) {
      this.ambT = 0.25;
      const x = rx(), y = ry(), tt = World.tile(Math.floor(x / T), Math.floor(y / T));
      if (tt === TILE.WATER || tt === TILE.SEA) this.add(x, y, 1, { speed: [0, 2], life: [0.5, 0.9], colors: ['rgba(255,255,255,A)'], size: 1.4, drag: 0, glow: true });
    } else this.ambT = 0.5;
  },
};

const Floaters = {
  list: [],
  add(x, y, text, size = 16, opt = {}) { this.list.push({ x, y, text, size, t: 0, life: 0.9, ...opt }); },
  update(dt) {
    for (const f of this.list) f.t += dt;
    this.list = this.list.filter(f => f.t < f.life);
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
    // 걸을 때 발밑 먼지 (점프 중에는 없다)
    if ((Particles.dustT -= dt) <= 0 && !(this.jumpT > 0)) { Particles.dustT = 0.16; Particles.dust(this.x, this.y + 6); }
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
    // 게임 파일이 새 버전으로 바뀌면 (고치고 배포하면) 서버도 저절로 새로 켠다. 세상은 방에 남아 있어서 그대로 이어진다
    setInterval(async () => {
      try {
        const html = await (await fetch(`index.html?t=${Date.now()}`, { cache: 'no-store' })).text();
        const v = Number((html.match(/game\.js\?v=(\d+)/) || [])[1]);
        if (v > GAME_V) {
          // 고치는 중이라 새 game.js 가 깨져 있으면 아직 켜지 않는다 (깨진 채 켜면 서버가 멈춘다). 실행은 하지 않고 문법만 본다
          const code = await (await fetch(`game.js?v=${v}&t=${Date.now()}`, { cache: 'no-store' })).text();
          try { new Function(code); } catch (err) { console.log(`[Server] 새 버전 ${v} 이 깨져 있어 기다림`, String(err)); return; }
          console.log(`[Server] 새 버전 ${v} (지금 ${GAME_V}): 새로 켬`);
          await this.uploadWorld().catch(() => {});
          location.reload();
        }
      } catch { /* 다음에 다시 */ }
    }, 30000);
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
    p.wear = Array.isArray(d.wr) ? d.wr.filter(id => ITEMS[id] && ['wear', 'gear'].includes(ITEMS[id].kind)).slice(0, 5) : [];
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
      // 글은 같은 서버 모두에게 (대화 줄), 소리는 가까이 있는 사람 말만
      const near = Math.hypot(p.tx - Player.x, p.ty - Player.y) < CONFIG.HEAR_TILES * T;
      if (p.sayText) Chat.add(p.name, p.sayText, false, !near);
      if (p.sayText && near && Game.state === 'play' && Social.voiceOn) Speech.speak(p.sayText, sayLang(p.sayText));
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
    // 모르는 아이템 (서버/방장이 예전 버전)은 뺀다: 그리다가 멈춰서 캐릭터와 작은 지도가 안 보이던 것
    Items.list = (list || []).filter(it => it && ITEMS[it[1]]).map(([id, type, x, y]) =>
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
    $('#chat-box').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); if (!Game.talkOpen) Game.toggleTalk(); });
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
    // 도트 하나 = 화면 픽셀 정수 배 (2.8배처럼 들쭉날쭉하지 않게). 보이는 칸 수는 VIEW_TILES 쯤 (조금 달라질 수 있다)
    const k = Math.max(1, Math.round(Math.min(this.cssW, this.cssH) * this.dpr / (CONFIG.VIEW_TILES * T)));
    this.scale = k / this.dpr;
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
    // 흔들림 (보스를 때리거나 내가 맞았을 때)
    const now = performance.now() / 1000;
    if (this.shakeUntil > now) {
      const a = this.shakeAmp * (this.shakeUntil - now) / this.shakeLen;
      this.camX += randFloat(-a, a);
      this.camY += randFloat(-a, a);
    }
    // 화면 픽셀 단위로 맞춰서 도트가 흔들리거나 번지지 않게
    const q = this.scale * this.dpr;
    this.camX = Math.round(this.camX * q) / q;
    this.camY = Math.round(this.camY * q) / q;

    const s = this.scale * this.dpr;
    // 세상은 "1 월드 px = 1 픽셀" 인 작은 캔버스(lo)에 먼저 그리고 화면 크기로 키운다:
    // 맵, 캐릭터, 몬스터, 아이템, 텐트, 휘두르기까지 모두 같은 크기의 픽셀이 된다.
    // 글자(이름표, 말풍선)와 이모지는 this.later 로 미뤄서 화면 해상도로 또렷하게 그린다
    const ox = Math.floor(this.camX), oy = Math.floor(this.camY);
    const lo = this.lo || (this.lo = document.createElement('canvas'));
    const lw = Math.ceil(viewW) + 2, lh = Math.ceil(viewH) + 2;
    if (lo.width !== lw || lo.height !== lh) { lo.width = lw; lo.height = lh; }
    const main = ctx, lctx = this.lctx || (this.lctx = lo.getContext('2d'));
    lctx.setTransform(1, 0, 0, 1, 0, 0);
    lctx.fillStyle = '#2e7d32';
    lctx.fillRect(0, 0, lw, lh);
    lctx.setTransform(1, 0, 0, 1, -ox, -oy);
    lctx.imageSmoothingEnabled = false;
    this.ctx = lctx;
    this.deferred = [];
    try { this.drawWorld(time, viewW, viewH, mapW, mapH); } finally { this.ctx = main; }
    this.drawGrade(lctx, lw, lh);
    main.imageSmoothingEnabled = false;
    main.setTransform(s, 0, 0, s, (ox - this.camX) * s, (oy - this.camY) * s);
    main.drawImage(lo, 0, 0);
    this.drawVignette(main);
    main.setTransform(s, 0, 0, s, -this.camX * s, -this.camY * s);
    const later = this.deferred;
    this.deferred = null;
    for (const fn of later) { main.save(); fn(main); main.restore(); }
    this.drawFloaters();

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawSwampDark();
    Particles.drawGlow(ctx, wx => (wx - this.camX) * this.scale, wy => (wy - this.camY) * this.scale, this.scale);
    this.drawEdgeArrow(World.door.x * T + T / 2, World.door.y * T, '🏠', Craft.canMakeAny() ? '🔨' : '');
    const peers = Multi.visiblePeers();
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

  // 🎨 빛과 색감: 왼쪽 위에서 비치는 햇빛 + 구역마다 다른 색 (구역을 옮기면 천천히 바뀐다)
  drawGrade(g, w, h) {
    const want = REGION_GRADE[World.regionAtPx(Player.x, Player.y)] || REGION_GRADE.DEFAULT;
    const cur = this.grade || (this.grade = [...want]);
    for (let i = 0; i < 4; i++) cur[i] += (want[i] - cur[i]) * 0.03;
    g.save();
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'soft-light';
    const sun = g.createLinearGradient(0, 0, w, h);
    sun.addColorStop(0, 'rgba(255,244,200,.55)');
    sun.addColorStop(0.55, 'rgba(255,244,200,0)');
    sun.addColorStop(1, 'rgba(20,30,80,.45)');
    g.fillStyle = sun;
    g.fillRect(0, 0, w, h);
    g.fillStyle = `rgba(${cur[0] | 0},${cur[1] | 0},${cur[2] | 0},${cur[3].toFixed(3)})`;
    g.fillRect(0, 0, w, h);
    g.restore();
  },

  // 화면 가장자리를 살짝 어둡게 (눈이 가운데로)
  drawVignette(ctx) {
    const w = this.canvas.width, h = this.canvas.height;
    if (!this.vig || this.vig.w !== w || this.vig.h !== h) {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const g = c.getContext('2d'), r = Math.hypot(w, h) / 2;
      const grad = g.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(10,15,30,.38)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
      this.vig = { w, h, c };
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.vig.c, 0, 0);
    ctx.restore();
  },

  shake(sec, amp) {
    const now = performance.now() / 1000;
    if ((this.shakeUntil || 0) - now > sec && this.shakeAmp >= amp) return;
    this.shakeLen = sec;
    this.shakeAmp = amp;
    this.shakeUntil = now + sec;
  },

  // 글자/이모지는 세상 그림(작은 캔버스) 위에 화면 해상도로 (세상을 그리는 중이 아니면 바로)
  later(fn) {
    if (this.deferred) this.deferred.push(fn);
    else { this.ctx.save(); fn(this.ctx); this.ctx.restore(); }
  },

  // 세상 그림: 맵 조각, 앞칸 표시, 아이템/몬스터/사람/제작대 (y 순서), 화살
  drawWorld(time, viewW, viewH, mapW, mapH) {
    const ctx = this.ctx;
    // 화면에 보이는 그림 조각만
    const span = CHUNK * T;
    for (let cy = Math.max(0, Math.floor(this.camY / span)); cy * span < Math.min(mapH, this.camY + viewH); cy++) {
      for (let cx = Math.max(0, Math.floor(this.camX / span)); cx * span < Math.min(mapW, this.camX + viewW); cx++) {
        ctx.drawImage(World.chunk(cx, cy), cx * span, cy * span);
      }
    }
    this.drawTarget(time);
    Particles.draw(ctx, true);

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
    Particles.draw(ctx, false);
    Monsters.arrows.forEach(a => this.drawArrow(a));
    for (const p of peers) p.arrows.forEach(a => this.drawArrow(a));
    this.drawCraftHint(time);
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
    // 횃불 빛: 따뜻한 주황빛을 살짝 더한다 (내 둘레도 촛불처럼 일렁이며 따뜻하게)
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    {
      const r = T * k * 2.6 * (1 + Math.sin(now * 5) * 0.02 + Math.sin(now * 13) * 0.015);
      const glow = ctx.createRadialGradient(px, py, 0, px, py, r);
      glow.addColorStop(0, `rgba(255,200,120,${0.16 * this.dark})`);
      glow.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
    }
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
      ctx.drawImage(tileIcon(`TILE:${ITEMS[block].tile}`, T).canvas, t.x * T, t.y * T);
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
    if (World.mazeIn(st) && World.trail) {
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
    for (const mz of World.mazes || []) if (World.tile(mz.goal.x, mz.goal.y) === TILE.CHEST) mark(mz.goal.x, mz.goal.y, '🎁');
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
    ctx.restore();
    this.later(ctx => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.font = `${ready ? 16 : 12}px ${FONT_EMOJI}`;
      ctx.fillText('🔨', cx, by - T * (st.kind === 'tent' ? 1.95 : 1.65) - hop);
    });
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
    const spr = PixelSprite.get(m.def.emoji, s); // 크기 그대로 1:1 (토끼 22, 용 56)
    if (spr) {
      ctx.imageSmoothingEnabled = false;
      const w = spr.canvas.width;
      ctx.drawImage(spr.canvas, -Math.round(w / 2), -Math.round(w / 2));
    } else {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.font = `${s}px ${FONT_EMOJI}`;
      ctx.fillText(m.def.emoji, 0, 0);
    }
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
    this.later(ctx => this.drawMonsterLabel(m, left, w, top, ch));
  },

  // 몬스터 머리 위 그림 / 💕 / 이름표 (화면 해상도 글자)
  drawMonsterLabel(m, left, w, top, ch) {
    const ctx = this.ctx, s = m.def.size;
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
      const fd = ITEMS[a.food];
      if (fd && fd.icon) { ctx.imageSmoothingEnabled = false; ctx.drawImage(tileIcon(fd.icon, 16).canvas, -8, -8); }
      else { ctx.font = `14px ${FONT_EMOJI}`; ctx.fillText(fd ? fd.emoji : '🍎', 0, 0); }
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
      const y = f.y - f.t * (f.icon ? 18 : 30);
      ctx.globalAlpha = f.icon ? Math.min(1, Math.max(0, (f.life - f.t) / 0.4)) : Math.max(0, 1 - f.t / f.life);
      if (f.icon) {
        // 주운 것: [그림] +1 (흰 테두리 글자)
        ctx.font = `bold ${f.size}px sans-serif`;
        const w = ctx.measureText(f.text).width, ic = f.size + 4, x0 = f.x - (ic + 2 + w) / 2;
        ctx.imageSmoothingEnabled = false;
        if (f.icon.canvas) ctx.drawImage(f.icon.canvas, x0, y - ic / 2, ic, ic);
        else { ctx.font = `${ic - 2}px ${FONT_EMOJI}`; ctx.textAlign = 'left'; ctx.fillText(f.icon.emoji, x0, y); ctx.font = `bold ${f.size}px sans-serif`; }
        ctx.textAlign = 'left';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fff';
        ctx.strokeText(f.text, x0 + ic + 2, y);
        ctx.fillStyle = f.color || '#2e7d32';
        ctx.fillText(f.text, x0 + ic + 2, y);
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        continue;
      }
      ctx.font = `${f.size}px ${FONT_EMOJI}`;
      ctx.fillText(f.text, f.x, y);
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
    // 아이템 그림은 24x24 를 1:1 로 (블록은 맵 칸 그림을 반으로, 하트 등은 이모지 픽셀 그림)
    const ix = Math.round(it.x), iy = Math.round(it.y - 4 + bob);
    if (def.icon || def.tile) ctx.drawImage(itemIcon(def, 24).canvas, ix - 12, iy - 12);
    else {
      const spr = PixelSprite.get(def.emoji, 20);
      if (spr) ctx.drawImage(spr.canvas, ix - 11, iy - 11);
      else { ctx.font = `22px ${FONT_EMOJI}`; ctx.fillText(def.emoji, it.x, iy); }
    }

    // 반짝임
    const a = (Math.sin(time * 4 + it.phase) + 1) / 2;
    this.sparkle(it.x + 10, it.y - 14 + bob, 3 + a * 2, 0.4 + a * 0.6);

    // 이름표
    this.later(ctx => {
      const { main, sub } = itemNames(def);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
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
    });
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

  // 20칸 x 32칸 픽셀 캐릭터 (1 칸 = 1 px). e: 위치/방향/걷기/휘두르기 상태, look: 옷 색, held: 손에 든 것 (무기/블록),
  // label: 머리 위 이름, mine: 내 캐릭터면 이름을 파란색으로
  // wear: 입은 옷 id 목록 (wornList)
  drawCharacter(e, look, held, label, mine, hearts, wear = []) {
    // 점프: 몸만 위로 (그림자는 땅에)
    const jumpH = e.jumpT > 0 ? Math.sin(Math.PI * (1 - e.jumpT / JUMP_SEC)) * 14 : 0;
    const ctx = this.ctx, { dir } = e, y = Math.round(e.y - jumpH);
    // 맞은 순간: 좌우로 흔들리며 빨갛게 번쩍인다
    const hitT = e.hitT || 0;
    const x = Math.round(e.x + (hitT > 0 ? Math.sin(hitT * 80) * 2.5 : 0));
    const flash = hitT > 0 && Math.floor(hitT * 20) % 2 === 0;
    // 20 x 32 픽셀 캐릭터 (1 칸 = 1 월드 px, 맵 칸과 같은 픽셀 크기). 왼쪽 보기를 그리고 오른쪽은 거울로
    const left = x - 10, top = y + 6 - 32;
    const mirror = dir === 'right';
    const step = e.moving ? Math.round(Math.sin(e.walkT * 12) * 1.4) : 0;
    const box = (gx, gy, w, h, color) => {
      ctx.fillStyle = flash ? '#ff5252' : color;
      ctx.fillRect(left + (mirror ? 20 - gx - w : gx), top + gy, w, h);
    };
    const side = dir === 'left' || dir === 'right';
    // 다친 뒤 무적 시간에는 깜빡인다
    ctx.save();
    if (hitT <= 0 && e.invulnT > 0 && Math.floor(e.invulnT * 10) % 2) ctx.globalAlpha = 0.4;

    ctx.fillStyle = 'rgba(0,0,0,.25)';
    ctx.beginPath();
    ctx.ellipse(x, e.y + 6, 9 - jumpH * 0.2, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    const SKIN = '#f1c27d', SKIN_D = '#d9a066', { hair: HAIR, shirt: SHIRT, pants: PANTS } = look;
    const HAIR_L = shade(HAIR, 1.45), HAIR_D = shade(HAIR, 0.7);
    const worn = new Set(wear), boots = worn.has('boots'), vest = worn.has('vest');
    const SHOE = boots ? '#6d4321' : '#4a4a4a', SHOE_L = boots ? '#8d5a2b' : '#6a6a6a';
    const BODY = vest ? '#a8723f' : SHIRT, BODY_D = shade(BODY, 0.75), BODY_L = shade(BODY, 1.2);
    const PANTS_D = shade(PANTS, 0.72);
    // 다리 (걸으면 번갈아 올라간다)
    const leg = (lx, off, back) => {
      box(lx, 23 + off, 4, 5, back ? PANTS_D : PANTS);
      box(lx + 3, 23 + off, 1, 5, PANTS_D);
      if (boots) { box(lx, 26 + off, 4, 2, '#8d5a2b'); box(lx, 26 + off, 4, 1, '#a8723f'); }
      box(lx - (side ? 1 : 0), 28 + off, side ? 5 : 4, 3, SHOE);
      box(lx - (side ? 1 : 0), 28 + off, side ? 5 : 4, 1, SHOE_L);
    };
    if (side) { leg(9, -step, true); leg(7, step, false); }
    else { leg(5, step, false); leg(11, -step, false); }
    box(5, 22, 10, 2, PANTS); // 엉덩이
    // 몸통
    box(5, 13, 10, 10, BODY);
    box(5, 13, 10, 1, BODY_L);
    box(14, 13, 1, 10, BODY_D);
    box(5, 22, 10, 1, BODY_D);
    if (vest) {
      if (dir !== 'up') {
        box(side ? 6 : 9, 13, 2, 9, SHIRT);
        for (const ly of [15, 17, 19]) box(side ? 6 : 9, ly, 2, 1, '#e6c08a');
      }
      box(5, 21, 10, 1, '#6d4321');
    } else if (dir === 'down') box(8, 13, 4, 1, SKIN_D); // 목
    // 팔 (걸으면 앞뒤로)
    const arm = (ax, off, back) => {
      box(ax, 13 + off, 2, 7, back ? BODY_D : BODY);
      box(ax, 20 + off, 2, 2, back ? SKIN_D : SKIN);
    };
    if (side) arm(8, -step, false);
    else { arm(3, -step, false); arm(15, step, false); }
    // 머리 (14 x 12, 모서리는 둥글게)
    box(4, 1, 12, 11, SKIN);
    box(3, 2, 14, 9, SKIN);
    box(4, 11, 12, 1, SKIN_D);
    if (dir === 'up') {
      box(4, 0, 12, 11, HAIR); box(3, 1, 14, 9, HAIR);
      box(4, 10, 12, 1, HAIR_D); box(6, 1, 4, 1, HAIR_L);
    } else {
      box(4, 0, 12, 4, HAIR); box(3, 1, 14, 3, HAIR);
      box(6, 1, 4, 1, HAIR_L);
      if (dir === 'down') {
        box(3, 4, 2, 4, HAIR); box(15, 4, 2, 4, HAIR); // 옆머리
        box(5, 4, 3, 1, HAIR); box(12, 4, 3, 1, HAIR); // 앞머리
        box(6, 6, 2, 3, '#fff'); box(12, 6, 2, 3, '#fff');
        box(7, 7, 1, 2, '#1a237e'); box(12, 7, 1, 2, '#1a237e');
        box(5, 9, 2, 1, '#f6a5a0'); box(13, 9, 2, 1, '#f6a5a0'); // 볼
        box(9, 10, 2, 1, '#c0645a');
      } else {
        // 옆모습 (왼쪽 보기): 뒤통수 머리카락, 앞쪽 눈 하나
        box(10, 3, 7, 6, HAIR); box(11, 9, 5, 1, HAIR_D);
        box(10, 6, 2, 2, SKIN_D); // 귀
        box(4, 6, 2, 3, '#fff'); box(4, 7, 1, 2, '#1a237e');
        box(5, 9, 2, 1, '#f6a5a0');
        box(3, 10, 2, 1, '#c0645a');
      }
    }
    const headWear = { crown: { type: 'crown' }, hat: { type: 'leather' } }[wear.find(id => ITEMS[id]?.slot === 'head')];
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

    // 🛡️ 방패: 든 손 반대쪽 팔에 (옆을 보면 몸 뒤쪽)
    if (worn.has('shield')) {
      const sx = dir === 'left' ? x + 3 : dir === 'right' ? x - 15 : x - 16;
      ctx.drawImage(tileIcon('SHIELD', 12).canvas, sx, y - 13);
    }

    // 손에 든 것 (휘두르면 앞으로 돌아간다)
    if (held && held !== 'hand') {
      const side = dir === 'left' ? -1 : 1;
      const swing = e.swingT > 0 ? 1 - e.swingT / 0.25 : 0;
      ctx.save();
      ctx.translate(x + side * 10, y - 1); // 손 높이 (얼굴을 가리지 않게)
      ctx.rotate(side * (-0.5 + swing * 1.8));
      ctx.scale(side, 1);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.font = `15px ${FONT_EMOJI}`;
      const hd = WEAPONS[held] || ITEMS[held], block = hd && (hd.tile || hd.icon); // 픽셀 그림 (손은 이모지)
      ctx.translate(0, -4);
      if (block) ctx.drawImage(itemIcon(hd, 16).canvas, -8, -8);
      else ctx.fillText(holdEmoji(held), 0, 0);
      ctx.restore();
    }

    if (label) this.later(ctx => {
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
    });
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
  // 모자 (1 칸 = 1 px, 머리는 x 3~16, y 0~11). 옆모습은 왼쪽 보기 기준 (오른쪽은 box 가 거울로)
  drawHat(box, hat, dir) {
    if (!hat) return;
    const side = dir === 'left' || dir === 'right';
    if (hat.type === 'cap') {
      const c = hat.color, d = shade(c, 0.72);
      box(4, -2, 12, 2, c); box(3, 0, 14, 3, c); box(6, -2, 3, 1, shade(c, 1.3));
      if (dir === 'down') box(2, 3, 16, 1, d);
      else if (side) box(0, 3, 9, 1, d);
    } else if (hat.type === 'band') {
      box(3, 3, 14, 2, hat.color); box(3, 4, 14, 1, shade(hat.color, 0.75));
    } else if (hat.type === 'beanie') {
      const c = hat.color;
      box(4, -3, 12, 3, c); box(3, 0, 14, 3, c); box(5, -3, 3, 1, shade(c, 1.3));
      box(3, 3, 14, 2, '#f5f5f5'); box(3, 4, 14, 1, '#d6d6d6');
      box(8, -6, 4, 3, '#fff'); box(9, -6, 2, 1, '#f0f0f0');
    } else if (hat.type === 'leather') {
      // 가죽 모자: 넓은 챙 + 진한 띠
      box(-1, 3, 22, 2, '#6d4321'); box(-1, 4, 22, 1, '#4e342e');
      box(5, -4, 10, 7, '#a8723f'); box(4, -2, 12, 5, '#a8723f'); box(6, -4, 4, 1, '#c8935a');
      box(4, 1, 12, 2, '#4e342e');
    } else if (hat.type === 'wreath') {
      // 꽃 화관: 초록 줄기 + 꽃
      box(3, 2, 14, 2, '#43a047'); box(3, 3, 14, 1, '#2e7d32');
      for (const [fx, col] of [[4, '#f06292'], [9, '#fdd835'], [14, '#f06292']]) { box(fx, 0, 2, 2, col); box(fx, 0, 1, 1, '#fff'); }
    } else if (hat.type === 'crown') {
      box(5, -2, 10, 4, '#fdd835'); box(5, -2, 10, 1, '#fff59d'); box(5, 1, 10, 1, '#f9a825');
      box(5, -5, 2, 3, '#fdd835'); box(9, -6, 2, 4, '#fdd835'); box(13, -5, 2, 3, '#fdd835');
      box(9, -1, 2, 2, '#e53935'); box(6, -1, 1, 1, '#1e88e5'); box(13, -1, 1, 1, '#1e88e5');
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
    this.later(ctx => {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.font = `18px ${FONT_EMOJI}`;
      ctx.fillText(icon, e.x, e.y - 66 + Math.sin(time * 4) * 2);
    });
  },

  // 만들 수 있는 무기가 있으면 집 위에 🔨 가 통통 튄다
  drawCraftHint(time) {
    if (!Craft.canMakeAny()) return;
    const x = World.door.x * T + T / 2, y = World.house.y * T - 10 + Math.sin(time * 5) * 4;
    this.later(ctx => this.drawHammer(ctx, x, y));
  },
  drawHammer(ctx, x, y) {
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
      await Promise.all([Words.load(), Sentences.load()]);
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
    // 예전 가방 (방패는 가방에 있기만 하면 막았다): 방패 칸이 비었으면 끼운다
    if (!this.equip.arm && this.inventory.shield > 0) this.wear('shield', false);
    this.picked = holdable(bag.picked) ? bag.picked : null;
    this.lastWeapon = WEAPONS[bag.lastWeapon] ? bag.lastWeapon : null;
    this.kills = bag.kills || 0;
    this.shieldHits = bag.shieldHits || 0;
    for (const r of RECIPES) if (r.unlock > 0 && this.kills >= r.unlock) this.unlockShown.add(r.result);
    this.bagJson = JSON.stringify(this.bagItems());
    this.bagT = bag.t || 0;
  },

  bagItems() {
    return { v: BAG_V, inventory: this.inventory, equip: this.equip, seen: [...this.seen], weapons: [...this.weapons], picked: this.picked, lastWeapon: this.lastWeapon, kills: this.kills, shieldHits: this.shieldHits || 0 };
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
      Particles.update(dt);
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
    if (playing) this.tickQuiz(dt);
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
    Particles.chips(tx, ty, tt, this.dig.n >= need);
    if (this.dig.n < need || this.busy) return;
    this.dig = { i: -1, n: 0 };
    this.busy = true;
    // 놓았던 블록을 캐면 그 아래 원래 땅 (모래 위에 놓았으면 모래)
    // 다리를 캐면 아래 원래 칸 (낭떠러지/바다), 원래 있던 다리면 물
    const under = tt === TILE.BRIDGE && (World.base[i] === TILE.CHASM || World.base[i] === TILE.SEA) ? World.base[i] : null;
    const ok = await Multi.editTile(i, tt, under ?? dig.after ?? (World.base[i] === TILE.SAND ? TILE.SAND : TILE.GRASS));
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
    const gi = (World.stageGates || []).findIndex(g => g.x === x && g.y === y);
    toast(`✨🌳 → ${['🍀', '🧭', '🌴', '🏔️', '🌊'][gi] || '🍀'}`);
    if (Store.settings.lang === 'en') Speech.speak('A golden tree appeared! Chop it to go to the next stage!', 'en');
    else Speech.speak('황금 나무가 생겼어요! 잘라서 다음 탄으로 가요!', 'ko');
  },

  // 황금 나무를 캐서 다음 탄 길이 열렸다 (모든 기기)
  onGateOpen(x, y) {
    if (this.state === 'title' || this.state === 'loading' || performance.now() - (this.playAt || 0) < 4000) return;
    for (let i = 0; i < 6; i++) Floaters.add(x * T + T / 2 + randFloat(-16, 16), y * T + randFloat(-10, 10), '✨', 16);
    // 몇 번째 문인지 → 열린 탄 (문 0 = 2탄, 1 = 3탄, 2 = 4탄 ...)
    const gi = Math.max(0, (World.stageGates || []).findIndex(g => g.x === x && g.y === y)), n = gi + 2;
    const names = [['🍀', '클로버 들판', 'Clover Field'], ['🧭', '절벽 미로', 'Cliff Maze'], ['🌴', '정글 미로', 'Jungle Maze'], ['🏔️', '골짜기 미로', 'Canyon Maze'], ['🌊', '바다 미로', 'Sea Maze']][gi] || ['🍀', '', ''];
    toast(`${names[0]} ${n}탄!`);
    if (Store.settings.lang === 'en') Speech.speak(`Stage ${n}, the ${names[2]}, is open!`, 'en');
    else Speech.speak(`${n}탄 ${names[1]}${josa(names[1], '이', '가')} 열렸어요!${n === 3 || n === 4 ? ' 금 간 벽은 부술 수 있어요!' : n === 5 ? ' 낭떠러지에 다리를 놓아서 건널 수 있어요!' : n === 6 ? ' 바다에 다리를 놓아서 건너요!' : ''}`, 'ko');
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
    // 다리는 물/낭떠러지/바다 위에만 (탄 사이 테두리는 안 된다), 나머지는 풀밭/모래에만
    if (next === TILE.BRIDGE ? !BRIDGE_ON.has(tt) : !PLACE_ON.has(tt)) return false;
    if (next === TILE.BRIDGE && tt !== TILE.WATER && (tx % CONFIG.STAGE_W === CONFIG.STAGE_W - 1 || ty === CONFIG.MAZE_Y - 1 || ty === CONFIG.STAGE_H - 1)) return false;
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

  // 미로 탄(3~6탄): 지나온 칸에 발자국 (큰 지도에 하늘색으로), 끝의 🎁 보물 상자 옆에 가면 💎 보석 + 축하 + 다음 탄 🔒 나무가 ✨ 황금 나무로.
  // 3탄은 상자와 다음 문이 멀어서 잠시 뒤 문 앞으로, 6탄(마지막)은 입구로 데려다준다. 상자에서 떨어졌다가 다시 오면 또 열 수 있다
  checkMaze() {
    const tx = Math.floor(Player.x / T), ty = Math.floor(Player.y / T), mz = World.mazeIn(World.stageAt(tx, ty));
    if (!mz) return;
    if (!World.trail) {
      World.trail = document.createElement('canvas');
      World.trail.width = World.w;
      World.trail.height = World.h;
    }
    const tg = World.trail.getContext('2d');
    tg.fillStyle = '#29b6f6';
    tg.fillRect(tx, ty, 1, 1);
    const goal = mz.goal, d = Math.hypot(Player.x - (goal.x * T + T / 2), Player.y - (goal.y * T + T / 2));
    if (d > T * 3) this.mazeNear = false;
    if (d > T * 1.4 || this.mazeNear || this.mazeDone) return;
    this.mazeNear = true;
    this.mazeDone = true;
    const n = mz.stage + 1, last = mz.gate == null;
    Sfx.success();
    for (let i = 0; i < 8; i++) Floaters.add(goal.x * T + T / 2 + randFloat(-24, 24), goal.y * T - randFloat(0, 30), i % 2 ? '✨' : '💎', 18);
    toast(last ? tr('🏆 6탄까지 모두 탈출! 🎉', '🏆 You beat every maze! 🎉') : tr(`🎁 ${n}탄 미로 탈출! 🎉`, `🎁 Maze ${n} solved! 🎉`));
    if (Store.settings.lang === 'en') Speech.speak(last ? 'You solved every maze! You are amazing!' : 'You found the treasure! The next gate is open!', 'en');
    else Speech.speak(last ? '마지막 바다 미로까지 탈출! 정말 대단해요!' : '보물을 찾았어요! 다음 탄 문이 열렸어요!', 'ko');
    for (let i = 0; i < (last ? 3 : 1); i++) this.addItem('gem');
    // 다음 탄이 골짜기/바다면 🌉 다리 5개 (낭떠러지와 바다에 놓아서 건넌다)
    if (mz.stage === 3 || mz.stage === 4) for (let i = 0; i < 5; i++) this.addItem('bridge');
    // 다음 탄 가는 🔒 나무 → ✨ 황금 나무 (모두의 기기에 알림)
    const g = !last && World.stageGates[mz.gate];
    if (g && World.tile(g.x, g.y) === TILE.LOCK_TREE) Multi.editTile(g.y * World.w + g.x, TILE.LOCK_TREE, TILE.GOLD_TREE);
    setTimeout(() => {
      this.mazeDone = false;
      const to = last ? mz.start : mz.back;
      if (!to || this.state !== 'play' || World.stageAtPx(Player.x, Player.y) !== mz.stage) return;
      if (last) World.trail.getContext('2d').clearRect(0, 0, World.w, World.h);
      Player.x = to.x * T + T / 2;
      Player.y = to.y * T + T / 2;
      this.mazeNear = false;
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
    this.quizT = 0; // 방금 카드를 읽었으니 문장 읽기는 1분 뒤부터 다시
  },

  // ---------- 📝 1분마다 문장 읽기: "계속하려면 문장을 읽어요!" (놀고 있는 시간만 센다) ----------
  quizT: 0,
  tickQuiz(dt) {
    if (!Social.wordsOn || Buddy.on || SERVER_CH || Card.active) { this.quizT = 0; return; }
    this.quizT += dt;
    if (this.quizT >= CONFIG.SENTENCE_EVERY_SEC) this.sentenceQuiz();
  },

  async sentenceQuiz() {
    this.quizT = 0;
    this.closeBag(false);
    this.closeTalk(false);
    this.state = 'card';
    Input.reset();
    const en = Store.settings.lang === 'en', kind = Quiz.nextKind();
    let card;
    if (kind === 'math') {
      card = Quiz.makeMath();
      toast('🔢 계속하려면 문제를 풀어요!');
      Speech.speak(`문제를 풀어 봐요! ${card.ask}`, 'ko');
    } else if (kind === 'abc') {
      card = Quiz.makeAbc();
      toast('🔤 계속하려면 알파벳을 읽어요!');
      Speech.speak('이 알파벳은 뭘까요?', 'ko');
    } else {
      card = Sentences.pick();
      toast(tr('📝 계속하려면 문장을 읽어요!', '📝 Read the sentence to keep playing!'));
      Speech.speak(en ? 'Read the sentence to keep playing!' : '계속하려면 문장을 읽어 봐요!', en ? 'en' : 'ko');
    }
    const res = await Card.show(card);
    Quiz.result(card, res);
    this.quizT = 0;
    if (this.state === 'card') this.state = 'play';
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
    // 🛡️ 방패: 다 막아 주고, SHIELD_HITS 번 막으면 부서진다 (다시 만들 수 있다)
    if (this.equip.arm === 'shield') {
      Player.invulnT = CONFIG.INVULN_SEC;
      const left = SHIELD_HITS - (this.shieldHits = (this.shieldHits || 0) + 1);
      if (left <= 0) {
        delete this.equip.arm;
        this.shieldHits = 0;
        if (this.inventory.shield > 0) this.wear('shield', false); // 가방에 하나 더 있으면 바로 끼운다
        Sfx.hurt();
        Floaters.add(Player.x, Player.y - 30, '💥', 20);
        toast(`💥 ${iconHtml(ITEMS.shield)} ${tr('방패가 부서졌어요! 🔨 다시 만들어요', 'Your shield broke! Craft a new one')}`);
      } else {
        Sfx.click();
        Floaters.add(Player.x, Player.y - 30, `🛡️${left}`, 18);
      }
      return;
    }
    this.hearts--;
    Player.invulnT = CONFIG.INVULN_SEC;
    Player.hitT = CONFIG.HIT_FLASH_SEC;
    Particles.hurt(Player.x, Player.y - 12);
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
    panel.innerHTML = '<div class="talk-log"></div>';
    Chat.render();
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
      <button class="big-btn talk-send" aria-label="send">💬</button>${Speech.SR ? '<button class="big-btn talk-mic" aria-label="speak">🎤</button>' : ''}`;
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
    // 🎤 말하기: 누르고 말하면 글자로 바뀌어 쓰기 칸에 들어가고, 말이 끝나면 바로 보낸다 (다시 누르면 그만)
    const mic = wrap.querySelector('.talk-mic');
    if (mic) mic.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      if (this.talkRec) { this.talkRec.stop(); this.talkRec = null; mic.classList.remove('on'); return; }
      Sfx.click();
      window.speechSynthesis?.cancel();
      mic.classList.add('on');
      input.placeholder = tr('🎤 말해 보세요…', '🎤 Say something…');
      let heard = '';
      const show = text => { input.value = Array.from(text.trim()).slice(0, SAY_MAX).join(''); count.textContent = `${Array.from(input.value).length}/${SAY_MAX}`; };
      this.talkRec = Speech.listen(Store.settings.lang === 'en' ? 'en' : 'ko', {
        onSound() {},
        onResult: (alts, final) => {
          heard = alts[0] || heard;
          show(heard);
          if (final && heard.trim()) { this.talkRec?.stop(); this.talkRec = null; mic.classList.remove('on'); send(); }
        },
        onError: err => { console.log('[Talk] 음성 입력 실패', err); },
        onEnd: () => { this.talkRec = null; mic.classList.remove('on'); input.placeholder = tr(`${SAY_MAX}글자까지 쓰기`, `Up to ${SAY_MAX} letters`); },
      });
    });
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
    if (this.talkRec) { this.talkRec.stop(); this.talkRec = null; }
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
    if (!def || !def.slot || !['wear', 'gear'].includes(def.kind) || !(this.inventory[id] > 0)) return;
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
      // 무기: 자주 바꾸니까 따로, 누르면 바로 든다 (✋ 맨손 포함)
      { icon: '✋', ko: '무기', en: 'Weapons', ids: Object.keys(WEAPONS).filter(id => id === 'hand' || this.weapons.has(id)) },
      // 장비: 입는 것 (옷, 방패). 누르고 👕 입기 → 왼쪽 입는 곳으로
      { icon: '🛡️', ko: '장비', en: 'Gear', ids: [...of('wear'), ...of('gear')] },
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
      const def = WEAPONS[id] || ITEMS[id], held = WEAPONS[id] && this.held === id ? ' held' : '';
      return `<button class="bag-cell${sel}${held}" data-cell="${id}">${iconHtml(def)}${ITEMS[id] ? `<b>${this.inventory[id]}</b>` : ''}<i>${itemNames(def).main}</i></button>`;
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
    else if (def.slot) acts.push(['wear', def.kind === 'gear' ? '🛡️' : '👕', def.kind === 'gear' ? '끼우기' : '입기', 'Put on']);
    if (!sel.startsWith('slot:') && pouchOf(id)) acts.push(['hold', '✋', '들기', 'Hold']);
    if (def.kind === 'food') acts.push(['eat', '😋', '먹기', 'Eat']);
    if (def.kind === 'potion') acts.push(['drink', '🧪', '마시기', 'Drink']);
    return `<span class="bag-info-icon">${iconHtml(def)}</span>
      <div class="bag-info-text"><b>${main}</b>${sub ? ` <small>${sub}</small>` : ''}<p>${itemDesc(id)}</p></div>
      <div class="bag-acts">${acts.map(([act, icon, ko, en]) => `<button class="big-btn bag-act" data-act="${act}">${icon} ${tr(ko, en)}</button>`).join('')}</div>`;
  },

  // 가방에서 하나 눌렀다: 고르고 이름을 읽어 준다
  bagSelect(id) {
    // 무기는 누르면 바로 손에 든다 (가방은 닫힌다)
    if (WEAPONS[id]) { Sfx.click(); this.setWeapon(id); return; }
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

  // 주운 것 알리기: 머리 위에 [그림] +1 (여럿이면 위로 쌓인다) + 반짝 소리 + 이름 읽기 (잠깐 사이에 주운 것은 한 번에)
  showGain(def, text, color) {
    const now = performance.now();
    this.gainStack = now - (this.gainAt || 0) < 700 ? (this.gainStack || 0) + 1 : 0;
    this.gainAt = now;
    const icon = def.tile || def.icon ? itemIcon(def, 24) : { emoji: def.emoji };
    Floaters.add(Player.x, Player.y - 46 - this.gainStack * 20, `${itemNames(def).main} ${text}`, 12, { icon, life: 1.8, color });
    Sfx.gain();
    (this.gainNames = this.gainNames || []).push(itemNames(def).main);
    clearTimeout(this.gainTimer);
    this.gainTimer = setTimeout(() => {
      const names = [...new Set(this.gainNames)];
      this.gainNames = [];
      if (this.state !== 'play') return;
      const en = Store.settings.lang === 'en';
      Speech.speak(en ? `Got ${names.join(', ')}!` : `${names.join(', ')}!`, en ? 'en' : 'ko');
    }, 450);
  },

  addItem(type) {
    const def = ITEMS[type];
    this.seen.add(type);
    if (def.kind === 'heart') {
      this.hearts = Math.min(CONFIG.MAX_HEARTS, this.hearts + CONFIG.HEART_HEAL);
      this.showGain(def, `+${CONFIG.HEART_HEAL}`, "#e53935");
      this.renderHearts();
      return;
    }
    // 다쳤을 때 음식을 주우면 바로 먹는다
    if (def.kind === 'food' && this.hearts < CONFIG.MAX_HEARTS) {
      this.hearts = Math.min(CONFIG.MAX_HEARTS, this.hearts + (def.heal || 1));
      this.showGain(def, `😋 ❤️+${def.heal || 1}`, '#e53935');
      this.renderHearts();
      return;
    }
    this.inventory[type] = (this.inventory[type] || 0) + 1;
    this.showGain(def, '+1');
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

// 💬 대화 기록: 같은 서버 사람들이 한 말. 아래 가운데 줄에 최근 3줄, 넓은 대화 창에 전부
const Chat = {
  log: [],
  add(name, text, mine, far = false) {
    this.log.push({ name: name || '?', text, mine, far });
    if (this.log.length > 60) this.log.shift();
    this.render();
  },
  line(m) {
    const div = document.createElement('div');
    div.className = `chat-line${m.mine ? ' mine' : ''}${m.far ? ' far' : ''}`;
    const b = document.createElement('b');
    b.textContent = `${m.name}:`;
    b.style.color = m.mine ? '#90caf9' : '#ffe082';
    div.append(b, document.createTextNode(m.text));
    return div;
  },
  render() {
    const box = $('#chat-box');
    if (box) box.replaceChildren(...this.log.slice(-3).map(m => this.line(m)));
    const full = document.querySelector('#talk-panel .talk-log');
    if (full) {
      full.replaceChildren(...this.log.map(m => { const d = this.line(m); d.querySelector('b').style.color = m.mine ? '#1565c0' : '#c62828'; return d; }));
      full.scrollTop = full.scrollHeight;
    }
  },
};

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
    Chat.add(Game.playerName, Player.sayText, true);
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
    if (kid && this.inMaze(kid) && (this.reactAt.guide || 0) < performance.now()) {
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
    if (World.stageAtPx(a.x, a.y) >= 2) { this.projectT = 10; return; } // 미로 탄: 길을 막지 않게 짓지 않는다
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
  // wet: 얕은 물(끊어진 다리)도 지나갈 수 있다고 본다 (길 안내용)
  findPath(sx, sy, gx, gy, wet = false) {
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
        if (!(goal && goalOk) && !this.walkable(nx, ny) && !(wet && World.tile(nx, ny) === TILE.WATER)) continue;
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

  inMaze(p) { return !!World.mazeIn(World.stageAtPx(p.x, p.y)); },

  // ---------- 🧭 미로 길 안내: 아이 자리에서 보물 상자까지 길을 찾아, 아이보다 몇 칸 앞에 서서 부른다 ----------
  // 아이가 막다른 길로 가도 길은 아이 자리에서 다시 찾으니까, 나는 언제나 맞는 길 쪽에서 "이쪽이야!" 한다
  guide(t) {
    const f = this.friend(), mz = f && World.mazeIn(World.stageAtPx(f.x, f.y)), goal = mz && mz.goal, now = performance.now();
    if (!f || !goal) { this.done(); return; }
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
      t.route = this.findPath(fx, fy, end.x, end.y, true); // 6탄: 끊어진 다리(얕은 물)도 길로 본다
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
    // 바로 앞이 끊어진 다리면: 그 앞에서 "다리 놓자!" (내가 물에 못 들어가니까)
    const gap = t.route.findIndex(c => World.tile(c.x, c.y) === TILE.WATER);
    if (gap >= 0 && gap <= 5) {
      const stop = t.route[Math.max(0, gap - 1)];
      if (this.goTo(stop.x * T + T / 2, stop.y * T + T / 2, 6)) { this.vec = { x: 0, y: 0 }; this.face(f.x, f.y); }
      this.talk('bridge', [['여기 다리를 놓자! 🌉', "Let's put a bridge here! 🌉"]], 8);
      return;
    }
    // 아이보다 4칸 앞 길 위로 (끊어진 다리 앞까지만)
    const n = t.route[Math.min(4, gap >= 0 ? gap - 1 : Infinity, t.route.length - 1)];
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
