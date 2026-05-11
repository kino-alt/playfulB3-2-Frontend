"use client"

import { GameButton } from '@/components/game-button'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useRoomData } from '@/contexts/room-context'

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('@/components/emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

export default function TitleScreen() {
  const router = useRouter()
  const {
    createRoom,
    resetRoom,
  } = useRoomData()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ws = (window as any).gameWs
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'CLIENT_DISCONNECTED',
              payload: { reason: 'returning_to_title' }
            }))
          }

          ws.close(1000, 'User returning to title')
        } catch (error) {
        }
      }
    }

    resetRoom()
  }, [resetRoom])

  const handleCreateRoom = async () => {
    try {
      await createRoom()
      router.push('/create-room')
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Failed to start game')
    }
  }

  const handleJoinRoom = () => {
    router.push('/join-room')
  }

  return (
    <EmojiBackgroundLayoutNoSSR>
      <div className="text-center mb-8">
        <div className="text-4xl mb-2">💬</div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent mb-1">
          絵言葉解き
        </h1>
        <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest">
          Emoji Discussion Game
        </p>
      </div>

      <div className="w-full space-y-3">
        <GameButton variant="primary" onClick={handleCreateRoom} icon="+" subtitle="Start a new game">
          Create Room
        </GameButton>

        <GameButton variant="secondary" onClick={handleJoinRoom} icon="→" subtitle="Join existing game">
          Join Room
        </GameButton>
      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}
