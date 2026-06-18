import { Loader2, Pencil, Plus, X } from "lucide-react";
import type { Entidad, Impuesto } from "./types";

interface Props {
  entidades: Entidad[];
  editando: Impuesto | null;
  formato: string;
  idEntidad: string;
  cargando: boolean;
  onFormatoChange: (value: string) => void;
  onEntidadChange: (value: string) => void;
  onCancelEdit: () => void;
  onSubmit: (event: React.FormEvent) => void;
}

export default function ImpuestoForm({
  entidades,
  editando,
  formato,
  idEntidad,
  cargando,
  onFormatoChange,
  onEntidadChange,
  onCancelEdit,
  onSubmit,
}: Props) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5 h-fit">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold text-slate-900">
            {editando ? "Editar impuesto" : "Nuevo impuesto"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Defini a que entidad corresponde
          </p>
        </div>
        {editando && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
            aria-label="Cancelar edicion"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nombre del impuesto
          </label>
          <input
            value={formato}
            onChange={(event) => onFormatoChange(event.target.value)}
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
            onChange={(event) => onEntidadChange(event.target.value)}
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
  );
}
