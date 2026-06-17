import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { StreamChat } from "stream-chat";
import { db } from "../../../../lib/prisma";


export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "NO_AUTORIZADO", message: "Token JWT ausente." } },
      { status: 401 }
    );
  }

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
  const cliente = await db.cliente.findFirst({ where: { clerk_id: userId } });

  if (!contador && !cliente) {
    return NextResponse.json(
      { error: { code: "USUARIO_NO_REGISTRADO", message: "Usuario no encontrado." } },
      { status: 404 }
    );
  }

  const cuil = contador ? String(contador.cuil) : String(cliente!.cuil);
  const nombre = contador
    ? `${contador.nombre ?? ""} ${contador.apellido ?? ""}`.trim()
    : `${cliente!.nombre ?? ""} ${cliente!.apellido ?? ""}`.trim();

  const streamUserId = `cuil-${cuil}`;
  const { searchParams } = new URL(req.url);
  const otherStreamId = searchParams.get("other");

  let otherNombre: string | null = null;
  if (otherStreamId?.startsWith("cuil-")) {
    const otherCuil = BigInt(otherStreamId.slice(5));
    const otherContador = await db.contador.findFirst({ where: { cuil: otherCuil } });
    const otherCliente = await db.cliente.findFirst({ where: { cuil: otherCuil } });
    if (otherContador) {
      otherNombre = `${otherContador.nombre ?? ""} ${otherContador.apellido ?? ""}`.trim() || null;
    } else if (otherCliente) {
      otherNombre = `${otherCliente.nombre ?? ""} ${otherCliente.apellido ?? ""}`.trim() || null;
    }
  }

  try {
    const serverClient = new StreamChat(
      process.env.STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );

    await serverClient.upsertUsers([
      { id: streamUserId, name: nombre || streamUserId },
      ...(otherStreamId ? [{ id: otherStreamId, name: otherNombre || otherStreamId }] : []),
    ]);

    const token = serverClient.createToken(streamUserId);

    let channelId: string | null = null;
    if (otherStreamId) {
      const ids = [streamUserId, otherStreamId].sort();
      channelId = `${ids[0]}-${ids[1]}`;
      const channel = serverClient.channel("messaging", channelId, {
        members: [streamUserId, otherStreamId],
        created_by_id: streamUserId,
      });
      await channel.create();
    }

    return NextResponse.json({ token, userId: streamUserId, nombre, channelId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: { code: "STREAM_ERROR", message: msg } }, { status: 500 });
  }
}
