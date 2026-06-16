"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Pencil } from "lucide-react";
import { registrarCliente, actualizarCliente } from "../../../../lib/actions/clientes.actions";

interface InitialData {
  cuil: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

interface Props {
  initialData?: InitialData;
}

export default function ClienteForm({ initialData }: Props) {
  const router = useRouter();
  const esEdicion = !!initialData;

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const nombre = (form.elements.namedItem("nombre") as HTMLInputElement).value.trim();
    const apellido = (form.elements.namedItem("apellido") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const telefono = (form.elements.namedItem("telefono") as HTMLInputElement).value.trim();

    let result;

    if (esEdicion) {
      result = await actualizarCliente(initialData.cuil, { nombre, apellido, email, telefono });
    } else {
      const cuil = (form.elements.namedItem("cuil") as HTMLInputElement).value.trim();
      result = await registrarCliente({ cuil, nombre, apellido, email, telefono });
    }

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(esEdicion ? `/dashboard/clientes/${initialData.cuil}` : "/dashboard/clientes");
    router.refresh();
  }

  return (
    <div className="max-w-xl">
      <button
        onClick={() => router.push(esEdicion ? `/dashboard/clientes/${initialData.cuil}` : "/dashboard/clientes")}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {esEdicion ? "Volver al cliente" : "Volver a clientes"}
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-brand-dark flex items-center justify-center text-white shrink-0">
          {esEdicion ? <Pencil className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {esEdicion ? "Editar cliente" : "Nuevo cliente"}
          </h1>
          <p className="text-sm text-slate-500">
            {esEdicion ? `CUIL ${initialData.cuil}` : "Completá los datos del cliente a registrar"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              name="nombre"
              type="text"
              required
              defaultValue={initialData?.nombre}
              placeholder="Juan"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
              Apellido <span className="text-red-500">*</span>
            </label>
            <input
              name="apellido"
              type="text"
              required
              defaultValue={initialData?.apellido}
              placeholder="Pérez"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            CUIL <span className="text-red-500">*</span>
          </label>
          {esEdicion ? (
            <div className="w-full px-3 py-2.5 text-sm border border-slate-100 rounded-xl bg-slate-100 text-slate-500 font-mono cursor-not-allowed">
              {initialData.cuil}
            </div>
          ) : (
            <>
              <input
                name="cuil"
                type="text"
                required
                inputMode="numeric"
                maxLength={11}
                placeholder="20123456789"
                className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors font-mono"
              />
              <p className="text-xs text-slate-400">11 dígitos sin guiones</p>
            </>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={initialData?.email}
            placeholder="juan@ejemplo.com"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Teléfono</label>
          <input
            name="telefono"
            type="tel"
            defaultValue={initialData?.telefono}
            placeholder="+54 9 11 1234-5678"
            className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push(esEdicion ? `/dashboard/clientes/${initialData.cuil}` : "/dashboard/clientes")}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-brand-dark rounded-xl hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
          >
            {loading
              ? esEdicion ? "Guardando..." : "Registrando..."
              : esEdicion ? "Guardar cambios" : "Registrar cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
