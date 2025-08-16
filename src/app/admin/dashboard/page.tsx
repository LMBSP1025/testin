"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/_components/container";
import { Post } from "@/interfaces/post";

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 인증 상태 확인
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (!isAuthenticated) {
      router.push("/admin");
      return;
    }

    // 포스트 목록 가져오기
    fetchPosts();
  }, [router]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("/api/posts");
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts);
      }
    } catch (error) {
      console.error("포스트를 가져오는데 실패했습니다:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuthenticated");
    router.push("/admin");
  };

  const handleCreatePost = () => {
    router.push("/admin/create");
  };

  const handleEditPost = (slug: string) => {
    router.push(`/admin/edit/${slug}`);
  };

  const handleDeletePost = async (slug: string) => {
    if (!confirm("정말로 이 포스트를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
        headers: {
          'Authorization': 'Bearer admin-token'
        }
      });

      if (response.ok) {
        // 포스트 목록 새로고침
        fetchPosts();
        alert("포스트가 삭제되었습니다.");
      } else {
        const errorData = await response.json();
        alert(`삭제에 실패했습니다: ${errorData.error || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error("삭제 오류:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (isLoading) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen py-12">
        <div className="max-w-4xl mx-auto shadow-[2px_2px_0_0_#000000] bg-gray-300">
          <div className="bg-blue-900 border-2 border-gray-300 text-white px-3 py-1 mb-8">
            <h2 className="text-xl font-bold">로딩 중...</h2>
          </div>
          <div className="p-8 text-center">
            <div className="text-black text-lg">로딩 중...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen py-12">
      {/* 윈도우 98 스타일 창 */}
      <div className="max-w-5xl mx-auto shadow-[2px_2px_0_0_#000000] bg-gray-300">
        {/* 창 제목 바 */}
        <div className="bg-blue-900 border-2 border-gray-300 text-white px-3 py-1 mb-8">
          <h2 className="text-xl font-bold">관리자 대시보드</h2>
        </div>
        
        <div className="p-8">
          {/* 상단 타이틀과 버튼들 */}
          {/* 포스트 목록 */}
          <div className="bg-gray-200 p-6 shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white]">
            <h2 className="text-2xl font-light mb-6 text-black">포스트 목록</h2>
            
            {posts.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                포스트가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.slug}
                    className="flex gap-10 items-center justify-between bg-white p-4 shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white]"
                  >
                    <div className="">
                      <h3 className="text-lg font-medium text-black">{post.title}</h3>
                      <div className="text-sm text-gray-600">
                        카테고리: {post.category} | 작성일: {post.date}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPost(post.slug)}
                        className="px-4 py-2 bg-gray-200 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.slug)}
                        className="px-4 py-2 bg-gray-200 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 뒤로가기 링크 */}
            <hr className="w-full my-4 border-gray-400 border-1" />
          <div className="flex gap-4">
              <button 
                onClick={handleCreatePost} 
                className="px-4 py-2 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150"
              >
                새 글 작성
              </button>
              <button 
                onClick={handleLogout} 
                className="px-4 py-2 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150"
              >
                로그아웃
              </button>
            <a 
              href="/category-select" 
              className="inline-block px-4 py-2 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150"
            >
              ← 메인으로 돌아가기
            </a>
            </div>
        </div>
      </div>
    </main>
  );
}
