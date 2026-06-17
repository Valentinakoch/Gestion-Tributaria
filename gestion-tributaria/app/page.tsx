import Link from "next/link";
import { FileText, Bell, Calendar } from "lucide-react";
import Footer from "@/components/footer";
import { db } from "../lib/prisma";

export default async function WelcomePage() {
  const estudio = await db.estudio_contable.findFirst();
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col">
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">

        {/* Nav */}
        <nav className="flex justify-between items-center px-8 md:px-16 py-6 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <polyline points="6,24 12,16 20,20 26,10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="26" cy="10" r="2.5" fill="#C8D9EE" />
              </svg>
            </div>
            <span className="text-base font-medium text-white">Estudio Contable</span>
          </div>
          <Link
            href="/sign-in"
            className="bg-white/10 text-white text-sm font-medium px-4 py-2 rounded-lg border border-white/[0.15] hover:bg-white/20 transition-colors"
          >
            Ingresar
          </Link>
        </nav>

        {/* Hero */}
        <div className="px-8 md:px-16 pt-20 md:pt-28 pb-20">
          <p className="text-xs text-white/35 tracking-[0.07em] uppercase mb-5">Portal de clientes</p>
          <h1 className="text-4xl md:text-6xl font-semibold text-white leading-tight mb-6 max-w-3xl">
            Tu situación impositiva,{" "}
            <span className="text-[#C8D9EE]">siempre bajo control</span>
          </h1>
          <p className="text-lg md:text-xl text-white/45 leading-relaxed max-w-xl mb-12">
            Accedé a tus liquidaciones, vencimientos y comprobantes. Tu contador conectado con vos, sin llamadas innecesarias.
          </p>
          <Link
            href="/sign-in"
            className="inline-block bg-white text-brand-dark text-base font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-8 md:mx-16 border-t border-white/[0.08]" />

        {/* Features */}
        <div className="px-8 md:px-16 py-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: FileText, title: "Liquidaciones", desc: "Tu contador sube los comprobantes y vos los ves al instante." },
            { icon: Bell, title: "Vencimientos", desc: "Alertas antes de cada fecha límite para evitar recargos." },
            { icon: Calendar, title: "Turnos", desc: "Pedí una reunión con el estudio desde el portal." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="border border-white/[0.08] rounded-2xl p-8 bg-white/[0.04]"
            >
              <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center mb-5">
                <Icon className="h-5 w-5 text-[#C8D9EE]" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* CTA row */}
        <div className="mx-8 md:mx-16 py-10 border-t border-white/[0.08] flex flex-col sm:flex-row sm:justify-between sm:items-center gap-5">
          <div>
            <p className="text-base font-semibold text-white mb-1">¿Todavía no tenés acceso?</p>
            <p className="text-sm text-white/40">Contactate y te damos el alta en minutos.</p>
          </div>
          <a
            href={`https://wa.me/${(estudio?.telefono ?? "5491112345678").replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start sm:self-auto shrink-0 bg-white text-brand-dark text-base font-semibold px-8 py-3.5 rounded-xl hover:bg-white/90 transition-colors"
          >
            Contactar
          </a>
        </div>

        <Footer dark telefono={estudio?.telefono} />
      </div>
    </div>
  );
}
