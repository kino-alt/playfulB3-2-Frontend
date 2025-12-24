import { http, HttpResponse, delay, ws } from 'msw'

const API_BASE_URL = "http://localhost:8080";
const WS_BASE_URL = "ws://localhost:8080";

// 1. WebSocketリンクの作成
const gameWs = ws.link(`${WS_BASE_URL}/api/rooms/:room_id/ws`);

export const handlers = [
  // --- 1. Room関連 (HTTP) ---
  http.post('http://localhost:8080/api/rooms', async () => {
    console.log("MSW: Intercepted /api/rooms!");
    await delay(500);
    return HttpResponse.json({
      "room_id": "abc",
      "user_id": "aa",
      "room_code": "AAAAAA",
      "theme": "人物",
      "hint": "出身地、性別、やったこと",
    }, { status: 201 });
  }),

  http.post('http://localhost:8080/api/user', async ({ request }) => {
    const body = await request.json() as any;
    await delay(500);
    if (body.room_code === "ERROR") return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({
      "room_id": "abc",
      "user_id": "bb",
      "is_leader": true,
    }, { status: 200 });
  }),

  // --- 2. WebSocketのモック (gameWs.addEventListener をそのまま入れる) ---
  gameWs.addEventListener('connection', ({ client }) => {
    console.log('[MSW] WS接続確立:', client.id);

    // 参加者更新通知
    setTimeout(() => {
      client.send(JSON.stringify({
        type: 'PARTICIPANT_UPDATE',
        payload: {
          participants: [{ user_id: "bb", user_name: "あかね", role: "player", is_Leader: "true" }]
        }
      }));
    }, 1000);

    // タイマー
    let seconds = 160;
    const timerInterval = setInterval(() => {
      if (seconds <= 0) {
        clearInterval(timerInterval);
        return;
      }
      seconds--;
      const min = Math.floor(seconds / 60).toString().padStart(2, '0');
      const sec = (seconds % 60).toString().padStart(2, '0');
      client.send(JSON.stringify({ type: 'TIMER_TICK', payload: { time: `${min}:${sec}` } }));
    }, 1000);

    client.addEventListener('message', (event) => {
      console.log('[MSW] WSメッセージ受信:', event.data);
      // メッセージ応答ロジック...
    });

    client.addEventListener('close', () => {
      console.log('[MSW] WS接続終了');
      clearInterval(timerInterval);
    });
  }),
];