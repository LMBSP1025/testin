import { Post, CreatePostData, UpdatePostData } from "@/interfaces/post";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";
import crypto from "crypto";

// Next.js에서 올바른 경로 설정
const postsDirectory = join(process.cwd(), "_posts");

// 디렉토리가 존재하지 않으면 생성
if (!fs.existsSync(postsDirectory)) {
  try {
    fs.mkdirSync(postsDirectory, { recursive: true });
  } catch (error) {
    console.error("_posts 디렉토리 생성 실패:", error);
  }
}

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // 실제 운영시에는 환경변수로 설정

// 비밀번호 해시 함수
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 비밀번호 검증
export function verifyPassword(password: string): boolean {
  return hashPassword(password) === hashPassword(ADMIN_PASSWORD);
}

// 고유 ID 생성
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// 현재 날짜 문자열 생성
function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

// 안전한 slug 생성 함수
function generateSafeSlug(title: string): string {
  // 한글 제목을 유지하면서 안전한 파일명 생성
  let slug = title
    .trim()
    .replace(/[^\w\s가-힣]/g, '') // 특수문자 제거 (한글, 영문, 숫자, 언더스코어만 허용)
    .replace(/\s+/g, '-') // 공백을 하이픈으로 변환
    .replace(/-+/g, '-') // 연속된 하이픈을 하나로
    .replace(/^-|-$/g, ''); // 앞뒤 하이픈 제거
  
  // 길이 제한 (50자)
  if (slug.length > 50) {
    slug = slug.substring(0, 50);
  }
  
  // 빈 문자열이면 기본값 반환
  if (!slug) {
    slug = 'post-' + Date.now();
  }
  
  // 한글이 포함된 경우 원본 제목 유지 (파일명 일치를 위해)
  if (/[가-힣]/.test(title)) {
    slug = title.trim();
  }
  
  return slug;
}

export function getPostSlugs() {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }
    const files = fs.readdirSync(postsDirectory);
    // .md 확장자 제거하고 slug 반환
    return files.map(file => file.replace('.md', ''));
  } catch (error) {
    console.error("포스트 디렉토리 읽기 실패:", error);
    return [];
  }
}

export function getPostBySlug(slug: string) {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return null;
    }
    
    // URL 디코딩 처리
    const decodedSlug = decodeURIComponent(slug.replace(/\.md$/, ""));
    
    // 먼저 정확한 파일명으로 시도
    let filePath = join(postsDirectory, `${decodedSlug}.md`);
    
    if (!fs.existsSync(filePath)) {
      // 정확한 파일명이 없으면 디렉토리 내 모든 파일을 검색
      const files = fs.readdirSync(postsDirectory);
      const matchingFile = files.find(file => {
        const fileName = file.replace('.md', '');
        return fileName === decodedSlug || fileName === slug.replace(/\.md$/, "");
      });
      
      if (matchingFile) {
        filePath = join(postsDirectory, matchingFile);
      } else {
        console.error(`파일을 찾을 수 없습니다: ${decodedSlug}.md`);
        return null;
      }
    }
    
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);
    
    return {
      id: data.id || decodedSlug,
      slug: decodedSlug,
      title: data.title || "Untitled",
      date: data.date || "",
      coverImage: data.coverImage || "",
      excerpt: data.excerpt || "",
      ogImage: data.ogImage || { url: "" },
      content,
      preview: data.preview,
      category: data.category || 'uncategorized',
      updatedAt: data.updatedAt || data.date || "",
    };
  } catch (error) {
    console.error(`포스트 읽기 실패 (${slug}):`, error);
    return null;
  }
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is NonNullable<typeof post> => post !== null) // null 값 필터링
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}

export function getPostsByCategory(category: string): Post[] {
  return getAllPosts().filter(post => post.category === category);
}

// 새 글 작성
export function createPost(postData: CreatePostData, password: string): Post | null {
  if (!verifyPassword(password)) {
    return null;
  }

  const id = generateId();
  // 안전한 slug 생성
  const slug = generateSafeSlug(postData.title);
  
  const date = getCurrentDate();
  
  const post: Post = {
    id,
    slug,
    title: postData.title,
    date,
    coverImage: "",
    excerpt: postData.excerpt,
    ogImage: { url: "" },
    content: postData.content,
    preview: postData.preview || false,
    category: postData.category,
    updatedAt: date,
  };

  const frontMatter = matter.stringify(postData.content, {
    id: post.id,
    title: post.title,
    date: post.date,
    excerpt: post.excerpt,
    category: post.category,
    coverImage: "",
    preview: post.preview,
    updatedAt: post.updatedAt,
  });

  const filePath = join(postsDirectory, `${slug}.md`);
  try {
    fs.writeFileSync(filePath, frontMatter);
  } catch (error) {
    console.error("포스트 파일 저장 실패:", error);
    return null;
  }

  return post;
}

// 글 수정
export function updatePost(slug: string, postData: UpdatePostData, password: string): Post | null {
  if (!verifyPassword(password)) {
    return null;
  }

  const existingPost = getPostBySlug(slug);
  if (!existingPost) {
    return null;
  }

  const updatedPost: Post = {
    ...existingPost,
    ...postData,
    coverImage: "",
    updatedAt: getCurrentDate(),
  };

  const frontMatter = matter.stringify(updatedPost.content, {
    id: updatedPost.id,
    title: updatedPost.title,
    date: updatedPost.date,
    excerpt: updatedPost.excerpt,
    category: updatedPost.category,
    coverImage: "",
    preview: updatedPost.preview,
    updatedAt: updatedPost.updatedAt,
  });

  const filePath = join(postsDirectory, `${slug}.md`);
  fs.writeFileSync(filePath, frontMatter);

  return updatedPost;
}

// 글 삭제
export function deletePost(slug: string, password: string): boolean {
  try {
    if (!verifyPassword(password)) {
      console.error("비밀번호 검증 실패");
      return false;
    }

    const filePath = join(postsDirectory, `${slug}.md`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`삭제할 파일이 존재하지 않습니다: ${filePath}`);
      return false;
    }
    
    // 파일 삭제
    fs.unlinkSync(filePath);
    console.log(`포스트 삭제 성공: ${slug}`);
    return true;
    
  } catch (error) {
    console.error(`포스트 삭제 실패 (${slug}):`, error);
    return false;
  }
}
