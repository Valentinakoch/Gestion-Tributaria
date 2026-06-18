import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "../../../../../lib/prisma";
import { FileText, ArrowLeft, CheckCircle, AlertTriangle, User, Receipt, ExternalLink } from "lucide-react";
import Link from "next/link";
import ComprobanteUploadForm from "../../_components/comprobante-upload-form";

export default async function LiquidacionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const resolvedParams = await params;
  const id = Number(resolvedParams.id);
  if (isNaN(id) || id <= 0) notFound();

  // 1. Buscamos la liquidación incluyendo el impuesto y también cruzando las tablas 
  // para obtener la entidad tributaria correspondiente al cliente y al impuesto.
  const liquidacion = await db.liquidacion.findUnique({
    where: { numero_boleta: id },
    include: {
      cliente: {
        include: {
          inscripto_en: {
            include: {
              entidad_tributaria: true,
            },
          },
        },
      },
      impuesto: true,
      comprobante: true,
    },
  });

  if (!liquidacion) notFound();

  const isPagado = liquidacion.estado?.toUpperCase() === "PAGADO";

  // 2. Extraemos la URL de pago de la entidad tributaria que coincida con el impuesto de esta liquidación
  const inscripcionCorrecta = liquidacion.cliente?.inscripto_en.find(
    (ins) => ins.id_entidad === liquidacion.id_impuesto
  );
  const urlPago = inscripcionCorrecta?.entidad_tributaria.url;

  // Check if the user is an admin (contador) or the client of this liquidation
  const isAdmin = await db.contador.findFirst({ where: { clerk_id: userId } });
  const isOwner = liquidacion.cliente?.clerk_id === userId;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard" // Link back to the client's main dashboard
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mi situación impositiva
        </Link>
      </div>

      <header className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-brand-dark flex items-center justify-center text-white">
          <FileText className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Liquidación #{liquidacion.numero_boleta}</h1>
          <p className="text-sm text-slate-500">Información detallada y documentos</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna de Datos */}
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Información Fiscal</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Cliente</p>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-300" />
                  <p className="text-sm font-medium text-slate-900">
                    {[liquidacion.cliente?.nombre, liquidacion.cliente?.apellido].filter(Boolean).join(" ") || `CUIL: ${liquidacion.cuil_cliente}`}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Tipo de Impuesto</p>
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-slate-300" />
                  <p className="text-sm font-medium text-slate-900">{liquidacion.impuesto?.formato || "General"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Período</p>
                  <p className="text-sm font-medium text-slate-900">
                    {liquidacion.periodo_fiscal ? new Date(liquidacion.periodo_fiscal).toLocaleDateString("es-AR", { month: "long", year: "numeric" }) : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Importe</p>
                  <p className="text-sm font-bold text-blue-600">${liquidacion.importe?.toLocaleString("es-AR")}</p>
                </div>
              </div>
            </div>

            <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 ${isPagado ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {isPagado ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              <span className="text-xs font-bold uppercase tracking-wider">{liquidacion.estado}</span>
            </div>

            {/* 3. BOTÓN DINÁMICO IR A PAGAR: Sólo aparece si la liquidación NO está pagada y existe la URL en la DB */}
            {!isPagado && urlPago && (
              <a
                href={urlPago}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl py-3 px-4 transition-colors shadow-sm"
              >
                IR A PAGAR
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </section>

          {isPagado && liquidacion.comprobante && (
            <section className="bg-emerald-50/50 rounded-2xl border border-emerald-100 p-6">
              <h3 className="font-semibold text-emerald-900 mb-3 flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4" /> Datos del Pago
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-emerald-700">
                  <span>Boleta Comprobante:</span>
                  <span className="font-mono">#{liquidacion.comprobante.numero_boleta}</span>
                </div>
                <div className="flex justify-between text-emerald-900 font-bold border-t border-emerald-100 pt-2">
                  <span>Pagado:</span>
                  <span>${liquidacion.comprobante.importe?.toLocaleString("es-AR")}</span>
                </div>
              </div>
            </section>
          )}

          {!isPagado && isOwner && ( // Only show upload form if not paid and current user is the client
            <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
              <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Subir Comprobante de Pago</h3>
              <p className="text-sm text-slate-500">
                Subí el PDF del comprobante de pago para marcar esta liquidación como pagada.
              </p>
              <ComprobanteUploadForm 
                liquidacionId={liquidacion.numero_boleta}
              />
            </section>
          )}
        </div>

        {/* Columna de Documentos (Visores PDF) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Documento de Liquidación
              </h3>
              {liquidacion.url_archivo && (
                <a href={liquidacion.url_archivo} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Abrir pantalla completa <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm aspect-[4/3] lg:aspect-auto lg:h-[600px]">
              {liquidacion.url_archivo ? (
                <iframe src={`${liquidacion.url_archivo}#toolbar=0`} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-400 text-sm italic">
                  No hay un archivo PDF asociado a esta liquidación.
                </div>
              )}
            </div>
          </div>

          {isPagado && liquidacion.comprobante?.url_archivo && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Comprobante de Pago
                </h3>
                <a href={liquidacion.comprobante.url_archivo} target="_blank" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                  Abrir pantalla completa <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm aspect-[4/3] lg:aspect-auto lg:h-[600px]">
                <iframe src={`${liquidacion.comprobante.url_archivo}#toolbar=0`} className="w-full h-full" />
              </div>
            </div>
          )}

          {isPagado && !liquidacion.comprobante?.url_archivo && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
              <p>La liquidación está pagada, pero no se encontró un comprobante de pago asociado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}