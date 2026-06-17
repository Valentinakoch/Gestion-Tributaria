"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  crearEntidadTributaria,
  eliminarEntidadTributaria,
  modificarEntidadTributaria,
} from "../../../../lib/actions/entidades.actions";

interface Entidad {
  id: number;
  nombre: string;
  url: string;
  clientesInscriptos: number;
}

interface Props {
  entidades: Entidad[];
}

type Mensaje = { tipo: "ok" | "error"; texto: string };

export default function EntidadesAdmin({ entidades }: Props) {
  const [search, setSearch] = useState("");
  const [nombre, setNombre] = useState("");
  const [url, setUrl] = useState("");
  const [editando, setEditando] = useState<Entidad | null>(null);
  const [entidadAEliminar, setEntidadAEliminar] = useState<Entidad | null>(null);
  const [mensaje, setMensaje] = useState<Mensaje | null>(null);
  const [cargando, setCargando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const filtradas = entidades.filter((entidad) => {
    const query = search.toLowerCase();
    return (
      entidad.nombre.toLowerCase().includes(query) ||
      entidad.url.toLowerCase().includes(query)
    );
  });

  function limpiarFormulario() {
    setNombre("");
    setUrl("");
    setEditando(null);
  }

  function comenzarEdicion(entidad: Entidad) {
    setEditando(entidad);
    setNombre(entidad.nombre);
    setUrl(entidad.url);
    setMensaje(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setCargando(true);
    setMensaje(null);

    const resultado = editando
      ? await modificarEntidadTributaria(editando.id, { url })
      : await crearEntidadTributaria({ nombre, url });

    if (resultado.success) {
      setMensaje({
        tipo: "ok",
        texto: editando
          ? "Entidad modificada correctamente."
          : "Entidad registrada correctamente.",
      });
      limpiarFormulario();
    } else {
      setMensaje({
        tipo: "error",
        texto: resultado.error || "No se pudo guardar la entidad.",
      });
    }

    setCargando(false);
  }

  async function confirmarEliminacion() {
    if (!entidadAEliminar) return;

    setEliminando(true);
    setMensaje(null);
    const resultado = await eliminarEntidadTributaria(entidadAEliminar.id);

    if (resultado.success) {
      if (editando?.id === entidadAEliminar.id) limpiarFormulario();
      setEntidadAEliminar(null);
      setMensaje({ tipo: "ok", texto: "Entidad eliminada correctamente." });
    } else {
      setMensaje({
        tipo: "error",
        texto: resultado.error || "No se pudo eliminar la entidad.",
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
              {editando ? "Editar URL" : "Nueva entidad"}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {editando ? editando.nombre : "Datos de la entidad tributaria"}
            </p>
          </div>
          {editando && (
            <button
              type="button"
              onClick={limpiarFormulario}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
              aria-label="Cancelar edición"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Nombre
            </label>
            <input
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              maxLength={100}
              disabled={editando !== null}
              placeholder="Ej: ARCA"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 disabled:cursor-not-allowed disabled:text-slate-500"
            />
            {editando && (
              <p className="text-xs text-slate-400 mt-1">
                El nombre no se modifica.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              URL de gestión/pago
            </label>
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.ejemplo.gob.ar/pagos"
              required
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-1">
              Link al portal de pagos o trámites.
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
            {cargando ? "Guardando..." : editando ? "Guardar URL" : "Registrar"}
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
                placeholder="Buscar por nombre o URL..."
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-slate-400">
              {filtradas.length} de {entidades.length} entidades
            </span>
          </div>

          {filtradas.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-400">
                {search
                  ? "No se encontraron entidades con esa búsqueda."
                  : "No hay entidades tributarias registradas."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                    <th className="px-6 py-3 font-medium">Entidad</th>
                    <th className="px-6 py-3 font-medium">Portal</th>
                    <th className="px-6 py-3 font-medium">Inscriptos</th>
                    <th className="px-6 py-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtradas.map((entidad) => (
                    <tr key={entidad.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {entidad.nombre}
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={entidad.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          Ir al portal
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {entidad.clientesInscriptos} clientes
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => comenzarEdicion(entidad)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar URL
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEntidadAEliminar(entidad);
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

      {entidadAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200 p-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Eliminar entidad tributaria
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  ¿Querés eliminar <span className="font-medium text-slate-700">{entidadAEliminar.nombre}</span>?
                  Esta operación no se puede deshacer.
                </p>
              </div>
            </div>

            {entidadAEliminar.clientesInscriptos > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Esta entidad tiene {entidadAEliminar.clientesInscriptos} clientes inscriptos.
                El sistema no va a permitir eliminarla hasta que no tenga inscripciones asociadas.
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setEntidadAEliminar(null)}
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
