"use client";

import { useEffect, useState } from "react";

const shouldUseMsw = (process.env.NEXT_PUBLIC_USE_MSW ?? "true") !== "false";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    if (!shouldUseMsw) return;

    const initMsw = async () => {
      if (typeof window === "undefined") return;

      const { worker } = await import("../mocks/browser");
      await worker.start({
        serviceWorker: {
          url: "/mockServiceWorker.js",
          options: { scope: "/" }, // capture all routes
        },
        onUnhandledRequest: "warn",
        quiet: false,
      });
      setMswReady(true);
    };
    initMsw();
  }, []);

  if (!shouldUseMsw) return <>{children}</>;
  if (!mswReady) return <div className="flex h-screen items-center justify-center">Loading Mock API...</div>;
  return <>{children}</>;
}