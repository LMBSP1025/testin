import { Post, CreatePostData, UpdatePostData } from "@/interfaces/post";
import { getCurrentDate, generateSafeSlug } from "./api";

// GitHub Gist를 데이터베이스로 사용
const GIST_ID = process.env.GITHUB_GIST_ID || '';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

interface GistFile {
  filename?: string;
  content?: string;
  raw_url?: string;
  truncated?: boolean;
}

interface GistData {
  files: {
    [key: string]: GistFile;
  };
}

interface AdminConfig {
  passwordHash?: string;
  globalPlaylistId?: string;
  globalPlaylistTitle?: string | null;
}

// Gist에서 포스트 데이터 가져오기
export async function getPostsFromGist(): Promise<Post[]> {
  if (!GIST_ID || !GITHUB_TOKEN) {
    console.warn('GitHub Gist 설정이 없습니다.');
    return [];
  }

  try {
    console.log('Fetching posts from Gist:', GIST_ID);
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      cache: 'no-store'
    } as RequestInit);

    if (!response.ok) {
      console.error('GitHub API 오류:', response.status, response.statusText);
      throw new Error(`GitHub API 오류: ${response.status}`);
    }

    const gist: GistData = await response.json();
    console.log('Gist response received');
    
    const postsFile = gist.files['posts.json'];
    console.log('Posts file meta:', postsFile);
    
    if (!postsFile) {
      console.log('posts.json 파일이 Gist에 없습니다.');
      return [];
    }

    // 가능한 경우 raw_url을 통해 최신 원본을 가져온다 (캐시 회피)
    if (postsFile.raw_url) {
      try {
        const rawResp = await fetch(postsFile.raw_url, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        } as RequestInit);
        if (rawResp.ok) {
          const text = await rawResp.text();
          const posts = JSON.parse(text);
          console.log('Parsed posts from raw_url:', Array.isArray(posts) ? posts.length : 'not array');
          return posts;
        } else {
          console.warn('raw_url fetch failed, status:', rawResp.status);
        }
      } catch (e) {
        console.warn('raw_url fetch error, fallback to embedded content:', e);
      }
    }

    // raw_url 사용 실패 시, 응답에 포함된 content 사용
    if (postsFile.content) {
      const posts = JSON.parse(postsFile.content);
      console.log('Parsed posts from embedded content:', Array.isArray(posts) ? posts.length : 'not array');
      return posts;
    }

    console.warn('posts.json에 content가 없고 raw_url도 접근 실패');
    return [];
  } catch (error) {
    console.error('Gist에서 포스트 가져오기 실패:', error);
    return [];
  }
}

// Gist에 포스트 데이터 저장하기
export async function savePostsToGist(posts: Post[]): Promise<boolean> {
  if (!GIST_ID || !GITHUB_TOKEN) {
    console.warn('GitHub Gist 설정이 없습니다.');
    return false;
  }

  try {
    console.log('Saving posts to Gist:', GIST_ID);
    const postsJson = JSON.stringify(posts, null, 2);
    
    const requestBody = {
      files: {
        'posts.json': {
          content: postsJson,
        },
      },
    };
    
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify(requestBody),
    });

    console.log('savePostsToGist Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API 오류:', response.status, response.statusText, errorText);
      return false;
    }

    // 저장 직후 원본(raw_url)로 다시 확인
    const result = await response.json();
    const rawUrl = result?.files?.['posts.json']?.raw_url;
    if (rawUrl) {
      const verify = await fetch(rawUrl, { cache: 'no-store' } as RequestInit);
      const verifyText = await verify.text();
      console.log('Verified raw content length:', verifyText.length);
    }
    
    return true;
  } catch (error) {
    console.error('Gist에 포스트 저장 실패:', error);
    return false;
  }
}

// Admin 설정 가져오기 (비밀번호 해시 등)
export async function getAdminConfigFromGist(): Promise<AdminConfig | null> {
  if (!GIST_ID || !GITHUB_TOKEN) {
    console.warn('GitHub Gist 설정이 없습니다.');
    return null;
  }

  try {
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store'
    } as RequestInit);

    if (!response.ok) {
      console.error('GitHub API 오류:', response.status, response.statusText);
      return null;
    }

    const gist: GistData = await response.json();
    const adminFile = gist.files['admin.json'];
    if (!adminFile) return null;

    if (adminFile.raw_url) {
      try {
        const rawResp = await fetch(adminFile.raw_url, { cache: 'no-store' } as RequestInit);
        if (rawResp.ok) {
          const text = await rawResp.text();
          return JSON.parse(text) as AdminConfig;
        }
      } catch (e) {
        // ignore and fallback
      }
    }

    if (adminFile.content) {
      try {
        return JSON.parse(adminFile.content) as AdminConfig;
      } catch (_e) {
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('Gist에서 admin 설정 가져오기 실패:', error);
    return null;
  }
}

// Admin 설정 저장 (비밀번호 해시 등)
export async function saveAdminConfigToGist(config: AdminConfig): Promise<boolean> {
  if (!GIST_ID || !GITHUB_TOKEN) {
    console.warn('GitHub Gist 설정이 없습니다.');
    return false;
  }

  try {
    const requestBody = {
      files: {
        'admin.json': {
          content: JSON.stringify(config, null, 2),
        },
      },
    };

    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify(requestBody),
    });

    return response.ok;
  } catch (error) {
    console.error('Gist에 admin 설정 저장 실패:', error);
    return false;
  }
}

