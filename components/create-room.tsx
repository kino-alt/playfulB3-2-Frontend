"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GameButton } from "./game-button"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { ParticipantList } from "./participant-list"
import {PageHeader} from "./page-header"
import { TextInput } from "./text-input"
import { api } from "@/lib/api"

interface CreateRoomProps {
  participants?: string[]
}

export default function CreateRoom({ participants : initialParticipants = [] }: CreateRoomProps) {
  const [roomCode, setRoomCode] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [participants, setParticipants] = useState<string[]>(initialParticipants)
  const router = useRouter()

  //create room code
  useEffect(() => {
    const createRoom = async () => {
      try {
        console.log("[v0] Creating room...")
        const data = await api.createRoom()
        console.log("[v0] Room created response:", data)

        if (data.success) {
          setRoomCode(data.roomCode)
          console.log("[v0] Room code set:", data.roomCode)
        } else {
          console.error("Failed to create room:", data.error)
        }
      } catch (error) {
        console.error("Error creating room:", error)
      } finally {
        setIsLoading(false)
      }
    }
    createRoom()
  }, [])

  //参加者リスト更新
  useEffect(() => {
    if (!roomCode) return

    console.log("[v0] Connecting to WebSocket for room:", roomCode)
    const ws = api.connectWebSocket(roomCode, (data) => {
      console.log("[v0] Received WebSocket message:", data)
      if (data.participants) {
        setParticipants(data.participants)
      }
    })

    // クリーンアップ: コンポーネントのアンマウント時にWebSocket接続を閉じる
    return () => {
      console.log("[v0] Closing WebSocket connection")
      ws.close()
    }
  }, [roomCode])

  const handleStartGame = async () => {
    if (!roomCode || participants.length<3 || participants.length>7) return

    try {
      console.log("[v0] Starting game for room:", roomCode)
      const data = await api.startGame(roomCode)

      if (data.success) {
        router.push(`/room/${roomCode.toUpperCase()}/create-topic`)
      } else {
        console.error("Failed to start game:", data.error)
        alert("Failed to start game")
      }
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
            title="Create Room" 
            subtitle="Set up your game" 
        />

        <TextInput
            value={isLoading ? "Loading..." : roomCode}
            onChange={setRoomCode}
            inputtitle="Room Code"
            height = "py-3"
            variant="primary"
            mode="display"
            textSize="text-2xl"
        />

        {/* Participants List */}
        <ParticipantList participants={participants} />

        {/* Start Button */}
        <div className="mt-auto">
          <GameButton variant="primary" onClick={handleStartGame}>
            Start Game
          </GameButton>
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}
