import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/api';

export async function GET() {
  try {
    // 모든 포스트를 가져와서 날짜순으로 정렬
    const posts = getAllPosts();
    
    if (posts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: '포스트가 없습니다.' 
      });
    }

    // 날짜순으로 정렬 (최신순)
    const sortedPosts = posts.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    // 가장 최근 포스트
    const latestPost = sortedPosts[0];
    
    // 마크다운 내용에서 첫 번째 이미지 찾기
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/;
    const match = latestPost.content.match(imageRegex);
    
    if (match) {
      const [, alt, imageUrl] = match;
      return NextResponse.json({
        success: true,
        image: {
          url: imageUrl,
          alt: alt || '이미지',
          postTitle: latestPost.title,
          postDate: latestPost.date
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '최근 포스트에 이미지가 없습니다.'
      });
    }
  } catch (error) {
    console.error('최근 이미지 가져오기 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
