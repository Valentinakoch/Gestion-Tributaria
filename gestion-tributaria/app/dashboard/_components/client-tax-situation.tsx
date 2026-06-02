"use client";

import { useState } from "react";
import { BarChart3, CheckCircle, AlertTriangle, ArrowLeft, CreditCard, ChevronLeft, ChevronRight, Search, Calendar } from "lucide-react";
import CustomSelect from "@/components/custom-select";

interface Liquidacion {
  id: string;
  impuesto: string;
  periodo: string;
  monto: number;
  estado: "PAGADO" | "PENDIENTE";
  fechaVencimiento: string;
}

interface Props {
  clienteName: string;
  liquidaciones: Liquidacion[];
}

const PAGE_SIZE = 5;

export default function ClientTaxSituation({ clienteName, liquidaciones }: Props) {
  const [selectedLiquidacion, setSelectedLiquidacion] = useState<Liquidacion | null>(null);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroImpuesto, setFiltroImpuesto] = useState<string>("todos");
  const [page, setPage] = useState(1);

  const pendientes = liquidaciones.filter((l) => l.estado === "PENDIENTE");
  const tienePendientes = pendientes.length > 0;

  const totalPendiente = liquidaciones.filter((l) => l.estado === "PENDIENTE").reduce((s, l) => s + l.monto, 0);

  function parseFechaDDMMAAAA(f: string): Date {
    const [d, m, a] = f.split("/").map(Number);
    return new Date(a, m - 1, d);
  }

  const proxVencimiento = pendientes.length > 0
    ? pendientes.reduce((a, b) =>
        parseFechaDDMMAAAA(a.fechaVencimiento) < parseFechaDDMMAAAA(b.fechaVencimiento) ? a : b
      ).fechaVencimiento
    : null;

  const impuestosUnicos = [...new Set(liquidaciones.map((l) => l.impuesto))].sort();
  const opcionesImpuesto = [
    { value: "todos", label: "Todos los impuestos" },
    ...impuestosUnicos.map((i) => ({ value: i, label: i })),
  ];

  const filtered = liquidaciones.filter((l) => {
    const matchesSearch = l.impuesto.toLowerCase().includes(search.toLowerCase());
    const matchesEstado = filtroEstado === "todos" || l.estado === filtroEstado;
    const matchesImpuesto = filtroImpuesto === "todos" || l.impuesto === filtroImpuesto;
    return matchesSearch && matchesEstado && matchesImpuesto;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goTo(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push("...");
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
        pages.push(i);
      }
      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  if (selectedLiquidacion) {
    return (
      <div>
      <header className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Detalle de Liquidación</h1>
          <p className="text-sm text-slate-500">{selectedLiquidacion.impuesto}</p>
        </div>
      </header>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 max-w-xl space-y-6">
          <button
            onClick={() => setSelectedLiquidacion(null)}
            className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {selectedLiquidacion.impuesto} {selectedLiquidacion.periodo}
            </h2>
            <p className="text-xs text-slate-400">ID: {selectedLiquidacion.id}</p>
          </div>
          <div className="border-t pt-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Impuesto:</span>
              <span className="font-medium text-slate-800">{selectedLiquidacion.impuesto}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Período:</span>
              <span className="font-medium text-slate-800">{selectedLiquidacion.periodo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Vencimiento:</span>
              <span className="font-medium text-slate-800">{selectedLiquidacion.fechaVencimiento}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Estado:</span>
              <span
                className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                  selectedLiquidacion.estado === "PAGADO"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {selectedLiquidacion.estado === "PAGADO" ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {selectedLiquidacion.estado}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-dashed">
              <span className="text-slate-900 font-bold">Importe Total:</span>
              <span className="text-lg font-bold text-slate-900">
                ${selectedLiquidacion.monto.toLocaleString("es-AR")}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Situación Impositiva</h1>
          <p className="text-sm text-slate-500">Bienvenido, {clienteName}</p>
        </div>
      </header>

      <div className="space-y-6">
        {tienePendientes ? (
          <div className="flex items-start gap-4 bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-900 text-lg">
                Tenés {pendientes.length} pago{pendientes.length > 1 ? "s" : ""} pendiente{pendientes.length > 1 ? "s" : ""}
              </h3>
              <p className="text-red-700 text-sm">
                Ponete al día para evitar recargos e intereses de mora municipales.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900 text-lg">Estás al día</h3>
              <p className="text-emerald-700 text-sm">
                No tenés obligaciones fiscales pendientes de liquidación en el estudio.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={`bg-white border rounded-2xl shadow-sm p-5 flex items-center gap-4 ${totalPendiente > 0 ? "border-red-200" : "border-emerald-200"}`}>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${totalPendiente > 0 ? "bg-red-50" : "bg-emerald-50"}`}>
              {totalPendiente > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Pendiente</p>
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
              <p className="text-xs text-slate-500 font-medium">Próximo Vencimiento</p>
              <p className={`text-xl font-bold ${proxVencimiento ? "text-amber-700" : "text-emerald-700"}`}>
                {proxVencimiento ?? "Sin vencimientos"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Buscar impuesto..."
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>
              <CustomSelect
                options={[
                  { value: "todos", label: "Todos los estados" },
                  { value: "PENDIENTE", label: "Pendiente" },
                  { value: "PAGADO", label: "Pagado" },
                ]}
                value={filtroEstado}
                onChange={(v) => { setFiltroEstado(v); setPage(1); }}
                className="min-w-[150px]"
              />
              <CustomSelect
                options={opcionesImpuesto}
                value={filtroImpuesto}
                onChange={(v) => { setFiltroImpuesto(v); setPage(1); }}
                className="min-w-[170px]"
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0">{filtered.length} de {liquidaciones.length} registros</span>
          </div>
          {paginated.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart3 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No hay liquidaciones registradas.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginated.map((liq) => (
                <div
                  key={liq.id}
                  className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-slate-800">{liq.impuesto}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Vencimiento: {liq.fechaVencimiento} &middot; {liq.periodo}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-slate-900 text-sm">
                      ${liq.monto.toLocaleString("es-AR")}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                        liq.estado === "PAGADO"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {liq.estado === "PAGADO" ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {liq.estado === "PAGADO" ? "Pagado" : "Pendiente"}
                    </span>
                    <button
                      onClick={() => setSelectedLiquidacion(liq)}
                      className="text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                    >
                      Ver detalle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-sm rounded-b-2xl">
              <button
                onClick={() => goTo(page - 1)}
                disabled={page === 1}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-slate-400 text-xs">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goTo(p)}
                      className={`min-w-[32px] h-8 rounded-lg text-xs font-semibold transition-colors ${
                        p === page
                          ? "bg-brand-dark text-white"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                onClick={() => goTo(page + 1)}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
