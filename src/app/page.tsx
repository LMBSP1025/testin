import Container from "@/app/_components/container";
import { Intro } from "@/app/_components/intro";
import { getAllPosts } from "@/lib/api";

export default function Index() {
  const allPosts = getAllPosts();

  const heroPost = allPosts[0];

  const morePosts = allPosts.slice(1);

  return (
    <main>
      <Container>
        <div className="flex flex-col items-center justify-center  min-h-[60vh]">
          <h1 className="text-5xl font-light tracking-tighter text-center my-16">(un)fazed.</h1>
        </div>
        <div className="flex justify-center my-8">
          <a href="/category-select" className="font-bold">카테고리로 이동</a>
        </div>
        <div className="flex flex-col items-center mt-24 mb-4 text-sm text-white">
          <span>2025 sungho left collab &lt;(un)fazed.&gt;</span>
          <span>All rights reserved</span>
        </div>
      </Container>
    </main>
  );
}
