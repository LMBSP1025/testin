"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Container from "@/app/_components/container";
import { CreatePostData } from "@/interfaces/post";

export default function CreatePost() {
  const [formData, setFormData] = useState<CreatePostData>({
    title: "",
    content: "",
    excerpt: "",
    category: "fiction",
    coverImage: "",
    images: [], // 여러 이미지를 저장할 배열
    preview: false,
  });
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]); // 여러 이미지 파일
  const [imageDescriptions, setImageDescriptions] = useState<string[]>([]); // 여러 이미지 설명
  const [imageWidths, setImageWidths] = useState<number[]>([]); // 여러 이미지 너비
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [imageError, setImageError] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number[]>([]); // 여러 이미지 업로드 진행률
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 인증 상태 확인
    const isAuthenticated = sessionStorage.getItem("adminAuthenticated");
    if (!isAuthenticated) {
      router.push("/admin");
      return;
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
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
          alert("포스트가 성공적으로 작성되었습니다!");
          router.push("/admin/dashboard");
        } else {
          setError("포스트 작성에 실패했습니다.");
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "포스트 작성에 실패했습니다.");
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

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setImageError("이미지 파일만 선택할 수 있습니다.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setImageFiles((prev) => [...prev, file]);
    setImageDescriptions((prev) => [...prev, ""]);
    setImageWidths((prev) => [...prev, 100]); // 기본 너비 100%
    setShowImagePreview(true);
    setImageError("");
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        handleFileSelect(files[i]);
      }
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
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        handleFileSelect(e.dataTransfer.files[i]);
      }
    }
  };

  const uploadImage = async (): Promise<string[] | null> => {
    if (!imageFiles.length) return null;

    setIsUploading(true);
    setUploadProgress(imageFiles.map(() => 0)); // 각 이미지별 진행률 초기화
    setImageError("");

    try {
      const formData = new FormData();
      for (const file of imageFiles) {
        formData.append("files", file); // 여러 파일을 'files'로 전송
      }

      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => prev.map(p => Math.min(p + 10, 90)));
      }, 100);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(prev => prev.map(() => 100)); // 모든 이미지 업로드 완료

      if (response.ok) {
        const { urls } = await response.json();
        return urls; // URL 배열 반환
      } else {
        const errorData = await response.json();
        setImageError(errorData.error || "이미지 업로드에 실패했습니다.");
        return null;
      }
    } catch (error) {
      setImageError("이미지 업로드 중 오류가 발생했습니다.");
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress([]); // 모든 이미지 업로드 진행률 초기화
    }
  };

  const insertImageAtCursor = async () => {
    if (!imageFiles.length || !contentRef.current) return;

    const imageUrls = await uploadImage();
    if (!imageUrls || !Array.isArray(imageUrls)) return;

    const textarea = contentRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    let newContent = formData.content;
    let cursorOffset = 0;

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const description = imageDescriptions[i]?.trim() || "이미지";
      const width = imageWidths[i] || 100;
      const imageMarkdown = `![${description}|${width}px](${imageUrl})`;
      newContent = newContent.substring(0, start + cursorOffset) + imageMarkdown + newContent.substring(end + cursorOffset);
      cursorOffset += imageMarkdown.length;
    }
    
    setFormData(prev => ({
      ...prev,
      content: newContent
    }));

    // 이미지 입력 필드 초기화
    setImageFiles([]);
    setImageDescriptions([]);
    setImageWidths([]); // 너비 초기화
    setShowImagePreview(false);
    setImageError("");

    // 포커스를 텍스트 영역으로 이동하고 커서 위치 조정
    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        const newCursorPos = start + cursorOffset;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const removeSelectedImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImageDescriptions(prev => prev.filter((_, i) => i !== index));
    setImageWidths(prev => prev.filter((_, i) => i !== index)); // 너비도 제거
    setShowImagePreview(false);
    setImageError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen py-12">
      {/* 윈도우 98 스타일 창 */}
      <div className="max-w-4xl mx-auto shadow-[2px_2px_0_0_#000000] bg-gray-300">
        {/* 창 제목 바 */}
        <div className="bg-blue-900 border-2 border-gray-300 text-white px-3 py-1 mb-8">
          <h2 className="text-xl font-bold">새 글 작성</h2>
        </div>
        
        <div className="p-8">
          {/* 상단 타이틀과 버튼들 */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-light tracking-tighter text-black">새 글 작성</h1>
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
            <div className="p-6 bg-white/10 rounded-md border border-white/20">
              <h3 className="text-lg font-medium text-black mb-4">🖼️ 이미지 업로드</h3>
              
              {/* 드래그 앤 드롭 영역 */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? "border-blue-400 bg-blue-400/10" 
                    : "border-white/30 hover:border-white/50"
                }`}
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="text-black/80 mb-3 text-base">
                  {dragActive ? "여기에 이미지를 놓으세요!" : "이미지를 드래그 앤 드롭하거나 클릭하여 선택하세요"}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 text-black rounded-md transition-colors text-base font-medium"
                >
                  이미지 선택
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="text-sm text-black/60 mt-3">
                  지원 형식: JPG, PNG, GIF, WebP (최대 5MB)
                </div>
              </div>

              {/* 선택된 이미지 미리보기 */}
              {showImagePreview && imageFiles.length > 0 && (
                <div className="mt-6 p-6 bg-white/5 rounded-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-base text-black/80 font-medium">선택된 이미지 ({imageFiles.length}개):</span>
                    <button
                      type="button"
                      onClick={() => setImageFiles([])}
                      className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded hover:bg-red-400/10"
                    >
                      모두 제거
                    </button>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="flex items-start space-x-4 p-3 bg-white/5 rounded-lg border border-white/10">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={`이미지 미리보기 ${index + 1}`}
                          className="w-24 h-24 object-cover rounded-md border border-white/30 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-black/70 mb-2 font-medium">
                            파일명: {file.name}
                          </div>
                          <div className="text-xs text-black/50 mb-2">
                            ({(file.size / 1024 / 1024).toFixed(2)}MB)
                          </div>
                          <input
                            type="text"
                            value={imageDescriptions[index] || ""}
                            onChange={(e) => {
                              const newDescriptions = [...imageDescriptions];
                              newDescriptions[index] = e.target.value;
                              setImageDescriptions(newDescriptions);
                            }}
                            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-black text-sm mb-3"
                            placeholder="이미지에 대한 설명 (선택사항)"
                          />
                          <div className="flex items-center space-x-3">
                            <label className="text-sm text-black/70 font-medium">너비:</label>
                            <input
                              type="number"
                              min="50"
                              max="800"
                              value={imageWidths[index] || 100}
                              onChange={(e) => {
                                const newWidths = [...imageWidths];
                                newWidths[index] = Number(e.target.value);
                                setImageWidths(newWidths);
                              }}
                              className="w-20 px-2 py-1 bg-white/20 border border-white/30 rounded-md text-black text-sm text-center"
                            />
                            <span className="text-sm text-black/70">px</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSelectedImage(index)}
                          className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-400/10 flex-shrink-0"
                        >
                          제거
                        </button>
                      </div>
                    ))}
                  </div>

                  {imageError && (
                    <div className="text-red-400 text-sm mb-3">{imageError}</div>
                  )}

                  {isUploading && (
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-black/80 mb-1">
                        <span>업로드 중...</span>
                        <span>{uploadProgress.reduce((sum, p) => sum + p, 0) / uploadProgress.length}%</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress.reduce((sum, p) => sum + p, 0) / uploadProgress.length}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={insertImageAtCursor}
                    disabled={isUploading}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors text-sm"
                  >
                    {isUploading ? "업로드 중..." : "현재 커서 위치에 이미지 삽입"}
                  </button>
                </div>
              )}
              
              <div className="text-xs text-black/60 mt-3">
                💡 이미지를 삽입하려면: 1) 이미지 파일 선택 2) 설명 입력 (선택사항) 3) 너비 설정 (선택사항) 4) 삽입 버튼 클릭
                <br />
                📏 너비는 20px~2000px 사이에서 설정 가능하며, 설정하지 않으면 기본값 100px가 적용됩니다.
              </div>
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
                  <div>![설명|너비px](이미지URL) → 크기 조정된 이미지</div>
                  <div>[링크텍스트](URL) → 링크</div>
                  <div># 제목 → 큰 제목</div>
                  <div>## 소제목 → 작은 제목</div>
                </div>
                <div className="text-xs text-black/60 mt-2 pt-2 border-t border-white/20">
                  🖼️ <strong>이미지 크기 조정:</strong> 이미지 업로드 시 너비를 20px~2000px 사이에서 설정하면<br/>
                  자동으로 `![설명|너비px](URL)` 형식으로 마크다운에 삽입됩니다.
                </div>
              </div>
              <textarea
                ref={contentRef}
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={15}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-md text-black placeholder-black/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent font-mono"
                placeholder="포스트 내용을 입력하세요"
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
                {isLoading ? "작성 중..." : "포스트 작성"}
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