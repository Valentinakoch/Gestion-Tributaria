import Link from "next/link";

interface FooterProps {
  dark?: boolean;
  telefono?: string | null;
}

export default function Footer({ dark = false, telefono }: FooterProps) {
  const tel = telefono ?? null;
  const waHref = tel ? `https://wa.me/${tel.replace(/\D/g, "")}` : null;

  const base = dark
    ? "bg-brand-dark border-white/[0.08] text-white"
    : "bg-white border-slate-200 text-slate-900";
  const muted = dark ? "text-white/40" : "text-slate-400";
  const linkClass = dark
    ? "text-sm text-white/60 hover:text-white transition-colors"
    : "text-sm text-slate-500 hover:text-slate-900 transition-colors";
  const divider = dark ? "border-white/[0.08]" : "border-slate-200";

  return (
    <footer className={`${base} border-t`}>
      <div className="max-w-7xl mx-auto px-8 md:px-16 py-12 flex flex-col sm:flex-row justify-between gap-10">

        {/* Logo + tagline */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${dark ? "bg-white/10" : "bg-brand-dark"}`}>
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <polyline points="6,24 12,16 20,20 26,10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="26" cy="10" r="2.5" fill={dark ? "#C8D9EE" : "white"} />
              </svg>
            </div>
            <span className="text-base font-semibold">Estudio Contable</span>
          </div>
          <p className={`text-sm max-w-[220px] leading-relaxed ${muted}`}>
            Tu gestión tributaria, siempre bajo control.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-3">
          <p className={`text-[11px] font-semibold uppercase tracking-widest ${muted}`}>Plataforma</p>
          <Link href="/" className={linkClass}>Inicio</Link>
          {waHref ? (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
              Contacto
            </a>
          ) : (
            <span className={`text-sm ${muted}`}>Contacto</span>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className={`border-t ${divider} px-8 md:px-16 py-4`}>
        <p className={`text-xs ${muted}`}>© 2026 Estudio Contable. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
