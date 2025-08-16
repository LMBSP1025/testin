import { NextRequest, NextResponse } from "next/server";
import { verifyPassword } from "@/lib/api";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: "비밀번호가 필요합니다." },
        { status: 400 }
      );
    }

    const isValid = verifyPassword(password);

    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
