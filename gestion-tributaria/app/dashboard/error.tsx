"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
          <span className="text-3xl">!</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Algo salió mal</h1>
        <p className="text-slate-600 mb-6">
          Hubo un problema al cargar el panel. Puede ser un error temporal de conexión.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
