import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug, updatePost, deletePost } from "@/lib/api";
import { UpdatePostData } from "@/interfaces/post";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    console.log('GET /api/posts/[slug] called with slug:', slug);
    
    const post = await getPostBySlug(slug);
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

export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { postData, password } = await request.json();
    const { slug } = params;
    console.log('PUT /api/posts/[slug] called with slug:', slug);
    console.log('postData:', postData ? 'provided' : 'missing');
    console.log('password:', password ? 'provided' : 'missing');
    
    if (!postData || !password) {
      return NextResponse.json(
        { error: "포스트 데이터와 비밀번호가 필요합니다." },
        { status: 400 }
      );
    }
    
    const post = await updatePost(slug, postData as UpdatePostData, password);
    console.log('updatePost result:', post ? 'success' : 'failed');
    
    if (!post) {
      return NextResponse.json(
        { error: "비밀번호가 올바르지 않거나 포스트 수정에 실패했습니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ success: true, post });
  } catch (error) {
    console.error('PUT /api/posts/[slug] error:', error);
    return NextResponse.json(
      { error: "포스트 수정에 실패했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;
    const { password } = await request.json();
    
    if (!password) {
      return NextResponse.json(
        { error: "비밀번호가 필요합니다." },
        { status: 400 }
      );
    }
    
    const success = await deletePost(slug, password);
    
    if (!success) {
      return NextResponse.json(
        { error: "비밀번호가 올바르지 않거나 포스트 삭제에 실패했습니다." },
        { status: 401 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/posts/[slug] error:', error);
    return NextResponse.json(
      { error: "포스트 삭제에 실패했습니다." },
      { status: 500 }
    );
  }
}