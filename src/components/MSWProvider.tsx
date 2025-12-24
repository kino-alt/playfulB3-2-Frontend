// src/components/MSWProvider.tsx
"use client";

import { useEffect, useState } from "react";

export const MSWProvider = ({ children }: { children: React.ReactNode }) => {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      // 開発環境かつブラウザの場合のみ起動
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        try {
          const { worker } = await import("@/src/mocks/browser");
          // startを待機
          await worker.start({
            onUnhandledRequest: "bypass",
          });
          console.log("[MSW] Mocking enabled.");
          // ネットワーク層の切り替えに少しだけ猶予を与える
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error("[MSW] Failed to start:", error);
        }
      }
      setMswReady(true);
    };
    init();
  }, []);

  // 🔴 ここで待機するのが非常に重要
  if (!mswReady) return (
    <div className="flex h-screen items-center justify-center">
      <p className="animate-pulse">Loading Mock API...</p>
    </div>
  );

  return <>{children}</>;
};