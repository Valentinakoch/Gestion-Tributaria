"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, User, Mail, Phone, Hash,
  CheckCircle, AlertTriangle, Calendar, DollarSign,
  ChevronLeft, ChevronRight, Pencil,
} from "lucide-react";

interface Liquidacion {
  id: string;
  impuesto: string;
  periodo: string;
  periodoDate: string | null;
  importe: number;
  estado: "PAGADO" | "PENDIENTE";
}

interface Cliente {
  cuil: string;
  nombre: string;
  email: string;
  telefono: string;
}

interface Props {
  cliente: Cliente;
  liquidaciones: Liquidacion[];
}

const PAGE_SIZE = 8;

export default function ClienteDetalle({ cliente, liquidaciones }: Props) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "PENDIENTE" | "PAGADO">("todos");

  const pendientes = liquidaciones.filter((l) => l.estado === "PENDIENTE");
  const totalPendiente = pendientes.reduce((s, l) => s + l.importe, 0);

  const proxVencimiento = pendientes.length > 0
    ? pendientes
        .filter((l) => l.periodoDate)
        .sort((a, b) => new Date(a.periodoDate!).getTime() - new Date(b.periodoDate!).getTime())[0]
        ?.periodo ?? null
    : null;

  const filtered = filtroEstado === "todos"
    ? liquidaciones
    : liquidaciones.filter((l) => l.estado === filtroEstado);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goTo(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => router.push("/dashboard/clientes")}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a clientes
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{cliente.nombre}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Ficha del cliente</p>
          </div>
          <button
            onClick={() => router.push(`/dashboard/clientes/${cliente.cuil}/editar`)}
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Editar datos
          </button>
        </div>
      </div>

      {/* Datos personales */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Datos personales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Hash className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">CUIL</p>
              <p className="text-sm font-semibold text-slate-800 font-mono">{cliente.cuil}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <User className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Nombre completo</p>
              <p className="text-sm font-semibold text-slate-800">{cliente.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm font-semibold text-slate-800">{cliente.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Teléfono</p>
              <p className="text-sm font-semibold text-slate-800">{cliente.telefono}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`bg-white border rounded-2xl shadow-sm p-5 flex items-center gap-4 ${totalPendiente > 0 ? "border-red-200" : "border-emerald-200"}`}>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${totalPendiente > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
            <DollarSign className={`h-5 w-5 ${totalPendiente > 0 ? "text-red-500" : "text-emerald-500"}`} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total pendiente</p>
            <p className={`text-xl font-bold ${totalPendiente > 0 ? "text-red-700" : "text-emerald-700"}`}>
              ${totalPendiente.toLocaleString("es-AR")}
            </p>
          </div>
        </div>
        <div className={`bg-white border rounded-2xl shadow-sm p-5 flex items-center gap-4 ${proxVencimiento ? "border-amber-200" : "border-emerald-200"}`}>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${proxVencimiento ? "bg-amber-50" : "bg-emerald-50"}`}>
            <Calendar className={`h-5 w-5 ${proxVencimiento ? "text-amber-600" : "text-emerald-500"}`} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Próximo vencimiento</p>
            <p className={`text-xl font-bold ${proxVencimiento ? "text-amber-700" : "text-emerald-700"}`}>
              {proxVencimiento ?? "Sin vencimientos"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla liquidaciones */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Liquidaciones</h2>
          <div className="flex items-center gap-2">
            {(["todos", "PENDIENTE", "PAGADO"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFiltroEstado(f); setPage(1); }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  filtroEstado === f
                    ? "bg-brand-dark text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {f === "todos" ? "Todos" : f === "PENDIENTE" ? "Pendientes" : "Pagados"}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Impuesto</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Período</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Importe</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <p className="text-slate-400 text-sm">No hay liquidaciones{filtroEstado !== "todos" ? " con ese filtro" : ""}.</p>
                </td>
              </tr>
            ) : (
              paginated.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-800">{l.impuesto}</td>
                  <td className="px-6 py-4 text-slate-500 capitalize">{l.periodo}</td>
                  <td className="px-6 py-4 text-right font-semibold text-slate-800">
                    ${l.importe.toLocaleString("es-AR")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      l.estado === "PAGADO"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                    }`}>
                      {l.estado === "PAGADO"
                        ? <CheckCircle className="h-3 w-3" />
                        : <AlertTriangle className="h-3 w-3" />}
                      {l.estado === "PAGADO" ? "Pagado" : "Pendiente"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-400">{filtered.length} registros</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goTo(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-slate-600 px-2">Página {page} de {totalPages}</span>
              <button
                onClick={() => goTo(page + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
