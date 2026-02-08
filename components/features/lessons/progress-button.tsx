"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { markLessonComplete } from "@/lib/actions/progress";
import { cn } from "@/lib/utils";

interface ProgressButtonProps {
  lessonId: string;
  courseId: string;
  isCompleted: boolean;
}

export function ProgressButton({
  lessonId,
  courseId,
  isCompleted,
}: ProgressButtonProps) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (isCompleted) return;
    startTransition(async () => {
      await markLessonComplete(lessonId, courseId);
    });
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isCompleted || isPending}
      className={cn(
        "gap-2",
        isCompleted
          ? "bg-green-500 text-white cursor-default"
          : "bg-green-500 hover:bg-green-600 text-white"
      )}
    >
      <Check className="h-4 w-4" />
      {isPending
        ? "Saving..."
        : isCompleted
        ? "Completed"
        : "Mark as Complete"}
    </Button>
  );
}
