import { http, HttpResponse, delay, ws } from 'msw'

const API_BASE_URL = "";
const WS_BASE_URL = typeof window !== 'undefined' 
  ? `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`
  : "ws://localhost:3000";

//  WebSocketリンクの作成
const gameWs = ws.link(`${WS_BASE_URL}/api/rooms/:room_id/ws`);
let timerInterval: NodeJS.Timeout | null = null;

const generateRoomCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';

  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      code += alphabet[byte % alphabet.length];
    }
    return code;
  }

  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
};

// グローバル参加者リスト（初期値は空）
let currentParticipants: Array<{user_id: string, user_name: string, role: string, is_Leader: boolean}> = [];

// グローバルゲームデータ（トピック、答え、選択絵文字など）
let gameData: {
  topic: string | null;
  emojis: string[];
  originalEmojis: string[];
  displayedEmojis: string[];
  dummyIndex: number | null;
  dummyEmoji: string | null;
  answer: string | null;
  theme: string | null;
  hint: string | null;
} = {
  topic: null,
  emojis: [],
  originalEmojis: [],
  displayedEmojis: [],
  dummyIndex: null,
  dummyEmoji: null,
  answer: null,
  theme: "人物",
  hint: "スティーブジョブズ",
};

// localStorage から参加者リストを取得（クロスブラウザ同期用）
const loadParticipantsFromStorage = () => {
  try {
    const stored = localStorage.getItem('playful-mock-participants');
    if (stored) {
      const parsed = JSON.parse(stored);
      // ログノイズ削減
      // console.log("[MSW] 📦 Loaded from localStorage:", parsed.map((p: any) => p.user_name).join(', '));
      return parsed;
    }
  } catch (e) {
    console.error("[MSW] Failed to load from localStorage:", e);
  }
  return [];
};

// localStorage に参加者リストを保存（クロスブラウザ同期用）
const saveParticipantsToStorage = (participants: typeof currentParticipants) => {
  try {
    localStorage.setItem('playful-mock-participants', JSON.stringify(participants));
    console.log("[MSW] 💾 Saved to localStorage:", participants.map(p => p.user_name).join(', '));
    // 🔴 他のタブ/ウィンドウに変更を通知
    syncChannel.postMessage({ type: 'PARTICIPANTS_UPDATED' });
    console.log("[MSW] 📡 Notified other windows/tabs");
  } catch (e) {
    console.error("[MSW] Failed to save to localStorage:", e);
  }
};

// デバッグ用：currentParticipants の変更を追跡
const setParticipants = (newList: typeof currentParticipants, source: string) => {
  // 実際に変更があったかどうかを確認
  const hasChanged = 
    currentParticipants.length !== newList.length ||
    currentParticipants.some((p, i) => !newList[i] || p.user_id !== newList[i].user_id);
  
  if (hasChanged) {
    console.log(`[MSW] setParticipants called from: ${source}`);
    console.log(`[MSW] Old participants:`, currentParticipants.map(p => p.user_name).join(', '));
    console.log(`[MSW] New participants:`, newList.map(p => p.user_name).join(', '));
    currentParticipants = newList;
    saveParticipantsToStorage(newList);
    // 変更ありの場合のみ broadcast
    broadcastParticipants();
  }
};

const broadcastParticipants = () => {
  const listSnapshot = [...currentParticipants];
  // ログノイズ削減のためコメントアウト
  // console.log("[MSW] Broadcasting updated list (clients:", gameWs.clients.size, "), participants:", listSnapshot.map(p => p.user_name).join(', '));
  gameWs.broadcast(
    JSON.stringify({
      type: 'PARTICIPANT_UPDATE',
      payload: { participants: listSnapshot },
    })
  );
};

// 選択された絵文字を参加者へ割り当てる（足りない場合はループ）
const buildAssignments = (emojis: string[]) => {
  if (!emojis.length || !currentParticipants.length) return [] as Array<{ user_id: string; emoji: string }>;
  return currentParticipants.map((p, idx) => ({ user_id: p.user_id, emoji: emojis[idx % emojis.length] }));
};

