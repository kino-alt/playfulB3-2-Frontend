"use client"

import { useState, useEffect } from "react"
import { GameButton } from "./game-button"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import {PageHeader} from "./page-header"
import { useRouter } from "next/navigation"
import { TextInput } from "./text-input"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState("")
  const [userName, setUserName] = useState("")
  const router = useRouter()
  const { 
    roomId,
    joinRoom,
  } = useRoomData();

  const handleJoinRoom = async () => {
    if (!roomCode || !userName) {
      return
    }

    try {
      console.log("[v0] Starting game for room:", roomCode)
      await joinRoom(roomCode,userName);
      router.push(`/room/${roomId}/waiting-start-game`);      
    } catch (error) {
      console.error("Error starting game:", error)
      alert("Failed to start game")
    }
  }

  return (
    <EmojiBackgroundLayout>
      <div className="w-full max-w-xs flex flex-col h-full">
        {/* Header */}
        <PageHeader 
            title="Join Room" 
            subtitle="Enter a room code" 
        />
        <div className="flex flex-col items-center justify-center flex-grow">
          <TextInput
              value={roomCode}
              onChange={setRoomCode}
              placeholder="Enter code"
              maxLength={6}
              variant="primary"
              textSize="text-2xl"
          />
          <TextInput
              value={userName}
              onChange={setUserName}
              placeholder="Enter user name"
              height="py-1"
              variant="gray"
              mode="edit"
              uppercase={false}
              textSize="text-base"
          />
        </div>

        {/* Join Button */}
        <div className="mt-auto">
          <GameButton variant="secondary" onClick={handleJoinRoom} disabled={!roomCode || !userName}>
            {"Join Room"}
          </GameButton>
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}
