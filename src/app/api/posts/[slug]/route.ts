import { NextRequest, NextResponse } from "next/server";
import { deletePost, updatePost, getPostBySlug } from "@/lib/api";
import { UpdatePostData } from "@/interfaces/post";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    console.log('GET /api/posts/[slug] called with slug:', slug);
    
    const post = getPostBySlug(slug);
    console.log('getPostBySlug result:', post ? 'found' : 'not found');
    
    if (!post) {
      console.error('Post not found for slug:', slug);
      return NextResponse.json(
        { error: "포스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('GET /api/posts/[slug] error:', error);
    return NextResponse.json(
      { error: "포스트를 가져오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { postData, password } = await request.json();
    const { slug } = params;
    
    console.log('PUT /api/posts/[slug] called with slug:', slug);
    console.log('postData:', postData ? 'provided' : 'missing');
    console.log('password:', password ? 'provided' : 'missing');

    if (!postData || !password) {
      return NextResponse.json(
        { success: false, error: "포스트 데이터와 비밀번호가 필요합니다." },
        { status: 400 }
      );
    }

    const post = updatePost(slug, postData as UpdatePostData, password);
    console.log('updatePost result:', post ? 'success' : 'failed');

    if (post) {
      return NextResponse.json({ success: true, post });
    } else {
      return NextResponse.json(
        { success: false, error: "비밀번호가 올바르지 않거나 포스트를 찾을 수 없습니다." },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('PUT /api/posts/[slug] error:', error);
    return NextResponse.json(
      { success: false, error: "포스트 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    // 관리자 인증 헤더 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: "인증이 필요합니다." },
        { status: 401 }
      );
    }
    
    const token = authHeader.substring(7); // "Bearer " 제거
    
    // 간단한 토큰 검증 (실제로는 JWT 등을 사용해야 함)
    if (token !== 'admin-token') {
      return NextResponse.json(
        { success: false, error: "인증이 유효하지 않습니다." },
        { status: 401 }
      );
    }

    const success = deletePost(slug, 'admin123'); // 기본 비밀번호 사용

    if (success) {
      return NextResponse.json({ success: true, message: "포스트가 삭제되었습니다." });
    } else {
      return NextResponse.json(
        { success: false, error: "포스트를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "포스트 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}
