"use client";

import { useState, useEffect } from 'react';

interface LatestImageData {
  url: string;
  alt: string;
  postTitle: string;
  postDate: string;
}

export default function LatestImage() {
  const [imageData, setImageData] = useState<LatestImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchLatestImage();
  }, []);

  const fetchLatestImage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/latest-image');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setImageData(data.image);
      } else {
        setError(data.message || '이미지를 찾을 수 없습니다.');
      }
    } catch (err) {
      console.error('LatestImage fetch error:', err);
      setError('이미지를 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state until data is loaded to prevent hydration mismatch
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-black">이미지 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-black/60">{error}</div>
      </div>
    );
  }

  if (!imageData) {
    return (
      <div className="text-center py-8">
        <div className="text-black/60">표시할 이미지가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="mx-auto cursor-pointer">
      <a href={`/posts/${encodeURIComponent(imageData.postTitle.toLowerCase().replace(/\s+/g, '-'))}`}>
        <div className="mb-4">
          <img 
            src={imageData.url} 
            alt={imageData.alt}
            className="w-full h-auto shadow-lg"
            loading="lazy"
            onError={(e) => {
              console.error('Image failed to load:', imageData.url);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        
        <div className="text-sm text-black/80">
          <div className="font-medium mb-1">{imageData.postTitle}</div>
          <div className="text-xs text-black/60">
            {new Date(imageData.postDate).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </a>
    </div>
  );
}