// 포스트 생성
export async function createPostInGist(postData: CreatePostData): Promise<Post | null> {
  console.log('=== createPostInGist START ===');
  console.log('Input postData:', postData);
  
  try {
    const posts = await getPostsFromGist();
    console.log('Current posts from Gist:', posts.length);
    
    const currentDate = getCurrentDate();
    
    const newPost: Post = {
      id: Date.now().toString(),
      slug: generateSafeSlug(postData.title),
      title: postData.title || "Untitled",
      date: currentDate,
      coverImage: "",
      images: postData.images || [], // images 필드 추가
      excerpt: postData.excerpt || "",
      ogImage: { url: "" },
      content: postData.content || "",
      preview: Boolean(postData.preview),
      category: postData.category || "fiction", // 기본 카테고리 설정
      updatedAt: currentDate,
      playlistId: postData.playlistId || "",
      playlistTitle: postData.playlistTitle || "",
    };

    console.log('Generated new post:', newPost);
    console.log('Generated slug:', newPost.slug);

    posts.push(newPost);
    console.log('Posts array after push:', posts.length);
    
    console.log('About to call savePostsToGist...');
    const success = await savePostsToGist(posts);
    console.log('savePostsToGist result:', success);
    
    if (success) {
      console.log('=== createPostInGist SUCCESS ===');
      return newPost;
    } else {
      console.log('=== createPostInGist FAILED - savePostsToGist returned false ===');
      return null;
    }
  } catch (error) {
    console.error('=== createPostInGist ERROR ===', error);
    return null;
  }
}

// 포스트 수정
export async function updatePostInGist(slug: string, postData: UpdatePostData): Promise<Post | null> {
  try {
    const posts = await getPostsFromGist();
    const index = posts.findIndex(p => p.slug === slug);
    
    if (index === -1) {
      console.error('Post not found for slug:', slug);
      return null;
    }

    const currentDate = getCurrentDate();
    
    posts[index] = {
      ...posts[index],
      ...postData,
      title: postData.title || posts[index].title || "Untitled",
      excerpt: postData.excerpt || posts[index].excerpt || "",
      content: postData.content || posts[index].content || "",
      images: postData.images || posts[index].images || [], // images 필드 처리
      category: postData.category || posts[index].category || "fiction", // 카테고리 기본값 설정
      preview: Boolean(postData.preview ?? posts[index].preview),
      playlistId: postData.playlistId || posts[index].playlistId || "",
      playlistTitle: postData.playlistTitle || posts[index].playlistTitle || "",
      date: currentDate, // 수정 시 현재 시간으로 업데이트
      updatedAt: currentDate,
    };

    console.log('Updated post in Gist:', posts[index]);
    
    const success = await savePostsToGist(posts);
    return success ? posts[index] : null;
  } catch (error) {
    console.error('Error updating post in Gist:', error);
    return null;
  }
}

// 메인 배너 설정 관련 함수들
export async function getMainBannerFromGist(): Promise<string | null> {
  if (!GIST_ID || !GITHUB_TOKEN) {
    console.warn('GitHub Gist 설정이 없습니다.');
    return null;
  }

  try {
    console.log('Fetching main banner from Gist:', GIST_ID);
    
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      console.error('GitHub API 오류:', response.status, response.statusText);
      return null;
    }

    const gist = await response.json();
    const mainBannerFile = gist.files['main-banner.json'];
    
    if (!mainBannerFile) {
      console.log('main-banner.json 파일이 없습니다.');
      return null;
    }

    const bannerConfig = JSON.parse(mainBannerFile.content);
    return bannerConfig.selectedBannerSlug || null;
  } catch (error) {
    console.error('메인 배너 조회 실패:', error);
    return null;
  }
}

export async function saveMainBannerToGist(bannerSlug: string | null): Promise<boolean> {
  if (!GIST_ID || !GITHUB_TOKEN) {
    console.warn('GitHub Gist 설정이 없습니다.');
    return false;
  }

  try {
    console.log('Saving main banner to Gist:', GIST_ID, bannerSlug);
    
    const bannerConfig = {
      selectedBannerSlug: bannerSlug,
      updatedAt: new Date().toISOString()
    };

    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'main-banner.json': {
            content: JSON.stringify(bannerConfig, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      console.error('GitHub API 오류:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return false;
    }

    console.log('메인 배너 설정 저장 성공');
    return true;
  } catch (error) {
    console.error('메인 배너 설정 저장 실패:', error);
    return false;
  }
}

// Gist에서 모든 포스트 삭제 (초기화)
export async function clearAllPostsFromGist(): Promise<boolean> {
  if (!GIST_ID || !GITHUB_TOKEN) {
    console.warn('GitHub Gist 설정이 없습니다.');
    return false;
  }

  try {
    console.log('Clearing all posts from Gist:', GIST_ID);
    
    const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'posts.json': {
            content: '[]', // 빈 배열로 초기화
          },
        },
      }),
    });

    if (!response.ok) {
      console.error('GitHub API 오류:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`GitHub API 오류: ${response.status}`);
    }

    const result = await response.json();
    console.log('Gist cleared successfully:', result);
    return true;
  } catch (error) {
    console.error('Gist 초기화 실패:', error);
    return false;
  }
}

// 포스트 삭제
export async function deletePostInGist(slug: string): Promise<boolean> {
  console.log('Deleting post from Gist with slug:', slug);
  const posts = await getPostsFromGist();
  console.log('Current posts before deletion:', posts.map(p => ({ title: p.title, slug: p.slug })));
  
  const filteredPosts = posts.filter(p => p.slug !== slug);
  console.log('Posts after filtering:', filteredPosts.map(p => ({ title: p.title, slug: p.slug })));
  console.log('Deleted posts count:', posts.length - filteredPosts.length);
  
  const success = await savePostsToGist(filteredPosts);
  console.log('Delete operation success:', success);
  return success;
}