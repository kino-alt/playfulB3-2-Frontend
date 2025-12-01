"use client"

import { useState, useEffect } from "react"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextInput } from "./text-input"
import { TextDisplay } from "./text-display" 
import { api } from "@/lib/api"
import { DisplaySelectedEmojis } from "./display-selected-emojis"
import { GameButton } from "./game-button"

export function ReviewAnswer({roomCode}:  { roomCode: string }) {
    const [theme, setTheme] =useState("")
    const [topic, setTopic] = useState("")
    const [answer, setAnswer] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    {/*(要修正) temporary values*/}
    useEffect(() => {
        setTheme("Theme")
        setTopic("Topic")
        setAnswer("Sample Answer")
        setIsLoading(false)
    }, [])

    {/*(要修正）temporary submit handler*/}
    const handleSubmit = async () => {
        console.log("[v0] Exitting for room:", roomCode)
        window.location.href = "/"
    }

    return (
        <EmojiBackgroundLayout>
        <div className="w-full max-w-xs flex flex-col h-full">
            
            <PageHeader title="Review Answer" subtitle={`Grade Submissions`} />

            {/*display theme*/}
            <TextDisplay
                value={isLoading ? "Loading..." : theme}
                inputtitle=""
                height="py-0.5"
                variant="primary"
                textSize="text-sm"
                marginBottom="mb-4"
            />

            {/*display topic*/}
            <TextInput
                value={isLoading ? "Loading..." : topic}
                onChange={setTopic}
                inputtitle=""
                placeholder=""
                height="py-4"
                variant="primary"
                mode="display"
                textSize="text-lg"
            />

            {/*display answer*/}
            <TextInput
                value={isLoading ? "Loading..." : answer}
                onChange={setAnswer}
                inputtitle=""
                placeholder=""
                height="py-4"
                variant="secondary"
                mode="display"
                textSize="text-lg"
                marginBottom="mb-4"
            />
            
            {/*display selected emojis*/}
            <DisplaySelectedEmojis
                selectedEmojis={[]}
                handleRemoveEmoji={() => {}}
                maxEmojis={7}
            /> 

            {/*submit button*/}
            <div className="mt-auto">
            <GameButton variant="primary" onClick={handleSubmit}>
                Exit 
            </GameButton>
            </div>  
            
        </div>
        </EmojiBackgroundLayout>
    )
}
