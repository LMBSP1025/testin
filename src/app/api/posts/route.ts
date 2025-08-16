import { NextRequest, NextResponse } from "next/server";
import { getAllPosts, createPost } from "@/lib/api";
import { CreatePostData } from "@/interfaces/post";

export async function GET() {
  try {
    const posts = getAllPosts();
    return NextResponse.json({ posts });
  } catch (error) {
    return NextResponse.json(
      { error: "포스트를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { postData, password } = await request.json();

    if (!postData || !password) {
      return NextResponse.json(
        { success: false, error: "포스트 데이터와 비밀번호가 필요합니다." },
        { status: 400 }
      );
    }

    const post = createPost(postData as CreatePostData, password);
    
    if (!post) {
      return NextResponse.json(
        { success: false, error: "비밀번호가 올바르지 않거나 포스트 생성에 실패했습니다." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "포스트 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
