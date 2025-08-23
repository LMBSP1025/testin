import { NextRequest, NextResponse } from "next/server";
import { changeAdminPassword } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "현재 비밀번호와 새 비밀번호가 필요합니다." },
        { status: 400 }
      );
    }

    const result = await changeAdminPassword(currentPassword, newPassword);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "비밀번호 변경에 실패했습니다." },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
