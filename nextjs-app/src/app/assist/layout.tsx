"use client";

import { Toaster } from "@/components/ui/sonner";

export default function AssistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative" style={{ 
      backgroundColor: "rgb(18, 43, 84)",
      backgroundImage: `radial-gradient(rgba(220, 220, 220, 0.2) 1px, transparent 1px)`,
      backgroundSize: "20px 20px"
    }}>
      {children}
      <Toaster />
    </div>
  );
}
