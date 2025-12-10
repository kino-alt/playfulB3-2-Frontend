// contexts/room-context.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { RoomContextType, RoomState, GameState } from "./types";
import { useWsHandler } from "./useWSHandler";

const initialContext: RoomContextType = {
  roomCode: undefined,
  myUserId: null,
  participantsList: [],
  roomState: GameState.WAITING,
  AssignedEmoji: null,
  assignmentsMap: {},
  timer: null,
  globalError: null,

  // actions
  createRoom: async () => {},
  joinRoom: async () => {},
  submitTopic: async () => {},
  submitAnswer: async () => {},
  startGame: async () => {},
};

export const RoomContext = createContext(initialContext);
export const useRoomData = () => useContext(RoomContext);

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<RoomState>({
    roomCode: undefined,
    myUserId: null,
    participantsList: [],
    roomState: GameState.WAITING,
    AssignedEmoji: null,
    assignmentsMap: {},
    timer: null,
    globalError: null,
  });

  const handleWS = useWsHandler(setState, state.myUserId);

  // actions -----------------------------
  const createRoom = async () => {
    const data = await api.createRoom();
    setState((prev) => ({
      ...prev,
      roomCode: data.roomCode,
      myUserId: data.userId,
    }));
  };

  const joinRoom = async (roomCode: string, userName: string) => {
    const data = await api.joinRoom(roomCode, userName);
    setState((prev) => ({
      ...prev,
      roomCode,
      myUserId: data.userId,
      participantsList: data.participants ?? [],
    }));
  };

  const submitTopic = async (topic: string, emoji: string[]) => {
    if (!state.roomCode) return;
    await api.submitTopic(state.roomCode, topic, emoji);
  };

  const submitAnswer = async (answer: string) => {
    if (!state.roomCode) return;
    await api.submitAnswer(state.roomCode, answer);
  };

  const startGame = async () => {
    if (!state.roomCode) return;
    await api.startGame(state.roomCode);
  };

  // WebSocket ---------------------------------
  useEffect(() => {
    if (!state.roomCode) return;

    const ws = api.connectWebSocket(state.roomCode, handleWS);

    return () => ws.close();
  }, [state.roomCode]);

  return (
    <RoomContext.Provider
      value={{
        ...state,
        createRoom,
        joinRoom,
        submitTopic,
        submitAnswer,
        startGame,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};


