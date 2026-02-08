"use client";

import { useState } from "react";
import { CourseCard } from "@/components/features/courses/course-card";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface Course {
  id: string;
  title: Record<string, string>;
  description: Record<string, string> | null;
  category: string | null;
  thumbnailUrl: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  estimatedDuration: number | null;
  teacher: { id: string; name: string; avatarUrl: string | null };
  lessons: { id: string }[];
  likes: { id: string }[];
}

interface CourseTabsProps {
  enrolledCourses: Course[];
  likedCourses: Course[];
  createdCourses?: Course[];
  isTeacher?: boolean;
}

export function CourseTabs({
  enrolledCourses,
  likedCourses,
  createdCourses,
  isTeacher,
}: CourseTabsProps) {
  const t = useTranslations("Profile");
  const tabs = [
    { id: "enrolled", label: t("tabs.inProgress"), count: enrolledCourses.length },
    { id: "liked", label: t("tabs.liked"), count: likedCourses.length },
    ...(isTeacher && createdCourses
      ? [{ id: "created", label: t("tabs.created"), count: createdCourses.length }]
      : []),
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "enrolled");

  const activeCourses =
    activeTab === "enrolled"
      ? enrolledCourses
      : activeTab === "liked"
      ? likedCourses
      : createdCourses || [];

  return (
    <div>
      <div className="flex gap-1 rounded-lg bg-cream-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-white text-brown-700 shadow-sm"
                : "text-beige-400 hover:text-brown-600"
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeCourses.length === 0 ? (
          <p className="py-8 text-center text-sm text-beige-400">
            {t("tabs.empty")}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activeCourses.map((course) => (
              <CourseCard
                key={course.id}
                id={course.id}
                title={course.title}
                description={course.description}
                category={course.category}
                thumbnailUrl={course.thumbnailUrl}
                difficulty={course.difficulty}
                teacher={course.teacher}
                lessonCount={course.lessons.length}
                likeCount={course.likes.length}
                estimatedDuration={course.estimatedDuration}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
