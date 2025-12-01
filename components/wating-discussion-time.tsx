"use client"

import { useState, useEffect, use } from "react"
import { EmojiBackgroundLayout } from "./emoji-background-layout"
import { PageHeader } from "./page-header"
import { TextInput } from "./text-input"
import { TextDisplay } from "./text-display"
import { CountTimer } from "./count-timer"
import { api } from "@/lib/api"
import { DisplaySelectedEmojis } from "./display-selected-emojis"

export function WaitingDiscussionTime({roomCode}:  { roomCode: string }) {
    const [theme, setTheme] =useState("")
    const [topic, setTopic] = useState("")
    const [isLoading, setIsLoading] = useState(true)

    {/*(要修正）temporary values*/}
    useEffect(() => {
        setTheme("Theme")
        setTopic("Topic")
        setIsLoading(false)
    }, [])
    const selectedEmojis: string[] = []
    const maxEmojis = 7

    return (
        <EmojiBackgroundLayout>
        <div className="w-full max-w-xs flex flex-col h-full">
            
            <PageHeader title="Discussion" subtitle={`Let's discuss emojis`} />

            {/*display theme*/}
            <TextDisplay
                value={isLoading ? "Loading..." : theme}
                inputtitle=""
                height="py-0.5"
                variant="primary"
                textSize="text-sm"
                marginBottom="mb-2"
            />

            {/*display topic*/}
            <TextInput
                value={isLoading ? "Loading..." : topic}
                onChange={setTopic}
                inputtitle=""
                placeholder=""
                height="py-2"
                variant="primary"
                mode="display"
                textSize="text-lg"
                marginBottom="mb-6"
            />

            {/* Discussion Timer */}
            <CountTimer roomCode={roomCode}/>

            {/* Display Selected Emojis */} 
            <DisplaySelectedEmojis
                selectedEmojis={selectedEmojis}
                handleRemoveEmoji={() => {}}
                maxEmojis={maxEmojis}
            />    
        </div>
        </EmojiBackgroundLayout>
    )
}
