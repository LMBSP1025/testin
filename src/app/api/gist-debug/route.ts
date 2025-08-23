import { NextRequest, NextResponse } from "next/server";
import { getPostsFromGist } from "@/lib/gist-storage";

export async function GET(request: NextRequest) {
  try {
    const posts = await getPostsFromGist();
    
    const response = NextResponse.json({
      success: true,
      posts: posts,
      count: posts.length,
      timestamp: new Date().toISOString()
    });

    // 캐시 방지 헤더 추가
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Gist 디버그 API 오류:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}