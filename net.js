// 원격 여럿이 하기 통신 (Firebase Realtime Database)
// 👥 를 눌렀을 때만 game.js 가 이 파일을 불러온다. 혼자 할 때는 Firebase 에 접속하지 않는다.
//
// 아래 설정값은 브라우저에 공개되도록 만들어진 값이라 비밀이 아니다.
// 데이터 보호는 Firebase 콘솔의 보안 규칙(README 참고)과 무료 플랜 한도로 한다.
//
// rooms/{방 번호}/
//   host   방 정보 (시드). 방장이 나가면 방 전체가 지워진다
//   p/{id} 사람마다 자기 캐릭터 (각자 쓴다)
//   w      몬스터 (방장이 쓴다)
//   items  아이템 (방장이 쓴다)
//   t/{칸} 캐거나 놓아서 바뀐 맵 칸 (누구나 쓴다. 같은 칸을 동시에 바꾸면 한 사람만 된다)
// bags/{캐릭터 이름}  가방 (같은 이름으로 들어오면 어느 기기에서든 이어서 한다)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getDatabase, ref, get, set, onValue, onChildAdded, onChildChanged, onDisconnect, remove,
  runTransaction, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js';

const firebaseConfig = {
  apiKey: 'AIzaSyD8MOgA8c9fP8BK8pSI9n3OzqQ4-o3L60k',
  authDomain: 'baby-craft.firebaseapp.com',
  databaseURL: 'https://baby-craft-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'baby-craft',
  storageBucket: 'baby-craft.firebasestorage.app',
  messagingSenderId: '612100382650',
  appId: '1:612100382650:web:1353137dcc6e4a6a608783',
};

let db = null;

async function connect() {
  if (db) return;
  const app = initializeApp(firebaseConfig);
  await signInAnonymously(getAuth(app));
  db = getDatabase(app);
}

const path = (code, key) => ref(db, `rooms/${code}/${key}`);

// 방 만들기: 빈 번호를 골라 방을 만든다 (want: 지난번 번호. 비어 있으면 그 번호로). 방장 창이 닫히면 방 전체를 지운다
export async function host(seed, sid, want) {
  await connect();
  let code = null;
  if (/^[0-9]{4}$/.test(want || '') && !(await get(path(want, 'host'))).exists()) code = want;
  for (let i = 0; !code && i < 10; i++) {
    const c = String(1000 + Math.floor(Math.random() * 9000));
    if (!(await get(path(c, 'host'))).exists() || i === 9) code = c;
  }
  await set(path(code, 'host'), { seed, t: serverTimestamp() });
  onDisconnect(ref(db, `rooms/${code}`)).remove();
  return room(code, seed, sid);
}

// 캐릭터 이름별 가방: 없으면 null
export async function loadBag(name) {
  await connect();
  return (await get(ref(db, `bags/${name}`))).val();
}

export async function saveBag(name, bag) {
  await connect();
  await set(ref(db, `bags/${name}`), bag);
}

// 방 번호로 들어가기
export async function join(code, sid) {
  await connect();
  const snap = await get(path(code, 'host'));
  if (!snap.exists()) throw new Error('no-room');
  return room(code, snap.val().seed, sid);
}

function room(code, seed, sid) {
  const me = path(code, `p/${sid}`);
  onDisconnect(me).remove();
  return {
    code,
    seed,
    sendMe: d => set(me, d),
    onPlayers: cb => onValue(path(code, 'p'), s => cb(s.val() || {})),
    sendWorld: w => set(path(code, 'w'), w),
    onWorld: cb => onValue(path(code, 'w'), s => cb(s.val())),
    sendItems: list => set(path(code, 'items'), list),
    onItems: cb => onValue(path(code, 'items'), s => cb(s.val())),
    putTiles: edits => set(path(code, 't'), edits),
    // 방 정보가 바뀔 때마다 (방장이 나가면 null, 같은 번호로 다시 열면 다시 온다)
    onRoom: cb => onValue(path(code, 'host'), s => cb(s.val())),
    // 맵 칸: 처음 붙을 때 지금까지 바뀐 칸이 모두 오고, 그 뒤로는 바뀔 때마다 온다
    onTiles: cb => {
      const each = s => cb(Number(s.key), s.val());
      onChildAdded(path(code, 't'), each);
      onChildChanged(path(code, 't'), each);
    },
    // 칸이 아직 expect 일 때만 next 로 바꾼다 (base: 한 번도 안 바뀐 칸의 원래 값). 됐으면 true
    async editTile(i, base, expect, next) {
      const res = await runTransaction(path(code, `t/${i}`), cur => ((cur ?? base) === expect ? next : undefined));
      return res.committed;
    },
  };
}
