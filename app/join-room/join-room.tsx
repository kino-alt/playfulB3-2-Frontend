"use client"

import { useState, useEffect, useRef } from 'react'
import { GameButton } from '@/components/game-button'
import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/page-header'
import { useRouter } from 'next/navigation'
import { TextInput } from '@/components/text-input'
import { useRoomData } from '@/contexts/room-context'

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('@/components/emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

const formatRoomCode = (code: string) => {
  if (!code || code.length <= 3) return code
  return `${code.slice(0, 3)}-${code.slice(3)}`
}

export default function JoinRoom() {
  const [roomCode, setRoomCode] = useState('')
  const [userName, setUserName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const router = useRouter()
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const storageKey = 'joinRoom_session_data'

  const {
    joinRoom,
  } = useRoomData()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = sessionStorage.getItem(storageKey)
        if (savedData) {
          const { roomCode: savedCode, userName: savedName } = JSON.parse(savedData)
          setRoomCode(savedCode || '')
          setUserName(savedName || '')
        }
      } catch (error) {
        console.error('Failed to restore data from sessionStorage:', error)
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(storageKey)
        } catch (error) {
          console.error('Failed to clear sessionStorage:', error)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      if (typeof window !== 'undefined') {
        try {
          const dataToSave = { roomCode, userName }
          sessionStorage.setItem(storageKey, JSON.stringify(dataToSave))
        } catch (error) {
          console.error('Failed to save data to sessionStorage:', error)
        }
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [roomCode, userName])

  const handleRoomCodeChange = (value: string) => {
    const cleanCode = value.replace(/-/g, '')
    setRoomCode(cleanCode)
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!roomCode || !userName) {
      return
    }

    try {
      setIsJoining(true)
      const newRoomId = await joinRoom(roomCode, userName)

      if (newRoomId) {
        router.push(`/room/${newRoomId}/waiting-start-game`)
      } else {
        alert('Failed to join room. Please try again.')
      }
    } catch (error: any) {
      const errorMsg = error.message || error.toString()
      if (errorMsg.includes('full') || errorMsg.includes('participant')) {
        alert('This room is full (5/5 participants). Please try another room.')
      } else if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        alert('Room not found. Please check the code.')
      } else {
        alert('Failed to join room. Please try again.')
      }
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <EmojiBackgroundLayoutNoSSR>
      <form onSubmit={handleJoinRoom} className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Join Room" subtitle="Enter a room code" />
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
            inputtitle="Name"
            placeholder="Enter user name"
            height="py-1"
            variant="gray"
            mode="edit"
            uppercase={false}
            textSize="text-base"
            maxLength={20}
          />
        </div>

        <div className="mt-auto">
          <GameButton variant="secondary" disabled={!roomCode || !userName || isJoining} type="submit">
            {isJoining ? 'Joining...' : 'Join Room'}
          </GameButton>
        </div>
      </form>
    </EmojiBackgroundLayoutNoSSR>
  )
}
