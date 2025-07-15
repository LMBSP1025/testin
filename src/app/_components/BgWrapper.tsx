"use client";
import { usePathname } from "next/navigation";
import cn from "classnames";

export default function BgWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPostDetail = pathname.startsWith("/posts/");
  return (
    <div className={cn(!isPostDetail && "bg-mobile", "min-h-screen")}>{children}</div>
  );
} 