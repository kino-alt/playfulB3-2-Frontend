// lib/api.ts

const API_BASE_URL = ""; 
const WS_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  : "";

//FIX: API設計に合わせて、StartGame削除
export const api = {
  /** -------------------------------
   * 1.1 Roomの作成
   * POST /api/rooms
   * ------------------------------- */
  createRoom: async () => {
    const response = await fetch(`${API_BASE_URL}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!response.ok) throw new Error("Failed to create room");
    // res: { room_id, user_id, room_code, theme, hint } 
    return response.json();
  },

  /** -------------------------------
   * 1.4 ルーム参加
   * POST /api/user
   * ------------------------------- */
  joinRoom: async (roomCode: string, userName: string) => {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room_code: roomCode,
        user_name: userName,
      }),
    });

    if (!response.ok) throw new Error("Failed to join room");
    //res: { room_id, user_is, is_leader }
    return response.json();
  },

  /** -------------------------------
   * 1.2 テーマ、絵文字の設定
   * POST /api/rooms/{room_id}/topic
   * ------------------------------- */
  submitTopic: async (roomId: string, topic: string, emoji: string[]) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/topic`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic,
        emojis: emoji,
      }),
    });

    if (!response.ok) throw new Error("Failed to submit topic");
    return response.json();
  },

  /** -------------------------------
   * 1.3 回答の提出
   * POST /api/rooms/{room_id}/answer
   * ------------------------------- */
  submitAnswer: async (roomId: string, userId: string, answer: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        answer: answer, //(要修正)answer/topic ?
      }),
    });

    if (!response.ok) throw new Error("Failed to submit answer");
    return response.json();
  },

  /** -------------------------------
   * (要修正)ゲーム開始アクション (POST /api/rooms/{room_id}/start)
   * ------------------------------- */
  startGame: async (roomId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/start`, {
      method: "POST",
    });

    if (!response.ok) throw new Error("Failed to start game");
    return response.json();
  },
  /** -------------------------------
   * (要修正)ゲーム終了アクション (POST /api/rooms/{room_id}/start)
   * ------------------------------- */
  finishRoom: async (roomId: string) => {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/finish`, {
      method: "POST",
    });

    if (!response.ok) throw new Error("Failed to finish game");
    return response.json();
  },

  /** -------------------------------
   *  WebSocket connect
   *  ws://.../api/rooms/{room_id}/ws
   *  ------------------------------- */
  connectWebSocket: (roomId: string, onMessage: (data: any) => void, userId?: string, userName?: string) => {
    if (!roomId) return { close: () => {} } as any;

    const url = `${WS_BASE_URL}/api/rooms/${roomId}/ws`;
    const ws = new WebSocket(url);

    ws.onmessage = (event) => {
      console.log(">>> RECEIVED IN API.TS:", event.data);
      const raw = event.data as any;

      const dispatch = (data: any) => {
        try {
          if (onMessage) onMessage(data);
        } catch (e) {
          console.error("[WS] onMessage handler error:", e);
        }
      };

      if (typeof raw === 'string') {
        try {
          dispatch(JSON.parse(raw));
        } catch (e) {
          console.error('[WS] JSON.parse failed (string):', e, raw);
        }
        return;
      }

      // Blob payload (Safari/MSW variations)
      if (typeof Blob !== 'undefined' && raw instanceof Blob) {
        raw.text()
          .then((text: string) => {
            try {
              dispatch(JSON.parse(text));
            } catch (e) {
              console.error('[WS] JSON.parse failed (blob):', e, text);
            }
          })
          .catch((e: any) => console.error('[WS] Blob.text() failed:', e));
        return;
      }

      // Already an object (MSW may dispatch object events)
      if (raw && typeof raw === 'object') {
        dispatch(raw);
        return;
      }

      console.warn('[WS] Unknown data type, forwarding raw:', typeof raw);
      dispatch({ type: 'UNKNOWN', payload: raw });
    };

    ws.onopen = () => {
      console.log("[WS] Connection Opened");
      // 接続時にデータを要求する
      ws.send(JSON.stringify({ type: 'FETCH_PARTICIPANTS' }));
      
      // 🔴 参加者の場合、ユーザー情報を送信してサーバー側に登録させる
      if (userId && userName) {
        console.log("[WS] Sending JOIN_USER:", userId, userName);
        ws.send(JSON.stringify({ type: 'JOIN_USER', payload: { user_id: userId, user_name: userName } }));
      }
    };

    ws.onerror = (err) => console.log("[WS] Error", err);
    ws.onclose = () => console.log("[WS] Closed");

    if (typeof window !== 'undefined') {
      (window as any).gameWs = ws;
    }

    return ws;
  },
}
