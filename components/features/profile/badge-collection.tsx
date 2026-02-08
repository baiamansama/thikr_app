"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Award } from "lucide-react";

interface Badge {
  id: string;
  name: Record<string, string>;
  description?: Record<string, string> | null;
  iconUrl?: string | null;
}

interface UserBadge {
  badge: Badge;
  earnedAt: Date;
}

interface BadgeCollectionProps {
  userBadges: UserBadge[];
}

export function BadgeCollection({ userBadges }: BadgeCollectionProps) {
  if (userBadges.length === 0) {
    return (
      <div className="py-8 text-center">
        <Award className="mx-auto h-12 w-12 text-cream-200" />
        <p className="mt-3 text-sm text-beige-400">
          No badges earned yet. Complete courses and maintain streaks to earn badges!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {userBadges.map(({ badge, earnedAt }, index) => {
        const displayName = badge.name.en || badge.name.ar || "Badge";
        const displayDesc = badge.description?.en || badge.description?.ar;

        return (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            whileHover={{ scale: 1.03 }}
            className="flex flex-col items-center rounded-xl border border-cream-200 bg-cream-100 p-4 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
              {badge.iconUrl ? (
                <Image
                  src={badge.iconUrl}
                  alt={displayName}
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
              ) : (
                <Award className="h-6 w-6 text-gold" />
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-brown-700">
              {displayName}
            </p>
            {displayDesc && (
              <p className="mt-1 text-xs text-beige-400 line-clamp-2">
                {displayDesc}
              </p>
            )}
            <p className="mt-2 text-xs text-beige-400">
              {new Date(earnedAt).toLocaleDateString()}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
