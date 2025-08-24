import { notFound } from "next/navigation";
import { getPostById, getAllPosts } from "@/lib/api";
import markdownToHtml from "@/lib/markdownToHtml";

export default async function Page({ params, searchParams }: { params: { id: string }, searchParams?: any }) {
  const { id } = params;
  const post = await getPostById(id);

  if (!post) {
    notFound();
  }

  const content = await markdownToHtml(post.content || "");

  return (
    <main className="bg-white p-8 pb-16">
      {/* 상단 타이틀 */}
      <div className="text-center mb-8">
        <a href="/" className="inline-block">
          <h1 className="text-6xl font-light text-black tracking-tighter">
            夢
          </h1>
        </a>
      </div>
      
      {/* 뒤로가기 버튼 */}
      <div className="text-center mb-4">
        <a 
          href="javascript:history.back()" 
          className=""
        >
          ← 뒤로가기
        </a>
      </div>
      
      {/* 제목 */}
      <h2 className="text-3xl font-normal text-center mb-8 text-black">
        {post.title}
      </h2>
      
      {/* 본문 */}
      <article className="max-w-4xl mx-auto">
        <div 
          dangerouslySetInnerHTML={{ __html: content }} 
          className="markdown-content"
          style={{
            wordBreak: 'keep-all',
            color: 'black !important',
            fontSize: '1.125rem',
            lineHeight: '1.75'
          }}
        />
      </article>
    </main>
  );
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ id: post.id }));
}