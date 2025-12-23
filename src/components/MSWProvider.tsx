"use client";

import { useEffect, useState } from "react";

export const MSWProvider = ({ children }: { children: React.ReactNode }) => {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // localhost かつ ブラウザ環境のみ
      if (typeof window !== "undefined" && 
          (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        try {
          const { worker } = await import("@/src/mocks/browser");
          await worker.start({
            // 登録されていないリクエスト（Next.js内部通信など）は無視する
            onUnhandledRequest: "bypass", 
          });
          console.log("[MSW] Mocking enabled.");
        } catch (error) {
          console.error("[MSW] Failed to start:", error);
        }
      }
      setMswReady(true);
    };
    init();
  }, []);

  // 完全に準備ができるまで表示を待つ（真っ白になる場合はここをチェック）
  if (!mswReady) return null;

  return <>{children}</>;
};