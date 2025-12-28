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

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomCode || !userName) {
      return
    }

    try {
    console.log("[v0] Joining room with code:", roomCode)
    
    const newRoomId = await joinRoom(roomCode, userName);
    
    if (newRoomId) {
      router.push(`/room/${newRoomId}/waiting-start-game`);
    } else {
      console.error("Room ID was not returned from joinRoom");
    }
  } catch (error) {
    console.error("Error joining game:", error)
    alert("Failed to join room. Please check the code.")
  }
  }

  return (
    <EmojiBackgroundLayout>
      <form onSubmit={handleJoinRoom} className="w-full max-w-xs flex flex-col h-full">
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
                uppercase={false}
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
                maxLength={20}
            />
          </div>

          {/* Join Button */}
          <div className="mt-auto">
            <GameButton variant="secondary"  disabled={!roomCode || !userName} type="submit">
              {"Join Room"}
            </GameButton>
          </div>
        </div>
      </form>
    </EmojiBackgroundLayout>
  )
}
