"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { Button } from "@/components/ui/button";
import { useSearchParams, useRouter } from "next/navigation";

interface Article {
  id: string;
  title: {
    english: string;
    русский: string;
    кыргыз: string;
    عربي: string;
  };
  path: {
    english: string;
    русский: string;
    кыргыз: string;
    عربي: string;
  };
}

const articlesTranslation: { [key: string]: string } = {
  english: "Articles",
  русский: "Статьи",
  кыргыз: "Макалалар",
  عربي: "مقالات",
};

export default function Articles({ language }: { language: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedArticle, setSelectedArticle] = useState<string | null>(
    searchParams.get("article") || null
  );
  const [markdownContent, setMarkdownContent] = useState("");
  const [articles] = useState<Article[]>([
    {
      id: "tarawih",
      title: {
        english: "Taraweeh Prayer",
        русский: "Намаз Таравих",
        кыргыз: "Таравих намазы",
        عربي: "صلاة التراويح",
      },
      path: {
        english: "content/tarawih_en.md",
        русский: "content/tarawih_ru.md",
        кыргыз: "content/tarawih_ky.md",
        عربي: "content/tarawih_ar.md",
      },
    },
    // Add more articles here as needed
  ]);

  useEffect(() => {
    if (selectedArticle) {
      const article = articles.find((a) => a.id === selectedArticle);
      if (article) {
        fetch(
          `/${
            article.path[language as keyof typeof article.path] ||
            article.path.english
          }`
        )
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch article");
            return res.text();
          })
          .then((text) => setMarkdownContent(text))
          .catch((err) => console.error(err));
      }
    }
  }, [selectedArticle, language]);

  if (selectedArticle) {
    return (
      <div
        className="container mx-auto px-4 py-6 max-w-3xl transition-colors"
        style={{ paddingBottom: "80px" }}
      >
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedArticle(null);
              router.push("/?view=articles");
            }}
            className="bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--card-border)] hover:bg-[var(--card-bg)]/80 p-2 rounded-full"
          >
            <span className="material-icons-round text-xl">arrow_back</span>
          </Button>
        </div>
        <header className="mb-8 text-center py-4">
          <h1
            className="text-4xl font-extrabold text-[var(--card-text)]"
            dir={language === "عربي" ? "rtl" : "ltr"}
          >
            {articles.find((a) => a.id === selectedArticle)?.title[
              language as keyof Article["title"]
            ] || articles.find((a) => a.id === selectedArticle)?.title.english}
          </h1>
        </header>
        <div
          className="prose prose-lg bg-[var(--card-bg)] text-[var(--card-text)] p-6 rounded-lg shadow-md border border-[var(--card-border)]"
          dir={language === "عربي" ? "rtl" : "ltr"}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug]}
            components={{
              h1: ({ ...props }) => (
                <h1
                  {...props}
                  className="text-3xl font-bold my-4 text-[var(--card-text)]"
                />
              ),
              h2: ({ ...props }) => (
                <h2
                  {...props}
                  className="text-2xl font-semibold my-3 text-[var(--card-text)]"
                />
              ),
              p: ({ ...props }) => (
                <p
                  {...props}
                  className="text-lg leading-relaxed my-2 text-[var(--card-text)]"
                />
              ),
              ul: ({ ...props }) => (
                <ul
                  {...props}
                  className="list-disc list-inside my-4 text-[var(--card-text)]"
                />
              ),
              li: ({ ...props }) => (
                <li {...props} className="my-1 text-[var(--card-text)]" />
              ),
              blockquote: ({ ...props }) => (
                <blockquote
                  {...props}
                  className="border-l-4 border-[var(--card-border)] pl-4 my-4 italic text-[var(--card-text)]"
                />
              ),
            }}
          >
            {markdownContent}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto px-4 py-6 max-w-3xl transition-colors"
      style={{ paddingBottom: "80px" }}
    >
      <div className="fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          onClick={() => router.push("/")}
          className="bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--card-border)] hover:bg-[var(--card-bg)]/80 p-2 rounded-full"
        >
          <span className="material-icons-round text-xl">arrow_back</span>
        </Button>
      </div>
      <header className="mb-8 text-center py-4">
        <h1
          className="text-4xl font-extrabold text-[var(--card-text)]"
          dir={language === "عربي" ? "rtl" : "ltr"}
        >
          {articlesTranslation[language] || "Articles"}
        </h1>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((article) => (
          <Button
            key={article.id}
            variant="outline"
            onClick={() => {
              setSelectedArticle(article.id);
              router.push(`/?view=articles&article=${article.id}`);
            }}
            className="bg-[var(--card-bg)] text-[var(--card-text)] border-[var(--card-border)] hover:bg-[var(--card-bg)]/80 p-6 rounded-lg shadow-md h-full flex items-center justify-center text-center"
            dir={language === "عربي" ? "rtl" : "ltr"}
          >
            {article.title[language as keyof Article["title"]] ||
              article.title.english}
          </Button>
        ))}
      </div>
    </div>
  );
}
