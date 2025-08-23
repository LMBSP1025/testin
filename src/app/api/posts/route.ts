import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost } from "@/lib/api";
import { CreatePostData } from "@/interfaces/post";
import { clearAllPostsFromGist } from "@/lib/gist-storage";

export async function GET(request: NextRequest) {
  try {
    const posts = await getAllPosts();
    return NextResponse.json(posts);
  } catch (error) {
    console.error("포스트 목록 가져오기 실패:", error);
    return NextResponse.json(
      { error: "포스트 목록을 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postData, password } = await request.json();

    if (!postData || !password) {
      return NextResponse.json(
        { error: "포스트 데이터와 비밀번호가 필요합니다." },
        { status: 400 }
      );
    }

    const post = await createPost(postData as CreatePostData, password);
    
    if (!post) {
      return NextResponse.json(
        { error: "비밀번호가 올바르지 않거나 포스트 생성에 실패했습니다." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error("포스트 생성 실패:", error);
    return NextResponse.json(
      { error: "포스트 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "비밀번호가 필요합니다." },
        { status: 400 }
      );
    }

    // 비밀번호 검증 (간단한 방식)
    if (password !== "admin123") {
      return NextResponse.json(
        { error: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    const success = await clearAllPostsFromGist();
    
    if (success) {
      return NextResponse.json({ success: true, message: "모든 포스트가 삭제되었습니다." });
    } else {
      return NextResponse.json(
        { error: "포스트 삭제에 실패했습니다." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("포스트 삭제 실패:", error);
    return NextResponse.json(
      { error: "포스트 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}