"use client";

import { useState } from "react";
import { Users, CheckCircle, AlertTriangle, Search, Plus, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import CustomSelect from "@/components/custom-select";

interface Cliente {
  id: string;
  nombre: string;
  cuit: string;
  estado: "al_dia" | "pendiente";
}

interface Props {
  adminName: string;
  clientesData: Cliente[];
}

const PAGE_SIZE = 5;

export default function AdminClientList({ adminName, clientesData }: Props) {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [page, setPage] = useState(1);

  const filtered = clientesData.filter((c) => {
    const matchesSearch =
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.cuit.includes(search);
    const matchesEstado =
      filtroEstado === "todos" || c.estado === filtroEstado;
    return matchesSearch && matchesEstado;
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

  return (
    <div>
      <header className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white">
          <Users className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
          <p className="text-sm text-slate-500">Padrón de Clientes</p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Buscar cliente..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
            <CustomSelect
              options={[
                { value: "todos", label: "Todos los estados" },
                { value: "al_dia", label: "Al día" },
                { value: "pendiente", label: "Pendiente" },
              ]}
              value={filtroEstado}
              onChange={(v) => { setFiltroEstado(v); setPage(1); }}
              className="min-w-[150px]"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">{filtered.length} de {clientesData.length} registros</span>
            <button
              onClick={() => alert("Próximamente: formulario para agregar nuevo cliente.")}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-dark px-3 py-2 rounded-xl hover:brightness-110 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Agregar Cliente
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No se encontraron clientes con esos filtros.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginated.map((cli) => (
              <div
                key={cli.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-slate-800 truncate">{cli.nombre}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">CUIT: {cli.cuit}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
                      cli.estado === "pendiente"
                        ? "bg-red-50 text-red-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {cli.estado === "pendiente" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    {cli.estado === "pendiente" ? "Pendiente" : "Al día"}
                  </span>
                  <button className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                    Gestionar
                    <ArrowRight className="h-3 w-3" />
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
  );
}
