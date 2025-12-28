"use client";

import { useEffect, useState } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    const initMsw = async () => {
      // ブラウザ環境のみ実行
      if (typeof window !== "undefined") {
        const { worker } = await import("../mocks/browser");
        await worker.start({
          quiet: true, // MSWのログを無効化してノイズを削減
          onUnhandledRequest: "bypass",
        });
        setMswReady(true);
      }
    };
    initMsw();
  }, []);

  // 🔴 重要：MSWの準備ができるまでは「Loading...」等を表示し、アプリ（Children）を出さない
  if (!mswReady) {
    return <div className="flex h-screen items-center justify-center">Loading Mock API...</div>;
  }

  return <>{children}</>;
}