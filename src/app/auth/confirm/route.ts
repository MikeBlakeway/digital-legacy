import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { readInviteRedirect } from "@/lib/auth/invite-redirects";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = readEmailOtpType(request.nextUrl.searchParams.get("type"));
  const nextPath = readInviteRedirect(
    request.nextUrl.searchParams.get("redirect_to"),
    request.url,
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
