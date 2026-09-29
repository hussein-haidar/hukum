import { NextResponse } from "next/server";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`
  );
}

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { success: false, message: "Google login belum dikonfigurasi" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const redirect = searchParams.get("redirect") || "/chatbot";
  const safeRedirect = redirect.startsWith("/") && !redirect.startsWith("//") ? redirect : "/chatbot";
  const state = Buffer.from(JSON.stringify({ r: safeRedirect })).toString("base64url");

  const redirectUri = `${getBaseUrl()}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}