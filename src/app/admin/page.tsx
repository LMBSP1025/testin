"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/_components/container";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const { success } = await response.json();
        if (success) {
          // 세션에 인증 상태 저장
          sessionStorage.setItem("adminAuthenticated", "true");
          router.push("/admin/dashboard");
        } else {
          setError("비밀번호가 올바르지 않습니다.");
        }
      } else {
        setError("인증에 실패했습니다.");
      }
    } catch (err) {
      setError("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen py-12">
      {/* 윈도우 98 스타일 창 */}
      <div className="max-w-2xl mx-auto shadow-[2px_2px_0_0_#000000] bg-gray-300">
        {/* 창 제목 바 */}
        <div className="bg-blue-900 border-2 border-gray-300 text-white px-3 py-1 mb-8">
          <h2 className="text-xl font-bold">관리자 로그인</h2>
        </div>
        
        <div className="p-8">
          
          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-400 text-black placeholder-gray-500 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm bg-red-100 border border-red-300 px-4 py-2 shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white]">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-6 py-3 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>
          
          {/* 뒤로가기 링크 */}
          <div className="text-center mt-8">
            <a 
              href="/category-select" 
              className="inline-block px-6 py-2 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150"
            >
              ← 메인으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
