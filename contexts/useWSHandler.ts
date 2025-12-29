import { useCallback } from 'react';
import { RoomState, GameState, Participant } from './types';

export const useWsHandler = (setState: React.Dispatch<React.SetStateAction<RoomState>>) => {

    //ws message handler
    const handleWebSocketMessage = useCallback((eventData: any) => {
        const { type, payload } = eventData;
        // Central dispatcher for WS messages from backend
        console.log("[WS RECEIVED]", type, payload); 

        switch (type) {
            //state update handler
            case 'STATE_UPDATE':
                const { nextState, data: payloadData } = payload;
                console.log("[STATE_UPDATE] nextState:", nextState, "payloadData:", payloadData);
                
                setState(prev => {
                    let newState = { ...prev, roomState: nextState as GameState, globalError: null };

                    if (payloadData) {
                        // 🔴 全フィールドをマッピング（undefined の場合は前の値を保持）
                        if (payloadData.topic !== undefined) newState.topic = payloadData.topic;
                        if (payloadData.answer !== undefined) newState.answer = payloadData.answer;
                        if (payloadData.theme !== undefined) newState.theme = payloadData.theme;
                        if (payloadData.hint !== undefined) newState.hint = payloadData.hint;
                        
                        // 🔴 ダミー絵文字関連データを受信
                        if (payloadData.originalEmojis !== undefined) {
                            newState.originalEmojis = payloadData.originalEmojis;
                        }
                        if (payloadData.dummyIndex !== undefined) {
                            newState.dummyIndex = payloadData.dummyIndex;
                        }
                        if (payloadData.dummyEmoji !== undefined) {
                            newState.dummyEmoji = payloadData.dummyEmoji;
                        }
                        
                        // サーバー側が selected_emojis (snake_case) で送ってくるのでマッピング
                        // 🔴 ホストかどうかで表示する絵文字を切り替え
                        const isHost = prev.participantsList.some(
                            p => p.user_id === prev.myUserId && p.role === 'host'
                        ) || (prev.myUserId === "aa");
                        
                        if (payloadData.displayedEmojis !== undefined) {
                            // サーバーから displayedEmojis が直接送られる場合
                            newState.displayedEmojis = payloadData.displayedEmojis;
                            console.log("[STATE_UPDATE] Received displayedEmojis:", payloadData.displayedEmojis);
                        }
                        
                        if (payloadData.selected_emojis !== undefined) {
                            // プレイヤーにはダミーが混じった配列を表示
                            // displayedEmojis が既に設定されている場合はそちらを優先
                            if (!newState.displayedEmojis || newState.displayedEmojis.length === 0) {
                                newState.displayedEmojis = payloadData.selected_emojis;
                            }
                            // selectedEmojisは互換性のため残す（プレイヤー用）
                            newState.selectedEmojis = payloadData.selected_emojis;
                        }
                        
                        // 🔴 ホストの場合は元の絵文字も selectedEmojis に設定
                        if (isHost && payloadData.originalEmojis !== undefined) {
                            newState.selectedEmojis = payloadData.originalEmojis;
                            console.log("[STATE_UPDATE] Host view: showing original emojis");
                        }
                        
                        console.log("[STATE_UPDATE] After mapping - topic:", newState.topic, "selectedEmojis:", newState.selectedEmojis, "displayedEmojis:", newState.displayedEmojis);
                    }
                    
                    // 🔴 payloadData がない、または topic/selectedEmojis が null/空の場合は前の値を保持
                    if (!payloadData || (payloadData.topic === null && prev.topic)) {
                        newState.topic = prev.topic;
                        console.log("[STATE_UPDATE] Preserving previous topic:", prev.topic);
                    }
                    if (!payloadData || (payloadData.selected_emojis?.length === 0 && prev.selectedEmojis.length > 0)) {
                        newState.selectedEmojis = prev.selectedEmojis;
                        console.log("[STATE_UPDATE] Preserving previous selectedEmojis:", prev.selectedEmojis);
                    }
                    // 🔴 displayedEmojis も保持
                    if (!payloadData || (payloadData.displayedEmojis?.length === 0 && prev.displayedEmojis.length > 0)) {
                        newState.displayedEmojis = prev.displayedEmojis;
                        console.log("[STATE_UPDATE] Preserving previous displayedEmojis:", prev.displayedEmojis);
                    }
                    // 🔴 originalEmojis も保持
                    if (!payloadData || (payloadData.originalEmojis?.length === 0 && prev.originalEmojis.length > 0)) {
                        newState.originalEmojis = prev.originalEmojis;
                        console.log("[STATE_UPDATE] Preserving previous originalEmojis:", prev.originalEmojis);
                    }
                    // 🔴 dummyIndex も保持
                    if ((!payloadData || payloadData.dummyIndex === undefined || payloadData.dummyIndex === null) && prev.dummyIndex !== null) {
                        newState.dummyIndex = prev.dummyIndex;
                        console.log("[STATE_UPDATE] Preserving previous dummyIndex:", prev.dummyIndex);
                    }
                    // 🔴 dummyEmoji も保持
                    if ((!payloadData || !payloadData.dummyEmoji) && prev.dummyEmoji) {
                        newState.dummyEmoji = prev.dummyEmoji;
                        console.log("[STATE_UPDATE] Preserving previous dummyEmoji:", prev.dummyEmoji);
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
            case 'PARTICIPANTS_UPDATE':
            // Participant list delta/full update
            // ログノイズ削減 - 全てのPARTICIPANT_UPDATEログをコメントアウト
            // console.log("[WS RECEIVED] PARTICIPANT_UPDATE", payload);
            
            setState(prev => {
                // MSWは payload.participants に配列を入れているので、そこを参照する
                const newParticipants = (payload.participants || []) as Participant[];
                
                // 変更がない場合は更新をスキップ（パフォーマンス最適化）
                const hasChanged = 
                    newParticipants.length !== prev.participantsList.length ||
                    newParticipants.some((p, i) => 
                        !prev.participantsList[i] || 
                        p.user_id !== prev.participantsList[i].user_id ||
                        p.is_Leader !== prev.participantsList[i].is_Leader
                    );
                
                if (!hasChanged) {
                    return prev; // 変更なしの場合は状態更新をスキップ
                }
                
                // 参加者数が変わった場合のみログを出す
                if (newParticipants.length !== prev.participantsList.length) {
                    console.log("[WS RECEIVED] Participants changed:", newParticipants.length, "people");
                }

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
