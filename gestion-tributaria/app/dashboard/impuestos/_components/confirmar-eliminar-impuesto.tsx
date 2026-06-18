import { AlertTriangle, Loader2 } from "lucide-react";
import type { Impuesto } from "./types";

interface Props {
  impuesto: Impuesto;
  eliminando: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmarEliminarImpuesto({
  impuesto,
  eliminando,
  onCancel,
  onConfirm,
}: Props) {
  return (
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
              Queres eliminar <span className="font-medium text-slate-700">{impuesto.formato}</span>?
              Esta operacion no se puede deshacer.
            </p>
          </div>
        </div>

        {impuesto.liquidacionesAsociadas > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Este impuesto tiene {impuesto.liquidacionesAsociadas} liquidaciones asociadas.
            El sistema no va a permitir eliminarlo mientras tenga historial.
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={eliminando}
            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={eliminando}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {eliminando && <Loader2 className="h-4 w-4 animate-spin" />}
            {eliminando ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  );
}
