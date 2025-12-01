"use client"

import React, { use } from "react"
import {useState, useEffect} from "react"
import { TextInput } from "./text-input"
import { api } from "@/lib/api"

export function CountTimer({roomCode}:  { roomCode: string }){
  const [timer, setTimer] = useState("")
    
  // Temporary: Mock timer value
  useEffect(() => {
    setTimer("00:30")
  }, [])

  return(
    <TextInput
          value={timer}
          onChange={() => {}}
          inputtitle=""
          placeholder=""
          height="py-10"
          variant="gray"
          mode="display"
          textSize="text-4lx"
        />
  );
};