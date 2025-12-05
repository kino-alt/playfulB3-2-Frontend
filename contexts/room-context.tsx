"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '@/lib/api'; // api.tsからWebSocket接続やHTTPアクションをインポート
import { GameState,Participant,RoomState,RoomContextType } from './types'; // GameState enumをインポート
import { useWsHandler } from './useWSHandler';

{/*
export interface RoomState {
    roomCode?: string;
    roomState: GameState;
    AssignedEmoji: string | null;
    assignmentsMap: Record<string, string>;
    timer: string | null;
    globalError: string | null;
}

export interface RoomContextType extends RoomState {
    // --- アクションメソッドの宣言 ---
 
}
*/}

// Contextの初期値
const initialContext: RoomContextType = {
    roomState: GameState.WAITING,
    myUserId: null,
    participantsList: [],
    AssignedEmoji: null,
    assignmentsMap: {},
    timer: null,
    globalError: null,    
};

export const RoomContext = createContext<RoomContextType>(initialContext);

//カスタムフック
export const useRoomData = () => useContext(RoomContext);


interface RoomProviderProps {
    children: ReactNode;
}

//RoomProvider
export const RoomProvider: React.FC<RoomProviderProps> = ({ children }) => {
    
    const [state, setState] = useState<RoomState>({    
        roomState: GameState.WAITING,
        myUserId: null,
        participantsList: [],
        AssignedEmoji: null,
        assignmentsMap: {},
        timer: null,
        globalError: null, 
    });

    {/* アクションメソッドの実装
    example:
    const createRoom = async () => {
        // ステップ1: api.createRoom() を呼び出す
        // ステップ2: 成功したら roomCode, isHost: true を state に設定 (setState)
    };*/}

    const handleWebSocketMessage = useWsHandler(setState, state.myUserId);

    // Context Value
    const contextValue: RoomContextType = {
        ...state,

    };

    //ws connection management
    useEffect(() => {
        let ws: WebSocket | null = null;
        
        // state.roomCodeが存在する場合のみ接続
        if (state.roomCode) {
            // api.connectWebSocketにroomCodeとハンドラを渡す
            ws = api.connectWebSocket(state.roomCode, handleWebSocketMessage);
        }

        //cleanup on unmount
        return () => {
            if (ws) {
                console.log("[v0] WebSocket connection closing...");
                ws.close();
            }
        };
    }, [state.roomCode, handleWebSocketMessage]); 

    return (
        <RoomContext.Provider value={contextValue}>
            {children}
        </RoomContext.Provider>
    );
};