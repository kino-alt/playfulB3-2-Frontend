import { http, HttpResponse, delay, ws } from 'msw'

const API_BASE_URL = "http://localhost:8080";
const WS_BASE_URL = "ws://localhost:8080";

// 1. WebSocketリンクの作成
const gameWs = ws.link(`${WS_BASE_URL}/api/rooms/:room_id/ws`);
let timerInterval: NodeJS.Timeout | null = null;
const allClients = new Set<any>();


export const handlers = [
  // --- 1. Room関連 (HTTP) ---
  http.post('/api/rooms', async () => {
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

  http.post('/api/user', async ({ request }) => {
    const body = await request.json() as any;
    await delay(500);
    if (body.room_code === "ERROR") return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({
      "room_id": "abc",
      "user_id": "bb",
      "is_leader": false,
    }, { status: 200 });
  }),

http.post('/api/rooms/:room_id/start', async ({ params }) => {
  // どの部屋のIDでリクエストが来たかログに出す
  console.log(`[MSW] Intercepted startGame for room: ${params.room_id}`);
  await delay(200);
  return HttpResponse.json({ status: "success" }, { status: 200 });
}),

http.post('/api/rooms/:room_id/topic', async ({ params }) => {
    console.log(`[MSW] Intercepted submitTopic for room: ${params.room_id}`);
    await delay(300);
    return HttpResponse.json({ status: "success" }, { status: 200 });
  }),

  http.post('/api/rooms/:room_id/finish', async ({ params }) => {
    console.log(`[MSW] Intercepted finishRoom for room: ${params.room_id}`);
    await delay(200);
    return HttpResponse.json({ status: "success" }, { status: 200 });
  }),

  // --- 2. WebSocketのモック (gameWs.addEventListener をそのまま入れる) ---
  gameWs.addEventListener('connection', ({ client }) => {
    allClients.add(client);
    console.log('[MSW] WS接続確立:', client.id, 'Total:', allClients.size);

    // 🔴 全員に送信する関数を定義
    const broadcast = (message: object) => {
      const msgString = JSON.stringify(message);
      allClients.forEach((c) => {
        if (c.readyState === 1) c.send(msgString);
      });
    };

    // 参加者リストの初期通知 (接続した瞬間に全員を更新)
    broadcast({
      type: 'PARTICIPANT_UPDATE',
      payload: {
        participants: [
          { user_id: "aa", user_name: "ホスト", role: "host", is_Leader: "false" },
          { user_id: "dummy1", user_name: "たいよう", role: "player", is_Leader: "true" },
          { user_id: "dummy2", user_name: "しょう", role: "player", is_Leader: "false" },
        ]
      }
    });

    client.addEventListener('message', (event) => {
      const data = JSON.parse(event.data as string);
      console.log('[MSW] WSメッセージ受信:', data.type);

      // 🔴 client.send をすべて broadcast に変更 🔴

      if (data.type === 'WAITING' || data.type === 'START_GAME') {
        broadcast({
          type: 'STATE_UPDATE',
          payload: { nextState: "setting_topic" }
        });
        return;
      }

      if (data.type === 'CHECKING') {
        broadcast({
          type: 'STATE_UPDATE',
          payload: { nextState: "finished" }
        });
        return;
      }

      if (data.type === 'ANSWERING') {
        broadcast({
          type: 'STATE_UPDATE',
          payload: {
            nextState: "checking",
            data: { answer: data.payload.answer }
          }
        });
        return;
      }

      if (data.type === 'SUBMIT_TOPIC') {
        broadcast({
          type: 'STATE_UPDATE',
          payload: {
            nextState: "discussing",
            data: {
              topic: data.payload.topic,
              selected_emojis: data.payload.emojis,
              assignments: [
                { user_id: "aa", emoji: "🍎" },
                { user_id: "bb", emoji: "🍇" },
                { user_id: "dummy1", emoji: "🍎" },
                { user_id: "dummy2", emoji: "🏢" }
              ]
            }
          }
        });

        if (timerInterval) clearInterval(timerInterval);
        let seconds = 10; 
        timerInterval = setInterval(() => {
          seconds--;
          if (seconds < 0) {
            clearInterval(timerInterval!);
            broadcast({ type: 'STATE_UPDATE', payload: { nextState: "answering" } });
            return;
          }
          const min = Math.floor(seconds / 60).toString().padStart(2, '0');
          const sec = (seconds % 60).toString().padStart(2, '0');
          broadcast({ type: 'TIMER_TICK', payload: { time: `${min}:${sec}` } });
        }, 1000);
      }
    });

    client.addEventListener('close', () => {
      allClients.delete(client);
      if (allClients.size === 0 && timerInterval) clearInterval(timerInterval);
    });
  }),
];