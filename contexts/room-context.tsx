"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type GameState =
  | "WAITING"
  | "CREATING_TOPIC"
  | "DISCUSSION_TIME"
  | "REVIEW"
  | "FINISHED";

interface Participant {
  name: string;
  userId: string;
  isHost: boolean;
}

interface RoomContextType {
  roomId: string | null;
  roomCode: string | null;
  userId: string | null;
  isLeader: boolean;

  gameState: GameState;
  participants: Participant[];
  timer: number;

  createRoom: () => Promise<void>;
  joinRoom: (roomCode: string, userName: string) => Promise<void>;
  submitTopic: (topic: string, emoji: string[]) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  startGame: () => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider = ({ children }: { children: React.ReactNode }) => {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLeader, setIsLeader] = useState(false);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [gameState, setGameState] = useState<GameState>("WAITING");
  const [timer, setTimer] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);

  /** -----------------------------------
   *  WebSocket Setup
   * ----------------------------------- */
  const connectWS = (roomId: string) => {
    if (wsRef.current) wsRef.current.close();

    wsRef.current = api.connectWebSocket(roomId, (msg) => {
      switch (msg.type) {
        case "STATE_UPDATE":
          setGameState(msg.state);
          break;

        case "PARTICIPANT_UPDATE":
          setParticipants(
            msg.participants.map((p: any) => ({
              name: p.name,
              userId: p.userId,
              isHost: p.isHost,
            }))
          );
          break;

        case "TIMER_TICK":
          setTimer(msg.remainingTime);
          break;

        default:
          console.warn("Unknown WS event:", msg);
      }
    });
  };

  /** -----------------------------------
   *  1. Create Room
   * ----------------------------------- */
  const createRoom = async () => {
    const res = await api.createRoom();

    setRoomId(res.room_id);
    setUserId(res.user_id);
    setRoomCode(res.room_code);
    setIsLeader(true); // host is creator

    connectWS(res.room_id);
  };

  /** -----------------------------------
   *  2. Join Room
   * ----------------------------------- */
  const joinRoom = async (roomCode: string, userName: string) => {
    const res = await api.joinRoom(roomCode, userName);

    setRoomId(res.room_id);
    setUserId(res.user_id || null);
    setRoomCode(roomCode);
    setIsLeader(res.is_leader || false);

    connectWS(res.room_id);
  };

  /** -----------------------------------
   *  3. Submit Topic
   * ----------------------------------- */
  const submitTopic = async (topic: string, emoji: string[]) => {
    if (!roomId) return;
    await api.submitTopic(roomId, topic, emoji);
  };

  /** -----------------------------------
   *  4. Submit Answer
   * ----------------------------------- */
  const submitAnswer = async (answer: string) => {
    if (!roomId || !userId) return;
    await api.submitAnswer(roomId, userId, answer);
  };

  /** -----------------------------------
   *  5. Start Game
   * ----------------------------------- */
  const startGame = async () => {
    if (!roomId) return;
    await api.startGame(roomId);
  };

  return (
    <RoomContext.Provider
      value={{
        roomId,
        roomCode,
        userId,
        isLeader,

        gameState,
        participants,
        timer,

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

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside <RoomProvider>");
  return ctx;
};
