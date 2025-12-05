//game states
export enum GameState {
    WAITING = 'waiting',
    SETTING_TOPIC = 'setting_topic',
    DISCUSSING = 'discussing',
    ANSWERING = 'answering',
    CHECKING = 'checking',
    FINISHED = 'finished',
}

//participant interface(ws)
export interface Participant {
    user_id: string;
    user_name: string;
    role: 'host' | 'player';
    is_Leader: boolean;
}

//room state interface(ws)
export interface RoomState {
    roomCode?: string;
    myUserId: string | null; 
    participantsList: Participant[]
    roomState: GameState;
    AssignedEmoji: string | null;
    assignmentsMap: Record<string, string>;
    timer: string | null;
    globalError: string | null;
}

//room context type
export interface RoomContextType extends RoomState {
    // --- アクションメソッドの宣言 ---
 
}