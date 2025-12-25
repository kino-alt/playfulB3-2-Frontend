import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// 🔴 handlers 配列を強制的に互換性のある型として展開します
export const worker = setupWorker(...(handlers as any))

worker.start({
  onUnhandledRequest: 'bypass',
})