import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "../../../lib/prisma";
import { MessageCircle, Inbox } from "lucide-react";
import ChatWindow from "./_components/chat-window";
import ChatInbox from "./_components/chat-inbox";

interface Props {
  searchParams: Promise<{ cuil?: string }>;
}

export default async function ChatPage({ searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const contador = await db.contador.findFirst({ where: { clerk_id: userId } });
  const cliente = await db.cliente.findFirst({ where: { clerk_id: userId } });

  if (!contador && !cliente) redirect("/dashboard");

  // --- CLIENTE: siempre va directo al chat con su contador asignado ---
  if (cliente) {
    if (!cliente.contador) redirect("/dashboard");
    const contadorAsignado = await db.contador.findUnique({
      where: { cuil: cliente.contador },
    });
    const currentStreamId = `cuil-${cliente.cuil}`;
    const otherStreamId = `cuil-${cliente.contador}`;
    const otherNombre =
      `${contadorAsignado?.nombre ?? ""} ${contadorAsignado?.apellido ?? ""}`.trim() ||
      "Contador";
    const ids = [currentStreamId, otherStreamId].sort();
    const channelId = `${ids[0]}-${ids[1]}`;

    return (
      <div>
        <header className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Chat</h1>
            <p className="text-sm text-slate-500">Conversación con {otherNombre}</p>
          </div>
        </header>
        <ChatWindow
          currentStreamId={currentStreamId}
          otherStreamId={otherStreamId}
          channelId={channelId}
        />
      </div>
    );
  }

  // --- CONTADOR ---
  const currentStreamId = `cuil-${contador!.cuil}`;
  const { cuil: clienteCuilParam } = await searchParams;

  // Sin ?cuil → bandeja de entrada
  if (!clienteCuilParam) {
    const clientes = await db.cliente.findMany({
      where: { contador: contador!.cuil },
      select: { cuil: true, nombre: true, apellido: true },
      orderBy: { apellido: "asc" },
    });
    const clientesSerializados = clientes.map((c) => ({
      cuil: String(c.cuil),
      nombre: c.nombre,
      apellido: c.apellido,
    }));

    return (
      <div>
        <header className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mensajes</h1>
            <p className="text-sm text-slate-500">Conversaciones con tus clientes</p>
          </div>
        </header>
        <ChatInbox currentStreamId={currentStreamId} clientes={clientesSerializados} />
      </div>
    );
  }

  // Con ?cuil → chat con un cliente específico
  const clienteDB = await db.cliente.findUnique({
    where: { cuil: BigInt(clienteCuilParam), contador: contador!.cuil },
  });
  if (!clienteDB) redirect("/dashboard/clientes");

  const otherStreamId = `cuil-${clienteCuilParam}`;
  const otherNombre =
    `${clienteDB.nombre ?? ""} ${clienteDB.apellido ?? ""}`.trim() || "Cliente";
  const ids = [currentStreamId, otherStreamId].sort();
  const channelId = `${ids[0]}-${ids[1]}`;

  return (
    <div>
      <header className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chat</h1>
          <p className="text-sm text-slate-500">Conversación con {otherNombre}</p>
        </div>
      </header>
      <ChatWindow
        currentStreamId={currentStreamId}
        otherStreamId={otherStreamId}
        channelId={channelId}
      />
    </div>
  );
}
