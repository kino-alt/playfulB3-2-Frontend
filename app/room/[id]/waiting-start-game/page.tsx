import WaitingStartGame from "@/src/components/waiting-start-game"

export default function WaitingStartGamePage({
  params,
}: {
  params: { id: string }
}) {
  // const { id } = params;
  return (
    <WaitingStartGame />
  )
}
