"use client"

import { TextInput } from "./text-input"

interface CountTimerProps {
  timervalue: string | null
}

export function CountTimer({ timervalue }: CountTimerProps) {
    return(
    <>
      {/* Timer Display */}
      <TextInput
        value={timervalue || "05:00"}
        onChange={() => {}}
        inputtitle=""
        placeholder=""
        height="py-10"
        variant="gray"
        mode="display"
        textSize="text-4xl"
      />
    </>
  );
};