import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";
import { getCanonicalSiteUrl, safeRedirectPath } from "@/lib/url";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"), "/");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const base = isLocalEnv ? origin : (getCanonicalSiteUrl() ?? origin);

  if (code) {
    const response = NextResponse.redirect(new URL(next, base));
    const supabase = createRouteHandlerClient(request, response);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return response;
  }

  return NextResponse.redirect(new URL("/login?error=auth", base));
}
