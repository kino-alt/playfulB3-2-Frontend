// contexts/room-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect,useCallback  } from "react";
import { api } from "@/lib/api";
import { RoomContextType, RoomState, GameState } from "./types";
import { useWsHandler } from "./useWSHandler";
import { ParticipantList } from "@/src/components/participant-list";
import { injectDummyEmoji } from "@/lib/emoji-utils";

//FIX: Separate RoomState
const getInitialRoomState = (): RoomState => {
  if (typeof window === 'undefined') {
    return {
      roomId: null,
      roomCode: undefined,
      myUserId: null,
      isLeader: false,
      topic: null,
      theme: null,
      hint: null,
      answer: null,
      selectedEmojis: [],
      originalEmojis: [],
      displayedEmojis: [],
      dummyIndex: null,
      dummyEmoji: null,
      participantsList: [],
      roomState: GameState.WAITING,
      AssignedEmoji: null,
      assignmentsMap: {},
      timer: null,
      globalError: null,
    };
  }

  try {
    const saved = localStorage.getItem('roomState');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        roomId: parsed.roomId || null,
        roomCode: parsed.roomCode || undefined,
        myUserId: parsed.myUserId || null,
        userName: parsed.userName || null,
        isLeader: parsed.isLeader || false,
        topic: parsed.topic || null,
        theme: parsed.theme || null,
        hint: parsed.hint || null,
        answer: parsed.answer || null,
        selectedEmojis: parsed.selectedEmojis || [],
        originalEmojis: parsed.originalEmojis || [],
        displayedEmojis: parsed.displayedEmojis || [],
        dummyIndex: parsed.dummyIndex ?? null,
        dummyEmoji: parsed.dummyEmoji || null,
        participantsList: parsed.participantsList || [],
        roomState: parsed.roomState || GameState.WAITING,
        AssignedEmoji: parsed.AssignedEmoji || null,
        assignmentsMap: parsed.assignmentsMap || {},
        timer: parsed.timer || null,
        globalError: null,
      };
    }
  } catch (error) {
    console.error('[RoomContext] Failed to restore from localStorage:', error);
  }

  return {
    roomId: null,
    roomCode: undefined,
    myUserId: null,
    userName: null,
    isLeader: false,
    topic: null,
    theme: null,
    hint: null,
    answer: null,
    selectedEmojis: [],
    originalEmojis: [],
    displayedEmojis: [],
    dummyIndex: null,
    dummyEmoji: null,
    participantsList: [],
    roomState: GameState.WAITING,
    AssignedEmoji: null,
    assignmentsMap: {},
    timer: null,
    globalError: null,
  };
};

const initialRoomState = getInitialRoomState();

const initialContext: RoomContextType = {
  ...initialRoomState, // RoomStateの全フィールドを含める
  isHost: false,
  maxEmojis: 0,
  createRoom: async () => {},
  joinRoom: async () => "",
  submitTopic: async () => {},
  submitAnswer: async () => {},
  startGame: async () => {},
  finishRoom: async () => {},
  skipDiscussion: async () => {},
  resetRoom: () => {}, // タイトル画面に戻る時に状態をクリア
};

//FIX: Add
interface RoomProviderProps {
  children: React.ReactNode;
  initialRoomId?: string; 
}

export const RoomContext = createContext(initialContext);
export const useRoomData = () => useContext(RoomContext);

