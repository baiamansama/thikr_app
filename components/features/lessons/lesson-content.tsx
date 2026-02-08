import { AzkarDisplay } from "./azkar-display";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ContentLine {
  id: string;
  order: number;
  arabic: string | null;
  translations: Record<string, string> | null;
  transcriptionLatin: string | null;
  transcriptionCyrillic: string | null;
  audioUrl: string | null;
  timestamp: number | null;
  repeatCount: number | null;
}

interface LessonContentProps {
  type: "azkar" | "text" | "audio";
  content: ContentLine[];
  language?: string;
}

export function LessonContent({
  type,
  content,
  language = "en",
}: LessonContentProps) {
  if (type === "text") {
    const textContent = content
      .map((c) => c.translations?.[language] || c.translations?.en || c.arabic || "")
      .join("\n\n");

    return (
      <div className="prose prose-brown max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{textContent}</ReactMarkdown>
      </div>
    );
  }

  if (type === "audio" || type === "azkar") {
    // Group content by repeat count for azkar-style display
    const audioUrl = content[0]?.audioUrl || undefined;
    const repeatCount = content[0]?.repeatCount || 1;

    return (
      <div className="space-y-6">
        {content.length > 0 && (
          <AzkarDisplay
            contentLines={content}
            audioUrl={audioUrl || undefined}
            language={language}
            repeatCount={repeatCount}
            showCounter={type === "azkar"}
          />
        )}
      </div>
    );
  }

  return null;
}
