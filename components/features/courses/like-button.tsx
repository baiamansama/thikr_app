"use client";

import { useOptimistic, useTransition } from "react";
import { Heart } from "lucide-react";
import { toggleCourseLike } from "@/lib/actions/courses";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  courseId: string;
  initialLiked: boolean;
  likeCount: number;
}

export function LikeButton({ courseId, initialLiked, likeCount }: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticLiked, setOptimisticLiked] = useOptimistic(initialLiked);
  const [optimisticCount, setOptimisticCount] = useOptimistic(likeCount);

  function handleClick() {
    startTransition(async () => {
      setOptimisticLiked(!optimisticLiked);
      setOptimisticCount(optimisticLiked ? likeCount - 1 : likeCount + 1);
      await toggleCourseLike(courseId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
        optimisticLiked
          ? "bg-red-50 text-red-500"
          : "bg-cream-100 text-beige-400 hover:text-red-400"
      )}
    >
      <Heart
        className={cn("h-4 w-4", optimisticLiked && "fill-current")}
      />
      <span>{optimisticCount}</span>
    </button>
  );
}
