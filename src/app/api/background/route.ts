import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BACKGROUND_CONFIG_FILE = path.join(process.cwd(), "background-config.json");

// Default background image
const DEFAULT_BACKGROUND = "/Msft_Nostalgia_Landscape-1536x864.jpg";

// Get current background
export async function GET() {
  try {
    if (fs.existsSync(BACKGROUND_CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(BACKGROUND_CONFIG_FILE, "utf8"));
      return NextResponse.json({ background: config.background || DEFAULT_BACKGROUND });
    }
    return NextResponse.json({ background: DEFAULT_BACKGROUND });
  } catch (error) {
    console.error("Background config read error:", error);
    return NextResponse.json({ background: DEFAULT_BACKGROUND });
  }
}

// Update background image
export async function POST(request: NextRequest) {
  try {
    const { background, password } = await request.json();
    
    if (!background || !password) {
      return NextResponse.json(
        { error: "배경 이미지와 비밀번호가 필요합니다." },
        { status: 400 }
      );
    }

    // Simple password check (you can use the same admin password system)
    if (password !== "admin123") {
      return NextResponse.json(
        { error: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // Validate background path (must start with / and be a valid image)
    if (!background.startsWith("/") || !background.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return NextResponse.json(
        { error: "올바른 이미지 경로가 아닙니다." },
        { status: 400 }
      );
    }

    // Check if file exists in public directory
    const publicPath = path.join(process.cwd(), "public", background.substring(1));
    if (!fs.existsSync(publicPath)) {
      return NextResponse.json(
        { error: "이미지 파일을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Save configuration
    const config = { background, updatedAt: new Date().toISOString() };
    fs.writeFileSync(BACKGROUND_CONFIG_FILE, JSON.stringify(config, null, 2));

    return NextResponse.json({ success: true, background });
  } catch (error) {
    console.error("Background update error:", error);
    return NextResponse.json(
      { error: "배경 이미지 업데이트에 실패했습니다." },
      { status: 500 }
    );
  }
}