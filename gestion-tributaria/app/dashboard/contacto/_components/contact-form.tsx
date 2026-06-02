"use client";

import { useState } from "react";
import { enviarMensaje, actualizarContactoCliente } from "../../../../lib/actions/contacto.actions";
import { Mail, Phone, Save, Loader2 } from "lucide-react";

interface Props {
  email: string;
  telefono: string;
}

export default function ContactForm({ email: emailInicial, telefono: telefonoInicial }: Props) {
  const [email, setEmail] = useState(emailInicial);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [statusContacto, setStatusContacto] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [statusMensaje, setStatusMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  async function handleGuardarContacto(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setStatusContacto(null);

    const res = await actualizarContactoCliente({ email, telefono });
    if (res.success) {
      setStatusContacto({ tipo: "ok", texto: "Datos actualizados correctamente." });
    } else {
      setStatusContacto({ tipo: "error", texto: res.error || "Error al actualizar." });
    }
    setGuardando(false);
  }

  async function handleEnviarMensaje(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setStatusMensaje(null);

    if (!mensaje.trim()) {
      setStatusMensaje({ tipo: "error", texto: "Escribí un mensaje." });
      setEnviando(false);
      return;
    }

    const res = await enviarMensaje(mensaje);
    if (res.success) {
      setStatusMensaje({ tipo: "ok", texto: "Mensaje enviado correctamente." });
      setMensaje("");
    } else {
      setStatusMensaje({ tipo: "error", texto: res.error || "Error al enviar el mensaje." });
    }
    setEnviando(false);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">Información de Contacto</h2>
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2">
            <span className="text-slate-400">Teléfono:</span>
            <span className="font-medium">(0291) 1234-5678</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-slate-400">Email:</span>
            <span className="font-medium">contacto@estudiocontable.com</span>
          </p>
          <p className="flex items-center gap-2">
            <span className="text-slate-400">Dirección:</span>
            <span className="font-medium">Alsina 123, Bahía Blanca</span>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-semibold">Tus datos de contacto</h2>

          {statusContacto && (
            <div
              className={`p-3 rounded-xl text-sm font-medium ${
                statusContacto.tipo === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
              }`}
            >
              {statusContacto.texto}
            </div>
          )}

          <form onSubmit={handleGuardarContacto} className="space-y-3">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Mail className="h-4 w-4 text-slate-400" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Phone className="h-4 w-4 text-slate-400" />
                Teléfono
              </label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="(0291) 1234-5678"
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-brand-dark text-white font-semibold rounded-xl px-4 py-2.5 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar datos
            </button>
          </form>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-3">
          <h2 className="text-lg font-semibold">Enviános tu consulta</h2>

          {statusMensaje && (
            <div
              className={`p-3 rounded-xl text-sm font-medium ${
                statusMensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
              }`}
            >
              {statusMensaje.texto}
            </div>
          )}

          <form onSubmit={handleEnviarMensaje} className="space-y-3">
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribí tu mensaje aquí..."
              rows={4}
              className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-brand-dark text-white font-semibold rounded-xl px-6 py-3 hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? "Enviando..." : "Enviar mensaje"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
