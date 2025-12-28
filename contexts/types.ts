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
    theme: string | null;   //FIX: Add
    hint: string | null;    //FIX: Add
    answer: string | null;
    selectedEmojis: string[];
    originalEmojis: string[];    // ホストが選んだ元の絵文字（ダミー注入前）
    displayedEmojis: string[];   // プレイヤーに見せる絵文字（ダミー注入後）
    dummyIndex: number | null;   // ダミーが注入された位置
    dummyEmoji: string | null;   // 注入されたダミー絵文字
    participantsList: Participant[]
    roomState: GameState;
    AssignedEmoji: string | null;
    assignmentsMap: Record<string, string>;
    timer: string | null;
    globalError: string | null;
}

//room context type
export interface RoomContextType extends RoomState {
  isHost: boolean;
  maxEmojis: number;
  createRoom: () => Promise<void>;
  joinRoom: (roomCode: string, userName: string) => Promise<string | undefined>;
  submitTopic: (topic: string, emoji: string[]) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  startGame: () => Promise<void>;
  finishRoom: () => Promise<void>;
  skipDiscussion: () => Promise<void>; // 議論をスキップ
  resetRoom: () => void; // タイトル画面に戻る時に状態をクリア
}
