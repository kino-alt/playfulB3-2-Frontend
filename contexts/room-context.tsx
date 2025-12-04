"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api'; // api.tsからWebSocket接続やHTTPアクションをインポート

export interface RoomState {
   
}

export interface RoomContextType extends RoomState {
    // --- アクションメソッドの宣言 ---
 
}

// Contextの初期値
const initialContext: RoomContextType = {
    
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
    });

    {*/ アクションメソッドの実装
     ex.
    const createRoom = async () => {
        // ステップ1: api.createRoom() を呼び出す
        // ステップ2: 成功したら roomCode, isHost: true を state に設定 (setState)
    };*/}

   
    // Context Value
    const contextValue: RoomContextType = {
        ...state,
      {/*メソッド名
      ex.
        createRoom,*/}
  
    };

    return (
        <RoomContext.Provider value={contextValue}>
            {children}
        </RoomContext.Provider>
    );
};
