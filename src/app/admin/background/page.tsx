"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function BackgroundManagement() {
  const [currentBackground, setCurrentBackground] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imageError, setImageError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (!isAuthenticated) {
      router.push("/admin");
      return;
    }

    // Load current background
    fetchCurrentBackground();
    // Load available images
    fetchAvailableImages();
  }, [router]);

  const fetchCurrentBackground = async () => {
    try {
      const response = await fetch("/api/background");
      if (response.ok) {
        const data = await response.json();
        setCurrentBackground(data.background);
      }
    } catch (error) {
      console.error("Failed to fetch current background:", error);
    }
  };

  const fetchAvailableImages = async () => {
    try {
      const response = await fetch("/api/background");
      if (response.ok) {
        // For now, we'll use a predefined list of common images
        // In a real app, you might want to scan the public directory
        // setAvailableImages([
        //   "/Msft_Nostalgia_Landscape-1536x864.jpg",
        //   "/mobile_bg.png",
        //   "/mobile_bg2.png"
        // ]);
      }
    } catch (error) {
      console.error("Failed to fetch available images:", error);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageError("이미지 파일만 선택할 수 있습니다.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageError("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    setImageFile(file);
    setImageError("");
    setShowImagePreview(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    setIsUploading(true);
    setUploadProgress(0);
    setImageError("");

    try {
      const formData = new FormData();
      formData.append("files", imageFile);

      // Upload progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.ok) {
        const { urls } = await response.json();
        return urls[0]; // Return first URL since we're uploading single file
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "업로드에 실패했습니다.");
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUploadAndSet = async () => {
    if (!imageFile) return;

    const imageUrl = await uploadImage();
    if (!imageUrl) return;

    // Automatically set the uploaded image as the new background
    try {
      const response = await fetch("/api/background", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          background: imageUrl,
          password: "admin123", // Use default password for immediate setting
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess("배경 이미지가 성공적으로 업로드되고 적용되었습니다!");
        setCurrentBackground(data.background);
        
        // Update CSS variable immediately
        document.documentElement.style.setProperty("--dynamic-background", `url(${imageUrl})`);
        
        // Clear the file selection
        setImageFile(null);
        setShowImagePreview(false);
        setImageError("");
        
        // Show success message for 3 seconds then redirect
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "배경 이미지 설정에 실패했습니다.");
      }
    } catch (err) {
      setError("배경 이미지 설정 중 오류가 발생했습니다.");
    }
  };

  const removeSelectedImage = () => {
    setImageFile(null);
    setShowImagePreview(false);
    setImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen py-12">
      {/* 윈도우 98 스타일 창 */}
      <div className="max-w-2xl mx-auto shadow-[2px_2px_0_0_#000000] bg-gray-300">
        {/* 창 제목 바 */}
        <div className="bg-blue-900 border-2 border-gray-300 text-white px-3 py-1 mb-8">
          <h2 className="text-xl font-bold">배경 이미지 관리</h2>
        </div>
        
        <div className="p-8">
          {/* 현재 배경 이미지 */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-black mb-4">현재 배경 이미지</h3>
            <div className="bg-white p-4 rounded border">
              <p className="text-sm text-gray-600 mb-2">경로: {currentBackground}</p>
              <div className="w-full h-32 bg-gray-100 rounded border overflow-hidden">
                <img 
                  src={currentBackground} 
                  alt="Current Background"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* 이미지 업로드 섹션 */}
          <div className="mb-8 p-4 bg-white/10 rounded-md border border-white/20">
            <h3 className="text-lg font-medium text-black mb-3">🖼️ 새 이미지 업로드</h3>
            
            {/* 드래그 앤 드롭 영역 */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive 
                  ? "border-blue-400 bg-blue-400/10" 
                  : "border-white/30 hover:border-white/50"
              }`}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-black/80 mb-2">
                {dragActive ? "여기에 이미지를 놓으세요!" : "이미지를 드래그 앤 드롭하거나 클릭하여 선택하세요"}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-black rounded-md transition-colors text-sm"
              >
                이미지 선택
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <div className="text-xs text-black/60 mt-2">
                지원 형식: JPG, PNG, GIF, WebP (최대 10MB)
              </div>
            </div>

            {/* 선택된 이미지 미리보기 */}
            {showImagePreview && imageFile && (
              <div className="mt-4 p-4 bg-white/5 rounded-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-black/80">선택된 이미지:</span>
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    제거
                  </button>
                </div>
                <div className="max-w-xs mb-3">
                  <img 
                    src={URL.createObjectURL(imageFile)} 
                    alt="이미지 미리보기"
                    className="w-full h-auto rounded-md border border-white/30"
                  />
                </div>
                <div className="text-xs text-black/60 mb-2">
                  파일명: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)}MB)
                </div>
                
                {imageError && (
                  <div className="text-red-400 text-sm mb-3">{imageError}</div>
                )}

                {isUploading && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-black/80 mb-1">
                      <span>업로드 중...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleUploadAndSet}
                  disabled={isUploading}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm"
                >
                  {isUploading ? "업로드 중..." : "이미지 업로드 및 즉시 배경으로 설정"}
                </button>
              </div>
            )}
            
            <div className="text-xs text-black/60 mt-3">
              💡 새 배경 이미지를 업로드하면 자동으로 배경으로 설정됩니다
            </div>
          </div>

          {/* 대시보드로 돌아가기 버튼 */}
          <div className="text-center mt-8">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="px-6 py-3 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150"
            >
              대시보드로
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}