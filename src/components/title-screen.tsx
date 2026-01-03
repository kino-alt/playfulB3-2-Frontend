'use client'

import {GameButton} from './game-button'
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
//FIX: Add
import { useRoomData } from '@/contexts/room-context';
import { GameState } from "@/contexts/types";

export default function TitleScreen() {
  const router = useRouter()
   const { 
    createRoom,
    globalError,
    resetRoom,
  } = useRoomData();
  
  // title-screenに到達したときにroom contextの状態を完全にリセット
  useEffect(() => {
    console.log("[TitleScreen] Resetting room context for fresh start");
    resetRoom();
  }, [resetRoom]);
  
  const handleCreateRoom = async() => {
     try {
      console.log("[v0] Starting game for room:")
      await createRoom();    
      console.log("[Title] Success, navigating to create-room");
      router.push("/create-room");
    } catch (error) {
      console.error("Error starting game:", error)
      alert("Failed to start game")
    }
  }

  const handleJoinRoom = () => {
    router.push("/join-room")
  }

  return (
    <EmojiBackgroundLayout>
        {/* Title Section */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💬</div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent mb-1">
            GAME TITLE
          </h1>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
            Emoji Discussion Game
          </p>
        </div>

        {/* Button Section */}
        <div className="w-full space-y-3">
          {/* Create Room Button */}
          <GameButton variant="primary" onClick={handleCreateRoom} icon="+" subtitle="Start a new game">
            Create Room
          </GameButton>

          {/* Join Room Button */}
          <GameButton variant="secondary" onClick={handleJoinRoom} icon="→" subtitle="Join existing game">
            Join Room
          </GameButton>
        </div>

    </EmojiBackgroundLayout>
  )
}
