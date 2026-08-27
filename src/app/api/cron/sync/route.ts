import { NextResponse } from "next/server";
import { runScheduledSync } from "@/lib/sync";

// Tahap 9: Endpoint untuk scheduler eksternal (cron-job.org, GitHub Actions, dll).
// Akses via: GET/POST /api/cron/sync?secret=CRON_SECRET
// Keamanan: wajib cocok dengan env CRON_SECRET (bila telah di-set).
export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  const provided =
    url.searchParams.get("secret") ||
    req.headers.get("x-cron-secret") ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  // Bila CRON_SECRET di-set di environment, wajib disertakan.
  if (secret && provided !== secret) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const results = await runScheduledSync();
    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
