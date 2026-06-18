import { ExternalLink, Pencil, Receipt, Search, Trash2 } from "lucide-react";
import type { Impuesto } from "./types";

interface Props {
  impuestos: Impuesto[];
  totalImpuestos: number;
  search: string;
  onSearchChange: (value: string) => void;
  onEdit: (impuesto: Impuesto) => void;
  onDelete: (impuesto: Impuesto) => void;
}

export default function ImpuestosTable({
  impuestos,
  totalImpuestos,
  search,
  onSearchChange,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200">
      <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por impuesto o entidad..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
          />
        </div>
        <span className="text-xs text-slate-400">
          {impuestos.length} de {totalImpuestos} impuestos
        </span>
      </div>

      {impuestos.length === 0 ? (
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
              {impuestos.map((impuesto) => (
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
                        onClick={() => onEdit(impuesto)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(impuesto)}
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
  );
}
