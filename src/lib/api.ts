import { Post } from "@/interfaces/post";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";

const postsDirectory = join(process.cwd(), "_posts");

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);
  // author는 name만 포함
  const author = {
    name: data.author?.name || "Unknown"
  };
  return {
    slug: realSlug,
    title: data.title || "Untitled",
    date: data.date || "",
    coverImage: data.coverImage || "",
    author,
    excerpt: data.excerpt || "",
    ogImage: data.ogImage || { url: "" },
    content,
    preview: data.preview,
    category: data.category || 'uncategorized',
  };
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter(post => post.category === category);
}
