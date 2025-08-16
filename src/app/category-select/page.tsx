import Container from "@/app/_components/container";
import LatestImage from "@/app/_components/LatestImage";

export default function CategorySelect() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen py-12">
      <Container>
                  {/* 윈도우 98 스타일 창 */}
          <div className="max-w-4xl mx-auto shadow-[2px_2px_0_0_#000000] bg-gray-300">
            {/* 창 제목 바 */}
            <div className="bg-blue-900 border-2 border-gray-300 text-white px-3 py-1">
              <h2 className="text-xl font-bold">夢</h2>
            </div>
            <div className="p-4">
            <LatestImage key="latest-image" />

            <hr className="w-full border-gray-400 border-1 shadow-[0px_1px_0_0_#f0f0f0] my-3" />
                        <div className="flex items-center justify-between w-full max-w-2xl">
              {/* 카테고리 버튼들 - 왼쪽 끝에 배치 */}
              <div className="grid grid-cols-4 gap-2">
                <a href="/writing" className="px-5 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium text-xl flex items-center justify-center">
                  글
                </a>
                <a href="/drawing" className="px-5 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium text-xl flex items-center justify-center">
                  그림
                </a>
                <a href="/banner" className="px-5 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium text-xl flex items-center justify-center">
                  배너
                </a>
                <a href="/etc" className="px-5 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium text-xl flex items-center justify-center">
                  기타
                </a>
              </div>
              
              {/* 관리 버튼 - 오른쪽 끝에 배치 */}
              <a href="/admin" className="px-5 py-1 bg-gray-300 hover:shadow-[inset_-2px_-2px_0_0_white,inset_2px_2px_0_0_#00000050,2px_2px_0_0_#000000] shadow-[inset_-2px_-2px_0_0_#00000050,inset_2px_2px_0_0_white,2px_2px_0_0_#000000] text-black font-medium text-xl flex items-center justify-center">
                관리
              </a>
            </div>
            </div>
            
            
          </div>
      </Container>
    </main>
  );
}
