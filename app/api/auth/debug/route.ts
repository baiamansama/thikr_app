import { NextResponse, type NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route";

export async function GET(request: NextRequest) {
  // Never expose auth cookie/session details in production.
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const response = NextResponse.json({});
  const supabase = createRouteHandlerClient(request, response);

  const cookieNames = request.cookies.getAll().map((c) => c.name).sort();
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto");

  const [{ data: userData, error: userError }, { data: claimsData, error: claimsError }] =
    await Promise.all([supabase.auth.getUser(), supabase.auth.getClaims()]);

  return NextResponse.json({
    host,
    proto,
    cookieNames,
    auth: {
      userId: userData.user?.id ?? null,
      email: userData.user?.email ?? null,
      userError: userError?.message ?? null,
      claimsError: claimsError?.message ?? null,
      hasClaims: Boolean(claimsData),
    },
  });
}

