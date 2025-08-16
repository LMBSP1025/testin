import Link from "next/link";
import { getPostsByCategory } from "@/lib/api";

export default function Banner() {
  const posts = getPostsByCategory("record");

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen py-12">
      {/* 윈도우 98 스타일 창 */}
      <div className="max-w-4xl mx-auto shadow-[2px_2px_0_0_#000000] bg-gray-300">
        {/* 창 제목 바 */}
        <div className="bg-blue-900 border-2 border-gray-300 text-white px-3 py-1 mb-8">
          <h2 className="text-xl font-bold">배너</h2>
        </div>
        
        <div className="p-6">
          
          {/* 포스트 카드 리스트 */}
          <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto">
            {posts.length === 0 && (
              <div className="text-center text-gray-600 bg-gray-200 px-4 py-3 shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white]">
                포스트가 없습니다.
              </div>
            )}
            {posts.map((post) => (
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
          
          {/* 뒤로가기 버튼 */}
          <div className="text-center mt-8">
            <Link 
              href="/category-select"
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