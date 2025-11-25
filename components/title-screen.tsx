'use client'

import {GameButton} from './game-button'
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { useRouter } from "next/navigation"

export default function TitleScreen() {
  const router = useRouter()
  
  const handleCreateRoom = () => {
    router.push("/create-room")
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
