"use client";

import { useEffect, useState } from "react";

// src/components/MSWProvider.tsx
export const MSWProvider = ({ children }: { children: React.ReactNode }) => {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        try {
          const { worker } = await import("@/src/mocks/browser");
          // start() を確実に待機
          await worker.start({
            onUnhandledRequest: "bypass",
            // サービスワーカーの登録を待つオプション（MSW v2）
            serviceWorker: {
              url: '/mockServiceWorker.js',
            }
          });
          console.log("[MSW] Mocking enabled.");
          
          // 🔴 ネットワーク層がMSWに切り替わるまで数ミリ秒待つとより安定します
          await new Promise((resolve) => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error("[MSW] Failed to start:", error);
        }
      }
      setMswReady(true);
    };
    init();
  }, []);

  if (!mswReady) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-gray-500 animate-pulse">準備中...</p>
      </div>
    );
  }

  return <>{children}</>;
};