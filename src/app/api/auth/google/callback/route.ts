import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUserToken } from "@/lib/user-auth";

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${process.env.PORT || 3000}`
  );
}

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=google_not_configured`);
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(`${getBaseUrl()}/login?error=google_failed`);
  }

  let redirect = "/chatbot";
  try {
    if (stateParam) {
      const state = JSON.parse(
        Buffer.from(stateParam, "base64url").toString("utf-8")
      );
      if (state.r && state.r.startsWith("/")) redirect = state.r;
    }
  } catch {
    // ignore invalid state
  }

  try {
    const redirectUri = `${getBaseUrl()}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(`${getBaseUrl()}/login?error=google_failed`);
    }

    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await infoRes.json();

    if (!profile.email || !profile.id) {
      return NextResponse.redirect(`${getBaseUrl()}/login?error=google_failed`);
    }

    const email = profile.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    let user;
    if (existing) {
      user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: profile.name || existing.name,
          picture: profile.picture || existing.picture,
          googleId: existing.googleId || profile.id,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          name: profile.name || email.split("@")[0],
          googleId: profile.id,
          picture: profile.picture || null,
        },
      });
    }

    const token = createUserToken(user.id);
    return NextResponse.redirect(
      `${getBaseUrl()}/auth/callback?token=${encodeURIComponent(token)}&next=${encodeURIComponent(redirect)}`
    );
  } catch (err) {
    console.error("Google callback error:", err);
    return NextResponse.redirect(`${getBaseUrl()}/login?error=google_failed`);
  }
}