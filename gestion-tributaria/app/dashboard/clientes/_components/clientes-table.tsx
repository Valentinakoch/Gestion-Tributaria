"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, Plus, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { eliminarCliente } from "../../../../lib/actions/clientes.actions";

interface Cliente {
  cuil: string;
  nombre: string;
  email: string;
  estado: "al_dia" | "pendiente";
}

interface Props {
  clientes: Cliente[];
}

const PAGE_SIZE = 10;

export default function ClientesTable({ clientes }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [confirmCuil, setConfirmCuil] = useState<string | null>(null);
  const [confirmStep, setConfirmStep] = useState<"warn" | "confirm">("confirm");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const filtered = clientes.filter(
    (c) =>
      c.nombre.toLowerCase().includes(search.toLowerCase()) ||
      c.cuil.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goTo(p: number) {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }

  async function handleEliminar() {
    if (!confirmCuil) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await eliminarCliente(confirmCuil);
    if (result?.error) {
      setDeleteError(result.error);
      setDeleting(false);
    } else {
      setConfirmCuil(null);
      setDeleting(false);
      router.refresh();
    }
  }

  const confirmCliente = clientes.find((c) => c.cuil === confirmCuil);
  const confirmNombre = confirmCliente?.nombre ?? "";
  const confirmTienePendiente = confirmCliente?.estado === "pendiente";

  function abrirConfirm(cuil: string, estado: "al_dia" | "pendiente") {
    setConfirmCuil(cuil);
    setConfirmStep(estado === "pendiente" ? "warn" : "confirm");
    setDeleteError(null);
  }

  function cerrarModal() {
    setConfirmCuil(null);
    setConfirmStep("confirm");
    setDeleteError(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clientes.length} clientes registrados</p>
        </div>
        <button
          onClick={() => router.push("/dashboard/clientes/nuevo")}
          className="flex items-center gap-2 bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, CUIL o email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">CUIL</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
              <th className="px-6 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center">
                  <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">
                    {search ? "No se encontraron clientes con esa búsqueda." : "Todavía no tenés clientes registrados."}
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((c) => (
                <tr
                  key={c.cuil}
                  onClick={() => router.push(`/dashboard/clientes/${c.cuil}`)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-slate-800">{c.nombre}</td>
                  <td className="px-6 py-4 text-slate-500 font-mono">{c.cuil}</td>
                  <td className="px-6 py-4 text-slate-500">{c.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        c.estado === "pendiente"
                          ? "bg-red-50 text-red-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {c.estado === "pendiente" ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {c.estado === "pendiente" ? "Pendiente" : "Al día"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-xs font-semibold text-blue-600">Ver detalle</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); abrirConfirm(c.cuil, c.estado); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar cliente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => goTo(page - 1)}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-slate-600 px-2">
                Página {page} de {totalPages}
              </span>
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

      {/* Modal de confirmación */}
      {confirmCuil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">

            {confirmStep === "warn" ? (
              <>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-amber-50 mx-auto mb-4">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <h2 className="text-base font-bold text-slate-900 text-center mb-1">Liquidaciones pendientes</h2>
                <p className="text-sm text-slate-500 text-center mb-4">
                  <span className="font-semibold text-slate-800">{confirmNombre}</span> tiene impuestos pendientes de pago. Si lo eliminás, se borrarán todos sus datos y liquidaciones permanentemente.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={cerrarModal}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setConfirmStep("confirm")}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    Continuar igual
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mx-auto mb-4">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-base font-bold text-slate-900 text-center mb-1">Eliminar cliente</h2>
                <p className="text-sm text-slate-500 text-center mb-4">
                  ¿Estás segura de que querés eliminar a <span className="font-semibold text-slate-800">{confirmNombre}</span>? Esta acción no se puede deshacer.
                </p>
                {confirmTienePendiente && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4 text-center">
                    Se eliminarán también todas sus liquidaciones pendientes.
                  </p>
                )}
                {deleteError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4 text-center">
                    {deleteError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={cerrarModal}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEliminar}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {deleting ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
