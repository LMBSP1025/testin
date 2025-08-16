
export type Post = {
  id: string;
  slug: string;
  title: string;
  date: string;
  coverImage: string;
  excerpt: string;
  ogImage: {
    url: string;
  };
  content: string;
  preview?: boolean;
  category: string;
  updatedAt?: string;
};

export type CreatePostData = {
  title: string;
  content: string;
  excerpt: string;
  category: string;
  coverImage?: string;
  preview?: boolean;
};

export type UpdatePostData = Partial<CreatePostData>;
