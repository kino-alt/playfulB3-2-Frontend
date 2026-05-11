"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GameButton } from '@/components/game-button'
import dynamic from 'next/dynamic'
import { ParticipantList } from '@/components/participant-list'
import { PageHeader } from '@/components/page-header'
import { TextInput } from '@/components/text-input'
import { useRoomData } from '@/contexts/room-context'
import { GameState } from '@/contexts/types'

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('@/components/emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

const formatRoomCode = (code: string) => {
  if (!code || code.length <= 3) return code
  return `${code.slice(0, 3)}-${code.slice(3)}`
}

export default function CreateRoom() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const {
    roomCode,
    roomId,
    participantsList,
    roomState,
    startGame,
  } = useRoomData()

  useEffect(() => {
    if (roomCode) {
      setIsLoading(false)
    }
  }, [roomCode])

  useEffect(() => {
    if (roomState === GameState.SETTING_TOPIC && roomCode) {
      router.push(`/room/${roomId}/create-topic`)
    }
  }, [roomState, roomId, router, roomCode])

  const handleStartGame = async () => {
    const currentParticipantsCount = participantsList.length

    if (currentParticipantsCount < 4 || currentParticipantsCount > 6) {
      alert(`参加人数は 4人から 6人までです（現在: ${currentParticipantsCount}人）`)
      return
    }

    try {
      await startGame()
    } catch (error) {
      alert('Failed to start game')
    }
  }

  return (
    <EmojiBackgroundLayoutNoSSR>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Create Room" subtitle="Set up your game" />

        <TextInput
          value={isLoading ? 'Loading...' : (roomCode ? formatRoomCode(roomCode) : 'N/A')}
          onChange={() => {}}
          inputtitle="Room Code"
          height="py-3"
          variant="primary"
          mode="display"
          textSize="text-2xl"
        />

        <ParticipantList participants={participantsList} />

        <div className="mt-auto">
          {roomState === GameState.WAITING && (
            <GameButton
              variant="primary"
              onClick={handleStartGame}
              disabled={participantsList.length < 4 || participantsList.length > 6 || isLoading}
            >
              Start Game
            </GameButton>
          )}
        </div>
      </div>
    </EmojiBackgroundLayoutNoSSR>
  )
}
