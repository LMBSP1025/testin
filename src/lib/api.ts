import { Post, CreatePostData, UpdatePostData } from "@/interfaces/post";
import fs from "fs";
import matter from "gray-matter";
import { join } from "path";
import crypto from "crypto";
import { 
  getPostsFromGist, 
  createPostInGist, 
  updatePostInGist, 
  deletePostInGist,
  getAdminConfigFromGist,
  saveAdminConfigToGist,
} from "@/lib/gist-storage";

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

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// 비밀번호 해시 함수
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 비밀번호 검증 (환경에 따라 Gist 또는 로컬)
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    if (isVercelEnvironment() && isGistAvailable()) {
      const config = await getAdminConfigFromGist();
      const storedHash = config?.passwordHash || hashPassword(DEFAULT_ADMIN_PASSWORD);
      return hashPassword(password) === storedHash;
    }

    // 로컬: 프로젝트 루트에 .admin-pass.json 사용, 없으면 기본값
    const adminPassPath = join(process.cwd(), ".admin-pass.json");
    let storedHash = hashPassword(DEFAULT_ADMIN_PASSWORD);
    if (fs.existsSync(adminPassPath)) {
      try {
        const text = fs.readFileSync(adminPassPath, "utf8");
        const parsed = JSON.parse(text) as { passwordHash?: string };
        if (parsed.passwordHash) storedHash = parsed.passwordHash;
      } catch (_e) {
        // ignore
      }
    }
    return hashPassword(password) === storedHash;
  } catch (_e) {
    return false;
  }
}

// 비밀번호 변경
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }>{
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "새 비밀번호는 6자 이상이어야 합니다." };
  }
  const verified = await verifyPassword(currentPassword);
  if (!verified) {
    return { success: false, error: "현재 비밀번호가 올바르지 않습니다." };
  }

  const newHash = hashPassword(newPassword);
  // Vercel + Gist
  if (isVercelEnvironment() && isGistAvailable()) {
    const ok = await saveAdminConfigToGist({ passwordHash: newHash });
    return ok ? { success: true } : { success: false, error: "원격 저장에 실패했습니다." };
  }

  // 로컬 파일로 저장
  try {
    const adminPassPath = join(process.cwd(), ".admin-pass.json");
    fs.writeFileSync(adminPassPath, JSON.stringify({ passwordHash: newHash }, null, 2));
    return { success: true };
  } catch (_e) {
    return { success: false, error: "로컬 저장에 실패했습니다." };
  }
}

// 글로벌 플레이리스트 설정 읽기
export async function getGlobalPlaylist(): Promise<{ id: string; title?: string | null } | null> {
  try {
    if (isVercelEnvironment() && isGistAvailable()) {
      const cfg = await getAdminConfigFromGist();
      if (cfg?.globalPlaylistId) return { id: cfg.globalPlaylistId, title: cfg.globalPlaylistTitle };
      return null;
    }
    const configPath = join(process.cwd(), ".admin-config.json");
    if (!fs.existsSync(configPath)) return null;
    const text = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(text) as { globalPlaylistId?: string; globalPlaylistTitle?: string | null };
    if (parsed.globalPlaylistId) return { id: parsed.globalPlaylistId, title: parsed.globalPlaylistTitle };
    return null;
  } catch (_e) {
    return null;
  }
}

// 글로벌 플레이리스트 설정 저장
export async function setGlobalPlaylist(playlistId: string, playlistTitle: string | null, password: string): Promise<{ success: boolean; error?: string }>{
  if (!playlistId) return { success: false, error: "플레이리스트 ID가 필요합니다." };
  if (!(await verifyPassword(password))) return { success: false, error: "비밀번호가 올바르지 않습니다." };

  if (isVercelEnvironment() && isGistAvailable()) {
    const ok = await saveAdminConfigToGist({ globalPlaylistId: playlistId, globalPlaylistTitle: playlistTitle ?? null });
    return ok ? { success: true } : { success: false, error: "원격 저장에 실패했습니다." };
  }
  try {
    const configPath = join(process.cwd(), ".admin-config.json");
    let current: any = {};
    if (fs.existsSync(configPath)) {
      try { current = JSON.parse(fs.readFileSync(configPath, "utf8")); } catch (_e) { current = {}; }
    }
    current.globalPlaylistId = playlistId;
    current.globalPlaylistTitle = playlistTitle ?? null;
    fs.writeFileSync(configPath, JSON.stringify(current, null, 2));
    return { success: true };
  } catch (_e) {
    return { success: false, error: "로컬 저장에 실패했습니다." };
  }
}

