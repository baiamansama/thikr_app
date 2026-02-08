import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/actions/auth";
import { getUserProfile } from "@/lib/db/queries/users";
import { getCompletedLessonsCount } from "@/lib/db/queries/progress";
import { ProfileHeader } from "@/components/features/profile/profile-header";
import { StatsCard } from "@/components/features/profile/stats-card";
import { BadgeCollection } from "@/components/features/profile/badge-collection";
import { CourseTabs } from "@/components/features/profile/course-tabs";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { signOut } from "@/lib/actions/auth";

export async function generateMetadata() {
  const t = await getTranslations("Profile");
  return { title: t("metaTitle") };
}

export default async function ProfilePage() {
  const t = await getTranslations("Profile");
  const tCommon = await getTranslations("Common");
  const locale = await getLocale();
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    redirect({ href: "/login", locale });
  }

  if (!user) redirect({ href: "/login", locale });
  const currentUser = user!;

  let profile;
  try {
    profile = await getUserProfile(currentUser.id);
  } catch {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-beige-400">{tCommon("dbNotConnectedShort")}</p>
      </div>
    );
  }

  if (!profile) redirect({ href: "/login", locale });
  const ensuredProfile = profile!;

  const lessonsCompleted = await getCompletedLessonsCount(currentUser.id);

  const enrolledCourses = ensuredProfile.enrollments.map((e) => e.course);
  const likedCourses = ensuredProfile.courseLikes.map((l) => l.course);
  const createdCourses =
    ensuredProfile.role === "teacher"
      ? ensuredProfile.courses.map((c) => ({
          ...c,
          teacher: {
            id: ensuredProfile.id,
            name: ensuredProfile.name,
            avatarUrl: ensuredProfile.avatarUrl,
          },
          likes: [],
          description: null,
          language: null,
          thumbnailUrl: null,
          difficulty: null as "beginner" | "intermediate" | "advanced" | null,
          estimatedDuration: null,
          category: null,
        }))
      : undefined;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-8">
      <ProfileHeader
        name={ensuredProfile.name}
        avatarUrl={ensuredProfile.avatarUrl}
        bio={ensuredProfile.bio}
        role={ensuredProfile.role}
        isOwnProfile
      />

      <StatsCard
        currentStreak={ensuredProfile.streak?.currentStreak ?? 0}
        longestStreak={ensuredProfile.streak?.longestStreak ?? 0}
        lessonsCompleted={lessonsCompleted}
        badgesEarned={ensuredProfile.userBadges.length}
      />

      {ensuredProfile.userBadges.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-brown-700 mb-4 dark:text-foreground">
            {t("badgesTitle")}
          </h2>
          <BadgeCollection userBadges={ensuredProfile.userBadges} />
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-brown-700 mb-4 dark:text-foreground">
          {t("coursesTitle")}
        </h2>
        <CourseTabs
          enrolledCourses={enrolledCourses}
          likedCourses={likedCourses}
          createdCourses={createdCourses}
          isTeacher={ensuredProfile.role === "teacher"}
        />
      </div>

      <form action={signOut}>
        <Button
          type="submit"
          variant="outline"
          className="border-cream-200 text-beige-400 hover:bg-cream-100 hover:text-red-500 dark:text-foreground"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("signOut")}
        </Button>
      </form>
    </div>
  );
}
