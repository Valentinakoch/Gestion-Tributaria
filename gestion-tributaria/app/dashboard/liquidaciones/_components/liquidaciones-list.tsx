"use client";

import { useMemo, useState } from "react";
import { Search, FileText, CheckCircle, AlertTriangle, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import CustomSelect from "@/components/custom-select";

interface Liquidacion {
  numeroBoleta: number;
  cliente: string;
  impuesto: string;
  periodo: string;
  monto: number;
  estado: "PAGADO" | "PENDIENTE";
}

interface Props {
  liquidaciones: Liquidacion[];
}

const PAGE_SIZE = 5;

export default function LiquidacionesList({ liquidaciones }: Props) {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroImpuesto, setFiltroImpuesto] = useState<string>("todos");
  const [page, setPage] = useState(1);

  const impuestos = useMemo(
    () => [...new Set(liquidaciones.map((l) => l.impuesto))].sort(),
    [liquidaciones]
  );

  const filtered = liquidaciones.filter((l) => {
    const matchesSearch =
      l.cliente.toLowerCase().includes(search.toLowerCase()) ||
      l.impuesto.toLowerCase().includes(search.toLowerCase()) ||
      l.periodo.toLowerCase().includes(search.toLowerCase());
    const matchesEstado =
      filtroEstado === "todos" || l.estado === filtroEstado;
    const matchesImpuesto =
      filtroImpuesto === "todos" || l.impuesto === filtroImpuesto;
    return matchesSearch && matchesEstado && matchesImpuesto;
  });

  const pendientes = liquidaciones.filter((l) => l.estado === "PENDIENTE");
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

  return (
    <div className="space-y-4">
      {pendientes.length > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            {pendientes.length} liquidación{pendientes.length > 1 ? "es" : ""} pendiente{pendientes.length > 1 ? "s" : ""} de pago.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por cliente, impuesto..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>
          <CustomSelect
            options={[
              { value: "todos", label: "Todos los estados" },
              { value: "PAGADO", label: "Pagado" },
              { value: "PENDIENTE", label: "Pendiente" },
            ]}
            value={filtroEstado}
            onChange={(v) => { setFiltroEstado(v); setPage(1); }}
            className="min-w-[150px]"
          />
          <CustomSelect
            options={[
              { value: "todos", label: "Todos los impuestos" },
              ...impuestos.map((imp) => ({ value: imp, label: imp })),
            ]}
            value={filtroImpuesto}
            onChange={(v) => { setFiltroImpuesto(v); setPage(1); }}
            className="min-w-[160px]"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              {search || filtroEstado !== "todos" || filtroImpuesto !== "todos"
                ? "No se encontraron resultados con esos filtros."
                : "No hay liquidaciones registradas."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-3 font-medium">N°</th>
                  <th className="px-6 py-3 font-medium">Cliente</th>
                  <th className="px-6 py-3 font-medium">Impuesto</th>
                  <th className="px-6 py-3 font-medium">Período</th>
                  <th className="px-6 py-3 font-medium text-right">Monto</th>
                  <th className="px-6 py-3 font-medium">Estado</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((l) => (
                  <tr
                    key={l.numeroBoleta}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-slate-400 font-mono text-xs">
                      #{l.numeroBoleta}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-800">
                      {l.cliente}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{l.impuesto}</td>
                    <td className="px-6 py-3.5 text-slate-600">{l.periodo}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-slate-900">
                      ${l.monto.toLocaleString("es-AR")}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full ${
                          l.estado === "PAGADO"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {l.estado === "PAGADO" ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {l.estado === "PAGADO" ? "Pagado" : "Pendiente"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/dashboard/liquidaciones/${l.numeroBoleta}`}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      <div className="text-xs text-slate-500">
        {filtered.length} de {liquidaciones.length} registro{filtered.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