// 글로벌 플레이리스트 초기화
export async function clearGlobalPlaylist(password: string): Promise<{ success: boolean; error?: string }>{
  if (!(await verifyPassword(password))) return { success: false, error: "비밀번호가 올바르지 않습니다." };
  if (isVercelEnvironment() && isGistAvailable()) {
    const ok = await saveAdminConfigToGist({ globalPlaylistId: undefined, globalPlaylistTitle: undefined } as any);
    return ok ? { success: true } : { success: false, error: "원격 저장에 실패했습니다." };
  }
  try {
    const configPath = join(process.cwd(), ".admin-config.json");
    if (!fs.existsSync(configPath)) return { success: true };
    let current: any = {};
    try { current = JSON.parse(fs.readFileSync(configPath, "utf8")); } catch (_e) { current = {}; }
    delete current.globalPlaylistId;
    delete current.globalPlaylistTitle;
    fs.writeFileSync(configPath, JSON.stringify(current, null, 2));
    return { success: true };
  } catch (_e) {
    return { success: false, error: "로컬 저장에 실패했습니다." };
  }
}

// 고유 ID 생성
function generateId(): string {
  return crypto.randomBytes(16).toString('hex');
}

// 현재 날짜 문자열 생성
function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 날짜 형식 검증
function isValidDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false;
  
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/) !== null;
}

// 안전한 날짜 문자열 생성 (기존 날짜가 유효하지 않으면 현재 날짜 사용)
function getSafeDate(existingDate?: string): string {
  if (existingDate && isValidDate(existingDate)) {
    return existingDate;
  }
  return getCurrentDate();
}

// 안전한 slug 생성 함수
function generateSafeSlug(title: string): string {
  if (!title || typeof title !== 'string') {
    console.warn('Invalid title for slug generation:', title);
    return 'post-' + Date.now();
  }
  
  let slug = title
    .trim()
    .replace(/[^\w\s가-힣]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  if (slug.length > 50) {
    slug = slug.substring(0, 50);
  }
  
  if (!slug) {
    slug = 'post-' + Date.now();
  }
  
  return slug;
}

// Vercel 환경인지 확인
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1';
}

// GitHub Gist 사용 가능한지 확인
function isGistAvailable(): boolean {
  return !!(process.env.GITHUB_GIST_ID && process.env.GITHUB_TOKEN);
}

export function getPostSlugs() {
  try {
    if (!fs.existsSync(postsDirectory)) {
      return [];
    }
    const files = fs.readdirSync(postsDirectory);
    console.log("getPostSlugs - Raw files:", files);
    
    const slugs = files.map(file => {
      let slug = file.replace('.md', '');
      console.log("getPostSlugs - After .md removal:", { file, slug });
      
      slug = slug.replace(/\.$/, '');
      console.log("getPostSlugs - After period removal:", { file, slug });
      
      return slug;
    });
    console.log("getPostSlugs - Final processed slugs:", slugs);
    return slugs;
  } catch (error) {
    console.error("포스트 디렉토리 읽기 실패:", error);
    return [];
  }
}

