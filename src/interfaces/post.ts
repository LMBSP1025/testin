
export type Post = {
  id: string;
  slug: string;
  title: string;
  date: string;
  coverImage: string;
  images: string[]; // 여러 이미지를 저장할 배열
  excerpt: string;
  ogImage: {
    url: string;
  };
  content: string;
  preview?: boolean;
  category: string;
  updatedAt?: string;
  // Optional YouTube playlist info for the global music player
  playlistId?: string;
  playlistTitle?: string;
};

export type CreatePostData = {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  coverImage?: string;
  images?: string[]; // 여러 이미지를 저장할 배열
  preview?: boolean;
  // Playlist fields (only playlist allowed)
  playlistId?: string;
  playlistTitle?: string;
};

export type UpdatePostData = Partial<CreatePostData>;