interface ParticipantListProps {
  participants: string[]
}

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <div className="mb-6 flex-1 overflow-y-auto">
      <label className="block text-sm font-semibold text-gray-700 mb-2">Players ({participants.length})</label>
      <div className="space-y-2 bg-gray-50 p-3 rounded-xl border-2 border-gray-200">
        {participants.map((participant, index) => (
          <div
            key={index}
            className="px-3 py-2 bg-white border-2 border-gray-300 rounded-lg text-sm font-semibold text-gray-700"
          >
            {participant}
          </div>
        ))}
      </div>
    </div>
  )
}
