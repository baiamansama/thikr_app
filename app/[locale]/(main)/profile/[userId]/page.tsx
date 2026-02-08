import { notFound } from "next/navigation";
import { getUserProfile } from "@/lib/db/queries/users";
import { getCompletedLessonsCount } from "@/lib/db/queries/progress";
import { ProfileHeader } from "@/components/features/profile/profile-header";
import { StatsCard } from "@/components/features/profile/stats-card";
import { BadgeCollection } from "@/components/features/profile/badge-collection";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  try {
    const profile = await getUserProfile(userId);
    const name = profile?.name || "Profile";
    const description = profile?.bio || `${name}'s profile on Thikr`;
    return {
      title: `${name} | Thikr`,
      description,
      openGraph: {
        title: `${name} | Thikr`,
        description,
      },
    };
  } catch {
    return { title: "Profile | Thikr" };
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const t = await getTranslations("Profile");
  const tCommon = await getTranslations("Common");
  const { userId } = await params;

  let profile;
  try {
    profile = await getUserProfile(userId);
  } catch {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-beige-400">{tCommon("dbNotConnectedShort")}</p>
      </div>
    );
  }

  if (!profile) notFound();

  const lessonsCompleted = await getCompletedLessonsCount(userId);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
      <ProfileHeader
        name={profile.name}
        avatarUrl={profile.avatarUrl}
        bio={profile.bio}
        role={profile.role}
      />

      <StatsCard
        currentStreak={profile.streak?.currentStreak ?? 0}
        longestStreak={profile.streak?.longestStreak ?? 0}
        lessonsCompleted={lessonsCompleted}
        badgesEarned={profile.userBadges.length}
      />

      {profile.userBadges.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-brown-700 mb-4 dark:text-foreground">
            {t("badgesTitle")}
          </h2>
          <BadgeCollection userBadges={profile.userBadges} />
        </div>
      )}
    </div>
  );
}
