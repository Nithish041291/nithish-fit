import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { summarizeDailyEnergy, type HealthExportPayload } from "@/lib/health/parseHealthExport";

/** Never statically cached/prerendered — every call must read the current env vars and hit
 * Supabase live. */
export const dynamic = "force-dynamic";

/**
 * Webhook receiver for the "Health Auto Export" iOS app's REST API automation, which reads
 * Apple Watch / Health data on-device and POSTs it here on a schedule. Single-user app, so
 * auth is a shared-secret token rather than a full account system — see README.md "Apple
 * Watch calorie sync" for the exact setup steps and required env vars.
 */
export async function POST(req: NextRequest) {
  const expectedToken = process.env.HEALTH_IMPORT_SECRET;
  const userId = process.env.HEALTH_IMPORT_USER_ID;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!expectedToken || !userId || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Health import is not configured on the server." }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
  const providedToken = bearerToken ?? req.nextUrl.searchParams.get("token");
  if (providedToken !== expectedToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: HealthExportPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const totals = summarizeDailyEnergy(payload);
  if (totals.length === 0) {
    return NextResponse.json({ imported: 0 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const syncedAt = new Date().toISOString();
  const rows = totals.map((t) => ({
    user_id: userId,
    date: t.date,
    active_energy_kcal: t.activeEnergyKcal,
    resting_energy_kcal: t.restingEnergyKcal,
    source: "apple_health",
    synced_at: syncedAt,
  }));

  const { error } = await supabase.from("daily_energy_logs").upsert(rows, { onConflict: "user_id,date" });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ imported: totals.length, dates: totals.map((t) => t.date) });
}
