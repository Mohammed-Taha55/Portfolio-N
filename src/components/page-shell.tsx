"use client";

import type { TabId } from "@/components/dock";
import Footer from "@/components/footer";
import { cn } from "@/lib/utils";

export default function PageShell({
  active: _active,
  children,
  className,
}: {
  active: TabId;
  children: React.ReactNode;
  className?: string;
}) {
  void _active;
  return (
    <div className="flex min-h-screen flex-col bg-[#fafcfd]">
      <main className="flex flex-1 flex-col items-center gap-12 p-4 sm:px-8">
        <div className={cn("flex w-full max-w-[1200px] flex-col", className)}>
          {children}
        </div>
      </main>
      <div className="relative z-50 flex justify-center px-4 sm:px-8">
        <Footer className="w-full max-w-[1200px] pb-6" />
      </div>
    </div>
  );
}
