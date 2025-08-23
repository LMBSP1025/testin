import { CMS_NAME, HOME_OG_IMAGE_URL } from "@/lib/constants";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import cn from "classnames";
import { readFileSync } from "fs";
import { join } from "path";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: ``,
  description: ``,
  openGraph: {
    images: [HOME_OG_IMAGE_URL],
  },
};

// Function to get current background from server
function getCurrentBackground(): string {
  try {
    const configPath = join(process.cwd(), "background-config.json");
    const configContent = readFileSync(configPath, "utf-8");
    const config = JSON.parse(configContent);
    return config.background || "/Msft_Nostalgia_Landscape-1536x864.jpg";
  } catch (error) {
    return "/Msft_Nostalgia_Landscape-1536x864.jpg";
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentBackground = getCurrentBackground();
  
  return (
    <html lang="en">
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --dynamic-background: url("${currentBackground}");
              }
            `,
          }}
        />
      </head>
      <body className={cn(inter.className, "bg-mobile", "dream-bg", "dark:text-slate-200")}>
        <div className="min-h-screen">
          {children}
        </div>
        
      </body>
    </html>
  );
}