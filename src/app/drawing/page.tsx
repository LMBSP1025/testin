import Link from "next/link";
import { getPostsByCategory } from "@/lib/api";

// 동적 렌더링 강제
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Drawing({ searchParams }: { searchParams?: { page?: string } }) {
  const posts = await getPostsByCategory("drawing");
  const currentPage = parseInt(searchParams?.page || '1');
  const postsPerPage = 10;
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const startIndex = (currentPage - 1) * postsPerPage;
  const endIndex = startIndex + postsPerPage;
  const currentPosts = posts.slice(startIndex, endIndex);

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen py-12 px-5">
      {/* 윈도우 98 스타일 창 */}
      <div className="max-w-xl w-full mx-auto shadow-[2px_2px_0_0_#000000] bg-gray-300">
        {/* 창 제목 바 */}
        <div className="bg-blue-900 border-2 border-gray-300 text-white px-3 py-1 mb-8">
          <h2 className="text-xl font-bold">그림</h2>
        </div>
        
        <div className="p-6">
          
          {/* 포스트 카드 리스트 */}
          <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
            {currentPosts.length === 0 && (
              <div className="text-center text-gray-600 bg-gray-200 px-4 py-3 shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white]">
                포스트가 없습니다.
              </div>
            )}
            {currentPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="block bg-gray-200 px-4 py-3 shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white] hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] transition-all duration-150"
              >
                <div className="text-lg font-medium mb-1 text-black">{post.title}</div>
                <div className="text-sm text-gray-600">{post.excerpt}</div>
              </Link>
            ))}
          </div>
          
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              {currentPage > 1 && (
                <Link
                  href={`/drawing?page=${currentPage - 1}`}
                  className="px-3 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium text-sm"
                >
                  이전
                </Link>
              )}
              
              <span className="px-3 py-1 text-sm text-gray-600">
                {currentPage} / {totalPages}
              </span>
              
              {currentPage < totalPages && (
                <Link
                  href={`/drawing?page=${currentPage + 1}`}
                  className="px-3 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium text-sm"
                >
                  다음
                </Link>
              )}
            </div>
          )}
          
          {/* 뒤로가기 버튼 */}
          <div className="text-center mt-8">
            <Link 
              href="/"
              className="inline-block px-6 py-2 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium"
            >
              뒤로가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
} 