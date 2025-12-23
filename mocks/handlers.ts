import { http, HttpResponse, delay, ws } from 'msw'

// WebSocketのリンクを定義（handlersの外に置く必要があります）
const gameWs = ws.link('*/api/ws')

export const handlers = [
  // ---------------------------------------------------------
  // 1. Room関連 (HTTP)
  // ---------------------------------------------------------

  // 1.1 Roomの作成
  http.post('*/api/rooms', async () => {
    await delay(500);
    return HttpResponse.json({
      "room_id": "3f316353-f3ab-9bc1-9f68-3bc999ef7486",
      "user_id": "ff6a4c2c-b396-a84f-9c3c-6513baf12611",
      "room_code": "AAAAAA",
      "theme": "人物",
      "hint": "出身地、性別、やったこと",
    }, { status: 201 });
  }),

  // 1.2 テーマ、絵文字の設定
  http.post('*/api/rooms/:room_id/topic', async ({ params, request }) => {
    const { room_id } = params;
    const body = await request.json();
    console.log(`[MSW] Room ID: ${room_id} にトピックを設定:`, body);
    await delay(500);
    return new HttpResponse(null, { status: 200 });
  }),

  // 1.3 回答の提出
  http.post('*/api/rooms/:room_id/answer', async ({ params, request }) => {
    const { room_id } = params;
    const body = await request.json();
    console.log(`[MSW] Room ID: ${room_id} に回答提出:`, body);
    await delay(500);
    return new HttpResponse(null, { status: 200 });
  }),

  // 1.4 ルーム参加
  http.post('*/api/user', async ({ request }) => {
    const body = await request.json() as any;
    await delay(500);

    if (body.room_code === "ERROR") {
        return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      "room_id": "3f316353-f3ab-9bc1-9f68-3bc999ef7486",
      "user_id": "2bc78967-4244-dcf6-4929-bc5ed70e4d09",
      "is_leader": true,
    }, { status: 200 });
  }),

  // ---------------------------------------------------------
  // 4. Websocket通信のモック
  // ---------------------------------------------------------
  gameWs.addEventListener('connection', ({ client }) => {
    console.log('[MSW] WS接続確立:', client.id)

    // 1秒後に参加者更新を通知
    setTimeout(() => {
      client.send(JSON.stringify({
        type: 'PARTICIPANT_UPDATE',
        payload: {
          participants: [
            {
              user_id: "2bc78967-4244-dcf6-4929-bc5ed70e4d09",
              user_name: "あああ",
              role: "player",
              is_Leader: "true"
            }
          ]
        }
      }))
    }, 1000)

    // タイマーシミュレーション
    let seconds = 160; 
    const timerInterval = setInterval(() => {
      if (seconds <= 0) {
        clearInterval(timerInterval);
        return;
      }
      seconds--;
      const min = Math.floor(seconds / 60).toString().padStart(2, '0');
      const sec = (seconds % 60).toString().padStart(2, '0');
      
      client.send(JSON.stringify({
        type: 'TIMER_TICK',
        payload: { time: `${min}:${sec}` }
      }))
    }, 1000)

    // クライアントからのメッセージに対する反応
    client.addEventListener('message', (event) => {
      console.log('[MSW] WSメッセージ受信:', event.data)
      
      try {
        const data = JSON.parse(event.data as string)
        if (data.type === 'START_GAME') {
          client.send(JSON.stringify({
            type: 'STATE_UPDATE',
            payload: {
              nextState: "discussing",
              data: {
                assignments: [
                  { user_id: "2bc78967-4244-dcf6-4929-bc5ed70e4d09", emoji: "🍎" }
                ]
              }
            }
          }))
        }
      } catch (e) {
        console.error("JSON parse error", e)
      }
    })

    client.addEventListener('close', () => {
      console.log('[MSW] WS接続終了')
      clearInterval(timerInterval)
    })
  }),
];