export const RoomProvider = ({ children, initialRoomId }: RoomProviderProps) => {
 // FIX: Include all fields of RoomState
  const [state, setState] = useState<RoomState>(() => getInitialRoomState());

  // localStorageに状態を保存（デバウンス処理）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem('roomState', JSON.stringify(state));
      } catch (error) {
        console.error('[RoomContext] Failed to save to localStorage:', error);
      }
    }, 500); // 500ms デバウンス
    
    return () => clearTimeout(timeoutId);
  }, [state]);

  const handleWS = useWsHandler(setState);
  const handlerRef = React.useRef(handleWS);
  handlerRef.current = handleWS;

  //check host
  // Host check based on participants list (fallback for test user "aa")
  const amIHost = React.useMemo(
    () => state.participantsList.some(p => p.user_id === state.myUserId && p.role === 'host') || (state.myUserId === "aa"),
    [state.participantsList, state.myUserId]
  );
  const maxEmoji = React.useMemo(
    () => Math.max(0, state.participantsList.length - 1),
    [state.participantsList.length]
  );

  // actions FIX:API設計に合わせる/useCallback関数使用-----------------------------
  // 1.1 Roomの作成 (POST /api/rooms)
  const createRoom = useCallback(async () => {
    // API: POST /api/rooms -> create lobby and store ids/theme/hint
    const data = await api.createRoom();
    console.log("[Context] API Response:", data);
    try{
      const newState = {
        roomId: data.room_id,
        roomCode: data.room_code,
        myUserId: data.user_id,
        isLeader: false,
        theme: data.theme, 
        hint: data.hint,
        roomState: GameState.WAITING,  // 明示的にWAITINGに設定
      };
      setState((prev) => ({
        ...prev,
        ...newState,
      }));
      // 即座にlocalStorageに保存
      if (typeof window !== 'undefined') {
        localStorage.setItem('roomState', JSON.stringify({ ...initialRoomState, ...newState }));
      }
    }catch (err) {
    console.error("[Context] createRoom Error:", err);
    throw err; // TitleScreen 側で catch できるように投げる
    }
  }, []);

  // 1.4 ルーム参加 (POST /api/user)
  const joinRoom = useCallback(async (roomCode: string, userName: string) => {
    // API: POST /api/user -> join by code and name
    const response = await api.joinRoom(roomCode, userName);
    console.log("[Context] Join Room Response:", response);
    
    // バックエンドがエラーレスポンスを返す場合をチェック
    if (response.error) {
      throw new Error(response.error);
    }
    
    const data = response;
    const newState = {
      roomId: data.room_id,
      roomCode,
      myUserId: data.user_id,
      userName: userName,  // ユーザー名を保存
      isLeader: String(data.is_leader) === "true" || data.is_leader === true,
    };
    setState((prev) => ({
      ...prev,
      ...newState,
    }));
    // 即座にlocalStorageに保存
    if (typeof window !== 'undefined') {
      localStorage.setItem('roomState', JSON.stringify({ ...initialRoomState, ...newState }));
    }
    return data.room_id;
  },[]);

  // 1.2 テーマ、絵文字の設定 (POST /api/rooms/${room_id}/topic)
  const submitTopic = useCallback(async (topic: string, emoji: string[]) => {
    if (!state.roomId || !amIHost) return;
    try {
      // 🔴 ダミー絵文字を注入
      const dummyResult = injectDummyEmoji(emoji);
      console.log("[Context] Dummy injection:", {
        original: dummyResult.originalEmojis,
        displayed: dummyResult.displayedEmojis,
        dummyIndex: dummyResult.dummyIndex,
        dummyEmoji: dummyResult.dummyEmoji,
      });

      // 状態に保存（ホストは元の絵文字も見られるように保持）
      setState(prev => ({
        ...prev,
        topic,
        selectedEmojis: dummyResult.originalEmojis,  // ホスト用：元の絵文字
        originalEmojis: dummyResult.originalEmojis,
        displayedEmojis: dummyResult.displayedEmojis,
        dummyIndex: dummyResult.dummyIndex,
        dummyEmoji: dummyResult.dummyEmoji,
      }));

      const result = await api.submitTopic(state.roomId, topic, emoji);
      if ((result as any)?.error) {
        console.error("[Context] submitTopic error:", (result as any).error, (result as any).details || "");
        setState(prev => ({ ...prev, globalError: (result as any).error }));
        return;
      }

      const ws = (window as any).gameWs; 
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Notify backend via WS to fan out topic to players
        // 🔴 プレイヤーにはダミーが混じった配列を送信
        ws.send(JSON.stringify({ 
          type: 'SUBMIT_TOPIC',
          payload: { 
            topic, 
            emojis: dummyResult.displayedEmojis,  // プレイヤー用：ダミー混入版
            originalEmojis: dummyResult.originalEmojis,  // ホスト確認用
            dummyIndex: dummyResult.dummyIndex,
            dummyEmoji: dummyResult.dummyEmoji,
          } 
        }));
        console.log("[Context] WS Message Sent: SUBMIT_TOPIC with dummy injection");
      }
    } catch (error) {
      console.error("Failed to submit topic:", error);
      setState(prev => ({ ...prev, globalError: (error as any)?.message || "Failed to submit topic" }));
    }
  }, [state.roomId, amIHost]);

  // 1.3 回答の提出 (POST /api/rooms/${room_id}/answer)
  const submitAnswer = useCallback(async (answer: string) => {
    if (!state.roomId || !state.myUserId || !state.isLeader) return;
  
    try {
      await api.submitAnswer(state.roomId, state.myUserId, answer);
      
      setState(prev => ({
          ...prev,
          answer: answer,
      }));
      const ws = (window as any).gameWs;
      if (ws && ws.readyState === WebSocket.OPEN) {
        // ANSWERING broadcast carries context for other tabs/clients
        // 🔴 ダミーデータも含めて送信
        ws.send(JSON.stringify({ 
          type: 'ANSWERING', 
          payload: { 
            answer,
            topic: state.topic,
            selected_emojis: state.selectedEmojis,
            originalEmojis: state.originalEmojis,
            displayedEmojis: state.displayedEmojis,
            dummyIndex: state.dummyIndex,
            dummyEmoji: state.dummyEmoji,
            theme: state.theme,
            hint: state.hint,
          } 
        }));
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  }, [state.roomId, state.myUserId, state.isLeader, state.topic, state.selectedEmojis, state.originalEmojis, state.displayedEmojis, state.dummyIndex, state.dummyEmoji, state.theme, state.hint]); 

  // start game
  const startGame = useCallback(async () => {
    if (!state.roomId || !amIHost) return;
    
    try {
      await api.startGame(state.roomId); 
      const ws = (window as any).gameWs; 
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Ask backend to move to waiting state across clients
        ws.send(JSON.stringify({ type: 'WAITING' }));
      }
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  }, [state.roomId, amIHost]);

  //finish room
  const finishRoom = useCallback(async () => {
    if (!state.roomId || !amIHost) return;

    try {
      await api.finishRoom(state.roomId); 
      const ws = (window as any).gameWs; 
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Signal finish to backend and clients
        ws.send(JSON.stringify({ type: 'CHECKING' }));
      }
    } catch (error) {
      console.error("Failed to finish room:", error);
    }
  }, [state.roomId, amIHost]);

  // タイトル画面に戻る時に状態とlocalStorageをクリア
  const resetRoom = useCallback(() => {
    console.log("[Context] resetRoom called - clearing all state and localStorage");
    // localStorageをクリア
    try {
      localStorage.removeItem('roomState');
      localStorage.removeItem('playful-mock-participants');
    } catch (error) {
      console.error('[RoomContext] Failed to clear localStorage:', error);
    }
    // stateを初期状態にリセット
    setState({
      roomId: null,
      roomCode: undefined,
      myUserId: null,
      isLeader: false,
      topic: null,
      theme: null,
      hint: null,
      answer: null,
      selectedEmojis: [],
      originalEmojis: [],
      displayedEmojis: [],
      dummyIndex: null,
      dummyEmoji: null,
      participantsList: [],
      roomState: GameState.WAITING,
      AssignedEmoji: null,
      assignmentsMap: {},
      timer: null,
      globalError: null,
    });
  }, []);

  // 議論をスキップして回答フェーズへ遷移
  const skipDiscussion = useCallback(async () => {
    if (!state.roomId) {
      console.log("[Room Context] No roomId to skip discussion");
      return;
    }
    try {
      console.log("[Room Context] Skipping discussion...");
      await api.skipDiscussion(state.roomId);
      console.log("[Room Context] Discussion skipped, moving to answering phase");
    } catch (error) {
      console.error("Failed to skip discussion:", error);
    }
  }, [state.roomId]);

  // WebSocket ---------------------------------
 useEffect(() => {
    // roomIdがない場合（title-screen等）は接続しない
    if (!state.roomId || !state.myUserId) {
        console.log("[Context] No roomId or myUserId, skipping WebSocket connection");
        return;
    }
    
    if (state.roomId && state.myUserId) {
        console.log("[Context] Opening WebSocket for roomId:", state.roomId, "userId:", state.myUserId);
      // Keep WS connection stable; dispatch via ref to avoid re-connects on handler change
        const ws = api.connectWebSocket(state.roomId, (data) => {
          // ログノイズ削減
          // console.log("[Context] onMessage received:", data);
          handlerRef.current(data);
      }, state.myUserId, state.userName || "ゲスト");  // 🔴 userId と userName を渡す

      // Periodically refresh participant list to stay in sync
      // 間隔を長くして負荷削減 (3秒 → 30秒)
      const fetchTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'FETCH_PARTICIPANTS' }));
        }
      }, 30000); // 30秒ごと（WebSocketイベントで即時更新されるため、低頻度でOK）

      return () => {
        console.log("[WS] Cleanup: Closing connection");
        clearInterval(fetchTimer);
        ws.close();
      };
    }
  }, [state.roomId, state.myUserId, state.userName]);

  // Debug: participantsList の更新監視 (コメントアウト - ログノイズ削減)
  // useEffect(() => {
  //   if (state.participantsList) {
  //     console.log(
  //       "[Context] participantsList updated:",
  //       state.participantsList.map((p) => ({
  //         id: p.user_id,
  //         name: p.user_name,
  //         role: p.role,
  //         isLeader: String(p.is_Leader),
  //       }))
  //     );
  //   }
  // }, [state.participantsList]);

  // Debug: roomState の変化監視
  useEffect(() => {
    console.log("[Context] roomState:", state.roomState);
  }, [state.roomState]);

  return (
    <RoomContext.Provider
      value={{
        ...state,
        isHost: amIHost,
        maxEmojis: maxEmoji,
        createRoom,
        joinRoom,
        submitTopic,
        submitAnswer,
        startGame,
        finishRoom,
        skipDiscussion,
        resetRoom,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};


