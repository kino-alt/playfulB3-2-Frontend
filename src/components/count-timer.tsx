"use client"

import { TextInput } from "./text-input"

interface CountTimerProps {
  timervalue: string | null
  height?: string // 高さを指定するプロパティを追加
}

export function CountTimer({ timervalue, height = "py-8" }: CountTimerProps) {
    return (
    <>
      {/* Timer Display */}
      <TextInput
        value={timervalue || "05:00"}
        onChange={() => {}}
        inputtitle=""
        placeholder=""
        height={height} // 受け取ったheightをTextInputに渡す
        variant="gray"
        mode="display"
        textSize="text-4xl"
      />
    </>
  );
};