export async function getPostBySlug(slug: string) {
  try {
    // Vercel 환경에서 Gist 사용 가능하면 Gist에서 검색
    if (isVercelEnvironment() && isGistAvailable()) {
      console.log('Vercel environment with Gist, searching in Gist');
      console.log('Looking for slug:', slug);
      const posts = await getPostsFromGist();
      console.log('All posts from Gist:', posts.map(p => ({ title: p.title, slug: p.slug })));
      
      // 여러 가지 slug 변형으로 검색 시도
      const slugVariations = [
        slug, // 원본 slug
        decodeURIComponent(slug), // URL 디코딩된 slug
        encodeURIComponent(slug), // URL 인코딩된 slug
        slug.replace(/\.md$/, ''), // .md 제거
        decodeURIComponent(slug).replace(/\.md$/, ''), // 디코딩 후 .md 제거
      ];
      
      console.log('Trying slug variations:', slugVariations);
      
      for (const variation of slugVariations) {
        const foundPost = posts.find(p => p.slug === variation);
        if (foundPost) {
          console.log('Found post with variation:', variation);
          return foundPost;
        }
      }
      
      // 한글 제목을 안전한 slug로 변환해서도 시도
      const safeSlug = generateSafeSlug(decodeURIComponent(slug));
      console.log('Trying with safe slug:', safeSlug);
      const safePost = posts.find(p => p.slug === safeSlug);
      if (safePost) {
        console.log('Found post with safe slug:', safeSlug);
        return safePost;
      }
      
      console.log('No post found with any slug variation');
      return null;
    }

    // Vercel 환경이지만 Gist 설정이 없으면 실패
    if (isVercelEnvironment()) {
      console.log('Vercel environment detected, but no Gist configured');
      return null;
    }

    // 로컬 환경에서는 파일 시스템 사용
    if (!fs.existsSync(postsDirectory)) {
      return null;
    }
    
    const decodedSlug = decodeURIComponent(slug.replace(/\.md$/, ""));
    
    console.log("getPostBySlug called with:", {
      originalSlug: slug,
      decodedSlug: decodedSlug,
      postsDirectory: postsDirectory
    });
    
    let filePath = join(postsDirectory, `${decodedSlug}.md`);
    
    if (!fs.existsSync(filePath)) {
      const files = fs.readdirSync(postsDirectory);
      console.log("Available files in posts directory:", files);
      
      const matchingFile = files.find(file => {
        const fileName = file.replace('.md', '');
        const matches = fileName === decodedSlug || fileName === slug.replace(/\.md$/, "");
        console.log("Checking file:", { fileName, decodedSlug, matches });
        return matches;
      });
      
      if (matchingFile) {
        filePath = join(postsDirectory, matchingFile);
        console.log("Found matching file:", matchingFile);
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
      date: getSafeDate(data.date), // 안전한 날짜 처리
      coverImage: data.coverImage || "",
      images: data.images || [], // images 필드 추가
      excerpt: data.excerpt || "",
      ogImage: data.ogImage || { url: "" },
      content,
      preview: Boolean(data.preview),
      category: data.category || 'fiction', // 기본 카테고리 설정
      updatedAt: getSafeDate(data.updatedAt || data.date), // 안전한 날짜 처리
      playlistId: data.playlistId,
      playlistTitle: data.playlistTitle,
    };
  } catch (error) {
    console.error(`포스트 읽기 실패 (${slug}):`, error);
    return null;
  }
}

export async function getAllPosts(): Promise<Post[]> {
  // Vercel 환경에서 Gist 사용 가능하면 Gist에서 가져오기
  if (isVercelEnvironment() && isGistAvailable()) {
    console.log('Vercel environment with Gist, fetching from Gist');
    const posts = await getPostsFromGist();
    return posts.sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  }

  // Vercel 환경이지만 Gist 설정이 없으면 빈 배열
  if (isVercelEnvironment()) {
    console.log('Vercel environment detected, but no Gist configured');
    return [];
  }

  // 로컬 환경에서는 파일 시스템 사용
  const slugs = getPostSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => await getPostBySlug(slug))
  );
  
  return posts
    .filter((post): post is NonNullable<typeof post> => post !== null)
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
}

export function getPostsByCategory(category: string): Promise<Post[]> {
  console.log(`getPostsByCategory called with category: "${category}"`);
  return getAllPosts().then(posts => {
    console.log(`Total posts found: ${posts.length}`);
    const filteredPosts = posts.filter(post => {
      const matches = post.category === category;
      console.log(`Post "${post.title}" has category "${post.category}" - matches: ${matches}`);
      return matches;
    });
    console.log(`Posts filtered for category "${category}": ${filteredPosts.length}`);
    return filteredPosts;
  });
}

