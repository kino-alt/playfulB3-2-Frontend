/**
 * エラーハンドリングユーティリティ
 * エラーの分類と統一的なハンドリング
 */

export enum ErrorCode {
  // ネットワークエラー
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',

  // 認証/認可エラー
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // バリデーションエラー
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  INVALID_STATE = 'INVALID_STATE',

  // リソースエラー
  NOT_FOUND = 'NOT_FOUND',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',

  // サーバーエラー
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // その他
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * カスタムエラークラス
 */
export class AppError extends Error {
  code: ErrorCode
  statusCode: number
  originalError?: Error

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    originalError?: Error
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.originalError = originalError

    // プロトタイプチェーンの復元（TypeScript）
    Object.setPrototypeOf(this, AppError.prototype)
  }

  /**
   * ユーザーフレンドリーなメッセージを取得
   */
  getUserMessage(): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.NETWORK_ERROR]: 'Network connection error. Please check your internet connection.',
      [ErrorCode.CONNECTION_TIMEOUT]: 'Connection timed out. Please try again.',
      [ErrorCode.CONNECTION_REFUSED]: 'Connection refused. The server may be down.',
      [ErrorCode.UNAUTHORIZED]: 'You are not authenticated. Please log in again.',
      [ErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
      [ErrorCode.PERMISSION_DENIED]: 'Permission denied. Only the host can perform this action.',
      [ErrorCode.VALIDATION_ERROR]: 'Invalid input. Please check your input and try again.',
      [ErrorCode.INVALID_INPUT]: 'Invalid input format.',
      [ErrorCode.INVALID_STATE]: 'Invalid game state. Please refresh the page.',
      [ErrorCode.NOT_FOUND]: 'Resource not found.',
      [ErrorCode.ROOM_NOT_FOUND]: 'Room not found. It may have been deleted.',
      [ErrorCode.USER_NOT_FOUND]: 'User not found.',
      [ErrorCode.INTERNAL_SERVER_ERROR]:
        'Server error occurred. Please try again later.',
      [ErrorCode.SERVICE_UNAVAILABLE]:
        'Service is temporarily unavailable. Please try again later.',
      [ErrorCode.UNKNOWN_ERROR]: 'An unknown error occurred. Please try again.',
    }

    return messages[this.code] || 'An error occurred.'
  }

  /**
   * エラーが再試行可能か判定
   */
  isRetryable(): boolean {
    const retryableCodes = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.CONNECTION_TIMEOUT,
      ErrorCode.SERVICE_UNAVAILABLE,
    ]
    return retryableCodes.includes(this.code)
  }

  /**
   * エラーが深刻か判定
   */
  isCritical(): boolean {
    const criticalCodes = [
      ErrorCode.INTERNAL_SERVER_ERROR,
      ErrorCode.INVALID_STATE,
    ]
    return criticalCodes.includes(this.code)
  }
}

/**
 * エラー分類関数
 */
export function classifyError(error: any): AppError {
  // AppError の場合はそのまま返す
  if (error instanceof AppError) {
    return error
  }

  // ネットワークエラー
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppError(
      ErrorCode.NETWORK_ERROR,
      'Failed to communicate with server',
      0,
      error
    )
  }

  // AbortError（タイムアウト）
  if (error.name === 'AbortError') {
    return new AppError(
      ErrorCode.CONNECTION_TIMEOUT,
      'Request timed out',
      408,
      error
    )
  }

  // HTTP エラー
  if (error.statusCode) {
    if (error.statusCode === 401) {
      return new AppError(
        ErrorCode.UNAUTHORIZED,
        'Unauthorized',
        401,
        error
      )
    }
    if (error.statusCode === 403) {
      return new AppError(
        ErrorCode.FORBIDDEN,
        'Forbidden',
        403,
        error
      )
    }
    if (error.statusCode === 404) {
      return new AppError(
        ErrorCode.NOT_FOUND,
        'Resource not found',
        404,
        error
      )
    }
    if (error.statusCode >= 500) {
      return new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Server error',
        error.statusCode,
        error
      )
    }
  }

  // デフォルト
  return new AppError(
    ErrorCode.UNKNOWN_ERROR,
    error?.message || 'Unknown error occurred',
    500,
    error instanceof Error ? error : undefined
  )
}

/**
 * エラー処理フック用のカスタムフック
 */
export function useErrorHandler() {
  const handleError = (error: any, context?: string): AppError => {
    const appError = classifyError(error)

    // ログに記録
    console.error(`[${context || 'Error'}]`, {
      code: appError.code,
      message: appError.message,
      statusCode: appError.statusCode,
      originalError: appError.originalError,
    })

    return appError
  }

  return { handleError }
}
