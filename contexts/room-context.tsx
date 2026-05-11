// contexts/room-context.tsx
"use client";

/**
 * データ管理設計方針：
 * 
 * 1. Single Source of Truth
 *    - RoomContext が全ての状態を管理
 *    - コンポーネントは Context から読み取りのみ
 * 
 * 2. Protected Data Pattern
 *    - サーバーから取得したデータ（theme/hint）は protectedDataRef で保護
 *    - 一度設定されたら、以降の state 更新で上書きされない
 * 
 * 3. Centralized Persistence
 *    - localStorage への保存は useEffect 1箇所のみ
 *    - デバウンス（500ms）で頻繁な保存を防止
 *    - 保存時に protected data を優先
 * 
 * 4. Immutable State Updates
 *    - すべての setState は merge ベース ({ ...prev, ...newState })
 *    - WebSocket からの更新も merge で既存データを保持
 * 
 * 5. Component-Level Draft State
 *    - UI 入力データ（topicInput など）は component の useState で管理
 *    - 独立した localStorage key で draft として保存
 *    - Context state とは分離
 */

import React, { createContext, useContext, useState, useEffect,useCallback  } from "react";
import { api } from "@/lib/api";
import { RoomContextType, RoomState, GameState } from "./types";
import { useWsHandler } from "./useWSHandler";
import { injectDummyEmoji } from "@/lib/emoji-utils";
import Logger from "@/lib/logger";

const TAG = '[RoomContext]';

// localStorage ユーティリティ（複数ルーム対応）
const STORAGE_PREFIX = 'roomState_';

const getStorageKey = (roomId: string | null, userId: string | null = null): string => {
  if (!roomId) return 'roomState_pending';
  // userIdがある場合はユーザーごとにキーを分ける（複数タブ対応）
  return userId ? `${STORAGE_PREFIX}${roomId}_${userId}` : `${STORAGE_PREFIX}${roomId}`;
};

const clearOldRoomData = () => {
  if (typeof window === 'undefined') return;
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    // ドラフトデータも削除
    localStorage.removeItem('createTopic_draft');
    localStorage.removeItem('joinRoom_session_data');
    console.log('[RoomContext] Cleared all room data from localStorage');
  } catch (error) {
    console.error('[RoomContext] Failed to clear old room data:', error);
  }
};

const saveRoomState = (state: RoomState, protectedData: { theme: string | null; hint: string | null }) => {
  if (typeof window === 'undefined' || !state.roomId) return;
  try {
    const dataToSave = {
      ...state,
      theme: protectedData.theme || state.theme,
      hint: protectedData.hint || state.hint,
      timestamp: Date.now(),
    };
    const storageKey = getStorageKey(state.roomId, state.myUserId);
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    const myParticipant = dataToSave.participantsList.find(p => p.user_id === state.myUserId);
    console.log(`[RoomContext] Saved to ${storageKey}:`, 
      `userId=${state.myUserId}, ` +
      `roomState=${dataToSave.roomState}, ` +
      `participantsCount=${dataToSave.participantsList.length}, ` +
      `myRole=${myParticipant?.role || 'unknown'}, ` +
      `isLeader=${dataToSave.isLeader}`
    );
  } catch (error) {
    console.error('[RoomContext] Failed to save room state:', error);
  }
};

