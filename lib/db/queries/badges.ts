import { db } from "@/lib/db";
import { userBadges } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getAllBadges() {
  return db.query.badges.findMany();
}

export async function getUserBadges(userId: string) {
  return db.query.userBadges.findMany({
    where: eq(userBadges.userId, userId),
    with: { badge: true },
    orderBy: (ub, { desc }) => [desc(ub.earnedAt)],
  });
}

export async function hasUserEarnedBadge(userId: string, badgeId: string) {
  const result = await db.query.userBadges.findFirst({
    where: and(
      eq(userBadges.userId, userId),
      eq(userBadges.badgeId, badgeId)
    ),
  });
  return !!result;
}

export async function awardBadge(userId: string, badgeId: string) {
  const alreadyEarned = await hasUserEarnedBadge(userId, badgeId);
  if (alreadyEarned) return null;

  const [awarded] = await db
    .insert(userBadges)
    .values({ userId, badgeId })
    .returning();
  return awarded;
}
