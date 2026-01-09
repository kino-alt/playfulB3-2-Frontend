import { useCallback } from 'react';
import { RoomState, GameState, Participant } from './types';

export const useWsHandler = (setState: React.Dispatch<React.SetStateAction<RoomState>>) => {

    //ws message handler
    const handleWebSocketMessage = useCallback((eventData: any) => {
        const { type, payload } = eventData; 

        switch (type) {
            //state update handler
            case 'STATE_UPDATE':
                const { nextState, data: payloadData } = payload;
                console.log('[STATE_UPDATE] Received:', { 
                    nextState, 
                    hasData: !!payloadData,
                    assignments: payloadData?.assignments?.length || 0
                });
                
                setState(prev => {
                    let newState = { ...prev, roomState: nextState as GameState, globalError: null };
                    
                    // ANSWERING状態への遷移をログ
                    if (nextState === GameState.ANSWERING) {
                        console.log('[STATE_UPDATE] Transitioning to ANSWERING state:', {
                            myUserId: prev.myUserId,
                            isLeader: prev.isLeader,
                            participantsList: prev.participantsList.map(p => ({
                                user_id: p.user_id,
                                user_name: p.user_name,
                                is_Leader: p.is_Leader
                            }))
                        });
                    }

                    // 仕様書のルールに従い、ステータスごとに必要なデータのみを処理
                    // データが undefined の場合は前の値を保持
                    if (payloadData) {
                        // すべてのステータスで共通のデータ処理
                        if (payloadData.topic !== undefined) newState.topic = payloadData.topic;
                        if (payloadData.answer !== undefined) newState.answer = payloadData.answer;
                        if (payloadData.theme !== undefined) newState.theme = payloadData.theme;
                        if (payloadData.hint !== undefined) newState.hint = payloadData.hint;
                        
                        // ダミー絵文字関連データを受信（displayedEmojis/originalEmojis/dummyIndex/dummyEmoji）
                        if (payloadData.displayedEmojis !== undefined) {
                            newState.displayedEmojis = payloadData.displayedEmojis;
                        }
                        if (payloadData.originalEmojis !== undefined) {
                            newState.originalEmojis = payloadData.originalEmojis;
                        }
                        if (payloadData.dummyIndex !== undefined) {
                            newState.dummyIndex = payloadData.dummyIndex;
                        }
                        if (payloadData.dummyEmoji !== undefined) {
                            newState.dummyEmoji = payloadData.dummyEmoji;
                        }
                        
                        // ホストかどうかで表示する絵文字を切り替え
                        const isHost = prev.participantsList.some(
                            p => p.user_id === prev.myUserId && p.role === 'host'
                        ) || (prev.myUserId === "aa");
                        
                        // ホストの場合は元の絵文字を selectedEmojis に設定
                        if (isHost && payloadData.originalEmojis !== undefined) {
                            newState.selectedEmojis = payloadData.originalEmojis;
                        }
                        // プレイヤーの場合は表示用絵文字を selectedEmojis に設定
                        else if (!isHost && payloadData.displayedEmojis !== undefined) {
                            newState.selectedEmojis = payloadData.displayedEmojis;
                        }
                    }
                    
                    // discussing state data update (assignments processing)
                    if (nextState === GameState.DISCUSSING && payloadData) {
                        const assignments = payloadData.assignments || []; 
                        console.log('[STATE_UPDATE] 🎯 DISCUSSING phase - assignments from payload:', assignments.length, 'myUserId:', prev.myUserId);

                        if (assignments.length > 0) {
                            //convert assignments array to map for easy lookup
                            const assignmentsMap: Record<string, string> = assignments.reduce((acc: Record<string, string>, assignment: any) => {
                                acc[assignment.user_id] = assignment.emoji;
                                return acc;
                            }, {});

                            // get assigned emoji for current user
                            const AssignedEmoji = assignmentsMap[prev.myUserId || ''] || prev.AssignedEmoji || null;
                            console.log('[STATE_UPDATE] 🎯 AssignedEmoji update:', {
                                myUserId: prev.myUserId,
                                fromPayload: assignmentsMap[prev.myUserId || ''],
                                fromPrevious: prev.AssignedEmoji,
                                final: AssignedEmoji,
                                allAssignments: assignmentsMap,
                                assignmentKeys: Object.keys(assignmentsMap)
                            });
                            
                            newState.assignmentsMap = assignmentsMap;
                            newState.AssignedEmoji = AssignedEmoji;
                        } else {
                            console.log('[STATE_UPDATE] ⚠️ No assignments in payload, keeping previous values:', {
                                previousAssignedEmoji: prev.AssignedEmoji,
                                previousAssignmentsMap: Object.keys(prev.assignmentsMap || {})
                            });
                        }
                    }

                    return newState;
                });
                break;

            //participant list update handler
            case 'PARTICIPANT_UPDATE':
            case 'PARTICIPANTS_UPDATE':
            
            setState(prev => {
                // MSWは payload.participants に配列を入れているので、そこを参照する
                const rawParticipants = (payload.participants || []) as any[];

                console.log('[PARTICIPANT_UPDATE] Received:', {
                    count: rawParticipants.length,
                    currentMyUserId: prev.myUserId,
                    currentUserName: prev.userName,
                    receivedParticipants: rawParticipants.map(p => ({
                        user_id: p.user_id,
                        user_name: p.user_name,
                        role: p.role,
                        is_Leader: p.is_Leader || p.is_leader
                    }))
                });

                // 空配列が来た場合は上書きせず保持（リロード直後などで人数0になるのを防ぐ）
                if (!rawParticipants.length) {
                    console.log('[PARTICIPANT_UPDATE] Empty payload - keeping previous participants');
                    return prev;
                }

                // 以前の参加者情報を user_id で引けるようにしておく（role/is_Leaderを補完するため）
                const prevById: Record<string, Participant> = prev.participantsList.reduce((acc, cur) => {
                    acc[cur.user_id] = cur;
                    return acc;
                }, {} as Record<string, Participant>);

                // is_Leader / is_leader 両対応に正規化しつつ、roleが無ければ前回の値を引き継ぐ
                const newParticipants: Participant[] = rawParticipants.map(p => {
                    const prevP = prevById[p.user_id];
                    const normalizedRole = p.role ?? prevP?.role ?? 'player';
                    return {
                        ...p,
                        role: normalizedRole,
                        // is_Leader はサーバーからの値（または前回値）をそのまま使用。host と leader は別概念。
                        is_Leader: p.is_Leader
                            ?? p.is_leader
                            ?? prevP?.is_Leader
                            ?? false,
                    };
                });

                // 変更がない場合は更新をスキップ（パフォーマンス最適化）
                const hasChanged = 
                    newParticipants.length !== prev.participantsList.length ||
                    newParticipants.some((p, i) => 
                        !prev.participantsList[i] || 
                        p.user_id !== prev.participantsList[i].user_id ||
                        p.is_Leader !== prev.participantsList[i].is_Leader ||
                        p.role !== prev.participantsList[i].role
                    );
                
                if (!hasChanged) {
                    return prev; // 変更なしの場合は状態更新をスキップ
                }
                
                // 参加者数が変わった場合のみログを出す
                if (newParticipants.length !== prev.participantsList.length) {
                    console.log("[WS RECEIVED] Participants changed:", newParticipants.length, "people");
                }
                
                // is_Leaderフラグの変更をログ
                const leaderChanges = newParticipants.filter((p, i) => {
                    const oldP = prev.participantsList[i];
                    return oldP && p.user_id === oldP.user_id && p.is_Leader !== oldP.is_Leader;
                });
                if (leaderChanges.length > 0) {
                    console.log("[PARTICIPANT_UPDATE] Leader flags changed:", leaderChanges.map(p => ({
                        user_id: p.user_id,
                        user_name: p.user_name,
                        is_Leader: p.is_Leader
                    })));
                }

                // myUserIdは絶対に変更しない（localStorageから復元した値を維持）
                // MSWのCLIENT_CONNECTEDハンドラーがサーバー側の参加者リストを同期する
                const me = newParticipants.find(p => p.user_id === prev.myUserId);
                
                if (!me) {
                    console.warn('[PARTICIPANT_UPDATE] ⚠️ myUserId not found in participants:', {
                        myUserId: prev.myUserId,
                        userName: prev.userName,
                        participantIds: newParticipants.map(p => p.user_id),
                        participantNames: newParticipants.map(p => p.user_name)
                    });
                    console.log('[PARTICIPANT_UPDATE] This is expected right after reload - CLIENT_CONNECTED will sync');
                } else {
                    console.log('[PARTICIPANT_UPDATE] ✓ Found myself:', {
                        myUserId: prev.myUserId,
                        myName: me.user_name,
                        myRole: me.role,
                        myIsLeader: me.is_Leader
                    });
                }
                
                // isLeaderの更新: WebSocketから取得できたら使用、できなければ既存の値を保持
                const updatedIsLeader = me 
                    ? (String(me.is_Leader) === "true" || me.is_Leader === true)
                    : prev.isLeader; // WebSocketデータが無い場合は既存値を保持（localStorage復元値など）
                
                if (me && updatedIsLeader !== prev.isLeader) {
                    console.log('[PARTICIPANT_UPDATE] isLeader changed:', {
                        previous: prev.isLeader,
                        fromWS: me.is_Leader,
                        updated: updatedIsLeader
                    });
                }
                
                console.log('[PARTICIPANT_UPDATE] Final state:', {
                    myUserId: prev.myUserId,
                    isLeader: updatedIsLeader,
                    AssignedEmoji: prev.AssignedEmoji,
                    participantsCount: newParticipants.length
                });
                
                return { 
                ...prev, 
                participantsList: newParticipants,
                // myUserIdは絶対に変更しない
                isLeader: updatedIsLeader,
                globalError: null
                };
            });
            break;

            //timer tick handler
            case 'TIMER_TICK':
                setState(prev => ({ 
                    ...prev, 
                    // Backend spec sends "time" (MM:SS); fallback to remaining seconds if provided
                    timer: payload.time ?? payload.remaining ?? prev.timer, 
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
