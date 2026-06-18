import { NextRequest, NextResponse } from "next/server";
import { notificarLiquidacionesPorVencer } from "../../../../lib/notificaciones/vencimientos-email";

function esRequestAutorizado(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  const esVercelCron = request.headers.get("user-agent")?.includes("vercel-cron") ?? false;

  if (cronSecret && authorization) {
    return authorization === `Bearer ${cronSecret}`;
  }

  return esVercelCron;
}

export async function GET(request: NextRequest) {
  if (!esRequestAutorizado(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const resultado = await notificarLiquidacionesPorVencer();

  return NextResponse.json({
    ok: true,
    ...resultado,
  });
}
