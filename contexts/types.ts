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
    roomId: string | null;      
    roomCode?: string | null;    
    myUserId: string | null ;      
    isLeader: boolean;         
    topic: string | null;       
    selectedEmojis: string[];
    participantsList: Participant[]
    roomState: GameState;
    AssignedEmoji: string | null;
    assignmentsMap: Record<string, string>;
    timer: string | null;
    globalError: string | null;
}

//room context type
export interface RoomContextType extends RoomState {
    createRoom: () => Promise<void>;
  joinRoom: (roomCode: string, userName: string) => Promise<void>;
  submitTopic: (topic: string, emoji: string[]) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  startGame: () => Promise<void>;

}
