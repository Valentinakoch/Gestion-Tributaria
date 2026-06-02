"use client";

import { useState } from "react";
import { crearTurno } from "../../../../lib/actions/turnos.actions";
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Search } from "lucide-react";
import CustomSelect from "@/components/custom-select";

interface Turno {
  id: string;
  fecha: string;
  hora: string;
  adminNombre: string;
}

interface Props {
  turnos: Turno[];
}

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let result = "";
  for (let i = 0; i < digits.length; i++) {
    if (i === 2 || i === 4) result += "/";
    result += digits[i];
  }
  return result;
}

function formatTimeInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  let result = "";
  for (let i = 0; i < digits.length; i++) {
    if (i === 2) result += ":";
    result += digits[i];
  }
  return result;
}

const PAGE_SIZE = 5;

export default function TurnoForm({ turnos }: Props) {
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [creando, setCreando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [search, setSearch] = useState("");
  const [filtroAdmin, setFiltroAdmin] = useState<string>("todos");
  const [page, setPage] = useState(1);

  const adminsUnicos = [...new Set(turnos.map((t) => t.adminNombre))].sort();
  const opcionesAdmin = [
    { value: "todos", label: "Todos los admins" },
    ...adminsUnicos.map((a) => ({ value: a, label: a })),
  ];

  const filtered = turnos.filter((t) => {
    const matchesSearch =
      t.adminNombre.toLowerCase().includes(search.toLowerCase()) ||
      t.fecha.includes(search) ||
      t.hora.includes(search);
    const matchesAdmin = filtroAdmin === "todos" || t.adminNombre === filtroAdmin;
    return matchesSearch && matchesAdmin;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setCreando(true);
    setMensaje(null);

    if (!fecha || !hora) {
      setMensaje({ tipo: "error", texto: "Completá fecha y hora." });
      setCreando(false);
      return;
    }

    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
      setMensaje({ tipo: "error", texto: "Fecha inválida. Usá el formato dd/mm/aaaa." });
      setCreando(false);
      return;
    }

    if (!/^\d{2}:\d{2}$/.test(hora)) {
      setMensaje({ tipo: "error", texto: "Hora inválida. Usá el formato hh:mm." });
      setCreando(false);
      return;
    }

    const [d, m, a] = fecha.split("/").map(Number);
    const fechaIso = `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const res = await crearTurno({ fecha: fechaIso, hora });
    if (res.success) {
      setMensaje({ tipo: "ok", texto: "Turno solicitado correctamente." });
      setFecha("");
      setHora("");
    } else {
      setMensaje({ tipo: "error", texto: res.error || "Error al crear el turno." });
    }
    setCreando(false);
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-2">Solicitar Turno Presencial</h2>
        <p className="text-sm text-slate-500 mb-4">
          Reservá una cita técnica en nuestras oficinas de Bahía Blanca para asesoramiento impositivo personalizado.
        </p>

        {mensaje && (
          <div
            className={`p-3 rounded-xl text-sm font-medium mb-4 ${
              mensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            inputMode="numeric"
            value={fecha}
            onChange={(e) => setFecha(formatDateInput(e.target.value))}
            placeholder="dd/mm/aaaa"
            maxLength={10}
            className="p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            required
          />
          <input
            type="text"
            inputMode="numeric"
            value={hora}
            onChange={(e) => setHora(formatTimeInput(e.target.value))}
            placeholder="hh:mm"
            maxLength={5}
            className="p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            required
          />
          <button
            type="submit"
            disabled={creando}
            className="bg-brand-primary text-white font-semibold rounded-xl px-4 py-2.5 hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creando ? "Solicitando..." : "Solicitar turno"}
          </button>
        </form>
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
                placeholder="Buscar turno..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
            <CustomSelect
              options={opcionesAdmin}
              value={filtroAdmin}
              onChange={(v) => { setFiltroAdmin(v); setPage(1); }}
              className="min-w-[160px]"
            />
          </div>
          <span className="text-xs text-slate-400 shrink-0">{filtered.length} de {turnos.length} registros</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No se encontraron turnos con esos filtros.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginated.map((t) => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{t.fecha}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {t.hora}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <User className="h-3 w-3" />
                  {t.adminNombre}
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
