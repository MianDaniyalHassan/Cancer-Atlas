"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Status = "checking" | "online" | "offline";

export default function HealthDot() {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;

    async function check() {
      try {
        const res = await fetch(`${API}/health`, { cache: "no-store" });
        if (active) setStatus(res.ok ? "online" : "offline");
      } catch {
        if (active) setStatus("offline");
      }
    }

    check();
    const id = setInterval(check, 10000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const label =
    status === "online" ? "Online" : status === "offline" ? "Offline" : "Checking…";

  return (
    <div className={`health ${status}`}>
      <span className="health-dot" />
      {label}
    </div>
  );
}
