"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";

export default function Redirect() {
  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const code = urlSearchParams.get("code");

    fetch("/api/tiktok-auth/callback", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin" />
    </div>
  );
}
