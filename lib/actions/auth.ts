"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createUser, getUserByAuthId } from "@/lib/db/queries/users";
import { getCanonicalSiteUrl, getRequestOrigin } from "@/lib/url";

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    await createUser({
      authId: data.user.id,
      name,
    });
  }

  redirect("/");
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Ensure user exists in our DB
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (authUser) {
    const existing = await getUserByAuthId(authUser.id);
    if (!existing) {
      await createUser({
        authId: authUser.id,
        name: authUser.email?.split("@")[0] ?? "User",
        avatarUrl: authUser.user_metadata?.avatar_url,
      });
    }
  }

  redirect("/");
}

export async function signInWithGoogle() {
  const supabase = await createClient();

  const baseUrl = getCanonicalSiteUrl() ?? (await getRequestOrigin()) ?? "http://localhost:3000";
  const redirectTo = new URL("/api/auth/callback", baseUrl).toString();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  let dbUser = await getUserByAuthId(authUser.id);
  if (!dbUser) {
    dbUser = await createUser({
      authId: authUser.id,
      name:
        authUser.user_metadata?.full_name ??
        authUser.email?.split("@")[0] ??
        "User",
      avatarUrl: authUser.user_metadata?.avatar_url,
    });
  }

  return dbUser;
}