const loadRoomState = (roomId?: string | null, userId?: string | null): RoomState | null => {
  if (typeof window === 'undefined') return null;
  try {
    // 特定の roomId を指定した場合はそのキーのみ参照
    if (roomId) {
      const saved = localStorage.getItem(getStorageKey(roomId, userId || null));
      if (saved) {
        const parsed = JSON.parse(saved);
        const myParticipant = parsed.participantsList?.find((p: any) => p.user_id === parsed.myUserId);
        console.log('[RoomContext] 📦 Restoring room by id:', 
          `roomId=${parsed.roomId}, ` +
          `userId=${parsed.myUserId}, ` +
          `userName=${parsed.userName}, ` +
          `roomState=${parsed.roomState}, ` +
          `participantsCount=${parsed.participantsList?.length || 0}, ` +
          `myRole=${myParticipant?.role || 'unknown'}, ` +
          `isLeader=${parsed.isLeader}, ` +
          `AssignedEmoji=${parsed.AssignedEmoji}`
        );
        return parsed as RoomState;
      }
      return null;
    }

    // roomId がない場合は最新のキーを探す
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    if (keys.length === 0) return null;

    let latestKey = keys[0];
    let latestTimestamp = 0;
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.timestamp && parsed.timestamp > latestTimestamp) {
          latestTimestamp = parsed.timestamp;
          latestKey = key;
        }
      }
    });

    const saved = localStorage.getItem(latestKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('[RoomContext] Restoring latest room:', { theme: parsed.theme, hint: parsed.hint, roomId: parsed.roomId });
      return parsed as RoomState;
    }
  } catch (error) {
    console.error('[RoomContext] Failed to restore from localStorage:', error);
  }
  return null;
};

