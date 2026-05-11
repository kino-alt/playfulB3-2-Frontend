"use client"

import { useState, useEffect, useRef } from 'react'
import { GameButton } from '@/components/game-button'
import dynamic from 'next/dynamic'
import { PageHeader } from '@/components/page-header'
import { TextInput } from '@/components/text-input'
import { TextDisplay } from '@/components/text-display'
import { DisplaySelectedEmojis } from '@/components/display-selected-emojis'
import { useRouter } from 'next/navigation'
import { useRoomData } from '@/contexts/room-context'
import { GameState } from '@/contexts/types'
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react'

const EmojiBackgroundLayoutNoSSR = dynamic(() => import('@/components/emoji-background-layout').then(m => m.EmojiBackgroundLayout), { ssr: false })

export function CreateTopic() {
  const [topicInput, setTopicInput] = useState('')
  const [emojiInput, setEmojiInput] = useState('')
  const [localSelectedEmojis, setLocalSelectedEmojis] = useState<string[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [step, setStep] = useState<'topic' | 'emoji'>('topic')

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const router = useRouter()

  const {
    roomId,
    roomCode,
    theme,
    hint,
    roomState,
    maxEmojis,
    submitTopic,
  } = useRoomData()

  const isEmojiComplete = localSelectedEmojis.length === maxEmojis
  const pickerWidth = 'min(92vw, 420px)'
  const pickerHeight = 'min(66vh, 520px)'

  useEffect(() => {
    if (typeof window === 'undefined' || !roomId) return

    try {
      const draftKey = `createTopic_draft_${roomId}`
      const saved = localStorage.getItem(draftKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        setTopicInput(parsed.topicInput || '')
        setLocalSelectedEmojis(parsed.localSelectedEmojis || [])
        setStep(parsed.step || 'topic')
      }
    } catch (error) {
      console.error('[CreateTopic] Failed to restore draft data:', error)
    }
  }, [roomId])

  useEffect(() => {
    if (typeof window === 'undefined' || !roomId) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      try {
        const draftKey = `createTopic_draft_${roomId}`
        const draftData = {
          topicInput,
          localSelectedEmojis,
          step,
          timestamp: Date.now(),
        }
        localStorage.setItem(draftKey, JSON.stringify(draftData))
      } catch (error) {
        console.error('[CreateTopic] Failed to save draft data:', error)
      }
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [roomId, topicInput, localSelectedEmojis, step])

  useEffect(() => {
    if (topicInput.trim() !== '' && step === 'topic') {
      if (timerRef.current) clearTimeout(timerRef.current)

      timerRef.current = setTimeout(() => {
        setStep('emoji')
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [topicInput, step])

  useEffect(() => {
    if (roomState === GameState.DISCUSSING && roomCode) {
      router.push(`/room/${roomId}/waiting-discussion-time`)
    }
  }, [roomState, roomId, router, roomCode])

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setEmojiInput(emojiData.emoji)
    setShowPicker(false)
  }

  const handleAddEmoji = () => {
    if (emojiInput && localSelectedEmojis.length < maxEmojis) {
      const newEmojis = [...localSelectedEmojis, emojiInput]
      setLocalSelectedEmojis(newEmojis)
      setEmojiInput('')
    }
  }

  const handleRemoveEmoji = (index: number) => {
    setLocalSelectedEmojis(localSelectedEmojis.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!topicInput || !isEmojiComplete || !roomId) return

    try {
      await submitTopic(topicInput, localSelectedEmojis)
      if (typeof window !== 'undefined') {
        const draftKey = `createTopic_draft_${roomId}`
        localStorage.removeItem(draftKey)
      }
    } catch (error) {
      console.error(error)
      alert('送信に失敗しました。')
    }
  }

  return (
    <EmojiBackgroundLayoutNoSSR>
      <div className="w-full max-w-xs flex flex-col h-full relative">
        <PageHeader title="Set the Topic" subtitle="Prepare your quiz" marginBottom="mb-2" />

        <TextDisplay
          value={"テーマ: " + (theme || 'N/A')}
          inputtitle=""
          height="py-0.5"
          variant="primary"
          textSize="text-sm"
          marginBottom="mb-4"
        />

        {step === 'topic' && (
          <div className="mb-2 z-20 flex justify-center">
            <div className="bg-amber-400 text-gray-600/80 text-xs font-black py-3 px-4 rounded-2xl shadow-xl relative text-center border-2 border-white leading-relaxed max-w-[280px] animate-bounce-slow">
              🖋️テーマに沿った「お題」を入力してね！
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-amber-400"></div>
            </div>
          </div>
        )}

        <div className="relative mb-8">
          <TextInput
            value={topicInput}
            onChange={(val) => {
              setTopicInput(val)
              if (step === 'emoji') setStep('topic')
            }}
            placeholder={hint ? `例： ${hint}` : 'Enter your topic'}
            inputtitle="TOPIC"
            height="py-3"
            variant="primary"
            textSize="text-xl"
            marginBottom="mb-0"
            maxLength={50}
            uppercase={false}
          />
        </div>

        <div className={`relative transition-all duration-500 ${step === 'topic' ? 'opacity-50 grayscale' : 'opacity-100'}`}>
          <div className="flex items-end justify-center gap-3 mb-5 ml-13">
            <div className="relative w-24 h-24">
              <div onClick={() => step !== 'topic' && !isEmojiComplete && setShowPicker(!showPicker)} className={`cursor-pointer ${step === 'topic' ? 'opacity-50' : ''}`}>
                <TextInput
                  value={emojiInput}
                  onChange={() => {}}
                  inputtitle="EMOJI"
                  placeholder=""
                  height="py-8"
                  variant="gray"
                  mode="edit"
                  textSize="text-3xl"
                  marginBottom="mb-0"
                  isEmojiInput={true}
                />
              </div>

              {showPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
                  <div className="absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 shadow-2xl rounded-3xl overflow-hidden border-2 border-amber-200 bg-white">
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      theme={Theme.LIGHT}
                      width={pickerWidth}
                      height={pickerHeight}
                      skinTonesDisabled
                      searchPlaceholder="絵文字を検索"
                      searchPlaceHolder="絵文字を検索"
                      previewConfig={{
                        showPreview: false,
                        defaultCaption: '絵文字を選択',
                        defaultEmoji: '🙂',
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex-shrink-0 mb-1">
              <GameButton variant="secondary" onClick={handleAddEmoji} height="p-2" disabled={!emojiInput || isEmojiComplete}>
                <p className="text-sm font-black uppercase">ADD</p>
              </GameButton>
            </div>
          </div>

          {step === 'emoji' && !isEmojiComplete && (
            <div className="mt-1 mb-1 z-20 flex justify-center">
              <div className="bg-amber-400 text-gray-600/80 text-xs font-black py-3 px-4 rounded-2xl shadow-xl relative text-center border-2 border-white leading-relaxed max-w-[280px] animate-bounce-slow">
                🔍お題を表現する絵文字を<br />あと <span style={{fontSize: '1.1rem', color: '#dc2626', fontWeight: '900'}}>{maxEmojis - localSelectedEmojis.length}</span> 個選んで！
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-amber-400"></div>
              </div>
            </div>
          )}

          <div className="flex-grow overflow-y-auto no-scrollbar min-h-[70px]">
            <DisplaySelectedEmojis
              selectedEmojis={localSelectedEmojis}
              handleRemoveEmoji={handleRemoveEmoji}
              maxEmojis={maxEmojis}
              roomState={roomState}
            />
          </div>
        </div>

        <div className="mt-auto pt-4">
          <GameButton
            variant="primary"
            onClick={handleSubmit}
            disabled={step === 'topic' || !isEmojiComplete}
          >
            Submit
          </GameButton>
        </div>
      </div>

      <style jsx global>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translate(-3%, 0); }
          50% { transform: translate(-3%, -8px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite ease-in-out;
        }
      `}</style>
    </EmojiBackgroundLayoutNoSSR>
  )
}
