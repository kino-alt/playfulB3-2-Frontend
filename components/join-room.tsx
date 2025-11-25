"use client"

import { useState, useEffect } from "react"
import { GameButton } from "./game-button"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import {PageHeader} from "./page-header"
import { useRouter } from "next/navigation"
import { TextInput } from "./text-input"
import { api } from "@/lib/api"

type JoinRoomProps = {}

export default function JoinRoom({ }: JoinRoomProps) {
  const [roomCode, setRoomCode] = useState("")
  const [userName, setUserName] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()

  const handleJoinRoom = async () => {
    if (!roomCode || !userName) {
      return
    }

    setIsJoining(true)
    try {
      const data = await api.joinRoom(roomCode.toUpperCase(), userName)

      if (data.success) {
        router.push(`/room/${roomCode.toUpperCase()}/waiting-start-game`)
      } else {
        alert(data.error || "Failed to join room")
      }
    } catch (error) {
      console.error("Error joining room:", error)
      alert("Failed to join room")
    } finally {
      setIsJoining(false)
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
          <GameButton variant="secondary" onClick={handleJoinRoom} disabled={isJoining || !roomCode || !userName}>
            {isJoining ? "Joining..." : "Join Room"}
          </GameButton>
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}
