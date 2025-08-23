import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/api';
import { getMainBannerFromGist, saveMainBannerToGist } from '@/lib/gist-storage';
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), '.main-banner.json');

// Vercel 환경인지 확인
function isVercelEnvironment(): boolean {
  return process.env.VERCEL === '1';
}

// GitHub Gist 사용 가능한지 확인
function isGistAvailable(): boolean {
  return !!(process.env.GITHUB_GIST_ID && process.env.GITHUB_TOKEN);
}

// 로컬에서 메인 배너 설정 읽기
function getLocalMainBanner(): string | null {
  try {
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return data.selectedBannerSlug || null;
    }
    return null;
  } catch (error) {
    console.error('로컬 메인 배너 설정 읽기 실패:', error);
    return null;
  }
}

// 로컬에서 메인 배너 설정 저장
function saveLocalMainBanner(bannerSlug: string | null): boolean {
  try {
    const data = { selectedBannerSlug: bannerSlug };
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('로컬 메인 배너 설정 저장 실패:', error);
    return false;
  }
}

// GET: 현재 메인 배너 설정 조회
export async function GET() {
  try {
    let selectedBannerSlug: string | null = null;

    if (isVercelEnvironment() && isGistAvailable()) {
      console.log('Vercel environment with Gist, getting main banner from Gist');
      selectedBannerSlug = await getMainBannerFromGist();
    } else {
      console.log('Local environment, getting main banner from local file');
      selectedBannerSlug = getLocalMainBanner();
    }

    return NextResponse.json({ 
      selectedBannerSlug,
      success: true 
    });
  } catch (error) {
    console.error('메인 배너 조회 실패:', error);
    return NextResponse.json({ 
      error: '메인 배너 조회에 실패했습니다.',
      success: false 
    }, { status: 500 });
  }
}

// POST: 메인 배너 설정 변경
export async function POST(request: NextRequest) {
  try {
    const { bannerSlug, password } = await request.json();

    // 비밀번호 검증
    if (!(await verifyPassword(password))) {
      return NextResponse.json({ 
        error: '비밀번호가 올바르지 않습니다.',
        success: false 
      }, { status: 401 });
    }

    let success = false;

    if (isVercelEnvironment() && isGistAvailable()) {
      console.log('Vercel environment with Gist, saving main banner to Gist');
      success = await saveMainBannerToGist(bannerSlug);
    } else {
      console.log('Local environment, saving main banner to local file');
      success = saveLocalMainBanner(bannerSlug);
    }

    if (success) {
      return NextResponse.json({ 
        selectedBannerSlug: bannerSlug,
        success: true 
      });
    } else {
      return NextResponse.json({ 
        error: '메인 배너 설정 저장에 실패했습니다.',
        success: false 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('메인 배너 설정 실패:', error);
    return NextResponse.json({ 
      error: '메인 배너 설정에 실패했습니다.',
      success: false 
    }, { status: 500 });
  }
}