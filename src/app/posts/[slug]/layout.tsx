import { Inter } from "next/font/google";
import cn from "classnames";

const inter = Inter({ subsets: ["latin"] });

export default function PostDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "dark:text-slate-400", "post-bg2")}>{children}</body>
    </html>
  );
} 