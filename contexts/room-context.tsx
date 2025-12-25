// contexts/room-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect,useCallback  } from "react";
import { api } from "@/lib/api";
import { RoomContextType, RoomState, GameState } from "./types";
import { useWsHandler } from "./useWSHandler";
import { ParticipantList } from "@/src/components/participant-list";

//FIX: Separate RoomState
const initialRoomState: RoomState = {
  roomId: null, // FIX: Add
  roomCode: undefined,
  myUserId: null,
  isLeader: false, // FIX: Add
  topic: null, // FIX: Add
  theme: null, // FIX: Add
  hint: null, //FIX: Add
  answer: null, //FIX: Add
  selectedEmojis: [], // FIX: Add
  participantsList: [], // FIX: Use 'participantsList'
  roomState: GameState.WAITING,
  AssignedEmoji: null,
  assignmentsMap: {},
  timer: null,
  globalError: null,
};

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
  const [state, setState] = useState<RoomState>(initialRoomState);

  const handleWS = useWsHandler(setState);
  const handlerRef = React.useRef(handleWS);
  handlerRef.current = handleWS;

  //check host
  const amIHost = state.participantsList.some(
    p => p.user_id === state.myUserId && p.role === 'host'
  ) || (state.myUserId === "aa");
  const maxEmoji = Math.max(0, state.participantsList.length - 1);

  // actions FIX:API設計に合わせる/useCallback関数使用-----------------------------
  // 1.1 Roomの作成 (POST /api/rooms)
  const createRoom = useCallback(async () => {
    // APIレスポンス: { room_id, user_id, room_code, theme, hint }
    const data = await api.createRoom();
    console.log("[Context] API Response:", data);
    try{
      setState((prev) => ({
        ...prev,
        roomId: data.room_id,
        roomCode: data.room_code,
        myUserId: data.user_id,
        isLeader:false,
        theme: data.theme, 
        hint: data.hint,
      }));
    }catch (err) {
    console.error("[Context] createRoom Error:", err);
    throw err; // TitleScreen 側で catch できるように投げる
    }
  }, []);

  // 1.4 ルーム参加 (POST /api/user)
  const joinRoom = useCallback(async (roomCode: string, userName: string) => {
    // APIレスポンス: { room_id, user_is, is_leader }
    const data = await api.joinRoom(roomCode, userName);
    console.log("[Context] Join Room Response:", data);
    setState((prev) => ({
      ...prev,
      roomId: data.room_id,
      roomCode,
      myUserId: data.user_id, 
      isLeader: String(data.is_leader) === "true" || data.is_leader === true,
    }));
    return data.room_id;
  },[]);

  // 1.2 テーマ、絵文字の設定 (POST /api/rooms/${room_id}/topic)
  const submitTopic = useCallback(async (topic: string, emoji: string[]) => {
    if (!state.roomId || !amIHost) return;
    try {
      await api.submitTopic(state.roomId, topic, emoji);
      
      const ws = (window as any).gameWs; 
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'SUBMIT_TOPIC',
          payload: { topic, emojis: emoji } 
        }));
        console.log("[Context] WS Message Sent: SUBMIT_TOPIC");
      }
    } catch (error) {
      console.error("Failed to submit topic:", error);
    }
  }, [state.roomId,state.participantsList, state.myUserId]);

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
        // 🔴 ANSWERING メッセージに topic と selectedEmojis も含める（クロスウィンドウ対応）
        ws.send(JSON.stringify({ 
          type: 'ANSWERING', 
          payload: { 
            answer,
            topic: state.topic,
            selected_emojis: state.selectedEmojis,
            theme: state.theme,
            hint: state.hint,
          } 
        }));
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  }, [state.roomId, state.myUserId]); 

  // start game
  const startGame = useCallback(async () => {
    if (!state.roomId || !amIHost) return;
    
    try {
      await api.startGame(state.roomId); 
      const ws = (window as any).gameWs; 
      if (ws && ws.readyState === WebSocket.OPEN) {
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
        ws.send(JSON.stringify({ type: 'CHECKING' }));
      }
    } catch (error) {
      console.error("Failed to finish room:", error);
    }
  }, [state.roomId,state.participantsList, state.myUserId]);

  // WebSocket ---------------------------------
 useEffect(() => {
    if (state.roomId && state.myUserId) {
        console.log("[Context] Opening WebSocket for roomId:", state.roomId, "userId:", state.myUserId);
      // 🔴 直接 handleWS を渡さず、Ref を経由した無名関数を渡す
      // これにより、handleWS が変わっても useEffect が再実行（切断）されなくなります
        const ws = api.connectWebSocket(state.roomId, (data) => {
          console.log("[Context] onMessage received:", data);
          handlerRef.current(data);
      }, state.myUserId, state.roomCode || "ゲスト");  // 🔴 userId と userName を渡す

      // 🔴 定期的に最新の参加者リストを取得（3秒ごと）
      const fetchTimer = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log("[Context] Periodic Fetch Request...");
          ws.send(JSON.stringify({ type: 'FETCH_PARTICIPANTS' }));
        }
      }, 3000);

      return () => {
        console.log("[WS] Cleanup: Closing connection");
        clearInterval(fetchTimer);
        ws.close();
      };
    }
  }, [state.roomId, state.myUserId]);

  // Debug: participantsList の更新監視
  useEffect(() => {
    if (state.participantsList) {
      console.log(
        "[Context] participantsList updated:",
        state.participantsList.map((p) => ({
          id: p.user_id,
          name: p.user_name,
          role: p.role,
          isLeader: String(p.is_Leader),
        }))
      );
    }
  }, [state.participantsList]);

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
        finishRoom
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};


