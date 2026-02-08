import { CourseCard } from "./course-card";

interface Course {
  id: string;
  title: Record<string, string>;
  description: Record<string, string> | null;
  category: string | null;
  language: string | null;
  difficulty: "beginner" | "intermediate" | "advanced" | null;
  thumbnailUrl: string | null;
  estimatedDuration: number | null;
  teacher: { id: string; name: string; avatarUrl: string | null };
  lessons: { id: string }[];
  likes: { id: string }[];
}

interface CourseGridProps {
  courses: Course[];
  emptyMessage?: string;
}

export function CourseGrid({ courses, emptyMessage }: CourseGridProps) {
  if (courses.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-beige-400">
          {emptyMessage ?? "No courses found."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => (
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
  );
}
