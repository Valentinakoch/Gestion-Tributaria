"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { saveCuil } from "../../lib/actions/auth.actions";
import { User, Info, Loader2, LogOut } from "lucide-react";

interface CuilSetupProps {
  userName: string;
}

export default function CuilSetup({ userName }: CuilSetupProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [cuil, setCuil] = useState("");
  const [status, setStatus] = useState<{ type: "idle" | "saving" | "success" | "error"; message?: string }>({ type: "idle" });

  function formatCuil(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    let result = "";
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 10) result += "-";
      result += digits[i];
    }
    return result;
  }

  function handleCuilChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCuil(formatCuil(e.target.value));
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ type: "saving" });

    const sanitized = cuil.replace(/\D/g, "");
    if (!/^\d{11}$/.test(sanitized)) {
      setStatus({ type: "error", message: "El CUIL debe tener 11 dígitos numéricos." });
      return;
    }

    try {
      const result = await saveCuil(sanitized);

      if (result.error) {
        throw new Error(result.error);
      }

      router.push("/dashboard");
    } catch (error: unknown) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Error desconocido." });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-dark to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Completar tu perfil</h1>
          <p className="text-slate-400">
            Hola <strong className="text-white">{userName}</strong>, aún falta tu CUIL para acceder al panel.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-medium text-slate-700">
              CUIL
              <input
                name="cuil"
                value={cuil}
                onChange={handleCuilChange}
                placeholder="00-00000000-0"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <button
              type="submit"
              disabled={status.type === "saving"}
              className="w-full rounded-xl bg-brand-dark px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-slate-400 flex items-center justify-center gap-2"
            >
              {status.type === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar CUIL"
              )}
            </button>

            <button
              type="button"
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
              className="w-full rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 flex items-center justify-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>

            {status.type === "error" && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{status.message}</p>
            )}

            {status.type === "success" && (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{status.message}</p>
            )}
          </form>

          <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-700">Por qué lo pedimos</p>
              <p>El CUIL se usa para asociar tu cuenta con tu registro fiscal en la base de datos del estudio.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
