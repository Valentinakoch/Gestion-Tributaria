"use client";

import { useEffect, useState } from "react";
import { StreamChat, Channel as StreamChannel } from "stream-chat";
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageComposer,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import "stream-chat-react/dist/css/index.css";

interface Props {
  currentStreamId: string;
  otherStreamId: string;
  channelId: string;
}

export default function ChatWindow({ currentStreamId, otherStreamId, channelId }: Props) {
  const [client, setClient] = useState<StreamChat | null>(null);
  const [channel, setChannel] = useState<StreamChannel | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const res = await fetch(`/api/mensajes/token?other=${otherStreamId}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (active) setError(`Token error ${res.status}: ${body?.error?.message ?? "sin detalle"}`);
          return;
        }
        const data = await res.json();
        const { token, userId, nombre, channelId: serverChannelId } = data;
        if (!token || !userId || !serverChannelId) {
          if (active) setError(`Respuesta inválida: ${JSON.stringify(data)}`);
          return;
        }

        const sc = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!);
        if (!sc.userID) {
          await sc.connectUser({ id: userId, name: nombre }, token);
        }

        if (!active) return;

        const ch = sc.channel("messaging", serverChannelId);
        await ch.watch();

        if (active) {
          setClient(sc);
          setChannel(ch);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : String(e));
      }
    }

    init();

    return () => {
      active = false;
    };
  }, [channelId, currentStreamId, otherStreamId]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500 text-sm">
        {error}
      </div>
    );
  }

  if (!client || !channel) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400 text-sm">
        Cargando chat...
      </div>
    );
  }

  return (
    <div className="h-[70vh] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <Chat client={client}>
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageComposer />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}
