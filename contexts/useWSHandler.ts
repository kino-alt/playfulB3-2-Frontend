import { useCallback } from 'react';
import { RoomState, GameState, Participant } from './types';

export const useWsHandler = (setState: React.Dispatch<React.SetStateAction<RoomState>>, myUserId: string | null) => {

    //ws message handler
    const handleWebSocketMessage = useCallback((eventData: any) => {
        const { type, payload } = eventData;
        //logging
        console.log("[WS RECEIVED]", type, payload); 

        switch (type) {
            //state update handler
            case 'STATE_UPDATE':
                const { nextState, data } = payload;
                setState(prev => {
                    let newState = { ...prev, roomState: nextState as GameState, globalError: null };

                    // discussing state data update
                    if (nextState === GameState.DISCUSSING && data) {
                        const assignments = data.assignments || []; 

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
                setState(prev => ({ 
                    ...prev, 
                    participantsList: payload.participants as Participant[],
                    globalError: null
                }));
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
    }, []);
    return handleWebSocketMessage;
};
