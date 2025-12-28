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

// Format room code with hyphen (e.g., ABC-123)
const formatRoomCode = (code: string) => {
  if (!code || code.length <= 3) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
};

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState("")
  const [userName, setUserName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()
  const { 
    roomId,
    joinRoom,
    participantsList,
  } = useRoomData();

  // Monitor participant count - if exceeds 5, show error and return to join screen
  useEffect(() => {
    if (participantsList.length > 5) {
      alert("This room is full (5/5 participants). You have been removed.");
      router.back();
    }
  }, [participantsList, router]);

  // Handle room code input - remove hyphens when storing
  const handleRoomCodeChange = (value: string) => {
    const cleanCode = value.replace(/-/g, '');
    setRoomCode(cleanCode);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomCode || !userName) {
      return
    }

    try {
      setIsJoining(true)
      console.log("[v0] Joining room with code:", roomCode)
      
      const newRoomId = await joinRoom(roomCode, userName);
      
      if (newRoomId) {
        router.push(`/room/${newRoomId}/waiting-start-game`);
      } else {
        console.error("Room ID was not returned from joinRoom");
        alert("Failed to join room. Please try again.");
      }
    } catch (error: any) {
      console.error("Error joining game:", error)
      // バックエンドから返されるエラーメッセージをチェック
      const errorMsg = error.message || error.toString();
      if (errorMsg.includes("full") || errorMsg.includes("participant")) {
        alert("This room is full (5/5 participants). Please try another room.")
      } else if (errorMsg.includes("not found") || errorMsg.includes("404")) {
        alert("Room not found. Please check the code.")
      } else {
        alert("Failed to join room. Please try again.")
      }
    } finally {
      setIsJoining(false)
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
                value={formatRoomCode(roomCode)}
                onChange={handleRoomCodeChange}
                inputtitle="Room Code"
                placeholder="___ - ___"
                maxLength={7}
                variant="primary"
                textSize="text-2xl"
                uppercase={false}
            />
            <TextInput
                value={userName}
                onChange={setUserName}
                inputtitle="User Name"
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
            <GameButton variant="secondary" disabled={!roomCode || !userName || isJoining} type="submit">
              {isJoining ? "Joining..." : "Join Room"}
            </GameButton>
          </div>
        </div>
      </form>
    </EmojiBackgroundLayout>
  )
}
