// participant-list.tsx (修正後)
import { Participant } from '@/contexts/types'; // types.tsからParticipantをインポートすることを想定

interface ParticipantListProps {
  participants: Participant[] 
}

export function ParticipantList({ participants }: ParticipantListProps) {
  console.log("ParticipantList Received:", participants);
  // ホストを除外する
  const players = participants.filter(p => p.role !== 'host');

  // リーダー（回答者）を探す
  const leader = players.find(p => String(p.is_Leader) === "true" || p.is_Leader === true);
  const otherPlayers = players.filter(p => p.user_id !== leader?.user_id);

  // 表示用リストの作成
  const sortedParticipants = leader ? [leader, ...otherPlayers] : players;

  // 🔴 もし players.length が 0 なら、ここに原因があります
  if (players.length === 0) {
    return (
      <div className="mb-6 flex-1 text-gray-400 text-sm italic">
        Waiting for players to join... (Total raw: {participants.length})
      </div>
    );
  }

  return (
    <div className="mb-6 flex-1 overflow-y-auto">
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Players ({players.length})
      </label>
      <div className="space-y-2 bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
        {sortedParticipants.map((p) => (
          <div
            key={p.user_id}
            className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 flex justify-between items-center"
          >
            <span>{p.user_name}</span>
            <div className="flex space-x-2">
              {String(p.is_Leader) === "true" && (
                <span className="ml-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  LEADER
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}