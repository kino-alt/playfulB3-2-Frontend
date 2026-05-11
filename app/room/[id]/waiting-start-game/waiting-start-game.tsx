"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/page-header'
import { ParticipantList } from '@/components/participant-list'
import { useRoomData } from '@/contexts/room-context'
import { GameState } from '@/contexts/types'

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('@/components/emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

export default function WaitingStartGame() {
  const router = useRouter()
  const {
    roomId,
    roomState,
    participantsList,
    isHost,
    startGame,
  } = useRoomData()

  useEffect(() => {
    if (roomState === GameState.SETTING_TOPIC && roomId) {
      router.push(`/room/${roomId}/waiting-create-topic`)
    }
  }, [roomState, roomId, router])

  const handleStartGame = async () => {
    try {
      await startGame()
    } catch (error) {
      console.error('[WaitingStartGame] Failed to start game:', error)
    }
  }

  return (
    <EmojiBackgroundLayoutNoSSR>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Waiting for players" subtitle="Please wait..." />

        <div className="w-full mb-8">
          <ParticipantList participants={participantsList} />
        </div>

        {isHost && (
          <button
            onClick={handleStartGame}
            className="w-full px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-colors shadow-lg"
          >
            Start Game
          </button>
        )}
      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}
