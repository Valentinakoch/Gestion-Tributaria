"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verificarRol } from "../../../lib/actions/auth.actions";
import { User, Building2, Loader2 } from "lucide-react";

export default function RoleSelector() {
  const router = useRouter();
  const [loading, setLoading] = useState<"admin" | "cliente" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSelect(rol: "admin" | "cliente") {
    setLoading(rol);
    setError(null);

    const res = await verificarRol(rol);

    if (res.success) {
      router.push("/dashboard");
    } else {
      setError(res.error || "Error al verificar el rol.");
      setLoading(null);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <button
        onClick={() => handleSelect("cliente")}
        disabled={loading !== null}
        className="group bg-white rounded-2xl border border-slate-200 p-8 text-left hover:border-blue-200 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-5 group-hover:bg-blue-50 transition-colors">
          <User className="h-7 w-7 text-slate-500 group-hover:text-blue-600 transition-colors" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Soy Cliente</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Accedé a tu situación impositiva, revisá tus liquidaciones, solicitá turnos y contactá al estudio.
        </p>
        {loading === "cliente" && (
          <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando...
          </div>
        )}
      </button>

      <button
        onClick={() => handleSelect("admin")}
        disabled={loading !== null}
        className="group bg-white rounded-2xl border border-slate-200 p-8 text-left hover:border-blue-200 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-5 group-hover:bg-blue-50 transition-colors">
          <Building2 className="h-7 w-7 text-slate-500 group-hover:text-blue-600 transition-colors" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Soy Administrador</h2>
        <p className="text-slate-500 text-sm leading-relaxed">
          Gestioná el padrón de clientes, subí liquidaciones, y administrá el estudio contable.
        </p>
        {loading === "admin" && (
          <div className="mt-4 flex items-center gap-2 text-blue-600 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando...
          </div>
        )}
      </button>

      {error && (
        <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
}
