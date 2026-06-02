import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getSafeRelativePath } from "@/lib/redirects";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_AUTH_REDIRECT = "/capture";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = readEmailOtpType(request.nextUrl.searchParams.get("type"));
  const nextPath = getSafeRelativePath(
    request.nextUrl.searchParams.get("next"),
    DEFAULT_AUTH_REDIRECT,
  );

  if (!tokenHash || !type) {
    return createExpiredLinkRedirect(request);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error) {
    return createExpiredLinkRedirect(request);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}

function readEmailOtpType(value: string | null): EmailOtpType | null {
  return value;
}

function createExpiredLinkRedirect(request: NextRequest): NextResponse {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "link_expired");

  return NextResponse.redirect(loginUrl);
}
