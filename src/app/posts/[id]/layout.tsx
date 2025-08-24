import { Inter } from "next/font/google";
import cn from "classnames";

const inter = Inter({ subsets: ["latin"] });

export default function PostDetailLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={cn(inter.className, "dark:text-slate-200", "post-bg2", "dream-bg")}>
      {children}
    </div>
  );
} 