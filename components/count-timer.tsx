"use client"

import React, { useState, useEffect } from "react"
import { TextInput } from "./text-input"

export function CountTimer({ roomCode }:  { roomCode: string }){
  const [timer, setTimer] = useState("")
    
  {/*(要修正）Temporary: Mock timer value*/}
  useEffect(() => {
    setTimer("00:30")
  }, [])

  return(
    <>
      {/* Timer Display */}
      <TextInput
        value={timer}
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