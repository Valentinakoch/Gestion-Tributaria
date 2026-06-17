"use client";

import { useEffect, useRef, useState } from "react";
import { StreamChat } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageComposer,
  MessageList,
  Thread,
  useChatContext,
  Window,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";
import { MessageSquare, Plus } from "lucide-react";

interface ClienteItem {
  cuil: string;
  nombre: string | null;
  apellido: string | null;
}

function NewConversationButton({ clientes }: { clientes: ClienteItem[] }) {
  const { client, setActiveChannel } = useChatContext();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function openChat(clienteCuil: string) {
    setLoading(clienteCuil);
    try {
      const res = await fetch(`/api/mensajes/token?other=cuil-${clienteCuil}`);
      if (!res.ok) return;
      const { channelId } = await res.json();
      if (!channelId) return;
      const ch = client.channel("messaging", channelId);
      await ch.watch();
      setActiveChannel(ch);
    } finally {
      setLoading(null);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative p-3 border-b border-slate-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-brand-dark px-4 py-2 rounded-xl hover:opacity-90 transition-opacity"
      >
        <Plus className="h-4 w-4" />
        Nueva conversación
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-[calc(100%-4px)] bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
          {clientes.length === 0 ? (
            <p className="text-xs text-slate-400 p-4 text-center">Sin clientes asignados</p>
          ) : (
            <ul className="max-h-60 overflow-y-auto">
              {clientes.map((c) => {
                const nombre = `${c.nombre ?? ""} ${c.apellido ?? ""}`.trim() || "Sin nombre";
                const inicial = (c.nombre?.[0] ?? "?").toUpperCase();
                return (
                  <li key={c.cuil}>
                    <button
                      onClick={() => openChat(c.cuil)}
                      disabled={loading === c.cuil}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 transition-colors flex items-center gap-3 disabled:opacity-50"
                    >
                      <div className="h-8 w-8 rounded-full bg-brand-dark/10 flex items-center justify-center text-brand-dark font-semibold text-xs shrink-0">
                        {inicial}
                      </div>
                      <span className="font-medium text-slate-800">{nombre}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function RightPanel() {
  const { channel } = useChatContext();

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
        <MessageSquare className="h-10 w-10 opacity-20" />
        <p className="text-sm">Seleccioná una conversación</p>
      </div>
    );
  }

  return (
    <Channel>
      <Window>
        <ChannelHeader />
        <MessageList />
        <MessageComposer />
      </Window>
      <Thread />
    </Channel>
  );
}

interface Props {
  currentStreamId: string;
  clientes: ClienteItem[];
}

export default function ChatInbox({ currentStreamId, clientes }: Props) {
  const [streamClient, setStreamClient] = useState<StreamChat | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const res = await fetch("/api/mensajes/token");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (active) setError(`Error ${res.status}: ${body?.error?.message ?? "sin detalle"}`);
          return;
        }
        const { token, userId, nombre } = await res.json();
        if (!token || !userId) {
          if (active) setError("Respuesta inválida del servidor.");
          return;
        }
        const sc = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!);
        if (!sc.userID) {
          await sc.connectUser({ id: userId, name: nombre }, token);
        }
        if (active) setStreamClient(sc);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      }
    }

    init();
    return () => { active = false; };
  }, [currentStreamId]);

  if (error) {
    return <div className="flex items-center justify-center h-96 text-red-500 text-sm">{error}</div>;
  }
  if (!streamClient) {
    return <div className="flex items-center justify-center h-96 text-slate-400 text-sm">Cargando bandeja...</div>;
  }

  const filters = { type: "messaging" as const, members: { $in: [currentStreamId] } };
  const sort = [{ last_message_at: -1 as const }];

  return (
    <div className="h-[75vh] rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex">
      <Chat client={streamClient}>
        <div className="w-72 flex-shrink-0 border-r border-slate-200 bg-slate-50 flex flex-col">
          <NewConversationButton clientes={clientes} />
          <div className="flex-1 overflow-y-auto">
            <ChannelList filters={filters} sort={sort} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <RightPanel />
        </div>
      </Chat>
    </div>
  );
}
