import { NextRequest, NextResponse } from "next/server";
import { getGlobalPlaylist, setGlobalPlaylist, clearGlobalPlaylist } from "@/lib/api";

export async function GET() {
  try {
    const config = await getGlobalPlaylist();
    return NextResponse.json({ playlist: config });
  } catch (error) {
    console.error("GET /api/playlist/global error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { playlistId, playlistTitle, password } = await request.json();
    if (!password) {
      return NextResponse.json({ success: false, error: "비밀번호가 필요합니다." }, { status: 400 });
    }
    const result = await setGlobalPlaylist(playlistId, playlistTitle ?? null, password);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("POST /api/playlist/global error:", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (!password) {
      return NextResponse.json({ success: false, error: "비밀번호가 필요합니다." }, { status: 400 });
    }
    const result = await clearGlobalPlaylist(password);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error("DELETE /api/playlist/global error:", error);
    return NextResponse.json({ success: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
