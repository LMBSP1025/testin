"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/_components/container";
import { Post } from "@/interfaces/post";

export default function AdminDashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changePwMessage, setChangePwMessage] = useState<string | null>(null);
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
        setPosts(data); // data.posts가 아닌 data 직접 사용
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

    const password = prompt("관리자 비밀번호를 입력하세요:");
    if (!password) {
      return;
    }

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePwMessage(null);
    try {
      const resp = await fetch("/api/auth/change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setChangePwMessage("비밀번호가 변경되었습니다.");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setChangePwMessage(data.error || "변경에 실패했습니다.");
      }
    } catch (_e) {
      setChangePwMessage("오류가 발생했습니다.");
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
        
        <div className="p-4">
          {/* 상단 타이틀과 버튼들 */}
          {/* 포스트 목록 */}
          <div className="bg-gray-200 ">
            
            {posts.length === 0 ? (
              <div className="text-center text-gray-600 py-8">
                포스트가 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <div
                    key={post.slug}
                    className="flex gap-8 items-center justify-between bg-white p-4 shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white]"
                  >
                    <div className="">
                      <h3 className="text-sm font-medium text-black">{post.title}</h3>
                      <div className="text-sm text-gray-600">
                        카테고리: {post.category} <br></br>
                        작성일: {post.date}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-col">
                      <button
                        onClick={() => handleEditPost(post.slug)}
                        className="px-2 py-1 bg-gray-200 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150 text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.slug)}
                        className="px-2 py-1 bg-gray-200 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150 text-sm"
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
          {/* 비밀번호 변경 섹션 */}
          <hr className="w-full my-4 border-gray-400 border-1" />
          <div className="bg-white p-4 mb-4 shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white]">
            <h3 className="text-sm font-bold text-black mb-2">비밀번호 변경</h3>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-2">
              <input
                type="password"
                placeholder="현재 비밀번호"
                className="px-2 py-1 border border-gray-400 text-sm"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <input
                type="password"
                placeholder="새 비밀번호 (6자 이상)"
                className="px-2 py-1 border border-gray-400 text-sm"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="px-2 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150 text-sm"
                >
                  변경하기
                </button>
                {changePwMessage && (
                  <span className="text-sm text-black">{changePwMessage}</span>
                )}
              </div>
            </form>
          </div>
          
          {/* 뒤로가기/기타 버튼 */}
            <hr className="w-full my-4 border-gray-400 border-1" />
          <div className="flex gap-2">
              <button 
                onClick={handleCreatePost} 
                className="px-2 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150 text-sm"
              >
                새 글 작성
              </button>
              <a 
                href="/admin/background"
                className="inline-block px-2 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150 text-sm"
              >
                배경 관리
              </a>
              <button 
                onClick={handleLogout} 
                className="px-2 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150 text-sm"
              >
                로그아웃
              </button>
            <a 
              href="/" 
              className="inline-block px-2 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150 text-sm"
            >
              ← 메인으로 돌아가기
            </a>
            </div>
          
          {/* 메인 배너 설정 섹션 */}
          <hr className="w-full my-4 border-gray-400 border-1" />
          <MainBannerSection />
          
          {/* 글로벌 플레이리스트 설정 섹션 */}
          <hr className="w-full my-4 border-gray-400 border-1" />
          <GlobalPlaylistSection />
        </div>
      </div>
    </main>
  );
}

function MainBannerSection() {
  const [bannerPosts, setBannerPosts] = useState<Post[]>([]);
  const [selectedBannerSlug, setSelectedBannerSlug] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [currentBannerSlug, setCurrentBannerSlug] = useState<string | null>(null);

  useEffect(() => {
    // 배너 카테고리 게시글 가져오기
    fetch("/api/posts")
      .then(r => r.json())
      .then(posts => {
        const bannerPosts = posts.filter((post: Post) => post.category === "banner");
        setBannerPosts(bannerPosts);
      })
      .catch(console.error);

    // 현재 메인 배너 설정 가져오기
    fetch("/api/main-banner")
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setCurrentBannerSlug(data.selectedBannerSlug);
          setSelectedBannerSlug(data.selectedBannerSlug);
        }
      })
      .catch(console.error);
  }, []);

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!password) {
      setMessage("관리자 비밀번호를 입력해주세요.");
      return;
    }

    try {
      const resp = await fetch("/api/main-banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          bannerSlug: selectedBannerSlug, 
          password 
        }),
      });
      
      const data = await resp.json();
      if (resp.ok && data.success) {
        setMessage("메인 배너가 설정되었습니다.");
        setCurrentBannerSlug(selectedBannerSlug);
        setPassword("");
      } else {
        setMessage(data.error || "설정 실패");
      }
    } catch (error) {
      console.error("메인 배너 설정 오류:", error);
      setMessage("오류가 발생했습니다.");
    }
  };

  const currentBannerPost = bannerPosts.find(post => post.slug === currentBannerSlug);

  return (
    <div className="bg-white p-4 mb-4 shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white]">
      <h3 className="text-sm font-bold text-black mb-2">메인 배너 설정</h3>
      
      {currentBannerPost ? (
        <div className="text-sm text-black mb-2">
          현재 메인 배너: <strong>{currentBannerPost.title}</strong>
        </div>
      ) : (
        <div className="text-sm text-black mb-2">현재 설정된 메인 배너가 없습니다.</div>
      )}

      <form onSubmit={handleSaveBanner} className="flex flex-col gap-2">
        <select
          value={selectedBannerSlug || ""}
          onChange={(e) => setSelectedBannerSlug(e.target.value || null)}
          className="px-2 py-1 border border-gray-400 text-sm"
        >
          <option value="">배너 선택 안함</option>
          {bannerPosts.map((post) => (
            <option key={post.slug} value={post.slug}>
              {post.title}
            </option>
          ))}
        </select>
        
        <input
          type="password"
          placeholder="관리자 비밀번호"
          className="px-2 py-1 border border-gray-400 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        
        <div className="flex items-center gap-2">
          <button 
            type="submit" 
            className="px-2 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150 text-sm"
          >
            설정
          </button>
          {message && <span className="text-sm text-black">{message}</span>}
        </div>
      </form>
      
      {bannerPosts.length === 0 && (
        <div className="text-sm text-gray-600 mt-2">
          배너 카테고리의 게시글이 없습니다. 먼저 배너 카테고리로 게시글을 작성해주세요.
        </div>
      )}
    </div>
  );
}

