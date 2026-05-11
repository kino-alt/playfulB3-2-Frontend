import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RoomProvider } from '@/contexts/room-context'
import { NetworkStatusIndicator } from '@/hooks/useNetworkMonitor'
import { WebSocketManager } from '@/components/websocket-manager'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Emoji Discussion Game',
  description: 'Guess the topic from emoji hints in this multiplayer game',
  generator: 'v0.app',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <RoomProvider>
          <NetworkStatusIndicator />
          <WebSocketManager />
          {children}
        </RoomProvider>
      </body>
    </html>
  )
}