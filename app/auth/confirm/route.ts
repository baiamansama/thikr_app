import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import { safeRedirectPath, getCanonicalSiteUrl } from "@/lib/url";
import type { EmailOtpType } from "@supabase/supabase-js";

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

  const { error } = await supabase.auth.verifyOtp({
    token_hash,
    // supabase-js expects EmailOtpType, but query param is string.
    type: type as EmailOtpType,
  });

  if (error) {
    return NextResponse.redirect(new URL(`/login?error=confirm`, base));
  }

  return response;
}
