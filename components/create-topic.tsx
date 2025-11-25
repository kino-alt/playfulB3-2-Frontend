"use client"

import { useState, useEffect } from "react"
import { GameButton } from "./game-button"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextInput } from "./text-input"
import { TextDisplay} from "./text-display"
import { api } from "@/lib/api"


export function CreateTopic({roomCode}:  { roomCode: string }) {
  const [theme, setTheme] =useState("")
  const [topic, setTopic] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [emojiInput, setEmojiInput] = useState("")
  const [hint, setHint] = useState("")
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([])
  
  //create theme
  useEffect(() => {
      const CreateTheme = async () => {
        try {
          console.log("[v0] Creating the theme...")
          const data = await api.createTheme(roomCode.toUpperCase())
          console.log("[v0] Theme created response:", data)
  
          if (data.success) {
            setTheme(data.theme)
            console.log("[v0] Room code set:", data.theme)
          } else {
            console.error("Failed to create room:", data.error)
          }
        } catch (error) {
          console.error("Error creating room:", error)
        } finally {
          setIsLoading(false)
        }
      }
      CreateTheme()
    }, [])
    
  const handleAddEmoji = () => {
    if (emojiInput.trim() && selectedEmojis.length < 7) {
      setSelectedEmojis([...selectedEmojis, emojiInput.trim()])
      setEmojiInput("")
    }
  }

  const handleRemoveEmoji = (index: number) => {
    setSelectedEmojis(selectedEmojis.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!topic.trim() || selectedEmojis.length === 0) {
      alert("トピックと絵文字を入力してください")
      return
    }

    console.log("[v0] Submitting topic:", {
      roomCode,
      topic,
      emojis: selectedEmojis,
      hint,
    })
    // バックエンドへの送信処理を追加予定
  }

  return (
    <EmojiBackgroundLayout>
      <div className="w-full max-w-xs flex flex-col h-full">
        <PageHeader title="Set the Topic" subtitle={`Set the topic and choose the emojis`} />

        <TextDisplay
          value={topic}
          inputtitle=""
          height="py-1"
          variant="primary"
          textSize="text-base"
        />

        <TextInput
          value={topic}
          onChange={setTopic}
          inputtitle="Topic"
          placeholder="Enter the Topic"
          height="py-2"
          variant="primary"
          mode="edit"
          textSize="text-lg"
        />

        <div className="flex items-end justify-center gap-3 mb-6 ">
          <div className="w-23 h-23"> 
            <TextInput
              value={emojiInput}
              onChange={setEmojiInput}
              inputtitle="Select"
              placeholder=""
              maxLength={1}
              height="py-8"
              variant="gray"
              mode="edit"
              textSize="text-10lx"
            />
          </div>
          <div className="flex-shrink-0">
            <GameButton variant="secondary" onClick={handleAddEmoji} height="py-1">
              <p className="text-xs font-bold uppercase"> ADD</p>
            </GameButton>
          </div>
        </div>

        <TextDisplay
          value={hint}
          inputtitle="refer to hints"
          height="py-1"
          variant="gray"
          textSize="text-xs"
        />

        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-white/70 text-sm mb-2">Selected Emojis ({selectedEmojis.length}/7)</p>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, index) => (
              <button
                key={index}
                onClick={() => selectedEmojis[index] && handleRemoveEmoji(index)}
                className="aspect-square bg-white/20 rounded-lg flex items-center justify-center text-2xl hover:bg-white/30 transition-colors"
              >
                {selectedEmojis[index] || ""}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <GameButton variant="primary" onClick={handleSubmit}>
            Submit
          </GameButton>
        </div>
      </div>
    </EmojiBackgroundLayout>
  )
}