// 새 글 작성
export async function createPost(postData: CreatePostData, password: string): Promise<Post | null> {
  console.log('createPost called with:', { hasPostData: !!postData, hasPassword: !!password });
  
  if (!(await verifyPassword(password))) {
    console.error('Password verification failed');
    return null;
  }

  console.log('Password verification successful');

  // 환경 변수 확인
  console.log('Environment check:', {
    VERCEL: process.env.VERCEL,
    GITHUB_GIST_ID: process.env.GITHUB_GIST_ID,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'SET' : 'NOT SET',
    isVercelEnvironment: isVercelEnvironment(),
    isGistAvailable: isGistAvailable()
  });

  // Vercel 환경에서 Gist 사용 가능하면 Gist에 저장
  if (isVercelEnvironment() && isGistAvailable()) {
    console.log('Vercel environment with Gist, creating in Gist');
    const result = await createPostInGist(postData);
    console.log('createPostInGist result:', result);
    return result;
  }

  // Vercel 환경이지만 Gist 설정이 없으면 실패
  if (isVercelEnvironment()) {
    console.log('Vercel environment detected, but no Gist configured');
    return null;
  }

  console.log('Using local file system');

  // 로컬 환경에서는 파일 시스템 사용
  const id = generateId();
  const slug = generateSafeSlug(postData.title);
  const date = getCurrentDate();
  
  const post: Post = {
    id,
    slug,
    title: postData.title,
    date,
    coverImage: "",
    images: postData.images || [], // 여러 이미지 배열 추가
    excerpt: postData.excerpt,
    ogImage: { url: "" },
    content: postData.content,
    preview: postData.preview || false,
    category: postData.category || "fiction", // 기본 카테고리 설정
    updatedAt: date,
    playlistId: postData.playlistId,
    playlistTitle: postData.playlistTitle,
  };

  // 모든 필드가 유효한지 검증하고 기본값 설정
  const validatedPost = {
    id: post.id || `post-${Date.now()}`,
    title: post.title || "Untitled",
    date: post.date || getCurrentDate(),
    excerpt: post.excerpt || "",
    category: post.category || "fiction",
    coverImage: post.coverImage || "",
    images: post.images || [],
    preview: Boolean(post.preview),
    updatedAt: post.updatedAt || getCurrentDate(),
    playlistId: post.playlistId || "",
    playlistTitle: post.playlistTitle || "",
  };

  console.log('Validated post data for front matter:', validatedPost);

  const frontMatter = matter.stringify(postData.content, validatedPost);

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
export async function updatePost(slug: string, postData: UpdatePostData, password: string): Promise<Post | null> {
  console.log('updatePost called with:', { slug, hasPostData: !!postData, hasPassword: !!password });
  
  if (!(await verifyPassword(password))) {
    console.error('Password verification failed');
    return null;
  }

  const existingPost = await getPostBySlug(slug);
  console.log('Existing post found:', !!existingPost);
  
  if (!existingPost) {
    console.error('Existing post not found for slug:', slug);
    return null;
  }

  const updatedPost: Post = {
    ...existingPost,
    ...postData,
    coverImage: "",
    images: postData.images || existingPost.images || [], // images 필드 처리
    content: postData.content || existingPost.content, // content 필드가 없으면 기존 내용 유지
    category: postData.category || existingPost.category || "fiction", // 카테고리 기본값 설정
    updatedAt: getCurrentDate(),
  };

  console.log('Updated post data:', { 
    title: updatedPost.title, 
    category: updatedPost.category,
    hasContent: !!updatedPost.content,
    contentLength: updatedPost.content?.length || 0,
    hasImages: !!updatedPost.images?.length
  });

  // Vercel 환경에서 Gist 사용 가능하면 Gist에 저장
  if (isVercelEnvironment() && isGistAvailable()) {
    console.log('Vercel environment with Gist, updating in Gist');
    return await updatePostInGist(slug, postData);
  }

  // Vercel 환경이지만 Gist 설정이 없으면 실패
  if (isVercelEnvironment()) {
    console.log('Vercel environment detected, but no Gist configured');
    return null;
  }

  // content가 없으면 오류
  if (!updatedPost.content) {
    console.error('Content is missing from updated post');
    return null;
  }

  // 모든 필드가 유효한지 검증하고 기본값 설정
  const validatedPost = {
    id: updatedPost.id || `post-${Date.now()}`,
    title: updatedPost.title || "Untitled",
    date: updatedPost.date || getCurrentDate(),
    excerpt: updatedPost.excerpt || "",
    category: updatedPost.category || "fiction",
    coverImage: updatedPost.coverImage || "",
    images: updatedPost.images || [],
    preview: Boolean(updatedPost.preview),
    updatedAt: updatedPost.updatedAt || getCurrentDate(),
    playlistId: updatedPost.playlistId || "",
    playlistTitle: updatedPost.playlistTitle || "",
  };

  console.log('Validated post data for front matter:', validatedPost);

  // 로컬 환경에서는 파일 시스템 사용
  const frontMatter = matter.stringify(updatedPost.content, validatedPost);

  const filePath = join(postsDirectory, `${slug}.md`);
  console.log('Writing to file path:', filePath);
  
  try {
    if (!fs.existsSync(postsDirectory)) {
      console.log('Posts directory does not exist, creating...');
      fs.mkdirSync(postsDirectory, { recursive: true });
    }
    
    fs.accessSync(postsDirectory, fs.constants.W_OK);
    fs.writeFileSync(filePath, frontMatter);
    console.log('File written successfully');
    return updatedPost;
  } catch (error) {
    console.error('Error writing file:', error);
    console.error('Error details:', {
      postsDirectory,
      filePath,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorCode: (error as any)?.code
    });
    return null;
  }
}

// 글 삭제
export async function deletePost(slug: string, password: string): Promise<boolean> {
  try {
    if (!(await verifyPassword(password))) {
      console.error("비밀번호 검증 실패");
      return false;
    }

    // Vercel 환경에서 Gist 사용 가능하면 Gist에서 삭제
    if (isVercelEnvironment() && isGistAvailable()) {
      console.log('Vercel environment with Gist, deleting from Gist');
      return await deletePostInGist(slug);
    }

    // Vercel 환경이지만 Gist 설정이 없으면 실패
    if (isVercelEnvironment()) {
      console.log('Vercel environment detected, but no Gist configured');
      return false;
    }

    // 로컬 환경에서는 파일 시스템 사용
    const filePath = join(postsDirectory, `${slug}.md`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`삭제할 파일이 존재하지 않습니다: ${filePath}`);
      return false;
    }
    
    fs.unlinkSync(filePath);
    console.log(`포스트 삭제 성공: ${slug}`);
    return true;
    
  } catch (error) {
    console.error(`포스트 삭제 실패 (${slug}):`, error);
    return false;
  }
}