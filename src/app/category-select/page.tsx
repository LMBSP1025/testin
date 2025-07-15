import Link from "next/link";

export default function CategorySelect() {
  return (
    <main className="relative flex flex-col items-center justify-center tracking-tighter min-h-screen py-12 text-">
      {/* 상단 타이틀 */}
      <Link href="/">
        <h1
          className="text-6xl font-light text-center mb-24 select-none"
          style={{ letterSpacing: '-0.07em' }}
        >
          (un)fazed.
        </h1>
      </Link>{/* 카테고리 리스트 */}
      <div className="flex flex-col items-center gap-10 w-full">
        <Link href="/fiction" className="text-2xl font-normal underline underline-offset-4 decoration-black hover:opacity-70 transition">fiction</Link>
        <Link href="/art" className="text-2xl font-normal underline underline-offset-4 decoration-black hover:opacity-70 transition">art</Link>
        <Link href="/video" className="text-2xl font-normal underline underline-offset-4 decoration-black hover:opacity-70 transition">video</Link>
        <Link href="/record" className="text-2xl font-normal underline underline-offset-4 decoration-black hover:opacity-70 transition">(record)</Link>
      </div>
      {/* 하단 저작권 */}
      <div className="absolute bottom-8 left-0 w-full flex flex-col items-center text-white text-sm opacity-80 select-none">
        <span>2025 sungho left collab.&lt;(un)fazed.&gt;</span>
        <span>All rights reserved</span>
      </div>
    </main>
  );
} 