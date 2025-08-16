"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Container from "@/app/_components/container";
import { UpdatePostData, Post } from "@/interfaces/post";

export default function EditPost() {
  const [formData, setFormData] = useState<UpdatePostData>({
    title: "",
    content: "",
    excerpt: "",
    category: "fiction",
    coverImage: "",
    preview: false,
  });
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPostLoading, setIsPostLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDescription, setImageDescription] = useState("");
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  useEffect(() => {
    // 인증 상태 확인
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (!isAuthenticated) {
      router.push("/admin");
      return;
    }

    // 포스트 데이터 가져오기
    fetchPost();
  }, [router, slug]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${slug}`);
      if (response.ok) {
        const post = await response.json();
        setFormData({
          title: post.title,
          content: post.content,
          excerpt: post.excerpt || "",
          category: post.category || "fiction",
          coverImage: post.coverImage || "",
          preview: post.preview || false,
        });
      } else {
        setError("포스트를 찾을 수 없습니다.");
      }
    } catch (error) {
      setError("포스트를 가져오는데 실패했습니다.");
    } finally {
      setIsPostLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/posts/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postData: formData,
          password,
        }),
      });

      if (response.ok) {
        const { success } = await response.json();
        if (success) {
          alert("포스트가 성공적으로 수정되었습니다!");
          router.push("/admin/dashboard");
        } else {
          setError("포스트 수정에 실패했습니다.");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "포스트 수정에 실패했습니다.");
      }
    } catch (err) {
      setError("오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // 이미지 파일 선택 처리
  const handleFileSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setImageError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      setImageError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    setImageFile(file);
    setImageDescription("");
    setShowImagePreview(true);
    setImageError("");
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
      const file = e.dataTransfer.files[0];
      handleFileSelect(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('description', imageDescription);

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('이미지 업로드에 실패했습니다.');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      setImageError('이미지 업로드에 실패했습니다.');
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const insertImageAtCursor = async () => {
    if (!imageFile) return;

    const imageUrl = await uploadImage();
    if (!imageUrl) return;

    const textarea = document.getElementById('content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;
    
    if (!currentContent) return;
    
    const imageMarkdown = `![${imageDescription || '이미지'}](${imageUrl})`;
    const newContent = currentContent.substring(0, start) + imageMarkdown + currentContent.substring(end);
    
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));

    // 이미지 입력 필드 초기화
    setImageFile(null);
    setImageDescription("");
    setShowImagePreview(false);
    setImageError("");

    // 포커스를 텍스트 영역으로 이동하고 커서 위치 조정
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + imageMarkdown.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const removeSelectedImage = () => {
    setImageFile(null);
    setImageDescription("");
    setShowImagePreview(false);
    setImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isPostLoading) {
    return (
      <main className="relative flex flex-col items-center justify-center min-h-screen py-12">
        <div className="max-w-4xl mx-auto shadow-[2px_2px_0_0_#000000] bg-gray-300">
          <div className="bg-blue-900 border-2 border-gray-300 text-white px-3 py-1 mb-8">
            <h2 className="text-xl font-bold">로딩 중...</h2>
          </div>
          <div className="p-8 text-center">
            <div className="text-black text-lg">로딩 중...</div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen py-12">
      {/* 윈도우 98 스타일 창 */}
      <div className="max-w-4xl mx-auto shadow-[2px_2px_0_0_#000000] bg-gray-300">
        {/* 창 제목 바 */}
        <div className="bg-blue-900 border-2 border-gray-300 text-white px-3 py-1 mb-8">
          <h2 className="text-xl font-bold">포스트 수정</h2>
        </div>
        
        <div className="p-8">
          {/* 상단 타이틀과 버튼들 */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-light tracking-tighter text-black">포스트 수정</h1>
            <a 
              href="/admin/dashboard" 
              className="px-6 py-3 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150"
            >
              ← 대시보드로
            </a>
          </div>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                              <label htmlFor="title" className="block text-sm font-medium text-black mb-2">
                제목 *
              </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-md text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  placeholder="포스트 제목을 입력하세요"
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-black mb-2">
                  카테고리 *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                  required
                >
                  <option value="fiction">글</option>
                  <option value="drawing">그림</option>
                  <option value="banner">배너</option>
                  <option value="etc">기타</option>
                </select>
              </div>
            </div>

            <div>
                              <label htmlFor="excerpt" className="block text-sm font-medium text-black mb-2">
                  요약
                </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-md text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="포스트 요약을 입력하세요"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="preview"
                name="preview"
                checked={formData.preview}
                onChange={handleInputChange}
                className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-white/50 focus:ring-2"
              />
              <label htmlFor="preview" className="ml-2 text-sm text-black">
                미리보기 모드
              </label>
            </div>

            {/* 이미지 업로드 섹션 */}
            <div className="p-4 bg-white/10 rounded-md border border-white/20">
              <h3 className="text-lg font-medium text-black mb-3">🖼️ 이미지 업로드</h3>
              
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
                  지원 형식: JPG, PNG, GIF, WebP (최대 5MB)
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
                  
                  <div className="mb-3">
                    <label htmlFor="imageDescription" className="block text-sm font-medium text-black mb-2">
                      이미지 설명
                    </label>
                    <input
                      type="text"
                      id="imageDescription"
                      value={imageDescription}
                      onChange={(e) => setImageDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-md text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                      placeholder="이미지에 대한 설명 (선택사항)"
                    />
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
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={insertImageAtCursor}
                    disabled={isUploading}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-md transition-colors text-sm font-medium"
                  >
                    {isUploading ? "업로드 중..." : "이미지 삽입"}
                  </button>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-black mb-2">
                내용 *
              </label>
              <div className="mb-3 p-3 bg-white/10 rounded-md">
                <p className="text-sm text-black/80 mb-2">📝 마크다운 사용법:</p>
                <div className="text-xs text-black/60 space-y-1 font-mono">
                  <div>**굵게** → <strong>굵게</strong></div>
                  <div>*기울임* → <em>기울임</em></div>
                  <div>![설명](이미지URL) → 이미지 삽입</div>
                  <div>[링크텍스트](URL) → 링크</div>
                  <div># 제목 → 큰 제목</div>
                  <div>## 소제목 → 작은 제목</div>
                </div>
              </div>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={15}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-md text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent font-mono"
                placeholder="포스트 내용을 마크다운 형식으로 입력하세요

예시:
# 제목

이미지 삽입:
![설명](https://example.com/image.jpg)

링크:
[링크텍스트](https://example.com)

굵게: **굵은 텍스트**
기울임: *기울어진 텍스트*"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
                관리자 비밀번호 *
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-md text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
                placeholder="관리자 비밀번호를 입력하세요"
                required
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150"
              >
                {isLoading ? "수정 중..." : "포스트 수정"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admin/dashboard")}
                className="px-6 py-3 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium transition-all duration-150"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
