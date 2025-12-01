"use client"

import { useState, useEffect, use } from "react"
import { GameButton } from "./game-button"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextInput } from "./text-input"
import { TextDisplay} from "./text-display"
import { DisplaySelectedEmojis } from "./display-selected-emojis"
import { useRouter } from "next/navigation"
import { Modal } from "./modal"
import { api } from "@/lib/api"


export function CreateTopic({roomCode}:  { roomCode: string }) {
  const [theme, setTheme] =useState("")
  const [topic, setTopic] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [emojiInput, setEmojiInput] = useState("")
  const [hint, setHint] = useState("")
  const [showHintOverlay, setShowHintOverlay] = useState(false)
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([])
  const router = useRouter()
  const EMOJI_REGEX = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])$/u;

  // (要修正) temporary values
  useEffect(() => {
    setTheme("Theme")
    setIsLoading(false)
    setHint("Hint: Choose emojis that represent the topic well.")
  }, [])
  const maxEmojis = 7

  {/* Toggle hint overlay visibility */}
  const handleToggleHintOverlay = () => {
    setShowHintOverlay(prev => !prev)
  }
  
  {/* (要修正）Handle emoji input change with validation */}
  const handleEmojiInputChange = (value: string) => {
    if (value === "" || EMOJI_REGEX.test(value)) {
      setEmojiInput(value);
    }

    const newChar = value.slice(-1);
    if (newChar === "" || EMOJI_REGEX.test(newChar)) {
      setEmojiInput(newChar);
    }

    if (value.length <= 1) {
      if (value === "" || EMOJI_REGEX.test(value)) {
        setEmojiInput(value);
      }
    }
  };
    
  {/* Add emoji to selected list */}
  const handleAddEmoji = () => {
    if (emojiInput.trim() && selectedEmojis.length < maxEmojis) {
      setSelectedEmojis([...selectedEmojis, emojiInput.trim()])
      setEmojiInput("")
    }
  }

  {/* Remove emoji from selected list */}
  const handleRemoveEmoji = (index: number) => {
    setSelectedEmojis(selectedEmojis.filter((_, i) => i !== index))
  }

  {/* (要修正)Temporary submit handler */}
  const handleSubmit = async () => {
    if (!topic.trim() || selectedEmojis.length === 0) {
      alert("トピックと絵文字を入力してください")
      return
    }

    try {
      console.log("[v0] Starting game for room:", roomCode)
      const data = await api.submitTopic(roomCode, topic.trim(), selectedEmojis as unknown as [])

      if (data.success) {
        router.push(`/room/${roomCode.toUpperCase()}/waiting-discussion-time`)
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

      {/* Hint Modal */}
      <Modal
        isOpen={showHintOverlay} 
        onClose={handleToggleHintOverlay}
        title="💡 Hint for Choosing Emojis"
        content={isLoading ? "Loading hint..." : hint} 
      />

      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Set the Topic" subtitle={`Set the topic and choose the emojis`} marginBottom="mb-2" />
        
        {/*Theme display*/}
        <TextDisplay
          value={isLoading ? "Loading..." : theme}
          inputtitle=""
          height="py-0.5"
          variant="primary"
          textSize="text-sm"
          marginBottom="mb-2"
        />

        {/*Topic input*/}
        <TextInput
          value={topic}
          onChange={setTopic}
          inputtitle=""
          placeholder="Enter the Topic"
          height="py-2"
          variant="primary"
          mode="edit"
          textSize="text-lg"
          marginBottom="mb-6"
        />

        <div className="flex items-end justify-center gap-3 mb-8 ml-13">
          <div className="relative w-24 h-24">
            {/* Hint Overlay Button */}
            <button
                onClick={handleToggleHintOverlay}
                className="absolute top-2 -left-9 z-10 w-6 h-6 rounded-full bg-yellow-400 text-white font-bold flex items-center justify-center text-sm shadow-md hover:bg-yellow-500 transition-colors"
                title="Refer to Hints"
            >
                !
            </button>

            {/*select emoji input*/}
            <TextInput
              value={emojiInput}
              onChange={handleEmojiInputChange}
              inputtitle="" 
              placeholder=""
              maxLength={1}
              height="py-8"
              variant="gray"
              mode="edit"
              textSize="text-xl"
              marginBottom="mb-2"
              isEmojiInput={true}
            />
            <p className="text-xs text-gray-500 font-semibold uppercase text-center mt-2">Select Emoji</p>
          </div>
          
           {/* Add button */}
          <div className="flex-shrink-0 mb-1"> 
            <GameButton variant="secondary" onClick={handleAddEmoji} height="p-2"> 
              <p className="text-xs font-bold uppercase"> ADD</p>
            </GameButton>
          </div>
        </div>

        {/*display selected emojis*/}
        <DisplaySelectedEmojis
          selectedEmojis={selectedEmojis}
          handleRemoveEmoji={handleRemoveEmoji}
          maxEmojis={maxEmojis}
        />

        {/*submit button*/}
        <div className="mt-auto">
          <GameButton variant="primary" onClick={handleSubmit} height="py-2">
            Submit 
          </GameButton>
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}
