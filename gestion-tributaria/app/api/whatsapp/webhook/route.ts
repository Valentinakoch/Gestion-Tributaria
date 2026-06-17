import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { telefonoRemitente, texto } = body;

  if (!telefonoRemitente || !texto) {
    return NextResponse.json(
      { error: { code: "ESTRUCTURA_INVALIDA", message: "Los campos telefonoRemitente y texto son requeridos." } },
      { status: 400 }
    );
  }

  const cliente = await db.cliente.findFirst({
    where: { telefono: String(telefonoRemitente) },
  });

  if (!cliente) {
    return NextResponse.json(
      { error: { code: "USUARIO_NO_REGISTRADO", message: "El teléfono remitente no corresponde a ningún usuario activo." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
