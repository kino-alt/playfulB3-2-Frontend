// lib/api.ts

const API_BASE_URL = ""; 
const WS_BASE_URL = "ws://localhost:8080";

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
        emoji,
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
  connectWebSocket: (roomId: string, onMessage: (data: any) => void) => {
    const ws = new WebSocket(`${WS_BASE_URL}/api/rooms/${roomId}/ws`);

    ws.onopen = () => {
      console.log("[WS] Connected:", roomId);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error("[WS] Invalid message:", err);
      }
    };

    ws.onerror = (err) => {
      console.error("[WS] Error:", err);
    };

    ws.onclose = () => {
      console.log("[WS] Disconnected");
    };

    return ws;
  },
};
