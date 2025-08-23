import { marked } from "marked";

export default async function markdownToHtml(markdown: string) {
  // 커스텀 렌더러 설정
  const renderer = new marked.Renderer();
  
  // 이미지 렌더링 커스터마이징 - 최신 marked 타입에 맞춤
  renderer.image = function({ href, title, text }: { href: string; title: string | null; text: string }) {
    // ![설명|너비px](이미지URL) 형식 파싱
    let width = "";
    let alt = text || "";
    
    if (text && text.includes("|")) {
      const parts = text.split("|");
      alt = parts[0];
      const widthPart = parts[1];
      if (widthPart && widthPart.includes("px")) {
        width = widthPart;
      }
    }
    
    const widthStyle = width ? ` style="width: ${width}; height: auto;"` : "";
    const altAttr = alt ? ` alt="${alt}"` : "";
    
    return `<img src="${href}"${altAttr}${widthStyle} class="max-w-full h-auto my-4" />`;
  };
  
  // marked 설정
  marked.use({ renderer });
  
  return marked(markdown);
}