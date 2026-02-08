"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface AzkarCounterProps {
  targetCount: number;
  onComplete?: () => void;
}

export function AzkarCounter({ targetCount, onComplete }: AzkarCounterProps) {
  const [count, setCount] = useState(0);
  const isCompleted = count >= targetCount;

  const handleTap = useCallback(() => {
    if (isCompleted) return;
    const newCount = count + 1;
    setCount(newCount);
    if (newCount >= targetCount) {
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200]);
      }
      onComplete?.();
    }
  }, [count, targetCount, isCompleted, onComplete]);

  const handleReset = useCallback(() => {
    setCount(0);
  }, []);

  return (
    <motion.div
      className="flex items-center gap-3"
      animate={isCompleted ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.4 }}
    >
      <motion.button
        onClick={handleTap}
        disabled={isCompleted}
        whileTap={!isCompleted ? { scale: 0.95 } : undefined}
        animate={isCompleted ? { scale: [1, 1.2, 1] } : {}}
        transition={isCompleted ? { duration: 0.4, ease: "easeInOut" } : { type: "spring", stiffness: 400, damping: 15 }}
        className={cn(
          "flex-1 py-4 text-lg font-bold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
          isCompleted
            ? "bg-green-600 text-white cursor-default"
            : "bg-green-500 text-white hover:bg-green-600 active:bg-green-700"
        )}
        aria-label={`Progress: ${count} of ${targetCount}`}
      >
        {isCompleted
          ? `Completed (${targetCount})`
          : `Tap (${count}/${targetCount})`}
      </motion.button>
      {count > 0 && !isCompleted && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          onClick={handleReset}
          className="rounded-lg border border-cream-200 px-3 py-4 text-sm text-beige-400 hover:bg-cream-100 transition-colors"
        >
          Reset
        </motion.button>
      )}
    </motion.div>
  );
}
