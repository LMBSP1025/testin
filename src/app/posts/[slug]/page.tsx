import { notFound } from "next/navigation";
import { getPostBySlug, getPostSlugs } from "@/lib/api";
import markdownToHtml from "@/lib/markdownToHtml";

export default async function Page({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const content = await markdownToHtml(post?.content || "");

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen py-12 px-4">
      {/* 상단 타이틀 */}
      <a href="/" className="mb-10 block">
        <h1
          className="text-6xl font-light text-center select-none tracking-tighter"
          style={{ letterSpacing: "-0.07em" }}
        >
          (un)fazed.
        </h1>
      </a>
      {/* 제목 */}
      <h2 className="text-2xl font-normal text-center mb-2 mt-2">{post?.title}</h2>
      {/* 저자 */}
      <div className="text-lg text-center mb-8 text-gray-700">{post?.author?.name}</div>
      {/* 본문 */}
      <article className="prose prose-lg max-w-xl w-full mx-auto text-center leading-relaxed bg-white/0 shadow-none mb-24" style={{wordBreak: 'keep-all'}}>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </article>
      {/* 하단 저작권 */}
      <div className="absolute bottom-8 left-0 w-full flex flex-col items-center text-white text-sm opacity-80 select-none">
        <span>2025 sungho left collab.&lt;(un)fazed.&gt;</span>
        <span>All rights reserved</span>
      </div>
    </main>
  );
}

export function generateStaticParams() {
  // .md 확장자 제거
  return getPostSlugs().map((slug) => ({ slug: slug.replace(/\.md$/, "") }));
}
