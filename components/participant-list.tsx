// participant-list.tsx (修正後)
import { Participant } from '@/contexts/types'; // types.tsからParticipantをインポートすることを想定

interface ParticipantListProps {
  participants: Participant[] 
}

export function ParticipantList({ participants }: ParticipantListProps) {
  
  const players = participants.filter(p => p.role !== 'host');
  
  const leader = players.find(p => p.is_Leader);
  const otherPlayers = players.filter(p => !p.is_Leader);
  const sortedParticipants = leader ? [leader, ...otherPlayers] : otherPlayers;

  return (
    <div className="mb-6 flex-1 overflow-y-auto">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Players ({players.length})</label>
      <div className="space-y-2 bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
        {sortedParticipants.map((p) => (
          <div
            key={p.user_id} 
            className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700 flex justify-between items-center"
          >
            <span>
                {p.user_name}
            </span>
            <div className="flex space-x-2">
                {p.is_Leader && (
                    <span className="ml-2 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        LEADER
                    </span>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}