function GlobalPlaylistSection() {
  const [playlistId, setPlaylistId] = useState("");
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [current, setCurrent] = useState<{ id: string; title?: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/playlist/global", { cache: "no-store" })
      .then(r => r.json())
      .then(d => setCurrent(d?.playlist || null))
      .catch(() => {});
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!playlistUrl) {
      setMessage("플레이리스트 링크를 입력해주세요.");
      return;
    }
    
    // YouTube 플레이리스트 링크에서 ID 추출
    const urlMatch = playlistUrl.match(/[?&]list=([^&]+)/);
    if (!urlMatch) {
      setMessage("올바른 YouTube 플레이리스트 링크를 입력해주세요.");
      return;
    }
    
    const extractedId = urlMatch[1];
    
    try {
      const resp = await fetch("/api/playlist/global", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlistId: extractedId, playlistTitle, password }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setMessage("글로벌 플레이리스트가 저장되었습니다.");
        setCurrent({ id: extractedId, title: playlistTitle });
        setPlaylistUrl("");
        setPlaylistTitle("");
        setPassword("");
      } else {
        setMessage(data.error || "저장 실패");
      }
    } catch (_e) {
      setMessage("오류가 발생했습니다.");
    }
  };

  const clear = async () => {
    setMessage(null);
    try {
      const resp = await fetch("/api/playlist/global", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        setMessage("글로벌 플레이리스트가 해제되었습니다.");
        setCurrent(null);
        setPassword("");
      } else {
        setMessage(data.error || "해제 실패");
      }
    } catch (_e) {
      setMessage("오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white p-4 mb-4 shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white]">
      <h3 className="text-sm font-bold text-black mb-2">글로벌 플레이리스트</h3>
      {current ? (
        <div className="text-sm text-black mb-2">
          현재 적용: <a className="underline" href={`https://www.youtube.com/playlist?list=${current.id}`} target="_blank" rel="noopener noreferrer">{current.title || current.id}</a>
        </div>
      ) : (
        <div className="text-sm text-black mb-2">현재 설정된 글로벌 플레이리스트가 없습니다.</div>
      )}
      <form onSubmit={save} className="flex flex-col gap-2">
        <input
          type="text"
          placeholder="YouTube 플레이리스트 링크 (예: https://www.youtube.com/playlist?list=PL...)"
          className="px-2 py-1 border border-gray-400 text-sm"
          value={playlistUrl}
          onChange={(e) => setPlaylistUrl(e.target.value)}
        />
        <input
          type="text"
          placeholder="플레이리스트 제목(선택)"
          className="px-2 py-1 border border-gray-400 text-sm"
          value={playlistTitle}
          onChange={(e) => setPlaylistTitle(e.target.value)}
        />
        <input
          type="password"
          placeholder="관리자 비밀번호"
          className="px-2 py-1 border border-gray-400 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <button type="submit" className="px-2 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150 text-sm">저장</button>
          <button type="button" onClick={clear} className="px-2 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150 text-sm">해제</button>
          {message && <span className="text-sm text-black">{message}</span>}
        </div>
      </form>
    </div>
  );
}