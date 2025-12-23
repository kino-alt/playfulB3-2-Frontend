// src/mocks/browser.ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

// これがブラウザ用のMSW実行インスタンスになります
export const worker = setupWorker(...handlers)