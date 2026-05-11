import Link from "next/link";
import UserMenu from "./user-menu";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Sistema de Gestión Tributaria</p>
            <h1 className="text-2xl font-semibold tracking-tight">Panel principal</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800">Estudio Contable</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-900">Cliente activo</span>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/95">
          <div className="space-y-4">
            <div className="rounded-3xl bg-indigo-600 p-4 text-white">
              <p className="text-xs uppercase tracking-[0.24em] opacity-80">Módulos</p>
              <p className="mt-3 text-lg font-semibold">Gestión tributaria</p>
            </div>
            <nav className="space-y-2 text-sm">
              <Link href="/" className="block rounded-2xl bg-slate-100 px-4 py-3 text-slate-900 transition hover:bg-slate-200 dark:bg-slate-950/80 dark:text-slate-100 dark:hover:bg-slate-950">Inicio</Link>
              <Link href="/#" className="block rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Situación impositiva</Link>
              <Link href="/#" className="block rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Boletas y VEP</Link>
              <Link href="/#" className="block rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Comprobantes</Link>
              <Link href="/#" className="block rounded-2xl px-4 py-3 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800">Clientes</Link>
            </nav>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Situación impositiva</p>
              <p className="mt-4 text-3xl font-semibold">Al día</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Sin deuda fiscal pendiente</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Boletas pendientes</p>
              <p className="mt-4 text-3xl font-semibold">6</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Vencimiento en próximos 7 días</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Comprobantes</p>
              <p className="mt-4 text-3xl font-semibold">12</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Validación automática habilitada</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Clientes</p>
              <p className="mt-4 text-3xl font-semibold">38</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Cuentas registradas</p>
            </article>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Resumen impositivo</p>
                <h2 className="mt-2 text-2xl font-semibold">Estado de obligaciones fiscales</h2>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                Información estática
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-slate-50 p-4 text-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Deuda total</p>
                <p className="mt-3 text-2xl font-semibold">$1.280.000</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Pagos recientes</p>
                <p className="mt-3 text-2xl font-semibold">$360.500</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4 text-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Reliquidaciones</p>
                <p className="mt-3 text-2xl font-semibold">3</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Situación impositiva</p>
                  <h3 className="mt-2 text-lg font-semibold">Impuestos recientes</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  Solo frontend
                </span>
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-[0.24em] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
                    <tr>
                      <th className="px-5 py-3">Impuesto</th>
                      <th className="px-5 py-3">Estado</th>
                      <th className="px-5 py-3">Vencimiento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950/80">
                    <tr>
                      <td className="px-5 py-4">IVA</td>
                      <td className="px-5 py-4 text-emerald-600 dark:text-emerald-400">Al día</td>
                      <td className="px-5 py-4">12/05/2026</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4">Ganancias</td>
                      <td className="px-5 py-4 text-amber-600 dark:text-amber-400">Pendiente</td>
                      <td className="px-5 py-4">18/05/2026</td>
                    </tr>
                    <tr>
                      <td className="px-5 py-4">Ingresos Brutos</td>
                      <td className="px-5 py-4 text-sky-600 dark:text-sky-400">En análisis</td>
                      <td className="px-5 py-4">22/05/2026</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-semibold">Carga de comprobante</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Interfaz estática para carga de comprobantes y validación automática.</p>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950/70">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Último comprobante</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Factura 1234 - Validado</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950/70">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Estado de validación</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">100% verificado</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950/70">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Próximo paso</p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Revisión de documentos pendientes</p>
                </div>
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