const getInitialRoomState = (): RoomState => {
  const loaded = loadRoomState();
  if (loaded) return loaded;
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
  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  // Host判定を安定させるために、ルーム作成直後のホストフラグを保持
  const createdRoomRef = React.useRef(false);
  
  // サーバーから取得した重要データを保護（一度設定されたら上書きしない）
  const protectedDataRef = React.useRef<{ theme: string | null; hint: string | null }>({
    theme: null,
    hint: null,
  });
  
  // 初期化時に localStorage から theme/hint を復元
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const loaded = loadRoomState(state.roomId, state.myUserId);
      if (loaded && loaded.theme) protectedDataRef.current.theme = loaded.theme;
      if (loaded && loaded.hint) protectedDataRef.current.hint = loaded.hint;
      console.log('[RoomContext] Protected data initialized:', protectedDataRef.current);
    } catch (error) {
      console.error('[RoomContext] Failed to initialize protected data:', error);
    }
  }, []); // マウント時に1度だけ実行

  // localStorageに状態を保存（スマート保存：重要データは保護）
  useEffect(() => {
    if (typeof window === 'undefined' || !state.roomId) return;
    
    // 前のタイマーをクリア
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      // theme/hint が設定されている場合は保護データとして記録
      if (state.theme && !protectedDataRef.current.theme) {
        protectedDataRef.current.theme = state.theme;
      }
      if (state.hint && !protectedDataRef.current.hint) {
        protectedDataRef.current.hint = state.hint;
      }
      
      saveRoomState(state, protectedDataRef.current);
    }, 500); // 500ms デバウンス
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state]);

  const handleWS = useWsHandler(setState);
  const handlerRef = React.useRef(handleWS);
  handlerRef.current = handleWS;

  // グローバルに WebSocket メッセージハンドラーを保存
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).gameWsHandler = handlerRef.current;
    }
  }, []);

  //check host
  // ホスト判定: ルーム作成時に myUserId が記録されるので、それとの比較
  // または WebSocket の PARTICIPANT_UPDATE で role=host がセットされる
  const amIHost = React.useMemo(
    () => {
      // 方法1: participantsList から host ロールを探す
      const isHostByRole = state.participantsList.some(p => p.user_id === state.myUserId && p.role === 'host');
      // 方法2: テスト用ユーザー "aa" は常にホスト
      const isTestHost = state.myUserId === "aa";
      // 方法3: ルームを作成した直後のホストフラグ（participants 受信前の穴埋め）
      const isCreatorHost = createdRoomRef.current && !!state.myUserId;
      
      const myParticipant = state.participantsList.find(p => p.user_id === state.myUserId);

      console.log('[RoomContext] amIHost check:',
        `myUserId=${state.myUserId}, ` +
        `participantsCount=${state.participantsList.length}, ` +
        `myRole=${myParticipant?.role || 'not-found'}, ` +
        `isHostByRole=${isHostByRole}, ` +
        `isTestHost=${isTestHost}, ` +
        `isCreatorHost=${isCreatorHost}, ` +
        `RESULT=${isHostByRole || isTestHost || isCreatorHost}`
      );

      return isHostByRole || isTestHost || isCreatorHost;
    },
    [state.participantsList, state.myUserId]
  );
  
  const maxEmoji = React.useMemo(
    () => {
      const playerCount = state.participantsList.length;
      const max = Math.max(3, Math.min(5, playerCount - 1));
      console.log(`[RoomContext] maxEmoji: playerCount=${playerCount}, max=${max}, state=${state.roomState}`);
      return max;
    },
    [state.participantsList.length, state.roomState]
  );

  // actions FIX:API設計に合わせる/useCallback関数使用-----------------------------
  // 1.1 Roomの作成 (POST /api/rooms)
  const createRoom = useCallback(async () => {
    try {
      // API: POST /api/rooms -> create lobby and store ids/theme/hint
      const data = await api.createRoom();
      Logger.info(TAG, 'Room created', { roomId: data.room_id, roomCode: data.room_code, theme: data.theme, hint: data.hint });

      createdRoomRef.current = true;
      const newState = {
        roomId: data.room_id,
        roomCode: data.room_code,
        myUserId: data.user_id,
        userName: 'ホスト(あなた)',
        isLeader: false, // ホストはLeaderではない。最初にJoinしたPlayerがLeaderになる
        theme: data.theme,
        hint: data.hint,
        roomState: GameState.WAITING,
      };

      // 保護データを即座に記録（useEffect より前に）
      if (data.theme) protectedDataRef.current.theme = data.theme;
      if (data.hint) protectedDataRef.current.hint = data.hint;

      setState(prev => ({
        ...prev,
        ...newState,
      }));

      Logger.info(TAG, 'State updated', { myUserId: data.user_id, roomId: data.room_id });
      // localStorage への保存は useEffect に任せる
    } catch (err) {
      Logger.error(TAG, 'Failed to create room', err as Error);
      throw err; // TitleScreen 側で catch できるように投げる
    }
  }, []);

  // 1.4 ルーム参加 (POST /api/user)
  const joinRoom = useCallback(async (roomCode: string, userName: string) => {
    // API: POST /api/user -> join by code and name
    const response = await api.joinRoom(roomCode, userName);
    console.log("[Context] Join Room Response:", response);
    createdRoomRef.current = false;

    // バックエンドがエラーレスポンスを返す場合をチェック
    if ((response as any)?.error) {
      throw new Error((response as any).error);
    }

    const data = response as any;

    // 保護データを記録（theme/hint が返される場合）
    if (data.theme) protectedDataRef.current.theme = data.theme;
    if (data.hint) protectedDataRef.current.hint = data.hint;

    const newState = {
      roomId: data.room_id,
      roomCode,
      myUserId: data.user_id,
      userName,
      isLeader: String(data.is_leader) === "true" || data.is_leader === true,
      theme: data.theme ?? null,
      hint: data.hint ?? null,
    };

    setState(prev => ({
      ...prev,
      ...newState,
    }));

    // localStorage への保存は useEffect に任せる
    return data.room_id;
  }, []);

  // 1.2 テーマ、絵文字の設定 (POST /api/rooms/${room_id}/topic)
  const submitTopic = useCallback(async (topic: string, emoji: string[]) => {
    // ホストのみがトピック設定可能
    if (!state.roomId || !amIHost) {
      Logger.warn(TAG, 'Cannot submit topic: missing roomId or user is not host');
      return;
    }
    try {
      // 🔴 ダミー絵文字を注入
      const dummyResult = injectDummyEmoji(emoji);
      Logger.debug(TAG, 'Dummy injection', {
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

      console.log('[submitTopic] Current room state before API call:', state.roomState);
      const result = await api.submitTopic(
        state.roomId!,
        state.myUserId!,
        topic,
        dummyResult.originalEmojis,
        dummyResult.displayedEmojis,
        dummyResult.dummyIndex,
        dummyResult.dummyEmoji
      );
      if ((result as any)?.error) {
        Logger.error(TAG, 'Submit topic failed', new Error((result as any).error));
        setState(prev => ({ ...prev, globalError: (result as any).error }));
        return;
      }
      console.log('[submitTopic] ✓ Topic submitted successfully, waiting for STATE_UPDATE via WebSocket...');

      const ws = (window as any).gameWs;
      console.log('[submitTopic] WebSocket check:', {
        wsExists: !!ws,
        readyState: ws?.readyState,
        isOpen: ws?.readyState === WebSocket.OPEN
      });

      if (ws && ws.readyState === WebSocket.OPEN) {
        // Notify backend via WS to fan out topic to players
        // 🔴 プレイヤーにはダミーが混じった配列を送信
        const payload = {
          displayedEmojis: dummyResult.displayedEmojis,  // ダミー含めた絵文字配列（4〜6個）
          originalEmojis: dummyResult.originalEmojis,  // ホスト確認用
          dummyIndex: dummyResult.dummyIndex,
          dummyEmoji: dummyResult.dummyEmoji,
        };
        console.log('[submitTopic] 📤 Sending SUBMIT_TOPIC via WebSocket:', payload);
        ws.send(JSON.stringify({
          type: 'SUBMIT_TOPIC',
          payload
        }));
        console.log('[submitTopic] ✓ SUBMIT_TOPIC sent successfully, waiting for STATE_UPDATE to "discussing"...');
        Logger.debug(TAG, 'WS SUBMIT_TOPIC sent with dummy injection');
      } else {
        console.error('[submitTopic] ❌ WebSocket not available or not open!', {
          wsExists: !!ws,
          readyState: ws?.readyState
        });
        setState(prev => ({ ...prev, globalError: 'WebSocket接続がありません' }));
      }
    } catch (error) {
      Logger.error(TAG, 'Failed to submit topic', error as Error);
      setState(prev => ({ ...prev, globalError: (error as any)?.message || "Failed to submit topic" }));
    }
  }, [state.roomId, state.myUserId, amIHost]);

  // 1.3 回答の提出 (POST /api/rooms/${room_id}/answer)
  const submitAnswer = useCallback(async (answer: string) => {
    if (!state.roomId || !state.myUserId) {
      console.error('[submitAnswer] Missing roomId or myUserId:', { roomId: state.roomId, myUserId: state.myUserId });
      throw new Error('Missing roomId or myUserId');
    }
    
    // ANSWERING状態であればリーダーチェックを緩和（この画面にいること自体がリーダーの証拠）
    const isInAnsweringState = state.roomState === GameState.ANSWERING;
    if (!isInAnsweringState && !state.isLeader) {
      console.error('[submitAnswer] User is not the leader and not in ANSWERING state:', { 
        isLeader: state.isLeader, 
        roomState: state.roomState 
      });
      throw new Error('Only the leader can submit an answer');
    }
  
    try {
      console.log('[submitAnswer] Submitting answer to API:', { 
        roomId: state.roomId, 
        userId: state.myUserId, 
        answer,
        isLeader: state.isLeader,
        roomState: state.roomState
      });
      await api.submitAnswer(state.roomId, state.myUserId, answer);
      
      setState(prev => ({
          ...prev,
          answer: answer,
      }));
      
      const ws = (window as any).gameWs;
      if (ws && ws.readyState === WebSocket.OPEN) {
        // ANSWERING broadcast carries context for other tabs/clients
        // 🔴 ダミーデータも含めて送信
        console.log('[submitAnswer] Broadcasting ANSWERING via WebSocket');
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
      } else {
        console.warn('[submitAnswer] WebSocket not available or not open');
      }
    } catch (error) {
      Logger.error(TAG, 'Failed to submit answer', error as Error);
      throw error; // エラーを上位に伝播
    }
  }, [state.roomId, state.myUserId, state.isLeader, state.roomState, state.topic, state.selectedEmojis, state.originalEmojis, state.displayedEmojis, state.dummyIndex, state.dummyEmoji, state.theme, state.hint]); 

  // start game
  const startGame = useCallback(async () => {
    if (!state.roomId || !state.myUserId) {
      Logger.warn(TAG, 'Cannot start game: missing roomId or myUserId');
      return;
    }

    if (!amIHost) {
      Logger.warn(TAG, 'Cannot start game: user is not host');
      alert('ホストのみがゲームを開始できます');
      return;
    }

    try {
      console.log('[RoomContext] Starting game for room:', state.roomId, 'userId:', state.myUserId, 'amIHost:', amIHost, 'currentState:', state.roomState);
      const result = await api.startGame(state.roomId, state.myUserId);

      if ((result as any)?.error) {
        Logger.error(TAG, 'Start game failed', new Error((result as any).error));
        setState(prev => ({ ...prev, globalError: (result as any).error }));
        alert('ゲーム開始に失敗しました: ' + (result as any).error);
        return;
      }

      console.log('[RoomContext] ✓ Game started successfully, response:', result);
      Logger.info(TAG, 'Game started successfully');
      // WebSocket から STATE_UPDATE が来るのを待つ
      // ここでは特に何もしない（WebSocket ハンドラーが state を更新）
    } catch (error) {
      Logger.error(TAG, 'Failed to start game', error as Error);
      const errorMsg = (error as any)?.message || 'ゲーム開始に失敗しました';
      setState(prev => ({ ...prev, globalError: errorMsg }));
      alert(errorMsg);
    }
  }, [state.roomId, state.myUserId, amIHost, state.roomState]);

  //finish room
  const finishRoom = useCallback(async () => {
    if (!state.roomId || !state.myUserId || !amIHost) return;

    try {
      await api.finishRoom(state.roomId, state.myUserId); 
      const ws = (window as any).gameWs; 
      if (ws && ws.readyState === WebSocket.OPEN) {
        // Signal finish to backend and clients
        ws.send(JSON.stringify({ type: 'CHECKING' }));
      }
    } catch (error) {
      Logger.error(TAG, 'Failed to finish room', error as Error);
    }
  }, [state.roomId, state.myUserId, amIHost]);

  // タイトル画面に戻る時に状態とlocalStorageをクリア
  const resetRoom = useCallback(() => {
    Logger.info(TAG, 'Resetting room - clearing all state');
    
    // すべての roomId-based localStorage キーをクリア
    if (typeof window !== 'undefined') {
      try {
        // 古いキーをクリア
        localStorage.removeItem('roomState');
        localStorage.removeItem('playful-mock-participants');
        
        // roomId-based キーをクリア
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith(STORAGE_PREFIX) || key.startsWith('createTopic_draft_') || key.startsWith('joinRoom_')) {
            localStorage.removeItem(key);
          }
        });
        
        Logger.info(TAG, 'Cleared all room data from localStorage');
      } catch (error) {
        Logger.error(TAG, 'Failed to clear localStorage', error as Error);
      }
    }
    
    // 保護データもリセット
    protectedDataRef.current = { theme: null, hint: null };
    createdRoomRef.current = false;
    
    // stateを初期状態にリセット
    setState({
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
    });
  }, []);

  // 議論をスキップして回答フェーズへ遷移
  const skipDiscussion = useCallback(async () => {
    console.log('[RoomContext] skipDiscussion called:', {
      roomId: state.roomId,
      myUserId: state.myUserId,
      roomState: state.roomState,
      amIHost,
      isLeader: state.isLeader,
      participantsList: state.participantsList.map(p => ({
        user_id: p.user_id,
        role: p.role,
        is_leader: p.is_leader
      }))
    });

    // 仕様書: ホストまたはリーダーのみがスキップ可能
    if (!state.roomId || !state.myUserId || (!amIHost && !state.isLeader)) {
      Logger.warn(TAG, 'Skip discussion: insufficient permissions or missing IDs', {
        roomId: state.roomId,
        myUserId: state.myUserId,
        amIHost,
        isLeader: state.isLeader
      });
      return;
    }
    try {
      Logger.info(TAG, 'Skipping discussion', { roomId: state.roomId, userId: state.myUserId });
      await api.skipDiscussion(state.roomId, state.myUserId);
      Logger.info(TAG, 'Discussion skipped, moving to answering phase');
    } catch (error) {
      Logger.error(TAG, 'Failed to skip discussion', error as Error);
    }
  }, [state.roomId, state.myUserId, amIHost, state.isLeader]);

  // Note: WebSocket connection is now managed by WebSocketManager component
  // which is loaded in app/layout.tsx for all pages

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


