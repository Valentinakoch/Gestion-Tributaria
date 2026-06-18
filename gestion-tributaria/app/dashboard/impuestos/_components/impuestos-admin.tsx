"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Receipt,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  crearImpuesto,
  eliminarImpuesto,
  modificarImpuesto,
} from "../../../../lib/actions/impuestos.actions";

interface Impuesto {
  id: number;
  formato: string;
  idEntidad: number | null;
  entidadNombre: string;
  entidadUrl: string;
  liquidacionesAsociadas: number;
}

interface Entidad {
  id: number;
  nombre: string;
}

interface Props {
  impuestos: Impuesto[];
  entidades: Entidad[];
}

type Mensaje = { tipo: "ok" | "error"; texto: string };

export default function ImpuestosAdmin({ impuestos, entidades }: Props) {
  const [search, setSearch] = useState("");
  const [formato, setFormato] = useState("");
  const [idEntidad, setIdEntidad] = useState("");
  const [editando, setEditando] = useState<Impuesto | null>(null);
  const [impuestoAEliminar, setImpuestoAEliminar] = useState<Impuesto | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [cargando, setCargando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const filtrados = impuestos.filter((impuesto) => {
    const query = search.toLowerCase();
    return (
      impuesto.formato.toLowerCase().includes(query) ||
      impuesto.entidadNombre.toLowerCase().includes(query)
    );
  });

  function limpiarFormulario() {
    setFormato("");
    setIdEntidad("");
    setEditando(null);
  }

  function comenzarEdicion(impuesto: Impuesto) {
    setEditando(impuesto);
    setFormato(impuesto.formato);
    setIdEntidad(impuesto.idEntidad ? String(impuesto.idEntidad) : "");
    setMensaje(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setCargando(true);
    setMensaje(null);

    const data = {
      formato,
      idEntidad: Number(idEntidad),
    };

    const resultado = editando
      ? await modificarImpuesto(editando.id, data)
      : await crearImpuesto(data);

    if (resultado.success) {
      setMensaje({
        tipo: "ok",
        texto: editando ? "Impuesto modificado correctamente." : "Impuesto creado correctamente.",
      });
      limpiarFormulario();
    } else {
      setMensaje({
        tipo: "error",
        texto: resultado.error || "No se pudo guardar el impuesto.",
      });
    }

    setCargando(false);
  }

  async function confirmarEliminacion() {
    if (!impuestoAEliminar) return;

    setEliminando(true);
    setMensaje(null);
    const resultado = await eliminarImpuesto(impuestoAEliminar.id);

    if (resultado.success) {
      if (editando?.id === impuestoAEliminar.id) limpiarFormulario();
      setImpuestoAEliminar(null);
      setMensaje({ tipo: "ok", texto: "Impuesto eliminado correctamente." });
    } else {
      setMensaje({
        tipo: "error",
        texto: resultado.error || "No se pudo eliminar el impuesto.",
      });
    }

    setEliminando(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="bg-white rounded-xl border border-slate-200 p-5 h-fit">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              {editando ? "Editar impuesto" : "Nuevo impuesto"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Definí a qué entidad corresponde
            </p>
          </div>
          {editando && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Cancelar edicion"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre del impuesto
            </label>
            <input
              value={formato}
              onChange={(event) => setFormato(event.target.value)}
              maxLength={100}
              placeholder="Ej: IVA, Ingresos Brutos ARBA"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Entidad tributaria
            </label>
            <select
              value={idEntidad}
              onChange={(event) => setIdEntidad(event.target.value)}
              required
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            >
              <option value="">Seleccionar entidad</option>
              {entidades.map((entidad) => (
                <option key={entidad.id} value={entidad.id}>
                  {entidad.nombre}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              Esta entidad define la URL de pago de las liquidaciones.
            </p>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-brand-primary text-white font-semibold rounded-lg px-4 py-2.5 hover:bg-brand-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {cargando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editando ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {cargando ? "Guardando..." : editando ? "Guardar cambios" : "Crear impuesto"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {mensaje && (
          <div
            className={`flex items-center gap-2 p-3 rounded-lg text-sm font-medium ${
              mensaje.tipo === "ok"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {mensaje.tipo === "ok" ? (
              <CheckCircle className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            {mensaje.texto}
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por impuesto o entidad..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              {filtrados.length} de {impuestos.length} impuestos
            </span>
          </div>

          {filtrados.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">
                {search ? "No se encontraron impuestos." : "No hay impuestos registrados."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                    <th className="px-6 py-3 font-medium">Impuesto</th>
                    <th className="px-6 py-3 font-medium">Entidad</th>
                    <th className="px-6 py-3 font-medium">Liquidaciones</th>
                    <th className="px-6 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtrados.map((impuesto) => (
                    <tr key={impuesto.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {impuesto.formato}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div className="flex items-center gap-2">
                          <span>{impuesto.entidadNombre}</span>
                          {impuesto.entidadUrl && (
                            <a
                              href={impuesto.entidadUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline"
                              aria-label="Abrir portal"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {impuesto.liquidacionesAsociadas}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => comenzarEdicion(impuesto)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImpuestoAEliminar(impuesto);
                              setMensaje(null);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"
                          >
                            <Trash2 className="h-3 w-3" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {impuestoAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 p-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Eliminar impuesto
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Queres eliminar <span className="font-medium text-slate-700">{impuestoAEliminar.formato}</span>?
                  Esta operacion no se puede deshacer.
                </p>
              </div>
            </div>

            {impuestoAEliminar.liquidacionesAsociadas > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Este impuesto tiene {impuestoAEliminar.liquidacionesAsociadas} liquidaciones asociadas.
                El sistema no va a permitir eliminarlo mientras tenga historial.
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setImpuestoAEliminar(null)}
                disabled={eliminando}
                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacion}
                disabled={eliminando}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {eliminando && <Loader2 className="h-4 w-4 animate-spin" />}
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
