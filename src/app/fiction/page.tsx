import Link from "next/link";
import { getPostsByCategory } from "@/lib/api";

export default function Fiction() {
  const posts = getPostsByCategory("fiction");

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen py-12">
      {/* 상단 타이틀 */}
      <Link href="/" className="mb-6">
        <h1
          className="text-6xl font-light text-center select-none tracking-tighter"
          style={{ letterSpacing: "-0.07em" }}
        >
          (un)fazed.
        </h1>
      </Link>
      {/* 카테고리명 */}
      <h2 className="text-2xl font-normal underline underline-offset-4 decoration-black text-center mb-16">fiction</h2>
      {/* 포스트 카드 리스트 */}
      <div className="flex flex-col gap-8 w-full max-w-xl px-4">
        {posts.length === 0 && (
          <div className="text-center text-gray-500">포스트가 없습니다.</div>
        )}
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="block bg-white/60 rounded-md px-6 py-6 shadow-md hover:bg-white/80 transition"
          >
            <div className="text-lg font-normal mb-2 text-gray-800">{post.title}</div>
            <div className="text-sm text-gray-600">{post.author?.name}</div>
          </Link>
        ))}
      </div>
      {/* 하단 저작권 */}
      <div className="absolute bottom-8 left-0 w-full flex flex-col items-center text-white text-sm opacity-80 select-none">
        <span>2025 sungho left collab.&lt;(un)fazed.&gt;</span>
        <span>All rights reserved</span>
      </div>
    </main>
  );
} 