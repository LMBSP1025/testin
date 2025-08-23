import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { v2 as cloudinary } from 'cloudinary';

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Vercel 환경인지 확인
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1';
}

// Cloudinary 사용 가능한지 확인
function isCloudinaryAvailable(): boolean {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    console.log("Upload request received:", {
      fileCount: files.length,
      fileTypes: files.map(f => f.type),
      fileSizes: files.map(f => f.size),
      fileNames: files.map(f => f.name)
    });

    if (!files || files.length === 0) {
      console.error("No files provided in request");
      return NextResponse.json(
        { error: "파일이 없습니다." },
        { status: 400 }
      );
    }

    // 각 파일 검증
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        console.error("Invalid file type:", file.type);
        return NextResponse.json(
          { error: "이미지 파일만 업로드 가능합니다." },
          { status: 400 }
        );
      }

      if (file.size > 5 * 1024 * 1024) {
        console.error("File too large:", file.size);
        return NextResponse.json(
          { error: "파일 크기는 5MB 이하여야 합니다." },
          { status: 400 }
        );
      }
    }

    const uploadedUrls: string[] = [];

    // Vercel 환경에서 Cloudinary 사용 가능하면 Cloudinary 사용
    if (isVercelEnvironment() && isCloudinaryAvailable()) {
      console.log('Vercel environment with Cloudinary, uploading to Cloudinary');
      
      for (const file of files) {
        try {
          const bytes = await file.arrayBuffer();
          const buffer = Buffer.from(bytes);
          
          // Base64로 인코딩
          const base64String = buffer.toString('base64');
          const dataURI = `data:${file.type};base64,${base64String}`;
          
          // Cloudinary에 업로드
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'blog-uploads',
            resource_type: 'auto',
          });
          
          console.log('File uploaded to Cloudinary:', result.secure_url);
          uploadedUrls.push(result.secure_url);
        } catch (cloudinaryError) {
          console.error('Cloudinary upload error:', cloudinaryError);
          return NextResponse.json(
            { error: "Cloudinary 업로드에 실패했습니다." },
            { status: 500 }
          );
        }
      }
      
      return NextResponse.json({ 
        success: true, 
        urls: uploadedUrls,
        fileNames: files.map(f => f.name)
      });
    }

    // Vercel 환경이지만 Cloudinary 설정이 없으면 기본 이미지 반환
    if (isVercelEnvironment()) {
      console.log('Vercel environment detected, but no Cloudinary configured, returning default images');
      const defaultUrls = files.map(() => '/mobile_bg.png');
      return NextResponse.json({ 
        success: true, 
        urls: defaultUrls,
        fileNames: files.map(() => 'default-image.png')
      });
    }

    // 로컬 환경에서는 파일 시스템 사용
    console.log('Local environment, using file system');
    
    // 업로드 디렉토리 생성
    const uploadDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log("Created upload directory:", uploadDir);
    }

    for (const file of files) {
      // 고유한 파일명 생성
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split(".").pop();
      const fileName = `${timestamp}-${randomString}.${extension}`;
      const filePath = join(uploadDir, fileName);

      console.log("Saving file:", { fileName, filePath });

      // 파일 저장
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      console.log("File saved successfully:", fileName);

      // 파일 URL 추가
      const fileUrl = `/uploads/${fileName}`;
      uploadedUrls.push(fileUrl);
    }

    return NextResponse.json({ 
      success: true, 
      urls: uploadedUrls,
      fileNames: files.map(f => f.name)
    });
  } catch (error) {
    console.error("파일 업로드 오류:", error);
    return NextResponse.json(
      { error: "파일 업로드에 실패했습니다." },
      { status: 500 }
    );
  }
}