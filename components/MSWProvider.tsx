"use client";

import { useEffect, useState } from "react";

export const MSWProvider = ({ children }: { children: React.ReactNode }) => {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    async function init() {
      // 開発環境かつブラウザ環境のみ実行
      if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
        try {
          const { worker } = await import("@/mocks/browser");
          await worker.start({
            onUnhandledRequest: "bypass",
          });
        } catch (error) {
          console.error("MSWの起動に失敗しました:", error);
        }
      }
      setMswReady(true);
    }
    init();
  }, []);

  // 準備ができるまでは何も出さない（一瞬チラつくのを防ぐ）
  // もし真っ黒のままなら、ここを return <>{children}</>; に変えてみてください
  if (!mswReady) return null; 

  return <>{children}</>;
};