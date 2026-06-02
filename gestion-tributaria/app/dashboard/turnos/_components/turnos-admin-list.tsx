"use client";

import { useState } from "react";
import { Calendar, Clock, User, Trash2, Settings, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { editarTurno, borrarTurno } from "../../../../lib/actions/turnos.actions";
import CustomSelect from "@/components/custom-select";

interface TurnoData {
  id: string;
  cliente: string;
  fecha: string;
  hora: string;
  fechaIso: string;
  horaIso: string;
  cuilCliente: string;
  cuilAdmin: string;
  adminNombre: string;
}

interface AdminOption {
  cuil: string;
  nombre: string;
}

interface Props {
  turnos: TurnoData[];
  admins: AdminOption[];
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

export default function TurnosAdminList({ turnos, admins }: Props) {
  const [editando, setEditando] = useState<TurnoData | null>(null);
  const [editFecha, setEditFecha] = useState("");
  const [editHora, setEditHora] = useState("");
  const [editAdmin, setEditAdmin] = useState("");
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false);

  const adminOptions = admins.map((a) => ({ value: a.cuil, label: a.nombre }));
  const [search, setSearch] = useState("");
  const [filtroAdmin, setFiltroAdmin] = useState<string>("todos");
  const [page, setPage] = useState(1);

  const adminNombresUnicos = [...new Set(turnos.map((t) => t.adminNombre))].sort();
  const opcionesFiltroAdmin = [
    { value: "todos", label: "Todos los admins" },
    ...adminNombresUnicos.map((n) => ({ value: n, label: n })),
  ];

  const filtered = turnos.filter((t) => {
    const matchesSearch =
      t.cliente.toLowerCase().includes(search.toLowerCase()) ||
      t.adminNombre.toLowerCase().includes(search.toLowerCase()) ||
      t.fecha.includes(search) ||
      t.hora.includes(search);
    const matchesAdmin = filtroAdmin === "todos" || t.adminNombre === filtroAdmin;
    return matchesSearch && matchesAdmin;
  });

  const PAGE_SIZE = 5;
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

  function abrirModal(t: TurnoData) {
    const [_, m, d] = t.fechaIso.split("-").map(Number);
    setEditFecha(`${d.toString().padStart(2, "0")}/${m.toString().padStart(2, "0")}/${t.fechaIso.slice(0, 4)}`);
    setEditHora(t.horaIso);
    setEditAdmin(t.cuilAdmin);
    setEditando(t);
  }

  function cerrarModal() {
    setEditando(null);
    setMensaje(null);
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setCargando(true);
    setMensaje(null);

    const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const dateMatch = editFecha.match(dateRegex);
    if (!dateMatch) {
      setMensaje({ tipo: "error", texto: "Fecha inválida. Usá dd/mm/aaaa." });
      setCargando(false);
      return;
    }
    const timeRegex = /^(\d{2}):(\d{2})$/;
    const timeMatch = editHora.match(timeRegex);
    if (!timeMatch) {
      setMensaje({ tipo: "error", texto: "Hora inválida. Usá hh:mm." });
      setCargando(false);
      return;
    }

    const nuevaFechaIso = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;

    const res = await editarTurno({
      cuilCliente: editando.cuilCliente,
      cuilAdminActual: editando.cuilAdmin,
      fechaActual: editando.fechaIso,
      horaActual: editando.horaIso,
      nuevaFecha: nuevaFechaIso,
      nuevaHora: editHora,
      nuevoCuilAdmin: editAdmin,
    });

    if (res.success) {
      cerrarModal();
    } else {
      setMensaje({ tipo: "error", texto: res.error || "Error al editar." });
    }
    setCargando(false);
  }

  async function handleBorrar(t: TurnoData) {
    if (!confirm(`¿Eliminar el turno de ${t.cliente} el ${t.fecha} a las ${t.hora}?`)) return;
    setMensaje(null);

    const res = await borrarTurno({
      cuilCliente: t.cuilCliente,
      cuilAdmin: t.cuilAdmin,
      fecha: t.fechaIso,
      hora: t.horaIso,
    });

    if (res.success) {
      setMensaje({ tipo: "ok", texto: "Turno eliminado." });
    } else {
      setMensaje({ tipo: "error", texto: res.error || "Error al borrar." });
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      {mensaje && (
        <div
          className={`mx-6 mt-4 flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${
            mensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

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
            options={opcionesFiltroAdmin}
            value={filtroAdmin}
            onChange={(v) => { setFiltroAdmin(v); setPage(1); }}
            className="min-w-[160px]"
          />
        </div>
        <span className="text-xs text-slate-400 shrink-0">{filtered.length} de {turnos.length} registros</span>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No se encontraron turnos con esos filtros.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {paginated.map((t) => (
            <div
              key={t.id}
              className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-800">{t.cliente}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t.fecha}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {t.hora}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {t.adminNombre}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => abrirModal(t)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                >
                  <Settings className="h-3 w-3" />
                  Gestionar
                </button>
                <button
                  onClick={() => handleBorrar(t)}
                  className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
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

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Gestionar Turno</h3>
              <button onClick={cerrarModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="text-sm text-slate-500">
              Cliente: <span className="font-medium text-slate-700">{editando.cliente}</span>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  Fecha
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editFecha}
                  onChange={(e) => setEditFecha(formatDateInput(e.target.value))}
                  placeholder="dd/mm/aaaa"
                  maxLength={10}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Hora
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editHora}
                  onChange={(e) => setEditHora(formatTimeInput(e.target.value))}
                  placeholder="hh:mm"
                  maxLength={5}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                  <User className="h-4 w-4 text-slate-400" />
                  Administrador
                </label>
                <CustomSelect
                  options={adminOptions}
                  value={editAdmin}
                  onChange={(v) => setEditAdmin(v)}
                />
              </div>

              {mensaje && (
                <div
                  className={`p-3 rounded-xl text-sm font-medium ${
                    mensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
                  }`}
                >
                  {mensaje.texto}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 px-4 py-2.5 bg-brand-dark text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {cargando ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
