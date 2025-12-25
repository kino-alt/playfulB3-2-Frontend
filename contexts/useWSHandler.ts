import { useCallback } from 'react';
import { RoomState, GameState, Participant } from './types';

export const useWsHandler = (setState: React.Dispatch<React.SetStateAction<RoomState>>) => {

    //ws message handler
    const handleWebSocketMessage = useCallback((eventData: any) => {
        const { type, payload } = eventData;
        //logging
        console.log("[WS RECEIVED]", type, payload); 

        switch (type) {
            //state update handler
            case 'STATE_UPDATE':
                const { nextState, data: payloadData } = payload;
                
                setState(prev => {
                    let newState = { ...prev, roomState: nextState as GameState, globalError: null };

                    if (payloadData) {
                        if (payloadData.topic !== undefined) newState.topic = payloadData.topic;
                        // サーバー側が selected_emojis (snake_case) で送ってくるのでマッピング
                        if (payloadData.selected_emojis !== undefined) {
                            newState.selectedEmojis = payloadData.selected_emojis;
                        }
                    }

                    // discussing state data update
                    if (nextState === GameState.DISCUSSING && payloadData) {
                        const assignments = payloadData.assignments || []; 

                        //convert assignments array to map for easy lookup
                        const assignmentsMap: Record<string, string> = assignments.reduce((acc: Record<string, string>, assignment: any) => {
                            acc[assignment.user_id] = assignment.emoji;
                            return acc;
                        }, {});

                        // get assigned emoji for current user
                        const AssignedEmoji = assignmentsMap[prev.myUserId || ''] || null;
                        return { 
                            ...newState,
                            assignmentsMap,
                            AssignedEmoji: AssignedEmoji
                        };
                    }

                    return newState;
                });
                break;

            //participant list update handler
           case 'PARTICIPANT_UPDATE':
            // 🔴 ログを追加して構造を確認
            console.log("[WS RECEIVED] Data:", payload);

            setState(prev => {
                // MSWは payload.participants に配列を入れているので、そこを参照する
                const newParticipants = (payload.participants || []) as Participant[];
                
                console.log("[WS RECEIVED] Extracted Participants:", newParticipants);

                const me = newParticipants.find(p => p.user_id === prev.myUserId);
                
                return { 
                ...prev, 
                participantsList: newParticipants,
                isLeader: me ? (String(me.is_Leader) === "true" || me.is_Leader === true) : prev.isLeader,
                globalError: null
                };
            });
            break;

            //timer tick handler
            case 'TIMER_TICK':
                setState(prev => ({ 
                    ...prev, 
                    timer: payload.time, 
                    globalError: null
                }));
                break;

            //error handler
            case 'ERROR':
                const { message } = payload;
                console.error(`[WS Error] Code: ${payload.code}, Message: ${message}`);
                setState(prev => ({ 
                    ...prev, 
                    globalError: message
                }));
                break;

            default:
                console.warn(`[v0] Unknown WS message type: ${type}`);
        }
    }, [setState]);
    return handleWebSocketMessage;
};
