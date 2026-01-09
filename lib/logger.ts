/**
 * ロギングユーティリティ
 * 本番環境でのデバッグを容易にするための統一ログシステム
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  tag: string
  message: string
  data?: any
  error?: Error
}

class Logger {
  private static logs: LogEntry[] = []
  private static maxLogs = 100
  private static minLevel = LogLevel.DEBUG

  /**
   * ログレベルを設定（本番環境では INFO 以上のみ）
   */
  static setLevel(level: LogLevel) {
    this.minLevel = level
  }

  /**
   * デバッグログ（開発環境のみ）
   */
  static debug(tag: string, message: string, data?: any) {
    if (this.minLevel > LogLevel.DEBUG) return
    this.log(LogLevel.DEBUG, tag, message, data)
  }

  /**
   * 情報ログ
   */
  static info(tag: string, message: string, data?: any) {
    if (this.minLevel > LogLevel.INFO) return
    this.log(LogLevel.INFO, tag, message, data)
  }

  /**
   * 警告ログ
   */
  static warn(tag: string, message: string, data?: any) {
    if (this.minLevel > LogLevel.WARN) return
    this.log(LogLevel.WARN, tag, message, data)
  }

  /**
   * エラーログ
   */
  static error(tag: string, message: string, error?: Error | any) {
    this.log(LogLevel.ERROR, tag, message, undefined, error)
  }

  /**
   * 内部ログ記録
   */
  private static log(
    level: LogLevel,
    tag: string,
    message: string,
    data?: any,
    error?: Error | any
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      tag,
      message,
      data,
      error: error instanceof Error ? error : undefined,
    }

    this.logs.push(entry)

    // ログの上限を超えたら古いものから削除
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // コンソール出力
    const prefix = `[${entry.timestamp}] [${LogLevel[level]}] [${tag}]`

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(prefix, message, data)
        break
      case LogLevel.INFO:
        console.info(prefix, message, data)
        break
      case LogLevel.WARN:
        console.warn(prefix, message, data)
        break
      case LogLevel.ERROR:
        console.error(prefix, message, error || data)
        break
    }
  }

  /**
   * ログを取得（最大100件）
   */
  static getLogs(level?: LogLevel): LogEntry[] {
    if (level === undefined) return this.logs
    return this.logs.filter(log => log.level >= level)
  }

  /**
   * ログをエクスポート（本番環境のバグ調査用）
   */
  static export(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * ログをクリア
   */
  static clear() {
    this.logs = []
  }
}

export default Logger
