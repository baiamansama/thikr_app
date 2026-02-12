import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import { safeRedirectPath, getCanonicalSiteUrl } from "@/lib/url";
import type { EmailOtpType } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeRedirectPath(url.searchParams.get("next"), "/");

  // In dev, rely on request origin. In prod, prefer canonical.
  const origin = url.origin;
  const isLocalEnv = process.env.NODE_ENV === "development";
  const canonical = getCanonicalSiteUrl();
  const base = isLocalEnv ? origin : (canonical ?? origin);

  // Enforce canonical host before verifying OTP so cookies land on the right domain.
  if (!isLocalEnv && canonical) {
    const c = new URL(canonical);
    if (url.hostname !== c.hostname || url.protocol !== c.protocol) {
      return NextResponse.redirect(
        new URL(`${c.origin}/auth/confirm${url.search}`)
      );
    }
  }

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL(`/login?error=confirm`, base));
  }

  const response = NextResponse.redirect(new URL(next, base));
  const supabase = createRouteHandlerClient(request, response);

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash,
    // supabase-js expects EmailOtpType, but query param is string.
    type: type as EmailOtpType,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=confirm`, base));
  }

  // Ensure the app DB user exists for email confirmation flows as well.
  try {
    const authUser = data.user;
    if (authUser) {
      const { getUserByAuthId, createUser } = await import("@/lib/db/queries/users");
      const existing = await getUserByAuthId(authUser.id);
      if (!existing) {
        const name =
          (authUser.user_metadata?.full_name as string | undefined) ??
          (authUser.email?.split("@")[0] ?? "User");
        await createUser({
          authId: authUser.id,
          name,
          avatarUrl: authUser.user_metadata?.avatar_url as string | undefined,
        });
      }
    }
  } catch {
    // Ignore DB/auth issues; confirmation should still succeed.
  }

  return response;
}
