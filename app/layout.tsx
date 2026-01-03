import type { Metadata, Viewport } from 'next'
import './globals.css'
import { MSWProvider } from '@/src/components/MSWProvider'
import { RoomProvider } from '@/contexts/room-context';

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
        <MSWProvider>
          <RoomProvider>
            {children}
          </RoomProvider>
        </MSWProvider>
      </body>
    </html>
  )
}