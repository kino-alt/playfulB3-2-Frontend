"use client";

import { useEffect, useState } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    const initMsw = async () => {
      if (typeof window === "undefined") return;

      const { worker } = await import("../mocks/browser");
      await worker.start({
        serviceWorker: {
          url: "/mockServiceWorker.js",
          options: { scope: "/" }, // ルート配下のリクエストを確実に捕捉
        },
        onUnhandledRequest: "warn", // 未ハンドルは警告
        quiet: false,
      });
      setMswReady(true);
    };
    initMsw();
  }, []);

  if (!mswReady) {
    return <div className="flex h-screen items-center justify-center">Loading Mock API...</div>;
  }

  return <>{children}</>;
}