// 원격 2인용 통신 (Firebase Realtime Database)
// 👥 를 눌렀을 때만 game.js 가 이 파일을 불러온다. 혼자 할 때는 Firebase 에 접속하지 않는다.
//
// 아래 설정값은 브라우저에 공개되도록 만들어진 값이라 비밀이 아니다.
// 데이터 보호는 Firebase 콘솔의 보안 규칙(README 참고)과 무료 플랜 한도로 한다.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getDatabase, ref, get, set, onValue, onDisconnect, remove, serverTimestamp,
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

// 아들 기기: 방을 만들고 게임 상태를 보낸다
export async function host(seed) {
  await connect();
  let code;
  for (let i = 0; i < 10; i++) {
    code = String(1000 + Math.floor(Math.random() * 9000));
    if (!(await get(path(code, 'host'))).exists()) break;
  }
  await set(path(code, 'host'), { seed, t: serverTimestamp() });
  // 창을 닫거나 연결이 끊기면 방을 지운다
  onDisconnect(ref(db, `rooms/${code}`)).remove();
  return {
    code,
    sendState: s => set(path(code, 's'), s),
    sendItems: list => set(path(code, 'items'), list),
    onDad: cb => onValue(path(code, 'd'), snap => cb(snap.val())),
    close: () => remove(ref(db, `rooms/${code}`)),
  };
}

// 아빠 기기: 방 번호로 들어가서 아빠 캐릭터 위치를 보낸다
export async function join(code) {
  await connect();
  const snap = await get(path(code, 'host'));
  if (!snap.exists()) throw new Error('no-room');
  onDisconnect(path(code, 'd')).remove();
  return {
    code,
    seed: snap.val().seed,
    sendDad: d => set(path(code, 'd'), d),
    onState: cb => onValue(path(code, 's'), s => cb(s.val())),
    onItems: cb => onValue(path(code, 'items'), s => cb(s.val())),
  };
}
