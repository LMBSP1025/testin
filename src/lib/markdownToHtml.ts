import { remark } from "remark";
import html from "remark-html";
import remarkGfm from "remark-gfm";

export default async function markdownToHtml(markdown: string) {
  const result = await remark()
    .use(remarkGfm) // GitHub Flavored Markdown 지원
    .use(html, {
      sanitize: false, // HTML 태그 허용
    })
    .process(markdown);
  
  return result.toString();
}
