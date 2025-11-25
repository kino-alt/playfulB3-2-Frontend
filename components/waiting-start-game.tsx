"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { ParticipantList } from "./participant-list"
import { WaitingAnimation } from "./waiting-animation"

export default function WaitingSartGame({roomCode }: { roomCode: string }) {
   const [participants, setParticipants] = useState<string[]>([])
   const router = useRouter()

  //参加者リスト更新
    useEffect(() => {
      if (!roomCode) return
  
      console.log("[v0] Connecting to WebSocket for room:", roomCode)
      const ws = api.connectWebSocket(roomCode, (data) => {
        console.log("[v0] Received WebSocket message:", data)
        if (data.participants) {
          setParticipants(data.participants)
        }
        if (data.type === "game_start") {
        console.log("[v0] Game started, redirecting to waiting-create-topic")
        router.push(`/room/${roomCode}/waiting-set-topic`)
      }
      })
  
      // クリーンアップ: コンポーネントのアンマウント時にWebSocket接続を閉じる
      return () => {
        console.log("[v0] Closing WebSocket connection")
        ws.close()
      }
    }, [roomCode,router])

  return (
    <EmojiBackgroundLayout>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Waiting for players" subtitle="Please wait..." />

        {/* Waiting animation */}
        <div className="flex flex-col items-center">
          <WaitingAnimation variant="secondary" />
        </div>

        {/* Participants List */}
        <div className="w-full mb-8">
            <ParticipantList participants={participants} />
        </div>

      </div>
    </EmojiBackgroundLayout>
  )
}
