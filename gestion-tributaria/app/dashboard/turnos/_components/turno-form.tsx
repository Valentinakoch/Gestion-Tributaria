"use client";

import { useState } from "react";
import { cancelarTurnoCliente, reservarTurno } from "../../../../lib/actions/turnos.actions";
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Search} from "lucide-react";
import CustomSelect from "@/components/custom-select";
import { CheckCircle2, X } from "lucide-react";

interface Turno {
  id: string;
  fecha: string;
  hora: string;
  fechaIso: string;
  horaIso: string;
  cuilContador: string;
  adminNombre: string;
}

interface ContadorOption {
  cuil: string;
  nombre: string;
}

interface Props {
  turnosDisponibles: Turno[];
  misTurnos: Turno[];
  contadores: ContadorOption[];
}

const PAGE_SIZE = 5;

export default function TurnoForm({ turnosDisponibles, misTurnos, contadores }: Props) {
  const [contadorElegido, setContadorElegido] = useState<string>("todos");
  const [turnoAReservar, setTurnoAReservar] = useState<Turno | null>(null);
  const [confirmandoCancelar, setConfirmandoCancelar] = useState<Turno | null>(null);

  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [cargando, setCargando] = useState(false)
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

   const opcionesContador = [
    { value: "todos", label: "Todos los profesionales" },
    ...contadores.map((c) => ({ value: c.cuil, label: c.nombre })),
  ];

  const filtered = turnosDisponibles.filter((t) => {
    const matchesContador = contadorElegido === "todos" || t.cuilContador === contadorElegido;
    const matchesSearch =
      t.adminNombre.toLowerCase().includes(search.toLowerCase()) ||
      t.fecha.includes(search) ||
      t.hora.includes(search);
    return matchesContador && matchesSearch;
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

  // Confirmar reserva 
  function abrirConfirmacion(t: Turno) {
    setTurnoAReservar(t);
    setMensaje(null);
  }

  function cerrarConfirmacion() {
    setTurnoAReservar(null);
    setMensaje(null);
  }
 
   async function handleConfirmarReserva() {
    if (!turnoAReservar) return;
    setCargando(true);
    setMensaje(null);

    const res = await reservarTurno({
      fecha: turnoAReservar.fechaIso,
      hora: turnoAReservar.horaIso,
      cuilContador: turnoAReservar.cuilContador,
    });

    if (res.success) {
      cerrarConfirmacion();
    } else {
      setMensaje({ tipo: "error", texto: res.error || "El turno ya no está disponible." });
    }
    setCargando(false);
  }

   // Cancelar mi turno 
      function pedirConfirmacionCancelar(t: Turno) {
      setConfirmandoCancelar(t);
      }

    async function ejecutarCancelar(t: Turno) {
      setMensaje(null);
      const res = await cancelarTurnoCliente({
        fecha: t.fechaIso,
        hora: t.horaIso,
        cuilContador: t.cuilContador,
      });
      if (res.success) {
        setMensaje({ tipo: "ok", texto: "Turno cancelado." });
      } else {
        setMensaje({ tipo: "error", texto: res.error || "Error al cancelar el turno." });
      }
    }
    function confirmarCancelacion() {
      if (!confirmandoCancelar) return;
      ejecutarCancelar(confirmandoCancelar);
      setConfirmandoCancelar(null);
    }

  return (
     <div className="space-y-6">
      {mensaje && !turnoAReservar && (
        <div
          className={`p-3 rounded-xl text-sm font-medium ${
            mensaje.tipo === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* Mis turnos reservados */}
      {misTurnos.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Mis Turnos</h2>
            <p className="text-sm text-slate-500">Tus citas reservadas</p>
          </div>
          <div className="divide-y divide-slate-100">
            {misTurnos.map((t) => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{t.fecha} - {t.hora}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <User className="h-3 w-3" />
                      {t.adminNombre}
                    </p>
                  </div>
                </div>
               
              <button  onClick={() => pedirConfirmacionCancelar(t)}
                   className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 transition-colors" >
              <X className="h-3 w-3" />
              Cancelar
            </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reservar nuevo turno */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Reservar Turno</h2>
          <p className="text-sm text-slate-500">
            Elegí un profesional y un horario disponible para tu cita.
          </p>
        </div>

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
              options={opcionesContador}
              value={contadorElegido}
              onChange={(v) => { setContadorElegido(v); setPage(1); }}
              className="min-w-[180px]"
            />
          </div>
          <span className="text-xs text-slate-400 shrink-0">{filtered.length} de {turnosDisponibles.length} disponibles</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">No hay turnos disponibles con esos filtros.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {paginated.map((t) => (
              <div key={t.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{t.fecha}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" />
                      {t.hora}
                      <User className="h-3 w-3 ml-2" />
                      {t.adminNombre}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => abrirConfirmacion(t)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white bg-brand-dark hover:brightness-110 px-3 py-1.5 rounded-xl transition-all"
                >
                  Reservar
                </button>
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

      {/* Modal confirmación */}
      {turnoAReservar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Confirmar Reserva</h3>
              <button onClick={cerrarConfirmacion} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="h-4 w-4 text-slate-400" />
                {turnoAReservar.fecha}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Clock className="h-4 w-4 text-slate-400" />
                {turnoAReservar.hora}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                {turnoAReservar.adminNombre}
              </div>
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
                onClick={cerrarConfirmacion}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarReserva}
                disabled={cargando}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand-dark text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {cargando ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal confirmación cancelar */}
      {confirmandoCancelar && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Cancelar turno</h3>
        <p className="text-sm text-slate-600">
          ¿Cancelar tu turno del {confirmandoCancelar.fecha} a las {confirmandoCancelar.hora}?
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setConfirmandoCancelar(null)}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={confirmarCancelacion}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-all"
          >
            Sí, cancelar
          </button>
        </div>
      </div>
    </div>
      )}
      </div>
  )
}