// 🔴 BroadcastChannel でクロスブラウザ同期
const syncChannel = new BroadcastChannel('playful-mock-sync');
syncChannel.onmessage = (event) => {
  if (event.data.type === 'PARTICIPANTS_UPDATED') {
    console.log("[MSW] 📡 Received sync from another window/tab");
    const updatedList = loadParticipantsFromStorage();
    if (updatedList.length > 0) {
      currentParticipants = updatedList;
      console.log("[MSW] 🔄 Synced participants:", currentParticipants.map(p => p.user_name).join(', '));
      broadcastParticipants(); // WebSocket broadcast to all connected clients
    }
  }
};


// (Removed duplicate gameWs connection handler defined outside handlers array)

export const handlers = [
  // --- 1. Room関連 (HTTP) ---
  http.post('/api/rooms', async () => {
    console.log("MSW: Intercepted /api/rooms!");
    
    // 🔴 新しいルーム作成時は localStorage をクリアして初期化
    console.log("[MSW] 🗑️ Clearing old room data");
    localStorage.removeItem('playful-mock-participants');
    localStorage.removeItem('playful-room-state');
    
    // 🔴 ゲームデータもリセット
    gameData = {
      topic: null,
      emojis: [],
      originalEmojis: [],
      displayedEmojis: [],
      dummyIndex: null,
      dummyEmoji: null,
      answer: null,
      theme: "人物",
      hint: "スティーブジョブズ",
    };
    
    const initial = [
      { user_id: "aa", user_name: "ホスト(あなた)", role: "host", is_Leader: false },
    ];
    
    setParticipants(initial, "/api/rooms");
    
    await delay(500);
    return HttpResponse.json({
      "room_id": "abc",
      "user_id": "aa",
      "room_code": generateRoomCode(),
      "theme": "人物",
      "hint": "スティーブジョブズ",
    }, { status: 201 });
  }),

  http.post('/api/user', async ({ request }) => {
    console.log("[MSW] ====== /api/user called ======");
    const body = await request.json() as any;

    // 🔴 クロスブラウザ同期対応：localStorage から参加者を読み込む
    let participants = loadParticipantsFromStorage();
    
    // localStorage に無ければ初期リスト
    if (participants.length === 0) {
      participants = [
        { user_id: "aa", user_name: "ホスト(あなた)", role: "host" as const, is_Leader: false },
      ];
    }
    
    console.log("[MSW] Before join, current participants:", participants.map((p: any) => p.user_name).join(', '));

    // 同じuser_nameの参加者が既に存在するか確認（リロード時の再接続）
    const existingUser = participants.find((p: any) => 
      p.user_name && body.user_name && 
      p.user_name.trim().toLowerCase() === body.user_name.trim().toLowerCase()
    );

    let userId: string;
    let updatedList: any[];

    if (existingUser) {
      // 既存ユーザーの再接続 - 同じuser_idを返す
      console.log("[MSW] Existing user reconnecting:", existingUser.user_name, existingUser.user_id);
      userId = existingUser.user_id;
      
      // 全員を一旦リーダー解除して、再接続した人をリーダーに設定
      updatedList = participants.map((p: any) => ({
        ...p,
        is_Leader: p.user_id === userId ? true : false
      }));
    } else {
      // 新規ユーザー
      userId = "bb-" + Math.random().toString(36).substring(2, 7);
      console.log("[MSW] New user joining:", body.user_name, userId);
      
      // 全員を一旦リーダー解除して、join した人をリーダーに設定
      updatedList = [
        ...participants.map((p: any) => ({ ...p, is_Leader: false })),
        {
          user_id: userId,
          user_name: body.user_name || "ゲスト",
          role: "player" as const,
          is_Leader: true,
        }
      ];
    }
    
    setParticipants(updatedList, "/api/user");
    console.log("[MSW] After join, participants:", currentParticipants.map(p => p.user_name).join(', '), "| Total:", currentParticipants.length);
    console.log("[MSW] ====== /api/user completed (WS connection will trigger broadcast) ======");

    return HttpResponse.json({
      room_id: "abc",
      user_id: userId,
      is_leader: existingUser ? existingUser.is_Leader : "true",
    }, { status: 200 });
  }),

  http.post('/api/rooms/:room_id/start', async ({ params }) => {
  console.log(`[MSW] Intercepted startGame for room: ${params.room_id}`);
  await delay(200);
  return HttpResponse.json({ status: "success" }, { status: 200 });
}),

  http.post('/api/rooms/:room_id/topic', async ({ params, request }) => {
    console.log(`[MSW] Intercepted submitTopic for room: ${params.room_id}`);
    const body = await request.json() as any;
    
    // 🔴 topic と emojis を保存
    gameData.topic = body.topic;
    gameData.emojis = body.emojis || body.selected_emojis || [];
    console.log("[MSW] Topic saved:", gameData.topic, "Emojis:", gameData.emojis);
    const assignments = buildAssignments(gameData.emojis);
    
    // 🔴 DISCUSSING 状態に遷移
    setTimeout(() => {
      gameWs.broadcast(
        JSON.stringify({
          type: 'STATE_UPDATE',
          payload: {
            nextState: "discussing",
            data: {
              topic: gameData.topic,
              selected_emojis: gameData.emojis,
              displayedEmojis: gameData.displayedEmojis,
              originalEmojis: gameData.originalEmojis,
              dummyIndex: gameData.dummyIndex,
              dummyEmoji: gameData.dummyEmoji,
              theme: gameData.theme,
              hint: gameData.hint,
              assignments,
            }
          }
        })
      );
      
      // タイマー開始 (5分 = 300秒) ※開始を5秒遅延
      if (timerInterval) clearInterval(timerInterval);
      setTimeout(() => {
        let seconds = 300;
        timerInterval = setInterval(() => {
          seconds--;
          if (seconds < 0) {
            clearInterval(timerInterval!);
            // ANSWERING 状態に遷移する際にもダミーデータを送信
            gameWs.broadcast(
              JSON.stringify({
                type: 'STATE_UPDATE',
                payload: {
                  nextState: "answering",
                  data: {
                    topic: gameData.topic,
                    selected_emojis: gameData.emojis,
                    originalEmojis: gameData.originalEmojis,
                    displayedEmojis: gameData.displayedEmojis,
                    dummyIndex: gameData.dummyIndex,
                    dummyEmoji: gameData.dummyEmoji,
                    theme: gameData.theme,
                    hint: gameData.hint,
                  }
                }
              })
            );
            return;
          }
          const min = Math.floor(seconds / 60).toString().padStart(2, '0');
          const sec = (seconds % 60).toString().padStart(2, '0');
          gameWs.broadcast(
            JSON.stringify({ type: 'TIMER_TICK', payload: { time: `${min}:${sec}` } })
          );
        }, 1000);
      }, 5000);
    }, 100);
    
    await delay(300);
    return HttpResponse.json({ status: "success" }, { status: 200 });
}),

  http.post('/api/rooms/:room_id/answer', async ({ params, request }) => {
    console.log(`[MSW] Intercepted submitAnswer for room: ${params.room_id}`);
    const body = await request.json() as any;
    console.log("[MSW] Answer submitted:", body);
    
    // 🔴 答えを保存（WebSocket の ANSWERING ハンドラが STATE_UPDATE を送信するので、ここでは HTTP レスポンスのみ）
    gameData.answer = body.answer;
    console.log("[MSW] Answer saved:", gameData.answer);
    console.log("[MSW] Waiting for ANSWERING WS message to broadcast STATE_UPDATE...");
    
    await delay(300);
    return HttpResponse.json({ status: "success" }, { status: 200 });
  }),

  http.post('/api/rooms/:room_id/finish', async ({ params }) => {
    console.log(`[MSW] Intercepted finishRoom for room: ${params.room_id}`);
    await delay(200);
    return HttpResponse.json({ status: "success" }, { status: 200 });
  }),

  // Skip discussion and move to answering phase
  http.post('/api/rooms/:room_id/skip-discussion', async ({ params }) => {
    console.log(`[MSW] Skip discussion for room: ${params.room_id}`);
    
    // タイマーをクリア
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    
    // 即座にANSWERING状態に遷移（ダミーデータも含める）
    gameWs.broadcast(
      JSON.stringify({
        type: 'STATE_UPDATE',
        payload: {
          nextState: "answering",
          data: {
            topic: gameData.topic,
            selected_emojis: gameData.emojis,
            originalEmojis: gameData.originalEmojis,
            displayedEmojis: gameData.displayedEmojis,
            dummyIndex: gameData.dummyIndex,
            dummyEmoji: gameData.dummyEmoji,
            theme: gameData.theme,
            hint: gameData.hint,
          }
        }
      })
    );
    
    await delay(100);
    return HttpResponse.json({ status: "success" }, { status: 200 });
  }),

  // --- 2. WebSocketのモック (gameWs.addEventListener をそのまま入れる) ---
  gameWs.addEventListener('connection', ({ client }) => {
    console.log("[MSW] New Connection. Total clients:", gameWs.clients.size);

    // 🔴 クロスブラウザ同期対応：接続時に localStorage から最新データを読み込む
    const storedParticipants = loadParticipantsFromStorage();
    if (storedParticipants.length > 0) {
      setParticipants(storedParticipants, "NEW_CONNECTION");
    }

    // 🔴 接続完了後、少し待ってから最新リストを配信（新規参加者のための自動同期）
    setTimeout(() => {
      console.log("[MSW] Auto-broadcast on connection to", gameWs.clients.size, "clients");
      broadcastParticipants();
    }, 100);

    client.addEventListener('message', (event) => {
      // ログノイズ削減 - 受信ログはコメントアウト
      // console.log("[MSW] Received message from client:", event.data);
      
      const data = JSON.parse(event.data as string);
      if (data.type === 'FETCH_PARTICIPANTS') {
        // ログノイズ削減 - fetchリクエストログはコメントアウト
        // console.log("[MSW] Manual fetch requested");
        // 🔴 クロスブラウザ同期対応：localStorage から読み込み
        let participants = loadParticipantsFromStorage();
        if (participants.length === 0) {
          // Initialize if empty
          participants = [
            { user_id: "aa", user_name: "ホスト(あなた)", role: "host" as const, is_Leader: false },
            { user_id: "dummy1", user_name: "たいよう", role: "player" as const, is_Leader: false },
            { user_id: "dummy2", user_name: "しょう", role: "player" as const, is_Leader: false },
          ];
        }
        // setParticipants内で変更検出とbroadcastを行うので、ここでの追加broadcastは不要
        setParticipants(participants, "FETCH_PARTICIPANTS");
      }

      if (data.type === 'CLIENT_CONNECTED') {
        console.log("[MSW] CLIENT_CONNECTED - Payload:", data.payload);
        const { user_id, user_name, role, is_Leader } = data.payload || {};
        
        if (!user_id) {
          console.error("[MSW] CLIENT_CONNECTED - No user_id provided");
          broadcastParticipants();
          return;
        }
        
        // localStorageから最新の参加者リストを読み込む
        let participants = loadParticipantsFromStorage();
        if (participants.length === 0) {
          participants = [
            { user_id: "aa", user_name: "ホスト(あなた)", role: "host" as const, is_Leader: false },
            { user_id: "dummy1", user_name: "たいよう", role: "player" as const, is_Leader: false },
            { user_id: "dummy2", user_name: "しょう", role: "player" as const, is_Leader: false },
          ];
        }
        
        // 戦略1: user_idで完全一致を探す
        let existingIndex = participants.findIndex((p: any) => p.user_id === user_id);

        // 戦略2: user_idで見つからない場合、user_nameで探す（異なるセッションでのリロード対策）
        if (existingIndex < 0 && user_name) {
          const normalizedName = user_name.trim().toLowerCase();
          existingIndex = participants.findIndex((p: any) =>
            p.user_name && p.user_name.trim().toLowerCase() === normalizedName
          );
          
          if (existingIndex >= 0) {
            console.log("[MSW] CLIENT_CONNECTED - Found by user_name, syncing user_id:", {
              serverSideId: participants[existingIndex].user_id,
              clientSideId: user_id,
              userName: user_name,
              action: 'Updating server-side user_id to match client'
            });
            // サーバー側のuser_idをクライアント側に合わせる（クライアントのlocalStorageが正）
            participants[existingIndex].user_id = user_id;
          }
        }
        
        // 戦略3: 両方で見つからない場合は新規参加者として追加
        if (existingIndex < 0) {
          console.log("[MSW] CLIENT_CONNECTED - New participant, adding:", { user_id, user_name, role });
          participants.push({
            user_id,
            user_name: user_name || 'Unknown',
            role: role || 'player',
            is_Leader: is_Leader || false,
          });
          existingIndex = participants.length - 1;
        } else {
          // 既存参加者の場合、情報を更新（role/is_Leaderは維持）
          console.log("[MSW] CLIENT_CONNECTED - Existing user reconnected:", { user_id, user_name });
          participants[existingIndex] = {
            ...participants[existingIndex],
            user_id: user_id, // クライアント側のIDに同期
            user_name: user_name || participants[existingIndex].user_name,
            // role と is_Leader は既存の値を維持
          };
        }
        
        setParticipants(participants, "CLIENT_CONNECTED");
        
        // 全クライアントに最新の参加者リストをブロードキャスト
        broadcastParticipants();
      }

      if (data.type === 'JOIN_USER') {
        console.log("[MSW] JOIN_USER - New user joining:", data.payload);
        const { user_id, user_name } = data.payload;
        // 参加者をリストに追加（既に存在する場合はスキップ）
        const exists = currentParticipants.some(p => p.user_id === user_id);
        if (!exists) {
          currentParticipants.push({
            user_id,
            user_name,
            role: "player" as const,
            is_Leader: true,
          });
          console.log("[MSW] User added, broadcasting updated list with", currentParticipants.length, "participants");
          broadcastParticipants();
        }
      }

      if (data.type === 'WAITING') {
        gameWs.broadcast(
          JSON.stringify({
            type: 'STATE_UPDATE',
            payload: { nextState: "setting_topic" }
          })
        );
        return;
      }

      if (data.type === 'CHECKING') {
        gameWs.broadcast(
          JSON.stringify({
            type: 'STATE_UPDATE',
            payload: {
              nextState: "checking",
              data: {
                topic: gameData.topic,
                answer: gameData.answer,
                selected_emojis: gameData.emojis,
                originalEmojis: gameData.originalEmojis,
                displayedEmojis: gameData.displayedEmojis,
                dummyIndex: gameData.dummyIndex,
                dummyEmoji: gameData.dummyEmoji,
                theme: gameData.theme,
                hint: gameData.hint,
              }
            }
          })
        );
        return;
      }

      if (data.type === 'ANSWERING') {
        // 🔴 ANSWERING メッセージから answer と topic/emojis を取得（クロスウィンドウ対応）
        console.log("[MSW] ANSWERING received, payload:", data.payload);
        gameData.answer = data.payload.answer;
        if (data.payload.topic) gameData.topic = data.payload.topic;
        if (data.payload.selected_emojis) gameData.emojis = data.payload.selected_emojis;
        if (data.payload.theme) gameData.theme = data.payload.theme;
        if (data.payload.hint) gameData.hint = data.payload.hint;
        
        // 🔴 ダミーデータも保持（ANSWERING送信時に含まれている場合）
        if (data.payload.originalEmojis) gameData.originalEmojis = data.payload.originalEmojis;
        if (data.payload.displayedEmojis) gameData.displayedEmojis = data.payload.displayedEmojis;
        if (data.payload.dummyIndex !== undefined) gameData.dummyIndex = data.payload.dummyIndex;
        if (data.payload.dummyEmoji) gameData.dummyEmoji = data.payload.dummyEmoji;
        
        console.log("[MSW] ANSWERING - Updated gameData:", {
          topic: gameData.topic,
          answer: gameData.answer,
          selected_emojis: gameData.emojis,
          displayedEmojis: gameData.displayedEmojis,
          originalEmojis: gameData.originalEmojis,
          dummyIndex: gameData.dummyIndex,
        });
        
        // 🔴 全データを含めて CHECKING 状態に遷移（ダミーデータも送信）
        gameWs.broadcast(
          JSON.stringify({
            type: 'STATE_UPDATE',
            payload: {
              nextState: "checking",
              data: {
                topic: gameData.topic,
                answer: gameData.answer,
                selected_emojis: gameData.emojis,
                originalEmojis: gameData.originalEmojis,
                displayedEmojis: gameData.displayedEmojis,
                dummyIndex: gameData.dummyIndex,
                dummyEmoji: gameData.dummyEmoji,
                theme: gameData.theme,
                hint: gameData.hint,
              }
            }
          })
        );
        console.log("[MSW] CHECKING broadcast sent with:", { displayedEmojis: gameData.displayedEmojis, originalEmojis: gameData.originalEmojis, dummyIndex: gameData.dummyIndex });
        return;
      }

      if (data.type === 'SUBMIT_TOPIC') {
        // 🔴 トピックと絵文字を保存
        gameData.topic = data.payload.topic;
        gameData.emojis = data.payload.emojis;
        console.log("[MSW] Topic saved:", gameData.topic, "Emojis:", gameData.emojis);
        
        gameWs.broadcast(
          JSON.stringify({
            type: 'STATE_UPDATE',
            payload: {
              nextState: "discussing",
              data: {
                topic: data.payload.topic,
                selected_emojis: data.payload.emojis,
                displayedEmojis: data.payload.displayedEmojis || data.payload.emojis,
                originalEmojis: data.payload.originalEmojis || [],
                dummyIndex: data.payload.dummyIndex,
                dummyEmoji: data.payload.dummyEmoji,
                assignments: buildAssignments(data.payload.emojis),
              }
            }
          })
        );

        if (timerInterval) clearInterval(timerInterval);
        // タイマー開始を5秒遅延し、5分(300秒)に設定
        setTimeout(() => {
          let seconds = 300; 
          timerInterval = setInterval(() => {
            seconds--;
            if (seconds < 0) {
              clearInterval(timerInterval!);
              gameWs.broadcast(
                JSON.stringify({ 
                  type: 'STATE_UPDATE', 
                  payload: { 
                    nextState: "answering",
                    data: {
                      topic: gameData.topic,
                      selected_emojis: gameData.emojis,
                      originalEmojis: gameData.originalEmojis,
                      displayedEmojis: gameData.displayedEmojis,
                      dummyIndex: gameData.dummyIndex,
                      dummyEmoji: gameData.dummyEmoji,
                    }
                  } 
                })
              );
              return;
            }
            const min = Math.floor(seconds / 60).toString().padStart(2, '0');
            const sec = (seconds % 60).toString().padStart(2, '0');
            gameWs.broadcast(
              JSON.stringify({ type: 'TIMER_TICK', payload: { time: `${min}:${sec}` } })
            );
          }, 1000);
        }, 5000);
      }
    });

    client.addEventListener('close', () => {
      if (gameWs.clients.size === 0 && timerInterval) clearInterval(timerInterval);
    });
  }),
  gameWs,
];