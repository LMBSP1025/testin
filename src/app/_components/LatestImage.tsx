'use client';

import { useState, useEffect } from 'react';

export default function LatestImage() {
  const [latestImage, setLatestImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLatestImage = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/latest-image');
        
        if (!response.ok) {
          throw new Error('Failed to fetch latest image');
        }
        
        const data = await response.json();
        
        if (data.imageUrl) {
          setLatestImage(data.imageUrl);
        } else {
          setError('No image available');
        }
      } catch (err) {
        console.error('Error fetching latest image:', err);
        setError('Failed to load image');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestImage();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600 text-sm">이미지 로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500 text-sm">{error}</div>
      </div>
    );
  }

  if (!latestImage) {
    return null;
  }

  return (
    <div className="flex justify-center mb-6">
      <img 
        src={latestImage} 
        alt="최신 이미지"
        className="max-w-full h-auto rounded-lg shadow-lg"
        style={{ maxHeight: '400px' }}
      />
    </div>
  );
}
